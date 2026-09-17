const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { name: '375px-small-phone', width: 375, height: 812, dpr: 2 },
  { name: '390px-iphone-standard', width: 390, height: 844, dpr: 3 },
  { name: '428px-large-phone', width: 428, height: 926, dpr: 3 },
  { name: '768px-tablet', width: 768, height: 1024, dpr: 2 },
];

const SECTIONS = [
  { name: '01-nav', selector: 'nav' },
  { name: '02-hero', selector: '#hero' },
  { name: '03-philosophy', selector: '.manifesto-left' },
  { name: '04-capabilities', selector: '.manifesto-right' },
  { name: '05-work', selector: '#projects-container' },
  { name: '06-process', selector: '#process' },
  { name: '07-contact', selector: '#close' },
  { name: '08-footer', selector: '.close-foot' },
];

async function isServerReady(url) {
  return new Promise(resolve => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function runAudit(outputSubdir = 'pre') {
  const targetDir = path.join(__dirname, '..', 'audit-screenshots', outputSubdir);
  fs.mkdirSync(targetDir, { recursive: true });

  const isReady = await isServerReady('http://localhost:3000');
  if (!isReady) {
    console.error('Server is not running on http://localhost:3000. Please start it first.');
    process.exit(1);
  }

  console.log(`Launching Chrome from: ${CHROME_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1200,800']
  });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
      });

      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
      // Wait until terminal loader and curtain have completely finished and hidden
      try {
        await page.waitForFunction(() => {
          const c = document.getElementById('loader-curtain');
          return !c || c.style.display === 'none';
        }, { timeout: 8000 });
      } catch (e) {
        await new Promise(r => setTimeout(r, 4500));
      }
      await new Promise(r => setTimeout(r, 800));

      // Scroll through page to activate all scroll animations like a real user
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 35);
        });
      });
      await new Promise(r => setTimeout(r, 500));

      // Capture full page screenshot (with nav closed)
      const fullPageFile = path.join(targetDir, `${vp.name}-fullpage.png`);
      await page.screenshot({ path: fullPageFile, fullPage: true });
      console.log(`✓ Full page captured: ${path.basename(fullPageFile)}`);

      // Ensure menu is closed
      await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (nav) nav.classList.remove('menu-open');
      });

      // Capture each section cleanly
      for (const sec of SECTIONS) {
        try {
          const el = await page.$(sec.selector);
          if (el) {
            // scroll element into view gently
            await page.evaluate(selector => {
              const element = document.querySelector(selector);
              if (element) element.scrollIntoView();
            }, sec.selector);
            await new Promise(r => setTimeout(r, 300));

            const secFile = path.join(targetDir, `${vp.name}-${sec.name}.png`);
            await el.screenshot({ path: secFile });
            console.log(`  ✓ ${sec.name} captured`);

            // Special check: if contact form exists, capture contact success state too
            if (sec.name === '07-contact') {
              await page.evaluate(() => {
                const form = document.getElementById('contact-form');
                const success = document.getElementById('contact-success');
                const emailSpan = document.getElementById('success-user-email');
                if (form && success) {
                  form.style.display = 'none';
                  success.style.display = 'block';
                  if (emailSpan) emailSpan.textContent = 'alex@example.com';
                }
              });
              await new Promise(r => setTimeout(r, 300));
              const successFile = path.join(targetDir, `${vp.name}-07b-contact-success.png`);
              await el.screenshot({ path: successFile });
              console.log(`  ✓ 07b-contact-success captured`);
              // Reset back
              await page.evaluate(() => {
                const form = document.getElementById('contact-form');
                const success = document.getElementById('contact-success');
                if (form && success) {
                  form.style.display = 'block';
                  success.style.display = 'none';
                }
              });
            }
          } else {
            console.warn(`  ⚠ Element ${sec.selector} not found`);
          }
        } catch (err) {
          console.error(`  ✗ Error capturing ${sec.name}:`, err.message);
        }
      }

      // After capturing all standard sections, test mobile drawer overlay if toggle button is active
      try {
        const isToggleVisible = await page.evaluate(() => {
          const btn = document.getElementById('nav-toggle');
          return btn && window.getComputedStyle(btn).display !== 'none';
        });
        if (isToggleVisible) {
          await page.evaluate(() => {
            window.scrollTo(0, 0);
            const btn = document.getElementById('nav-toggle');
            if (btn) btn.click();
          });
          await new Promise(r => setTimeout(r, 450));
          const menuFile = path.join(targetDir, `${vp.name}-01b-nav-open.png`);
          await page.screenshot({ path: menuFile });
          console.log(`  ✓ 01b-nav-open captured`);
          // Close drawer
          await page.evaluate(() => {
            const btn = document.getElementById('nav-toggle');
            if (btn) btn.click();
          });
          await new Promise(r => setTimeout(r, 300));
        }
      } catch (err) {
        console.error(`  ✗ Error capturing mobile nav drawer:`, err.message);
      }

      await page.close();
    }
  } finally {
    await browser.close();
    console.log(`\nAudit finished! Screenshots saved in: ${targetDir}`);
  }
}

const subdir = process.argv[2] || 'pre';
runAudit(subdir).catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
