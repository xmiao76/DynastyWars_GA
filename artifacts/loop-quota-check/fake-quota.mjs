import fs from 'node:fs';
const [requestFile] = process.argv.slice(2);
JSON.parse(fs.readFileSync(requestFile, 'utf8'));
console.error('ERROR: exceeded retry limit, last status: 429 Too Many Requests, request id: fixture');
process.exit(7);
