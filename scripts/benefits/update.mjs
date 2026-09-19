import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {sources,reviewedCatalog} from './reviewed.mjs';
import {fetchSource,hashSource} from './adapters.mjs';
import {validateCatalog} from '../../src/utils/benefits.js';
const root=new URL('../../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
async function atomic(file,data){const path=new URL(file,root);await mkdir(new URL('.',path),{recursive:true});await writeFile(new URL(file+'.tmp',root),JSON.stringify(data,null,2)+'\n');await rename(new URL(file+'.tmp',root),path);}
export async function refresh(catalog,baseline,fetcher=fetchSource,now=new Date()){
 validateCatalog(catalog);
 const next=structuredClone(catalog),status={checkedAt:now.toISOString(),sources:{}};
 for(const [id,source] of Object.entries(sources)){
  try{
   const hash=hashSource(await fetcher(source));
   if(hash!==baseline[id]?.sha256){status.sources[id]={state:'review',message:'원문 변경 또는 검토 기준 없음. 기존 정상 데이터 유지.',observedHash:hash};continue;}
   status.sources[id]={state:'ok',message:'검토한 공식 원문과 동일'};
   for(const p of next.products.filter(p=>p.sourceId===id))for(const b of p.benefits)b.checkedAt=now.toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
  }catch(error){status.sources[id]={state:'failed',message:String(error.message).slice(0,180)};}
 }
 return {catalog:validateCatalog(next),status};
}
async function main(){
 const mode=process.argv[2]||'check';
 if(mode==='build'){
  validateCatalog(reviewedCatalog);
  const baseline=await read('scripts/benefits/baseline.json');
  // A stale baseline cannot accidentally bless edited rates/conditions.
  if(baseline.catalogHash!==hashSource(Buffer.from(JSON.stringify(reviewedCatalog))))throw Error('검토 데이터 변경: 원문 재검토 후 accept 실행 필요');
  await atomic('src/data/official-benefits.json',reviewedCatalog);return;
 }
 if(mode==='accept'){
  if(!process.argv.includes('--reviewed'))throw Error('공식 원문과 reviewed.mjs 대조 후 --reviewed를 명시하세요.');
  validateCatalog(reviewedCatalog);const baseline={};
  for(const [id,source] of Object.entries(sources)){
   const content=await fetchSource(source);
   baseline[id]={url:source.url,sha256:hashSource(content),reviewedAt:new Date().toISOString()};
   await mkdir(new URL('.tmp/benefit-sources/',root),{recursive:true});
   await writeFile(new URL(`.tmp/benefit-sources/${id}.${source.adapter==='pdf'?'pdf':'txt'}`,root),content);
  }
  baseline.catalogHash=hashSource(Buffer.from(JSON.stringify(reviewedCatalog)));
  await atomic('scripts/benefits/baseline.json',baseline);
  await atomic('src/data/official-benefits.json',reviewedCatalog);
 }
 if(!['check','accept'].includes(mode))throw Error('check, build, accept 중 선택');
 const catalog=await read('src/data/official-benefits.json'),baseline=await read('scripts/benefits/baseline.json');
 if(baseline.catalogHash!==hashSource(Buffer.from(JSON.stringify(reviewedCatalog))))throw Error('검토 데이터와 기준 해시 불일치');
 const result=await refresh(catalog,baseline);
 await atomic('src/data/official-benefits.json',result.catalog);
 await atomic('src/data/benefit-status.json',result.status);
 console.log(JSON.stringify(result.status,null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
