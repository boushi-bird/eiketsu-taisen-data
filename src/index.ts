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

  // TODO: 前回のデータ取得

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

    // TODO: データ変換

    // TODO: データ比較

    // TODO: 変換データ保存

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
