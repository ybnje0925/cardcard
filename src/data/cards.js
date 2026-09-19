export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
const rule = (keywords, benefitLabel, priority=10) => ({keywords:keywords.split(','),benefitLabel,priority});
export function seedData() {
  return {version:1,favorites:[],recentSearches:[],customMerchants:[],cards:[
    {id:'samsung',issuer:'삼성카드',displayName:'삼성 taptap O',edition:'taptap O',benefitSummary:['스타벅스 할인','대중교통·택시 할인','이동통신 할인','쇼핑 할인','CGV·롯데시네마 할인','해외 적립'],merchantRules:[rule('스타벅스,커피','스타벅스·커피 할인'),rule('버스,지하철,택시,카카오택시','대중교통·택시 할인'),rule('SKT,KT,LG U+,통신비','이동통신 할인'),rule('CGV,롯데시네마','영화 할인')],visual:{theme:'black',label:'taptap O',brand:'SAMSUNG'},monthlyGoalKRW:300000},
    {id:'naver',issuer:'현대카드',displayName:'네이버 현대카드',edition:'확인 필요',benefitSummary:['네이버페이 포인트 적립','네이버쇼핑 관련 혜택','스마트스토어 관련 혜택','네이버플러스 관련 혜택','일반 가맹점 기본 적립'],merchantRules:[rule('네이버,네이버쇼핑,스마트스토어,네이버페이,네이버플러스,NAVER','네이버 서비스 적립'),rule('일반,기본','일반 가맹점 기본 적립',1)],visual:{theme:'green',label:'NAVER',brand:'NAVER × Hyundai Card'},monthlyGoalKRW:300000},
    {id:'kb',issuer:'KB국민카드',displayName:'KB ALL YOU NEED',edition:'확인 필요',benefitSummary:['국내 일반 결제 할인·적립','해외 결제 혜택','OTT 혜택','쇼핑 멤버십 혜택','이동통신 자동납부'],merchantRules:[rule('넷플릭스,유튜브,유튜브 프리미엄,티빙,웨이브,디즈니플러스','OTT 구독 혜택'),rule('네이버플러스,쿠팡,로켓와우','쇼핑 멤버십 혜택'),rule('SKT,KT,LG U+,통신비','이동통신 자동납부 혜택'),rule('해외결제','해외 결제 혜택'),rule('일반,기본','국내 일반 결제 할인·적립',2)],visual:{theme:'gold',label:'ALL YOU NEED',brand:'KB 국민카드'},monthlyGoalKRW:300000},
    {id:'nh',issuer:'NH농협카드',displayName:'NH올원더풀카드',edition:'올원더풀',benefitSummary:['생활 영역 혜택','의료 혜택','교통 혜택','일반 가맹점 포인트·할인'],merchantRules:[rule('병원,약국,의료','의료 영역 혜택'),rule('버스,지하철,교통','교통 혜택',8),rule('생활,마트','생활 영역 혜택'),rule('일반,기본','일반 가맹점 포인트·할인',1)],visual:{theme:'blue',label:'올원더풀',brand:'NH 농협카드'},monthlyGoalKRW:300000}
  ].map(c=>({...c,currentSpentKRW:0,monthKey:monthKey(),autopayItems:[],history:{},memo:''}))};
}
