import puppeteer, { Browser } from 'puppeteer';

let browser: Browser | null = null;
let launching: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;

  if (launching) return launching;

  launching = puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  }).then(b => {
    browser = b;
    launching = null;
    b.on('disconnected', () => { browser = null; });
    return b;
  });

  return launching;
}
