import {createHash,constants} from 'node:crypto';
import https from 'node:https';
const strip=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|#160);/g,' ').replace(/\s+/g,' ').trim();
function between(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a+start.length);if(a<0||b<=a)throw Error('혜택 영역 구조 변경');return s.slice(a,b);}
export function extractSource(adapter,buffer) {
 if(adapter==='pdf'){
  if(buffer.length<10000||buffer.subarray(0,5).toString()!=='%PDF-')throw Error('상품설명서 PDF 응답 아님');
  return buffer;
 }
 const raw=buffer.toString('utf8');let text;
 if(adapter==='samsung'){
  if(!raw.includes('AAP1483'))throw Error('상품 식별 실패');
  // Read JSON string literals from Nuxt SSR. Never execute remote JavaScript.
  const parts=[];
  for(const token of raw.matchAll(/"(?:[^"\\]|\\.)*"/g)){
   try {const s=JSON.parse(token[0]);if(s.includes('<')&&(s.includes('서비스안내')||s.includes('대상 이용처')))parts.push(strip(s));}catch{}
  }
  text=[...new Set(parts)].join('\n');
  for(const marker of ['스타벅스','50%','10,000','5,000','30','CGV','전월'])if(!text.includes(marker))throw Error('삼성 혜택 필수 항목 누락');
 } else if(adapter==='nh'){
  text=strip(raw);text=between(text,'“생활소비','국제 브랜드 프리미엄 서비스');
  for(const marker of ['NH포인트','40만원','80만원','15%','30%'])if(!text.includes(marker))throw Error('NH 혜택 필수 항목 누락');
 } else if(adapter==='kb'){
  text=strip(raw);text=between(text,'국내 가맹점 1% 청구할인','연회비 반환기준');
  for(const marker of ['3,000','40만원','50%','2%'])if(!text.includes(marker))throw Error('KB 혜택 필수 항목 누락');
 }else throw Error('등록되지 않은 어댑터');
 if(text.length<500)throw Error('빈 혜택 응답');
 return Buffer.from(text);
}
export const hashSource=buffer=>createHash('sha256').update(buffer).digest('hex');
export async function fetchSource(source){
 if(source.adapter==='pdf'&&new URL(source.url).hostname==='www.hyundaicard.com'){
  // This issuer requires legacy TLS renegotiation. Certificate verification stays ON.
  const bytes=await new Promise((resolve,reject)=>{
   const req=https.get(source.url,{secureOptions:constants.SSL_OP_LEGACY_SERVER_CONNECT,timeout:25000},res=>{
    if(res.statusCode!==200){res.resume();reject(Error(`HTTP ${res.statusCode}`));return;}
    const chunks=[];let size=0;
    res.on('data',chunk=>{size+=chunk.length;if(size>10000000)req.destroy(Error('응답 크기 제한 초과'));else chunks.push(chunk);});
    res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
   });req.on('timeout',()=>req.destroy(Error('연결 시간 초과')));req.on('error',reject);
  });
  return extractSource(source.adapter,bytes);
 }
 const response=await fetch(source.url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'CardCard-official-benefit-check/1.0'},redirect:'error'});
 if(!response.ok)throw Error(`HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length>10000000)throw Error('응답 크기 제한 초과');
 return extractSource(source.adapter,bytes);
}
