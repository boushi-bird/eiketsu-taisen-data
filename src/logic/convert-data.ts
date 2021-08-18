function deleteKeys(data: any, deleteKeys: string[]): void {
  if (!data) {
    return;
  }
  for (const key of deleteKeys) {
    delete data[key];
  }
}

function deleteKeysForArray(rows: any, deleteKeys: string[]): void {
  if (!rows || !(rows instanceof Array)) {
    return;
  }
  for (const row of rows) {
    for (const key of deleteKeys) {
      delete row[key];
    }
  }
}

export default (data: any): void => {
  if (!data) {
    return;
  }

  // 毎日差分が出るとキャッシュが効きにくくなるので
  // 使用しない項目は削除する。

  deleteKeys(data, ['DATA', 'PLAYER']);
  deleteKeysForArray(data['GENERAL'], [
    'belong',
    'ex_rank',
    'not_belong',
    'master_player',
  ]);
  deleteKeysForArray(data['ASSIST'], [
    'belong',
    'ex_rank',
    'not_belong',
    'master_player',
  ]);
};
