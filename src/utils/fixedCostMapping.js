import {normalize} from './finance.js';

export function fixedCostQuery(item){
 const q=normalize(item.name||'');
 if(q.includes('아파트')||q.includes('관리비'))return '아파트관리비';
 if(/전기|수도|도시가스|공과금/.test(q))return `${item.name} 공과금`;
 const isTelco=/휴대폰|핸드폰|이동통신|통신비|skt|kt|lgu|엘지유플러스/.test(q);
 return isTelco&&!/인터넷|iptv|결합/.test(q)?'통신비':item.name;
}
