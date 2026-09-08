import { readFileSync, writeFileSync } from 'node:fs';

const file = 'c:/Users/hussa/Desktop/Laqahi/laqahi-main/src/utils/api.js';
let content = readFileSync(file, 'utf8');

// تأمين: لا نلحق إن كانت الدالة موجودة مسبقًا
if (content.includes('getParentChildrenApi')) {
  console.log('SKIP: already present');
  process.exit(0);
}

const block = [
  '',
  'export async function getParentChildrenApi() {',
  "  return apiData('/parent/children')",
  '}',
  ''
].join('\n');

content = content.replace(/\s+$/, '') + '\n' + block;
writeFileSync(file, content, 'utf8');
console.log('APPENDED: getParentChildrenApi');