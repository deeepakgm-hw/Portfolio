const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SECTIONS = [
  { name: 'desktop-1440-hero', selector: '#hero' },
  { name: 'desktop-1440-capabilities', selector: '#manifesto' },
  { name: 'desktop-1440-work', selector: '#work' },
  { name: 'desktop-1440-process', selector: '#process' },
  { name: 'desktop-1440-contact', selector: '#close' }
];

async function isServerReady(url) {
  return new Promise(resolve => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function captureDesktop() {
  const targetDir = path.join(__dirname, '..', 'audit-screenshots', 'desktop-1440');
  fs.mkdirSync(targetDir, { recursive: true });

  const isReady = await isServerReady('http://localhost:3000');
  if (!isReady) {
    console.error('Server is not running on http://localhost:3000.');
    process.exit(1);
  }

  console.log(`Launching Chrome for 1440px desktop audit...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for extended loader and curtain lift to finish
    try {
      await page.waitForFunction(() => {
        const loader = document.getElementById('loader');
        const curtain = document.getElementById('loader-curtain');
        const loaderHidden = !loader || loader.style.display === 'none' || window.getComputedStyle(loader).display === 'none';
        const curtainHidden = !curtain || curtain.style.display === 'none' || window.getComputedStyle(curtain).display === 'none';
        return loaderHidden && curtainHidden;
      }, { timeout: 15000 });
      console.log('Loader & curtain successfully dismissed.');
    } catch (e) {
      console.warn('Timed out waiting for loader dismissal via style.display, forcing removal...');
      await page.evaluate(() => {
        const l = document.getElementById('loader');
        const c = document.getElementById('loader-curtain');
        if (l) l.style.display = 'none';
        if (c) c.style.display = 'none';
      });
    }

    // Wait for hero typography reveal to complete
    try {
      await page.waitForFunction(() => {
        const h1 = document.querySelector('#hero h1');
        if (!h1) return false;
        const comp = window.getComputedStyle(h1);
        return comp.opacity !== '0' && comp.visibility !== 'hidden';
      }, { timeout: 8000 });
    } catch (e) {
      console.warn('Hero h1 wait timed out, continuing...');
    }

    // Allow 3D centerpiece entrance bloom and typography reveals to settle
    await new Promise(r => setTimeout(r, 2500));

    // Capture sections individually first
    for (const sec of SECTIONS) {
      try {
        const el = await page.$(sec.selector);
        if (el) {
          await page.evaluate(selector => {
            const element = document.querySelector(selector);
            if (element) element.scrollIntoView();
          }, sec.selector);

          // Allow scroll triggers and entrance stagger animations to finish settling
          await new Promise(r => setTimeout(r, 1800));

          const secFile = path.join(targetDir, `${sec.name}.png`);
          await el.screenshot({ path: secFile });
          console.log(`✓ ${sec.name} captured`);
        } else {
          console.warn(`⚠ Element ${sec.selector} not found`);
        }
      } catch (err) {
        console.error(`✗ Error capturing ${sec.name}:`, err.message);
      }
    }

    // Now trigger all remaining ScrollTriggers down the page for fullpage capture
    await page.evaluate(async () => {
      const distance = 400;
      const delay = 80;
      while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
        document.scrollingElement.scrollBy(0, distance);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      await new Promise(resolve => setTimeout(resolve, 800));
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    // Full page screenshot
    const fullPageFile = path.join(targetDir, 'desktop-1440-fullpage.png');
    await page.screenshot({ path: fullPageFile, fullPage: true });
    console.log(`✓ 1440px full page captured`);

    await page.close();
  } finally {
    await browser.close();
    console.log(`\n1440px Desktop screenshots saved in: ${targetDir}`);
  }
}

captureDesktop().catch(err => {
  console.error('Desktop capture failed:', err);
  process.exit(1);
});
