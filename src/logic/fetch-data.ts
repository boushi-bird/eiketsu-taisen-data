import puppeteer from 'puppeteer-core';
import logger from '../lib/logger';

const IGNORE_RESOURCE_TYPES = ['image', 'font'];
const IGNORE_RESOURCE_URLS = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://www.googleadservices.com',
];

const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
const navigationTimeout = process.env.PUPPETEER_NAVIGATION_TIMEOUT;
const baseDataWaitingTimeout =
  parseInt(process.env.BASE_DATA_WAITING_TIMEOUT || '60000') || 60000;
const clientUserAgent = process.env.CLIENT_USER_AGENT;
const targetUrl = process.env.TARGET_URL;

function isIgnoreUrl(url: string): boolean {
  return IGNORE_RESOURCE_URLS.some((u) => url.startsWith(u));
}

export default async (): Promise<any> => {
  if (!targetUrl) {
    logger.warn('TARGET_URLが設定されていない');
    return null;
  }
  if (!executablePath) {
    logger.warn('PUPPETEER_EXECUTABLE_PATHが設定されていない');
    return null;
  }

  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox'],
    headless: true,
  });
  try {
    logger.debug('ブラウザ開始');
    const page = await browser.newPage();

    page.setRequestInterception(true);
    page.on('request', (request) => {
      const reqUrl = request.url();
      if (
        IGNORE_RESOURCE_TYPES.includes(request.resourceType()) ||
        isIgnoreUrl(reqUrl)
      ) {
        logger.debug(`スキップ: ${reqUrl}`);
        request.abort();
      } else {
        logger.debug(`処理中: ${reqUrl}`);
        request.continue();
      }
    });

    if (clientUserAgent != null) {
      page.setUserAgent(clientUserAgent);
    }
    if (navigationTimeout != null) {
      const navtimeout = parseInt(navigationTimeout);
      page.setDefaultNavigationTimeout(navtimeout);
    }

    logger.debug('ページアクセス開始');
    await page.goto(targetUrl);

    logger.debug('js処理開始');

    const waitingFunction = 'BASE_DATA && Object.keys(BASE_DATA).length > 0';
    const evaluateFunction = 'BASE_DATA';

    logger.debug('BASE_DATA処理待ち');
    await page.waitForFunction(waitingFunction, {
      timeout: baseDataWaitingTimeout,
    });
    logger.debug('BASE_DATA処理待ち完了');

    return await page.evaluate(evaluateFunction);
  } catch (e) {
    throw e;
  } finally {
    logger.debug('ブラウザ終了');
    await browser.close();
  }
};
