import {monthKey} from '../data/cards.js';
import {money,normalize} from './finance.js';
import {resolveMerchant} from '../data/merchants.js';

export function previousMonth(date=new Date()) {
 return monthKey(new Date(date.getFullYear(),date.getMonth()-1,1));
}
export function productFor(card,catalog) {
 // Legacy Samsung name is unambiguous; other editions/packs need explicit confirmation.
 const id=card.officialProductId ?? (card.id==='samsung'&&card.edition==='taptap O'?'samsung-taptap-o':'');
 return catalog.products.find(p=>p.id===id&&p.cardId===card.id);
}
export function freshness(product,status,date=new Date()) {
 if(!product)return '상품·Edition 확인 필요';
 const state=status.sources?.[product.sourceId];
 if(state?.state==='failed')return '갱신 실패 · 기존 정보 유지';
 if(state?.state==='review')return '공식 원문 변경 · 확인 필요';
 const oldest=product.benefits.map(b=>b.checkedAt).sort()[0];
 if(!oldest||date.getTime()-Date.parse(oldest+'T00:00:00+09:00')>30*86400000)return '정보가 오래됨 · 재확인 필요';
 return '공식 정보';
}
export const benefitLabel=b=>b.status==='needs-review'?'확인 필요':b.status==='display-only'?(b.type==='service'?'이용권 제공':'순위별 추가 적립'):b.flatAmount!==null?`${money(b.flatAmount)}원 ${b.type==='points'?'적립':b.type==='cashback'?'캐시백':'할인'}`:`${b.rate}% ${b.type==='points'?'적립':b.type==='cashback'?'캐시백':'할인'}`;
export function capFor(b,previous) {
 if(!b.tiers)return b.monthlyCap;
 // Unknown spend: show the minimum qualifying tier, never silently assume 800k.
 return [...b.tiers].reverse().find(t=>previous!==undefined&&previous>=t.previousSpend)?.monthlyCap??b.tiers[0].monthlyCap;
}
export function estimateBenefit(b,card,amount,context={},date=new Date()) {
 const previous=context.assumePreviousSpend?(b.previousSpend??b.tiers?.[0]?.previousSpend):card.history?.[previousMonth(date)];
 const notes=[];
 const excluded=b.exclusions.some(x=>normalize(context.query||'').includes(normalize(x)));
 if(context.mode==='excluded'||excluded)return {value:null,eligible:false,notes:['혜택 제외 거래'],b};
 if(b.status!=='verified'||(b.rate===null&&b.flatAmount===null))return {value:null,eligible:false,notes:['조건 확인 필요 · 자동 계산 제외'],b};
 if(b.packages&&card.samsungPackage&&!b.packages.includes(card.samsungPackage))return {value:null,eligible:false,notes:['선택 패키지 대상 아님'],b};
 if(b.packages&&!card.samsungPackage)notes.push('삼성 선택 패키지 확인 필요');
 if(b.mode&&context.mode!==b.mode) return {value:null,eligible:false,notes:[b.mode==='recurring'?'정기결제·자동납부 선택 시 비교':'네이버 회원·적립 대상 주문 여부 선택 필요'],b};
 if(b.previousSpend>0){
  if(context.assumePreviousSpend)notes.push('전월 실적 조건 충족 가정 · 기본 구간 기준');
  else if(previous===undefined){notes.push(`${previousMonth(date)} 실적 기록 없음`);if(b.tiers)notes.push('최소 실적 구간 한도 기준');}
  else if(previous<b.previousSpend)return {value:0,eligible:false,notes:[`전월 기록 ${money(previous)}원 · 기준 미달 (신규 유예는 별도 확인)`],b};
  else notes.push(`전월 기록 ${money(previous)}원 · 기준 충족`);
 }
 if(amount===''||amount===null||amount===undefined)return {value:null,eligible:true,rankingValue:b.flatAmount??b.rate??0,notes:['금액 미입력 · 할인율/적립률 기준',...notes],b};
 if(!Number.isSafeInteger(amount)||amount<=0)return {value:null,eligible:false,notes:['결제 금액을 입력하세요',...notes],b};
 if(amount<b.minPayment)return {value:0,eligible:false,notes:[`건당 ${money(b.minPayment)}원 이상 필요`],b};
 let value=b.flatAmount??Math.floor(Math.min(amount,b.monthlySpendCap??Infinity)*b.rate/100);
 value=Math.min(value,amount,capFor(b,previous)??Infinity,b.perTransactionCap??Infinity,b.dailyCap??Infinity);
 if(b.monthlyCap!==null||b.dailyCap!==null||b.frequency)notes.push('남은 한도·횟수 미확인');
 notes.push(...b.conditions.filter(s=>!s.includes('신규')).slice(0,2));
 return {value,eligible:value>0,notes,b};
}
function matches(b,merchant,mode) {
 const q=normalize(merchant.label);
 if(b.scope==='all')return true;
 if(b.scope==='overseas')return mode==='overseas';
 if(mode==='overseas')return false;
 if(b.scope==='general')return true;
 // Exact normalized aliases avoid false positives (e.g. 동물병원 -> 병원).
 const keywords=[...b.keywords,b.merchant,b.category].map(normalize);
 return merchant.terms.some(term=>{
  const normalized=normalize(term);
  return keywords.some(k=>k===normalized||k.length>=3&&normalized.length>=3&&(k.includes(normalized)||normalized.includes(k)));
 });
}
export function compareBenefits(cards,catalog,status,query,amount,mode='direct',date=new Date(),customMerchants=[],assumptions={}) {
 const merchant=resolveMerchant(query,customMerchants);if(!merchant)return [];
 return cards.map(card=>{
  const product=productFor(card,catalog);
  if(!product)return {card,value:null,reason:'보유 상품·Edition 또는 PACK을 먼저 확인해주세요.',notes:[],state:'상품 확인 필요'};
  const candidates=product.benefits.filter(b=>matches(b,merchant,mode)).map(b=>estimateBenefit(b,card,amount,{query:merchant.label,mode,...assumptions},date));
  // A dedicated Naver purchase must not fall back to the unlimited general rate.
  const naverTarget=product.id==='naver-ed1'&&product.benefits.some(b=>b.scope==='merchant'&&matches(b,merchant,mode));
  const scoped=naverTarget?candidates.filter(e=>e.b.scope!=='general'):candidates;
  const combined=scoped.map(e=>{
   const base=e.b.additionalTo&&candidates.find(c=>c.b.id===e.b.additionalTo&&c.value!==null);
   return base&&e.value!==null&&e.eligible?{...e,value:Math.min(amount,e.value+base.value),base,capValue:e.value}:e;
  });
  const sorted=combined.sort((a,b)=>(b.value??b.rankingValue??-1)-(a.value??a.rankingValue??-1));
  const best=sorted[0];
  if(!best)return {card,value:null,reason:'확인된 해당 사용처 혜택 없음',notes:[],state:freshness(product,status,date)};
  const value=best.value,base=best.base;
  const state=freshness(product,status,date);
  return {card,product,b:best.b,value,rankingValue:best.value??best.rankingValue??0,unit:best.b.unit,reason:benefitLabel(best.b)+(base?' + 기본 1% 할인':''),notes:best.notes,state,eligible:best.eligible&&state==='공식 정보',merchant};
 }).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||(b.rankingValue??-1)-(a.rankingValue??-1));
}

export function recommendedForProgress(results,amount,threshold={won:300,ratio:0.01}) {
 const leader=results.find(r=>r.eligible&&r.rankingValue>0);if(!leader||!Number.isSafeInteger(amount)||amount<=0)return null;
 const difference=Math.max(0,leader.rankingValue-(results.find(r=>r.card.id!==leader.card.id&&r.eligible&&r.rankingValue>0)?.rankingValue??0));
 const candidate=results.find(r=>r.card.id!==leader.card.id&&r.eligible&&r.rankingValue>0&&r.card.currentSpentKRW<r.card.monthlyGoalKRW&&leader.rankingValue-r.rankingValue<=Math.max(threshold.won,Math.floor(amount*threshold.ratio)));
 if(!candidate)return null;
 return {leader,candidate,difference:leader.rankingValue-candidate.rankingValue,remaining:Math.max(0,candidate.card.monthlyGoalKRW-candidate.card.currentSpentKRW)};
}

export function validateCatalog(catalog) {
 const fail=()=>{throw Error('공식 혜택 JSON 검증 실패');};
 if(catalog?.schemaVersion!==1||!Array.isArray(catalog.products)||!catalog.products.length)fail();
 const ids=new Set();const amount=n=>n===null||(Number.isSafeInteger(n)&&n>=0);
 for(const p of catalog.products){
  if(!p.id||ids.has(p.id)||!['samsung','naver','kb','nh'].includes(p.cardId)||!p.sourceId||!Array.isArray(p.benefits)||!p.benefits.length)fail();ids.add(p.id);
  const benefits=new Set();
  for(const b of p.benefits){
   if(!b.id||benefits.has(b.id)||!b.merchant||!b.category||!['discount','points','cashback','service'].includes(b.type)||!['verified','display-only','needs-review'].includes(b.status)||!['원','P'].includes(b.unit)||!['merchant','general','all','overseas'].includes(b.scope))fail();benefits.add(b.id);
   if(!(b.rate===null||(Number.isFinite(b.rate)&&b.rate>0&&b.rate<=100)))fail();
   for(const key of ['flatAmount','monthlyCap','perTransactionCap','dailyCap','monthlySpendCap','previousSpend','minPayment'])if(!amount(b[key]))fail();
   if(b.previousSpend===null||b.minPayment===null||b.status==='verified'&&((b.rate===null)===(b.flatAmount===null)))fail();
   for(const key of ['keywords','conditions','exclusions','spendExclusions'])if(!Array.isArray(b[key])||!b[key].every(x=>typeof x==='string'&&x.length>0))fail();
   if(!/^\d{4}-\d{2}-\d{2}$/.test(b.checkedAt)||!Number.isFinite(Date.parse(b.checkedAt)))fail();
   let url;try{url=new URL(b.sourceUrl);}catch{fail();}
   if(url.protocol!=='https:'||!['www.samsungcard.com','www.hyundaicard.com','card.kbcard.com','card.nonghyup.com'].includes(url.hostname)||b.sourceId!==p.sourceId)fail();
   if(b.frequency&&!Object.entries(b.frequency).every(([k,v])=>['day','month','year'].includes(k)&&Number.isInteger(v)&&v>0))fail();
   if(b.tiers&&(!b.tiers.length||!b.tiers.every((t,i)=>amount(t.previousSpend)&&t.previousSpend!==null&&amount(t.monthlyCap)&&t.monthlyCap!==null&&(!i||t.previousSpend>b.tiers[i-1].previousSpend))))fail();
  }
 }
 return catalog;
}
