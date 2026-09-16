import { monthKey, seedData } from '../data/cards.js';
export const STORAGE_KEY='my-cards-v1';
export function rollover(data, key=monthKey()) {
 return {...data,cards:data.cards.map(c=>c.monthKey<key?{...c,history:{...c.history,[c.monthKey]:c.currentSpentKRW},currentSpentKRW:0,monthKey:key}:c)};
}
const str=v=>typeof v==='string'&&v.length<=10000;
const amount=v=>Number.isSafeInteger(v)&&v>=0&&v<=999999999999;
export function validateData(d){
 if(!d||d.version!==1||!Array.isArray(d.cards)||d.cards.length!==4||!Array.isArray(d.favorites)||!d.favorites.every(str))throw Error('올바른 내 카드 백업 파일이 아닙니다.');
 const ids=new Set();
 for(const c of d.cards){
  if(!str(c.id)||ids.has(c.id)||!str(c.issuer)||!str(c.displayName)||!str(c.edition)||!str(c.memo)||!amount(c.monthlyGoalKRW)||c.monthlyGoalKRW===0||!amount(c.currentSpentKRW)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(c.monthKey)||c.monthKey>monthKey()||!c.history||Array.isArray(c.history)||!Object.entries(c.history).every(([k,v])=>/^\d{4}-(0[1-9]|1[0-2])$/.test(k)&&amount(v))||!c.visual||!['black','green','gold','blue'].includes(c.visual.theme)||!str(c.visual.label)||!str(c.visual.brand)||!Array.isArray(c.benefitSummary)||!c.benefitSummary.every(str)||!Array.isArray(c.merchantRules)||!c.merchantRules.every(r=>Array.isArray(r.keywords)&&r.keywords.every(str)&&str(r.benefitLabel)&&Number.isFinite(r.priority))||!Array.isArray(c.autopayItems)||!c.autopayItems.every(a=>str(a.id)&&str(a.name)&&str(a.category)&&str(a.memo)&&(a.amount===null||amount(a.amount))&&Number.isInteger(a.day)&&a.day>=1&&a.day<=31&&['포함','제외','모름'].includes(a.inclusion)))throw Error('백업 데이터의 항목이나 금액이 올바르지 않습니다.');
  ids.add(c.id);
 }
 return rollover(d);
}
export function loadData(){const raw=localStorage.getItem(STORAGE_KEY);return raw?validateData(JSON.parse(raw)):seedData();}
