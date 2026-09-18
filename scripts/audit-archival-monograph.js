const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const CHAPTERS = [
  { name: '00-hero', selector: '#hero' },
  { name: '01-philosophy-capabilities', selector: '#manifesto' },
  { name: '02-selected-work-specimens', selector: '#work' },
  { name: '03-field-logs', selector: '#process' },
  { name: '04-contact-dispatch', selector: '#close' }
];

async function captureArchive() {
  const outDir = path.join(__dirname, '..', 'audit-screenshots', 'archival-rebuild');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const viewports = [
    { name: '1440px', width: 1440, height: 900, isMobile: false, touch: false },
    { name: '375px', width: 375, height: 812, isMobile: true, touch: true }
  ];

  for (const vp of viewports) {
    console.log(`\nCapturing Archival Monograph at ${vp.name}...`);
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.touch
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for loader dismissal
    try {
      await page.waitForFunction(() => {
        const curtain = document.getElementById('loader-curtain');
        return !curtain || curtain.style.display === 'none';
      }, { timeout: 12000 });
    } catch(e) {
      await page.evaluate(() => {
        const l = document.getElementById('loader');
        const c = document.getElementById('loader-curtain');
        if (l) l.style.display = 'none';
        if (c) c.style.display = 'none';
      });
    }

    // Wait for hero reveals and 3D wordmark
    await new Promise(r => setTimeout(r, 2200));

    // Scroll through page to activate ScrollTriggers
    await page.evaluate(async () => {
      const distance = 350;
      const delay = 60;
      while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
        document.scrollingElement.scrollBy(0, distance);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      await new Promise(resolve => setTimeout(resolve, 600));
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    // Capture individual chapters
    for (const ch of CHAPTERS) {
      const el = await page.$(ch.selector);
      if (el) {
        await page.evaluate(sel => {
          const target = document.querySelector(sel);
          if (target) target.scrollIntoView();
        }, ch.selector);

        await new Promise(r => setTimeout(r, 800));

        const filePath = path.join(outDir, `${vp.name}-${ch.name}.png`);
        await el.screenshot({ path: filePath });
        console.log(`  ✓ Saved ${path.basename(filePath)}`);
      }
    }

    // Capture full page
    window_reset:
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));
    const fullpagePath = path.join(outDir, `${vp.name}-fullpage.png`);
    await page.screenshot({ path: fullpagePath, fullPage: true });
    console.log(`  ✓ Saved ${path.basename(fullpagePath)}`);

    await page.close();
  }

  await browser.close();
  console.log(`\nArchival Monograph audit complete! Saved in ${outDir}`);
}

captureArchive().catch(console.error);
