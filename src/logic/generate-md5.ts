import crypto from 'crypto';
import fs from 'fs';

export default (filePath: string): boolean => {
  const file = fs.readFileSync(filePath);
  const md5 = crypto.createHash('md5');
  const result = md5.update(file).digest('hex');
  fs.writeFileSync(`${filePath}.md5`, result);
  return true;
};
