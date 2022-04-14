import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import logger from './lib/logger';
import fetchData from './logic/fetch-data';

const encoding = 'utf-8';
const dataDir = path.resolve(__dirname, '../data');
const outputRawFile = path.resolve(dataDir, 'base_data.json');

const git = simpleGit(dataDir);

(async () => {
  logger.debug('git設定');
  await git.addConfig('user.name', process.env.GIT_USER_NAME || 'bot');
  await git.addConfig(
    'user.email',
    process.env.GIT_USER_EMAIL || 'bot@example.com',
  );

  await git.checkout('.');

  logger.debug('前回のデータ取得');
  const prevData = (function () {
    try {
      return JSON.parse(fs.readFileSync(outputRawFile, { encoding }));
    } catch (e) {
      logger.warn('前回のデータ取得失敗', e);
      return {};
    }
  })();

  logger.info('データ取得開始');

  try {
    // データ取得
    const currentData = await fetchData();

    if (!currentData || Object.keys(currentData).length === 0) {
      logger.warn('データ取得できず');
      return;
    }

    logger.debug('生データ保存');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputRawFile, JSON.stringify(currentData), { encoding });

    logger.debug('キーの増減確認');
    try {
      compareKeys(currentData, prevData);
    } catch (e) {
      logger.warn('キーの増減確認処理失敗');
      logger.warn(e);
    }

    await git.add('.');
    const result = await git.status();
    if (result.staged.length === 0) {
      logger.info('データ変更なし');
      return;
    }

    const currentDatetime = execSync('date +"%FT%T%z"').toString();
    await git.commit(currentDatetime);
    logger.info(`データ保存完了: ${currentDatetime}`);
  } catch (e) {
    logger.error(e);
  }
})();

function compareKeys(currentData: any, prevData: any) {
  const keys = Object.keys(currentData);
  const prevKeys = Object.keys(prevData);

  keys.concat(prevKeys).forEach((key) => {
    const includeData = keys.includes(key);
    const includePrev = prevKeys.includes(key);
    if (includeData && !includePrev) {
      logger.info(`データから ${key} が増えた。`);
    } else if (!includeData && includePrev) {
      logger.info(`データから ${key} が減った。`);
    }
  });
}
