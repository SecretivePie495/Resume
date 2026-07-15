import puppeteer, { Browser } from 'puppeteer-core';

const LOCAL_CHROME_PATH = process.env.CHROME_EXECUTABLE_PATH
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let browser: Browser | null = null;
let launching: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return puppeteer.launch({
    headless: true,
    executablePath: LOCAL_CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

export async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;

  if (launching) return launching;

  launching = launchBrowser().then(b => {
    browser = b;
    launching = null;
    b.on('disconnected', () => { browser = null; });
    return b;
  });

  return launching;
}
