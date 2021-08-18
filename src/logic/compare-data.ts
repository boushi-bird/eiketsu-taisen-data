import logger from '../lib/logger';

export default (currentData: any, prevData: any) => {
  const keys = Object.keys(currentData);
  const prevKeys = Object.keys(prevData);

  logger.debug('キーの増減確認');
  keys.concat(prevKeys).forEach((key) => {
    const includeData = keys.includes(key);
    const includePrev = prevKeys.includes(key);
    if (includeData && !includePrev) {
      logger.info(`データから ${key} が増えた。`);
    } else if (!includeData && includePrev) {
      logger.info(`データから ${key} が減った。`);
    }
  });

  logger.debug('各データの増減確認');
  for (const key of keys) {
    if (key === 'DATA') {
      const current = currentData[key][0]['code'];
      const prev = (prevData[key] || [{}])[0]['code'];
      if (current !== prev) {
        logger.info(`${key}: ${prev} => ${current}`);
      }
      continue;
    }

    const current = currentData[key];
    if (current instanceof Array) {
      const len = current.length;
      const prevLen = (prevData[key] || []).length;
      if (len != prevLen) {
        logger.info(`${key}: ${prevLen} => ${len}`);
      }
    } else if (current instanceof Object) {
      const len = Object.keys(current).length;
      const prevLen = Object.keys(prevData[key] || {}).length;
      if (len != prevLen) {
        logger.info(`${key}: ${prevLen} => ${len}`);
      }
    } else {
      const prev = prevData[key];
      if (current != prev) {
        logger.info(`${key}: ${prev} => ${current}`);
      }
    }
  }
};
