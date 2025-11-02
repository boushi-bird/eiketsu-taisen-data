import logger from '../lib/logger';

// データとして利用するキー
const KEYS = [
  'general',
  'generalAppearVer',
  'generalAppearFilterGroup',
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

// 傾奇用データとして利用するキー
const KABUKI_KEYS = ['general', 'indexInitial', 'kabuki', 'kabukiRank'];
const KABUKI_GENERAL_KEYS = ['idx', 'index_initial_idx', 'card_number'];

export const convertEiketsuDeckDataKabuki = (data: any): any => {
  const newData: any = {};

  for (const key of KABUKI_KEYS) {
    const current = data[key];
    if (!current) {
      throw new Error(`${key} not exists!`);
    }
    if (key === 'general') {
      // general の場合は必要最低限の値に絞る
      newData[key] = (current as any[]).map(generateKabukiGeneralProps);
    } else {
      newData[key] = current;
    }
  }

  return newData;
};

function generateKabukiGeneralProps(general: any) {
  const newGeneral: any = {};
  for (const key of KABUKI_GENERAL_KEYS) {
    const current = general[key];
    if (current == null) {
      throw new Error(`${key} not exists!`);
    }
    newGeneral[key] = current;
  }
  return newGeneral;
}
