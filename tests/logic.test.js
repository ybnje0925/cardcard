import test from 'node:test';
import assert from 'node:assert/strict';
import {seedData,monthKey} from '../src/data/cards.js';
import {recommendCard,scheduled} from '../src/utils/finance.js';
import {rollover,validateData} from '../src/utils/storage.js';
test('merchant match outranks general benefits and shortfall breaks ties',()=>{const d=seedData();assert.equal(recommendCard(d.cards,'스타벅스')[0].card.id,'samsung');assert.equal(recommendCard(d.cards,' LG U+ ')[0].card.id,'samsung');assert.equal(recommendCard(d.cards,'주유')[0].card.id,'kb');d.cards[0].currentSpentKRW=250000;assert.equal(recommendCard(d.cards,'KT')[0].card.id,'kb');assert.equal(recommendCard(d.cards,'')[0],undefined);});
test('month rollover preserves history exactly once',()=>{const d=seedData();d.cards[0].monthKey='2025-12';d.cards[0].currentSpentKRW=340000;const next=rollover(d,'2026-01');assert.equal(next.cards[0].history['2025-12'],340000);assert.equal(next.cards[0].currentSpentKRW,0);assert.deepEqual(rollover(next,'2026-01'),next);});
test('forecast only includes included amounts and backup rejects invalid values',()=>{const d=seedData();d.cards[0].autopayItems=[{id:'a',name:'구독',category:'구독',memo:'',day:1,amount:70000,inclusion:'포함'},{id:'b',name:'보험',category:'보험',memo:'',day:2,amount:50000,inclusion:'제외'}];assert.equal(scheduled(d.cards[0]),70000);assert.equal(validateData(d).cards.length,4);d.cards[0].currentSpentKRW=-1;assert.throws(()=>validateData(d));});
