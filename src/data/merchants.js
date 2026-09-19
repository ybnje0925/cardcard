import {normalize} from '../utils/finance.js';

// This registry is intentionally small and declarative: add aliases without touching the calculator.
export const merchantRegistry=[
 {id:'starbucks',label:'스타벅스',category:'카페',aliases:['스타벅스','스벅','스타벅스감일','starbucks'],terms:['스타벅스','커피전문점','카페']},
 {id:'megacoffee',label:'메가커피',category:'카페',aliases:['메가커피','메가'],terms:['커피전문점','카페']},
 {id:'twosome',label:'투썸플레이스',category:'카페',aliases:['투썸','투썸플레이스'],terms:['투썸플레이스','커피전문점','카페']},
 {id:'convenience',label:'편의점',category:'편의점',aliases:['cu','gs25','gs','세븐일레븐','이마트24','편의점'],terms:['편의점','트렌디숍']},
 {id:'emart',label:'이마트',category:'대형마트',aliases:['이마트','이마트트레이더스'],terms:['이마트','대형마트']},
 {id:'coupang',label:'쿠팡',category:'온라인쇼핑',aliases:['쿠팡','쿠팡쇼핑'],terms:['쿠팡','소셜커머스','온라인쇼핑']},
 {id:'baemin',label:'배달의민족',category:'배달',aliases:['배달의민족','배민','배달'],terms:['배달의민족','배달']},
 {id:'oliveyoung',label:'올리브영',category:'쇼핑',aliases:['올리브영','올영'],terms:['올리브영','트렌디숍']},
 {id:'cgv',label:'CGV',category:'영화',aliases:['cgv','씨지브이','영화','영화관'],terms:['CGV','영화관','롯데시네마','메가박스']},
 {id:'hospital',label:'병원',category:'의료',aliases:['병원','의원','한의원','의료'],terms:['병원','의원','한의원','의료']},
 {id:'animal-hospital',label:'동물병원',category:'반려동물',aliases:['동물병원','동물 병원'],terms:['동물병원','반려동물']},
 {id:'pharmacy',label:'약국',category:'의료',aliases:['약국'],terms:['약국','의료']},
 {id:'taxi',label:'택시',category:'교통',aliases:['택시','카카오t','카카오택시','카택'],terms:['택시','카카오T','교통']},
 {id:'transit',label:'대중교통',category:'교통',aliases:['대중교통','버스','지하철','교통'],terms:['버스','지하철','대중교통','교통']},
 {id:'fuel',label:'주유',category:'주유',aliases:['주유','주유소','충전'],terms:['주유','주유소','충전소']},
 {id:'netflix',label:'넷플릭스',category:'OTT',aliases:['넷플릭스','netflix'],terms:['넷플릭스','OTT','디지털구독']},
 {id:'restaurant',label:'일반 음식점',category:'음식점',aliases:['음식점','식당','외식','밥'],terms:['음식점','일반']},
 {id:'naver',label:'네이버쇼핑',category:'온라인쇼핑',aliases:['네이버쇼핑','네이버 쇼핑','스마트스토어','네이버페이','네이버'],terms:['네이버','네이버쇼핑','스마트스토어','네이버페이']},
 {id:'mobile',label:'통신',category:'통신',aliases:['통신','통신비','skt','kt','lgu+','lg u+'],terms:['SKT','KT','LG U+','통신비']}
];

export function resolveMerchant(input,customMerchants=[]){
 const raw=input.trim(),q=normalize(raw);if(!q)return null;
 const custom=customMerchants.find(m=>normalize(m.name)===q||normalize(m.name).includes(q)||q.includes(normalize(m.name)));
 const pool=custom?[{id:custom.id,label:custom.name,category:custom.category,aliases:[custom.name],terms:[custom.category,custom.name]}]:merchantRegistry;
 const exact=pool.find(m=>m.aliases.some(a=>normalize(a)===q));
 const partial=exact||pool.find(m=>m.aliases.some(a=>normalize(a).length>=2&&(normalize(a).includes(q)||q.includes(normalize(a)))));
 if(partial)return {...partial,raw,matched:true};
 return {id:'freeform',label:raw,category:'기타',aliases:[raw],terms:[raw],raw,matched:false};
}

export const popularMerchants=['스타벅스','쿠팡','넷플릭스','병원','택시','주유'];
