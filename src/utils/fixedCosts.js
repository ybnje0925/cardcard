import catalog from '../data/official-benefits.json';
import status from '../data/benefit-status.json';
import {analyzeFixedCostsWithData} from './fixedCostEngine';
import {money,normalize} from './finance';

export const fixedCostCategories=['통신','주거','공과금','보험','구독','멤버십','교육','기타'];
export const paymentMethods=['카드 자동결제','공식 홈페이지 정기결제','앱스토어 결제','네이버페이','KB Pay','자동납부','잘 모르겠음'];
const categoryAliases={'넷플릭스':'구독','유튜브 프리미엄':'구독','티빙':'구독','웨이브':'구독','디즈니+':'구독','쿠팡 로켓와우':'멤버십','네이버플러스':'멤버십','아파트 관리비':'주거','전기요금':'공과금','도시가스':'공과금','수도요금':'공과금','보험료':'보험','SKT':'통신','KT':'통신','LG U+':'통신','휴대폰':'통신','인터넷':'통신','IPTV':'통신'};
export function inferFixedCostCategory(name=''){const hit=Object.keys(categoryAliases).find(k=>normalize(name).includes(normalize(k)));return categoryAliases[hit]||'기타';}
export function normalizeFixedCost(item,cardId=''){return {id:item.id||crypto.randomUUID(),name:String(item.name||'').trim(),category:item.category||inferFixedCostCategory(item.name),amount:item.amount===null||item.amount===''?null:Number(item.amount||0),cardId:item.cardId||cardId,day:Number(item.day||1),paymentMethod:item.paymentMethod||'잘 모르겠음',inclusion:item.inclusion||'모름',memo:item.memo||'',changeStatus:item.changeStatus||'current'};}
export function analyzeFixedCosts(cards,items,date=new Date()){return analyzeFixedCostsWithData(cards,items,catalog,status,date);}
export function fixedCostItems(cards){return cards.flatMap(card=>card.autopayItems.map(item=>normalizeFixedCost(item,card.id)));}
export function fixedCostReason(a){if(a.state==='최적')return '현재 카드가 가장 유리합니다.';if(a.state==='비슷함')return '혜택 차이는 월 '+money(a.gap||0)+'원으로 작아 현재 카드 유지도 괜찮습니다.';if(a.state==='데이터 부족')return '금액·상품·결제방식 또는 공식 조건을 확인해주세요.';return (a.best?.card.displayName||'추천 카드')+'로 변경하면 월 약 '+money(a.monthlySaving)+'원 절약 가능';}