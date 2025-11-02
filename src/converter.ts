import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import logger from './lib/logger';
import generateMd5 from './logic/generate-md5';
import {
  convertData as convertEiketsuDeckData,
  compareData as compareEiketsuDeckData,
  convertEiketsuDeckDataKabuki,
} from './logic/eiketsu-deck-data';

const encoding = 'utf-8';
const dataDir = path.resolve(__dirname, '../data');
const outputRawFile = path.resolve(dataDir, 'base_data.json');
const outputEiketsuDeckFile = path.resolve(dataDir, 'eiketsu_deck_data.json');
const outputEiketsuDeckKabukiFile = path.resolve(
  dataDir,
  'eiketsu_deck_data_kabuki.json',
);

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

  logger.info('データ変換開始');

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

  logger.debug('傾奇ptデータ作成');

  // 傾奇pt対応
  let kabuki;
  try {
    kabuki = convertEiketsuDeckDataKabuki(rawData);
  } catch (e) {
    logger.warn('傾奇ptデータ処理失敗', rawData);
    logger.warn(e);
    // 傾奇pt処理は失敗しても続行
    kabuki = undefined;
  }

  try {
    logger.debug('データ保存');
    fs.writeFileSync(outputEiketsuDeckFile, JSON.stringify(currentData), {
      encoding,
    });

    logger.debug('データのMD5作成');
    generateMd5(outputEiketsuDeckFile);

    if (kabuki) {
      fs.writeFileSync(outputEiketsuDeckKabukiFile, JSON.stringify(kabuki), {
        encoding,
      });
      generateMd5(outputEiketsuDeckKabukiFile);
    } else {
      // 傾奇ptが生成できなければ削除
      try {
        if (fs.existsSync(outputEiketsuDeckKabukiFile)) {
          fs.unlinkSync(outputEiketsuDeckKabukiFile);
        }
      } catch (e) {
        logger.error(e);
      }
      try {
        const md5File = `${outputEiketsuDeckKabukiFile}.md5`;
        if (fs.existsSync(md5File)) {
          fs.unlinkSync(md5File);
        }
      } catch (e) {
        logger.error(e);
      }
    }

    await git.add('.');
    const result = await git.status();
    if (result.staged.length === 0) {
      logger.info('[データ変換]データ変更なし');
      return;
    }

    const currentDatetime = execSync('date +"%FT%T%z"').toString();
    await git.commit(currentDatetime);
    logger.info(`データ保存完了: ${currentDatetime}`);
  } catch (e) {
    logger.error(e);
  }
})();
