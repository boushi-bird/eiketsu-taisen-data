import logger from '../lib/logger';

// データとして利用するキー
const KEYS = [
  'general',
  'color',
  'period',
  'indexInitial',
  'cardType',
  'cost',
  'generalRarity',
  'unitType',
  'skill',
  'strat',
  'stratCategory',
  'stratRange',
  'stratTime',
  'illust',
  'illustView',
  'cv',
];

export const convertData = (data: any): any => {
  if (!data) {
    return;
  }
  const newData: any = {};

  for (const key of KEYS) {
    const current = data[key];
    if (!current) {
      throw new Error(`${key} not exists!`);
    }
    newData[key] = current;
  }

  return newData;
};

export const compareData = (currentData: any, prevData: any) => {
  const keys = Object.keys(currentData);

  logger.debug('各データの増減確認');
  for (const key of keys) {
    const current = currentData[key];
    const prev = prevData[key];
    if (current instanceof Array) {
      // 配列の場合は配列数を比較
      const len = current.length;
      const prevLen = prev instanceof Array ? prev.length : 0;
      if (len != prevLen) {
        logger.info(`${key}: ${prevLen} => ${len}`);
      }
    } else if (current instanceof Object) {
      // Objectの場合はキーの数を比較
      const len = Object.keys(current).length;
      const prevLen = prev instanceof Object ? Object.keys(prev).length : 0;
      if (len != prevLen) {
        logger.info(`${key}: ${prevLen} => ${len}`);
      }
    } else {
      if (current != prev) {
        logger.info(`${key}: ${prev} => ${current}`);
      }
    }
  }
};
