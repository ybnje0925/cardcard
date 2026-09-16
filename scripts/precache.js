import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const assets=(await readdir('dist/assets')).map(f=>'assets/'+f);
const hash=createHash('sha256').update(assets.join(',')).digest('hex').slice(0,12);
let sw=await readFile('dist/sw.js','utf8');
sw=sw.replace("const CACHE='my-cards-v1'",`const CACHE='my-cards-${hash}'`).replace("BASE+'icon-512.png'",`BASE+'icon-512.png',${assets.map(f=>`BASE+${JSON.stringify(f)}`).join(',')}`);
await writeFile('dist/sw.js',sw);
