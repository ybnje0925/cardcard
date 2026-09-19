import {readFile} from 'node:fs/promises';
import {validateCatalog} from '../../src/utils/benefits.js';
const catalog=JSON.parse(await readFile(new URL('../../src/data/official-benefits.json',import.meta.url),'utf8'));
validateCatalog(catalog);
const status=JSON.parse(await readFile(new URL('../../src/data/benefit-status.json',import.meta.url),'utf8'));
if(!Number.isFinite(Date.parse(status.checkedAt))||catalog.products.some(p=>!['ok','failed','review'].includes(status.sources?.[p.sourceId]?.state)))throw Error('공식 갱신 상태 JSON 검증 실패');
console.log(`Official benefits validated: ${catalog.products.length} products, ${catalog.products.reduce((n,p)=>n+p.benefits.length,0)} benefits`);
