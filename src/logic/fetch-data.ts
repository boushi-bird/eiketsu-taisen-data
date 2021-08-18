import puppeteer from 'puppeteer-core';
import logger from '../lib/logger';

const IGNORE_RESOURCE_TYPES = ['image', 'font'];

const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
const navigationTimeout = process.env.PUPPETEER_NAVIGATION_TIMEOUT;
const clientUserAgent = process.env.CLIENT_USER_AGENT;
const targetUrl = process.env.TARGET_URL;

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
      if (IGNORE_RESOURCE_TYPES.includes(request.resourceType())) {
        logger.debug(`スキップ: ${request.url()}`);
        request.abort();
      } else {
        logger.debug(`処理中: ${request.url()}`);
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
    const handle = await page.evaluateHandle(() => ({ window }));
    const properties = await handle.getProperties();
    const windowHandle = properties.get('window');
    if (windowHandle == null) {
      return null;
    }

    logger.debug('base_data処理待ち');
    await page.waitForFunction(
      (window: { [x: string]: any }) => {
        const baseData = window['base_data'];
        return baseData && Object.keys(baseData).length > 0;
      },
      { timeout: 60000 },
      windowHandle,
    );
    logger.debug('base_data処理待ち完了');

    return await page.evaluate((window) => {
      return window['base_data'];
    }, windowHandle);
  } catch (e) {
    throw e;
  } finally {
    logger.debug('ブラウザ終了');
    await browser.close();
  }
};
