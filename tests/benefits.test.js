import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {seedData} from '../src/data/cards.js';
import {compareBenefits,estimateBenefit,previousMonth,productFor,freshness,validateCatalog} from '../src/utils/benefits.js';
import {validateData} from '../src/utils/storage.js';
import {refresh} from '../scripts/benefits/update.mjs';
import {extractSource,hashSource} from '../scripts/benefits/adapters.mjs';
import {resolveMerchant} from '../src/data/merchants.js';
import {recommendedForProgress} from '../src/utils/benefits.js';
const catalog=JSON.parse(await readFile(new URL('../src/data/official-benefits.json',import.meta.url)));
const date=new Date(2026,8,17),status={sources:{}};
function cards(){const cards=seedData().cards;for(const c of cards)c.history['2026-08']=400000;cards[0].samsungPackage='1';cards[1].officialProductId='naver-ed1';cards[2].officialProductId='kb-all';cards[3].officialProductId='nh-discount';return cards;}
const compare=(cs,q,n,mode='direct')=>compareBenefits(cs,catalog,status,q,n,mode,date);
test('catalog is valid and source URLs are official; corrupt numeric data rejected',()=>{
 assert.equal(validateCatalog(catalog),catalog);const copy=structuredClone(catalog);copy.products[0].benefits[0].rate=500;assert.throws(()=>validateCatalog(copy));
 copy.products[0].benefits[0].rate=50;copy.products[0].benefits[0].sourceUrl='https://example.com';assert.throws(()=>validateCatalog(copy));
});
test('10000 won Starbucks compares 5000 discount, 100P, 100 discount, 1000 discount',()=>{
 const r=compare(cards(),'스타벅스',10000);assert.equal(r[0].card.id,'samsung');assert.deepEqual(Object.fromEntries(r.map(x=>[x.card.id,x.value])),{samsung:5000,nh:1000,naver:100,kb:100});assert.match(r[0].notes.join(' '),/남은 한도/);
});
test('monthly cap, chosen package, and unsupported coffee merchant',()=>{
 const cs=cards();assert.equal(compare(cs,'스타벅스',100000)[0].value,10000);cs[0].samsungPackage='4';assert.equal(compare(cs,'스타벅스',10000)[0].value,3000);cs[0].samsungPackage='1';assert.equal(compare(cs,'이디야',10000).find(r=>r.card.id==='samsung').value,null);
});
test('unknown edition never inherits current product; manual fields survive validation',()=>{
 const cs=seedData().cards;cs[1].edition='Edition2';assert.equal(productFor(cs[1],catalog),undefined);assert.equal(compare(cs,'스타벅스',10000).find(r=>r.card.id==='naver').value,null);
 const d=seedData();d.cards[0].memo='내 메모';d.cards[0].benefitSummary=['사용자 수정'];d.cards[0].samsungPackage='6';const migrated=validateData(structuredClone(d));assert.equal(migrated.cards[0].memo,'내 메모');assert.deepEqual(migrated.cards[0].benefitSummary,['사용자 수정']);assert.equal(migrated.cards[1].officialProductId,'naver-ed1');assert.equal(migrated.cards[1].edition,'Edition1 · 원본');assert.equal(migrated.cards[2].officialProductId,'kb-all');assert.equal(migrated.cards[2].edition,'KB ALL');assert.equal(migrated.cards[3].officialProductId,'nh-discount');assert.equal(migrated.cards[3].edition,'할인 PACK');
});
test('fixed-cost assumption bypasses previous-month shortfall and uses base tier',()=>{
 const cs=cards();for(const c of cs)c.history['2026-08']=0;const r=compareBenefits(cs,catalog,status,'넷플릭스',17000,'recurring',new Date(2026,8,19),[],{assumePreviousSpend:true});const kb=r.find(x=>x.card.id==='kb');assert.ok(kb.value>0);assert.match(kb.notes.join(' '),/실적 조건 충족 가정/);
});
test('current-month spending never satisfies previous-month condition; zero differs from missing',()=>{
 const cs=cards();cs[0].currentSpentKRW=900000;cs[0].monthlyGoalKRW=10000;cs[0].history['2026-08']=0;const r=compare(cs,'스타벅스',10000);assert.equal(r.find(r=>r.card.id==='samsung').value,0);assert.notEqual(r[0].card.id,'samsung');
 delete cs[0].history['2026-08'];assert.equal(compare(cs,'스타벅스',10000)[0].value,5000);assert.match(compare(cs,'스타벅스',10000)[0].notes.join(' '),/기록 없음/);
 assert.equal(previousMonth(new Date(2026,0,31)),'2025-12');
});
test('flat cinema discount respects minimum transaction and count metadata',()=>{
 const cs=cards(),b=catalog.products[0].benefits.find(b=>b.id==='cinema');assert.equal(estimateBenefit(b,cs[0],9999,{},date).value,0);assert.equal(estimateBenefit(b,cs[0],10000,{},date).value,5000);assert.deepEqual(b.frequency,{day:1,month:2,year:12});
});
test('NH tier cap and daily point cap apply; uncertain tier uses minimum cap',()=>{
 const cs=cards();assert.equal(compare(cs,'병원',200000).find(r=>r.card.id==='nh').value,8000);cs[3].history['2026-08']=800000;assert.equal(compare(cs,'병원',200000).find(r=>r.card.id==='nh').value,15000);delete cs[3].history['2026-08'];assert.equal(compare(cs,'병원',200000).find(r=>r.card.id==='nh').value,8000);
 cs[3].officialProductId='nh-points';assert.equal(compare(cs,'일반',2000000).find(r=>r.card.id==='nh').value,10000);
});
test('KB shared extra cap stacks with basic rate even when basic exceeds extra',()=>{
 assert.equal(compare(cards(),'넷플릭스',10000,'recurring').find(r=>r.card.id==='kb').value,1100);
 assert.equal(compare(cards(),'넷플릭스',500000,'recurring').find(r=>r.card.id==='kb').value,8000);
 assert.equal(compare(cards(),'넷플릭스',10000).find(r=>r.card.id==='kb').value,100);
});
test('Naver targeted purchases require membership context and cap eligible spending',()=>{
 assert.equal(compare(cards(),'네이버쇼핑',300000,'naver-plus').find(r=>r.card.id==='naver').value,10000);
 assert.equal(compare(cards(),'네이버쇼핑',300000,'naver-nonmember').find(r=>r.card.id==='naver').value,2000);
 assert.equal(compare(cards(),'네이버쇼핑',300000).find(r=>r.card.id==='naver').value,null);
});
test('excluded, empty, zero, invalid and overseas inputs do not manufacture rewards',()=>{
 assert.deepEqual(compare(cards(),' ',10000),[]);
 for(const n of ['',0,-10,NaN,Infinity])assert.ok(compare(cards(),'스타벅스',n).every(r=>r.value===null));
 assert.ok(compare(cards(),'스타벅스',10000,'excluded').every(r=>r.value===null||r.value===0));
 assert.equal(compare(cards(),'동물병원',10000).find(r=>r.card.id==='nh').value,null);
 assert.equal(compare(cards(),'해외결제',10000,'overseas').find(r=>r.card.id==='kb').value,200);
});
test('stale and failed sources remain visible but cannot win a recommendation',()=>{
 const p=catalog.products[0];assert.match(freshness(p,{sources:{samsung:{state:'failed'}}},date),/갱신 실패/);assert.match(freshness(p,status,new Date(2027,0,1)),/오래됨/);
 const r=compareBenefits(cards(),catalog,{sources:{samsung:{state:'review'}}},'스타벅스',10000,'direct',date);assert.notEqual(r[0].card.id,'samsung');assert.equal(r.find(r=>r.card.id==='samsung').value,5000);
});
test('refresh failure and changed source retain every original field and confirmation date',async()=>{
 const before=structuredClone(catalog);const fail=await refresh(catalog,{},async()=>{throw Error('network');},new Date(2026,8,20));assert.deepEqual(fail.catalog,before);assert.ok(Object.values(fail.status.sources).every(s=>s.state==='failed'));
 const change=await refresh(catalog,{},async()=>Buffer.from('changed'),new Date(2026,8,20));assert.deepEqual(change.catalog,before);assert.ok(Object.values(change.status.sources).every(s=>s.state==='review'));assert.deepEqual(catalog,before);
 const baseline=Object.fromEntries(['samsung','naver','kb','nh'].map(id=>[id,{sha256:hashSource(Buffer.from('same'))}]));const ok=await refresh(catalog,baseline,async()=>Buffer.from('same'),new Date(2026,8,20));assert.equal(ok.catalog.products[0].benefits[0].checkedAt,'2026-09-20');
});
test('empty or redesigned official responses fail closed',()=>{
 for(const adapter of ['samsung','nh','kb','pdf'])assert.throws(()=>extractSource(adapter,Buffer.from('<html>Access denied</html>')));
 const empty=structuredClone(catalog);empty.products[0].benefits=[];assert.throws(()=>validateCatalog(empty));
});
test('merchant aliases, partial names, categories and custom places normalize before comparison',()=>{
 assert.equal(resolveMerchant('스벅 감일').label,'스타벅스');assert.equal(resolveMerchant('메가').category,'카페');assert.equal(resolveMerchant('배민').label,'배달의민족');assert.equal(resolveMerchant('네이버 쇼핑').label,'네이버쇼핑');
 assert.equal(resolveMerchant('CU').category,'편의점');assert.equal(resolveMerchant('동물병원').category,'반려동물');
 assert.equal(resolveMerchant('회사 구내식당',[{id:'x',name:'회사 구내식당',category:'음식점'}]).category,'음식점');
 const r=compare(cards(),'스벅 감일',13000);assert.equal(r.find(x=>x.card.id==='samsung').value,6500);
});
test('no amount ranks by benefit rate and progress recommendation never replaces the winner',()=>{
 const r=compare(cards(),'스타벅스','');assert.equal(r[0].card.id,'samsung');assert.equal(r[0].value,null);assert.equal(r[0].reason,'50% 할인');
 const sample=[{card:{id:'a',currentSpentKRW:300000,monthlyGoalKRW:300000},eligible:true,rankingValue:500},{card:{id:'b',currentSpentKRW:260000,monthlyGoalKRW:300000},eligible:true,rankingValue:450}];
 const advice=recommendedForProgress(sample,10000);assert.equal(advice.leader.card.id,'a');assert.equal(advice.candidate.card.id,'b');assert.equal(advice.remaining,40000);
 assert.equal(recommendedForProgress(sample,100000).candidate.card.id,'b');
});
test('requested payment cases keep official conditions visible',()=>{
 const cs=cards();
 assert.equal(compare(cs,'넷플릭스',17000,'recurring').find(x=>x.card.id==='kb').value,1870);
 assert.equal(compare(cs,'병원',50000).find(x=>x.card.id==='nh').value,5000);
 assert.equal(compare(cs,'일반 음식점',30000).find(x=>x.card.id==='kb').value,300);
 const unknown=seedData().cards;assert.match(compare(unknown,'스타벅스',10000).find(x=>x.card.id==='samsung').notes.join(' '),/기록 없음/);
});
