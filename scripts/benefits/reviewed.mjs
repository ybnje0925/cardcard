// Human-reviewed facts only. Never infer a product from a marketing slogan.
// Regenerate with npm run benefits:build after reviewing the linked source.
export const sources = {
 samsung:{url:'https://www.samsungcard.com/home/card/cardinfo/PGHPPCCCardCardinfoDetails001?code=AAP1483',kind:'product',adapter:'samsung',title:'삼성 taptap O · AAP1483'},
 naver:{url:'https://www.hyundaicard.com/upload/card/T_AEI-20260309-1644-88_금소법_네이버 현대카드 Ed1_v1.pdf',kind:'pdf',adapter:'pdf',title:'네이버 현대카드 Edition1 상품설명서 (2026.03)'},
 kb:{url:'https://card.kbcard.com/cards/products/credit-cards/kb-all-card?solicitorcode=7030024780',kind:'product',adapter:'kb',title:'KB ALL 카드 (구 WE:SH All)'},
 nh:{url:'https://card.nonghyup.com/servlet/IpCc2021R.act?CD_WRS_SQNO=90010604',kind:'product',adapter:'nh',title:'NH올원더풀 · 90010604'}
};
const checkedAt='2026-09-17';
const commonExcluded=['무이자할부','상품권','선불카드','충전','국세','지방세','등록금','공과금','사회보험','현금서비스','카드론','연회비','수수료'];
const commonNotes=['카드사 등록 업종 기준이며 제외 거래·취소 거래에는 적용되지 않습니다.'];
function benefit(source,id,merchant,category,type,rate,monthlyCap,previousSpend,extra={}) {
 return {id,merchant,category,type,rate,flatAmount:null,unit:type==='points'?'P':'원',monthlyCap,perTransactionCap:null,dailyCap:null,monthlySpendCap:null,frequency:null,previousSpend,minPayment:0,keywords:merchant.split('·'),scope:'merchant',conditions:[...commonNotes],exclusions:[...commonExcluded],spendExclusions:[],status:'verified',sourceUrl:sources[source].url,sourceId:source,checkedAt,...extra};
}
const samsungSpend=['할인 받은 결제 전액','세금·공과금','관리비·등록금','교통·택시','상품권·선불충전'];
const sb=(id,m,c,t,r,cap,spend,e={})=>benefit('samsung',id,m,c,t,r,cap,spend,{spendExclusions:samsungSpend,...e});
const samsung=[
 sb('coffee50','스타벅스','커피','discount',50,10000,300000,{packages:['1','2','3'],capGroup:'coffee',conditions:['패키지 1·2·3 선택 시','가두매장 또는 사이렌오더 결제'],exclusions:[...commonExcluded,'백화점·쇼핑몰 임대매장']}),
 sb('coffee30','스타벅스·투썸플레이스·카페베네·탐앤탐스·커피빈·엔제리너스·할리스·파스쿠찌·아티제·폴바셋','커피','discount',30,10000,300000,{packages:['4','5','6'],capGroup:'coffee',conditions:['패키지 4·5·6 선택 시','가두매장 결제, 스타벅스 사이렌오더 포함'],exclusions:[...commonExcluded,'백화점·쇼핑몰 임대매장']}),
 sb('transport','버스·지하철·택시','교통','discount',10,5000,300000,{capGroup:'transport',conditions:['버스·지하철은 후불교통 이용','교통·택시 통합 한도','신규 발급월과 다음 달은 실적 유예']}),
 sb('mobile','SKT·KT·LG U+·통신비','통신','discount',10,5000,300000,{mode:'recurring',conditions:['이동통신 자동납부','신규 발급월과 다음 달은 실적 유예'],exclusions:[...commonExcluded,'결합상품','단말기','대리점 결제']}),
 sb('cinema','CGV·롯데시네마','영화','discount',null,null,300000,{flatAmount:5000,perTransactionCap:5000,minPayment:10000,frequency:{day:1,month:2,year:12},conditions:['영화 티켓 1만원 이상','현장 또는 공식 홈페이지·앱 예매','신규 발급월과 다음 달은 실적 유예'],exclusions:[...commonExcluded,'예매 대행']}),
 sb('overseas','해외 가맹점','해외','points',1.3,null,0,{scope:'overseas',conditions:['해외겸용카드만 제공','해외 수수료 별도']})
];
for(const [id,m,packages] of [['open','G마켓·옥션·11번가',['1','4']],['social','쿠팡·티몬·위메프',['2','5']],['trendy','편의점·올리브영·유니클로·자라·H&M·8SECONDS',['3','6']]]){
 samsung.push(sb(id+'7',m,'쇼핑','discount',7,5000,300000,{packages,capGroup:'shopping',conditions:['해당 쇼핑 할인 패키지 선택 시',...(id==='trendy'?['가두매장 직접 결제만 적용']:[])],exclusions:[...commonExcluded,'임대매장']}));
 samsung.push(sb(id+'1',m,'쇼핑','points',1,null,0,{packages:['1','2','3','4','5','6'].filter(p=>!packages.includes(p)),conditions:['해당 업종 적립 패키지 선택 시'],exclusions:[...commonExcluded,'할인 적용 거래','임대매장']}));
}
const naverSpend=['세금·공과금·사회보험','전기·가스·관리비','학교·등록금','상품권·선불충전','고속도로·고속버스','현대카드 할인·무이자할부','대출·수수료·이자'];
const nb=(id,m,r,cap,e={})=>benefit('naver',id,m,'네이버페이','points',r,cap,300000,{spendExclusions:naverSpend,exclusions:[...commonExcluded,'전기요금','도시가스','아파트관리비','고속도로','고속버스','학교납입금','현대카드 할인 거래'],...e});
const naver=[nb('general','일반 가맹점',1,null,{scope:'general',conditions:['멤버십 적립 대상 외 결제','신규 발급월과 다음 달은 실적 유예']}),nb('plus','네이버·네이버쇼핑·스마트스토어·네이버페이',5,10000,{mode:'naver-plus',monthlySpendCap:200000,conditions:['네이버플러스 회원 + 적립 대상 아이콘 있는 주문','월 대상 결제액 20만원까지, 멤버십 자체 적립 별도']}),nb('nonmember','네이버·네이버쇼핑·스마트스토어·네이버페이',1,2000,{mode:'naver-nonmember',monthlySpendCap:200000,conditions:['멤버십 비회원의 적립 대상 주문','월 대상 결제액 20만원까지']}),benefit('naver','membership','네이버플러스 멤버십','구독','service',null,null,300000,{frequency:{month:1},status:'display-only',conditions:['멤버십 정기결제 카드로 등록하면 이용권 제공','결제 할인액으로 환산하지 않음']})];
const kbSpend=['자동납부 할인 받은 결제 전액','상품권·선불충전','학교·등록금','세금·공과금·사회보험','관리비','무승인 교통 거래','대출·수수료·이자'];
const kbBase=(id,m,c,r,cap,spend,e={})=>benefit('kb',id,m,c,'discount',r,cap,spend,{spendExclusions:kbSpend,exclusions:[...commonExcluded,'아파트관리비','학교납입금','정부지원금','신차구매 할인'],...e});
const kb=[kbBase('domestic','국내 가맹점','일반',1,null,0,{scope:'general'}),kbBase('overseas','해외 가맹점','해외',2,40000,0,{scope:'overseas',conditions:['해외겸용만 제공, 수수료 별도']}),...[
 ['membership','네이버플러스·로켓와우·쿠팡 로켓와우',50],['ott','넷플릭스·유튜브 프리미엄·웨이브·티빙·디즈니플러스',10],['mobile','SKT·KT·LG U+·Liiv M·통신비',5]
].map(([id,m,r])=>kbBase(id,m,'자동납부',r,3000,400000,{mode:'recurring',capGroup:'autopay',additionalTo:'domestic',conditions:['세 영역 통합 월 3,000원 추가 할인','공식 정기결제·자동납부','신규 사용등록일부터 다음 달 말까지 실적 유예'],exclusions:[...commonExcluded,'인앱결제','간편결제','통신 결합상품']}))];
const nhSpend=['학교·등록금·임대료','세금·공과금·사회보험','관리비·가스·전기','상품권·선불충전','후불교통·택시','대출·수수료·이자','포인트 사용액'];
const nhBase=(id,m,c,t,r,cap,e={})=>benefit('nh',id,m,c,t,r,cap,400000,{spendExclusions:nhSpend,exclusions:[...commonExcluded,'임대매장','업종 식별 불가 PG·간편결제','임대료','학교납입금','포인트 사용분'],...e});
const nhDiscount=[];
for(const [id,m,c,r,e] of [
 ['shopping','롯데백화점·신세계백화점·현대백화점·AK백화점·갤러리아·하나로마트·이마트·롯데마트','생활소비',5,{conditions:['오프라인 직접 결제만'],exclusions:[...commonExcluded,'기업형 슈퍼마켓','임대매장']}],
 ['homeshopping','GS SHOP·CJ온스타일·현대홈쇼핑·롯데홈쇼핑·NS홈쇼핑','생활소비',5,{}],
 ['fuel','주유·주유소·충전소','생활소비',5,{conditions:['전기차는 환경부 공공급속충전기 지정 결제만']}],
 ['mobile','SKT·KT·LG U+·통신비','생활소비',3,{mode:'recurring',frequency:{month:1},conditions:['자동납부 월 1회','알뜰폰·TV·인터넷 제외']}],
 ['apartment','아파트관리비','생활소비',3,{mode:'recurring',frequency:{month:1},conditions:['관리비 업종 자동납부 월 1회','관리비는 전월실적 제외']}],
 ['medical','병원·의원·한의원·약국','건강',10,{conditions:['오프라인 직접 결제'],exclusions:[...commonExcluded,'동물병원','임대매장']}],
 ['beauty','미용실·피부미용원','건강',10,{conditions:['오프라인 직접 결제']}],
 ['fitness','헬스장·종합스포츠센터·골프연습장·요가·필라테스·안경점','건강',5,{conditions:['오프라인 직접 결제']}],
 ['transit','버스·지하철','교통',15,{conditions:['후불교통 결제만']}],
 ['travel','KTX·SRT·고속버스·택시','교통',5,{}],
 ['driver','카카오T대리','교통',5,{mode:'recurring',conditions:['카카오T대리 자동결제 등록']}],
 ['ott','넷플릭스·유튜브 프리미엄','여가',30,{mode:'recurring',conditions:['공식 사이트·앱 정기결제','인앱·일부 페이·1회성 결제 제외']}],
 ['cinema','CGV·롯데시네마·메가박스','여가',10,{conditions:['영화 티켓만, 상품권·매점 제외']}],
 ['coffee','스타벅스·투썸플레이스·이디야·커피빈','여가',10,{conditions:['앱 주문 제외, 스타벅스 사이렌오더 포함']}],
 ['bakery','파리바게트·뚜레쥬르·파리크라상','여가',5,{conditions:['앱 주문 제외']}]
])nhDiscount.push(nhBase(id,m,c,'discount',r,8000,{capGroup:c,tiers:[{previousSpend:400000,monthlyCap:8000},{previousSpend:800000,monthlyCap:15000}],...e}));
const nhPoints=[nhBase('base','국내외 가맹점','일반','points',1,50000,{scope:'all',dailyCap:10000,conditions:['기본 NH포인트 적립','일 1만P·월 5만P 한도']}),nhBase('smart','건강·H&B·쇼핑·여행·여가','스마트적립','points',null,10000,{status:'display-only',conditions:['월 이용액 1위 영역 +3%, 2위 +2%','월 전체 업종 순위가 필요해 결제 전 계산 제외','기본적립과 별도, 다음 달 15일 이후 적립']})];
export const reviewedCatalog={schemaVersion:1,products:[
 {id:'samsung-taptap-o',cardId:'samsung',name:'삼성 taptap O (AAP1483)',sourceId:'samsung',benefits:samsung},
 {id:'naver-ed1',cardId:'naver',name:'네이버 현대카드 (원본 / Edition1)',sourceId:'naver',benefits:naver},
 {id:'kb-all',cardId:'kb',name:'KB ALL (구 WE:SH All)',sourceId:'kb',benefits:kb},
 {id:'nh-discount',cardId:'nh',name:'NH올원더풀 · 할인 PACK',sourceId:'nh',benefits:nhDiscount},
 {id:'nh-points',cardId:'nh',name:'NH올원더풀 · 적립 PACK',sourceId:'nh',benefits:nhPoints}
 ]};
