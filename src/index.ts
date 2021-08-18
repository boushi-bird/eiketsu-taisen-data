import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git/promise';
import logger from './lib/logger';
import compareData from './logic/compare-data';
import convertData from './logic/convert-data';
import fetchData from './logic/fetch-data';
import generateMd5 from './logic/generate-md5';

const encoding = 'utf-8';
const dataDir = path.resolve(__dirname, '../data');
const outputRawFile = path.resolve(dataDir, 'raw_base.json');
const outputFile = path.resolve(dataDir, 'base.json');

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
      return JSON.parse(fs.readFileSync(outputFile, { encoding }));
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

    logger.debug('データ変換');
    try {
      convertData(currentData);
    } catch (e) {
      logger.warn('データ変換処理失敗', currentData);
      logger.warn(e);
      return;
    }

    logger.debug('データ比較');
    try {
      compareData(currentData, prevData);
    } catch (e) {
      logger.warn('比較処理失敗');
      logger.warn(e);
      return;
    }

    logger.debug('データ保存');
    fs.writeFileSync(outputFile, JSON.stringify(currentData), { encoding });

    logger.debug('データのMD5作成');
    generateMd5(outputFile);

    await git.add('.');
    const result = await git.status();
    if (result.staged.length === 0) {
      logger.info('データ変更なし');
      return;
    }

    const currentDatetime = execSync('date +"%FT%T%z"').toString();
    await git.commit(currentDatetime);
    logger.info('データ保存完了');
  } catch (e) {
    logger.error(e);
  }
})();
