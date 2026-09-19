import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.goto('http://localhost:4173');await page.getByRole('heading',{name:'이번 달 카드 현황'}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
 await page.getByRole('button',{name:'지금 뭐로 결제하지?'}).click();
 await page.getByLabel('어디서 결제하세요?').fill('스벅 감일');await page.getByLabel('결제 예정 금액',{exact:true}).fill('13000');await page.getByRole('button',{name:'카드 추천 보기'}).click();
 assert.match(await page.locator('.recommend-hero').innerText(),/삼성 taptap O/);assert.match(await page.locator('.recommend-hero').innerText(),/6,500원/);assert.match(await page.locator('.recommend-hero').innerText(),/기록 없음/);
 await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/payment-recommend-390.png',fullPage:true});
 await page.locator('.other-cards summary').click();assert.match(await page.locator('.other-cards').innerText(),/네이버 현대카드/);assert.match(await page.locator('.other-cards').innerText(),/KB ALL YOU NEED/);
 await page.getByRole('button',{name:'이 카드 상세 보기'}).click();assert.match(await page.locator('.benefit-tile').first().innerText(),/월 최대 10,000원/);
 await page.locator('.previous-record').click();await page.getByLabel('전월 인정 실적',{exact:true}).fill('0');await page.getByRole('button',{name:'전월 실적 저장'}).click();
 await page.getByRole('button',{name:'추천',exact:true}).click();await page.getByLabel('어디서 결제하세요?').fill('스타벅스');await page.getByLabel('결제 예정 금액',{exact:true}).fill('10000');await page.getByRole('button',{name:'카드 추천 보기'}).click();
 assert.match(await page.locator('.comparison-summary').innerText(),/적용 조건/);
 await page.getByRole('button',{name:'추천',exact:true}).click();await page.getByLabel('어디서 결제하세요?').fill('회사 간식방');await page.getByRole('button',{name:'카드 추천 보기'}).click();await page.getByRole('button',{name:/내 매장으로 등록/}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('my-cards-v1')).customMerchants.some(m=>m.name==='회사 간식방')),true);
 await page.getByRole('button',{name:'추천',exact:true}).click();await page.getByLabel('어디서 결제하세요?').fill('');assert.match(await page.locator('.recent-places').innerText(),/회사 간식방/);
 for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`recommend overflow ${width}`);}
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('my-cards-v1')).cards[1].officialProductId),'naver-ed1');
 await page.getByRole('button',{name:'카드',exact:true}).click();await page.getByRole('button',{name:'네이버 현대카드 상세 보기',exact:true}).click();assert.match(await page.locator('.official-section').innerText(),/Edition1/);assert.match(await page.locator('.official-section').innerText(),/5%/);assert.match(await page.locator('.official-section').innerText(),/10,000/);
 await page.getByRole('button',{name:'내 카드',exact:true}).click();await page.getByRole('button',{name:'KB국민카드 ALL YOU NEED 상세 보기',exact:true}).click();assert.match(await page.locator('.official-section').innerText(),/KB ALL/);assert.match(await page.locator('.official-section').innerText(),/50%/);assert.match(await page.locator('.official-section').innerText(),/통합 월 3,000원/);
 await page.evaluate(()=>history.back());await page.getByRole('button',{name:'네이버 현대카드 상세 보기',exact:true}).waitFor();await page.evaluate(()=>history.back());await page.getByRole('heading',{name:'이번 달 카드 현황'}).waitFor();assert.equal(await page.locator('body').isVisible(),true); await page.setViewportSize({width:390,height:844});await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'홈',exact:true}).click();await page.getByRole('button',{name:'지금 뭐로 결제하지?'}).click();
 assert.deepEqual(errors,[]);console.log('PASS: merchant alias, payment amount, winner hero, collapsed comparisons, prior-month handling, custom/recent store, 320/390/430px, offline, no JS errors');
} finally {await browser.close();}
