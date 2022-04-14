import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import logger from './lib/logger';
import generateMd5 from './logic/generate-md5';
import {
  convertData as convertEiketsuDeckData,
  compareData as compareEiketsuDeckData,
} from './logic/eiketsu-deck-data';

const encoding = 'utf-8';
const dataDir = path.resolve(__dirname, '../data');
const outputRawFile = path.resolve(dataDir, 'base_data.json');
const outputEiketsuDeckFile = path.resolve(dataDir, 'eiketsu_deck_data.json');

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
      return JSON.parse(fs.readFileSync(outputEiketsuDeckFile, { encoding }));
    } catch (e) {
      logger.warn('前回のデータ取得失敗', e);
      return {};
    }
  })();

  logger.debug('生データ取得');
  const rawData = JSON.parse(fs.readFileSync(outputRawFile, { encoding }));

  logger.debug('データ変換');
  let currentData;
  try {
    currentData = convertEiketsuDeckData(rawData);
  } catch (e) {
    logger.warn('データ変換処理失敗', rawData);
    logger.warn(e);
    return;
  }

  logger.debug('データ比較');
  try {
    compareEiketsuDeckData(currentData, prevData);
  } catch (e) {
    logger.warn('比較処理失敗');
    logger.warn(e);
    return;
  }

  try {
    logger.debug('データ保存');
    fs.writeFileSync(outputEiketsuDeckFile, JSON.stringify(currentData), {
      encoding,
    });

    logger.debug('データのMD5作成');
    generateMd5(outputEiketsuDeckFile);

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
