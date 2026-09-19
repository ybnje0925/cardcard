import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
await page.goto('http://localhost:4173');await page.getByRole('heading',{name:'이번 달 카드 현황'}).waitFor();
await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
await fs.mkdir('test-results',{recursive:true});
await page.screenshot({path:'test-results/home-390.png',fullPage:true});
async function overflow(label){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=390),true,label);}
await overflow('home');
await page.getByRole('button',{name:'삼성 taptap O 1만원 추가',exact:true}).click();
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('my-cards-v1')).cards[0].currentSpentKRW),10000);
await page.getByRole('button',{name:'직접 입력'}).first().click();await page.getByLabel('현재 실적',{exact:true}).fill('210000');assert.equal(await page.getByLabel('현재 실적',{exact:true}).inputValue(),'210,000');await page.getByRole('button',{name:'실적 저장',exact:true}).click();
await page.getByRole('button',{name:'추천',exact:true}).click();await page.getByLabel('어디서 결제하세요?').fill('스타벅스');await page.getByRole('button',{name:'카드 추천 보기'}).click();await overflow('recommend');assert.match(await page.locator('.recommend-hero').innerText(),/삼성 taptap O/);await page.screenshot({path:'test-results/recommend-390.png',fullPage:true});
await page.getByRole('button',{name:'카드',exact:true}).click();await page.getByRole('button',{name:'삼성 taptap O 상세 보기',exact:true}).click();await page.getByRole('button',{name:'카드 정보 편집'}).click();await page.getByLabel('카드 이름',{exact:true}).fill('삼성 나의 카드');await page.getByLabel('월 목표 실적',{exact:true}).fill('400000');await page.getByLabel('사용자 메모',{exact:true}).fill('통신비 카드');await overflow('edit');await page.getByRole('button',{name:'변경사항 저장'}).click();await page.getByRole('heading',{name:'삼성 나의 카드',exact:true}).waitFor();
await page.getByRole('button',{name:'고정비',exact:true}).click();await page.getByRole('button',{name:'자동결제 추가',exact:true}).click();await page.getByLabel('이름',{exact:true}).fill('넷플릭스');await page.getByLabel('예상 월 금액 (선택)',{exact:true}).fill('70000');await page.getByLabel('실적 포함 여부').selectOption('포함');await page.getByRole('button',{name:'자동결제 저장'}).click();await overflow('autopay');await page.screenshot({path:'test-results/autopay-390.png',fullPage:true});
await page.getByRole('button',{name:'카드',exact:true}).click();await page.getByRole('button',{name:'삼성 나의 카드 상세 보기',exact:true}).click();assert.match(await page.locator('.total-line').innerText(),/280,000/);
await page.getByLabel('설정 및 데이터 백업').click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'데이터 백업',exact:true}).click();const download=await downloadPromise;await download.saveAs('test-results/backup.json');const backup=JSON.parse(await fs.readFile('test-results/backup.json','utf8'));assert.equal(backup.cards[0].currentSpentKRW,210000);
await page.locator('input[type=file]').setInputFiles('test-results/backup.json');await page.getByRole('button',{name:'이 백업으로 복원'}).click();await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('my-cards-v1')).cards[0].autopayItems.length),1);
await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:'이번 달 카드 현황'}).waitFor();await overflow('offline');
assert.deepEqual(errors,[]);console.log('PASS: 390px layouts, quick input, formatted input, persistence, recommendation, favorites, editing, autopay forecast, backup/restore, offline reload, no JS errors');
await browser.close();

