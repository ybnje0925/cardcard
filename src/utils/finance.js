export const money = n => Number(n || 0).toLocaleString('ko-KR');
export const percent = c => c.monthlyGoalKRW > 0 ? Math.round(c.currentSpentKRW/c.monthlyGoalKRW*100) : 0;
export const remaining = c => Math.max(0,c.monthlyGoalKRW-c.currentSpentKRW);
export const scheduled = c => c.autopayItems.filter(a=>a.inclusion==='포함').reduce((sum,a)=>sum+(a.amount||0),0);
export const normalize = s => s.toLowerCase().replace(/[\s+·]/g,'');
export function recommendCard(cards, query) {
 const q=normalize(query.trim()); if(!q)return [];
 return cards.map(card=>{
   const matches=card.merchantRules.filter(r=>r.keywords.some(k=>normalize(k)&& (q===normalize(k)||q.includes(normalize(k)))));
   const exact=matches.filter(r=>r.keywords.some(k=>q===normalize(k)));
   const candidates=exact.length?exact:matches;
   const fallback=card.merchantRules.filter(r=>r.keywords.some(k=>['일반','기본'].includes(k)));
   const best=[...(candidates.length?candidates:fallback)].sort((a,b)=>b.priority-a.priority)[0];
   return {card,rank:exact.length?2:matches.length?1:0,priority:best?.priority??-1,reason:best?`${best.benefitLabel}${candidates.length?' 혜택이 있어서 추천':' · 기본 혜택으로 추천'}`:'등록된 혜택이 없습니다'};
 }).filter(r=>r.priority>=0).sort((a,b)=>b.rank-a.rank||b.priority-a.priority||remaining(b.card)-remaining(a.card));
}
