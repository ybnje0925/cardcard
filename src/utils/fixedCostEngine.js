import {compareBenefits} from './benefits.js';
import {money} from './finance.js';
import {fixedCostQuery} from './fixedCostMapping.js';
import {applySharedCaps} from './fixedCostMath.js';

function modeFor(item){if(item.paymentMethod==='앱스토어 결제')return 'appstore';if(['카드 자동결제','공식 홈페이지 정기결제','자동납부'].includes(item.paymentMethod))return 'recurring';if(item.paymentMethod==='네이버페이')return 'naver-plus';return 'direct';}
function currentValue(result){if(!result)return null;if(result.value!==null)return result.value;if(result.reason==='확인된 해당 사용처 혜택 없음'||result.notes?.includes('혜택 제외 거래'))return 0;return null;}
export function analyzeFixedCostsWithData(cards,items,catalog,status,date=new Date()){
 const normalized=items.map((x,index)=>({...x,id:x.id||`fixed-${index}`,name:String(x.name||'').trim(),amount:x.amount===null||x.amount===''?null:Number(x.amount||0)})).filter(x=>x.name);
 const options=normalized.map(item=>compareBenefits(cards,catalog,status,fixedCostQuery(item),item.amount,modeFor(item),date,[],{assumePreviousSpend:true}));
 const starting=normalized.map(x=>x.cardId||'');
 const evaluate=assignment=>{
  const used=new Map(),rows=normalized.map((_,i)=>{
   const result=options[i].find(r=>r.card.id===assignment[i]);
   return result?applySharedCaps(result,used):null;
  });
  return {rows,total:rows.reduce((sum,r)=>sum+(r?.eligible&&r.value!==null?r.value:0),0)};
 };
 let assignment=[...starting],baseline=evaluate(assignment),optimized=evaluate(assignment);
 // Move one bill at a time toward the placement with the largest portfolio gain.
 for(let step=0;step<normalized.length*cards.length;step++){
  let move=null;
  for(let i=0;i<normalized.length;i++){
   if(normalized[i].amount===null||normalized[i].amount<=0)continue;
   for(const candidate of options[i]){
    if(candidate.card.id===assignment[i]||!candidate.eligible||candidate.value===null)continue;
    const next=[...assignment];next[i]=candidate.card.id;const scored=evaluate(next);
    if(scored.total>optimized.total&&(move===null||scored.total>move.scored.total))move={assignment:next,scored};
   }
  }
  if(!move)break;
  assignment=move.assignment;optimized=move.scored;
 }
 const analyses=normalized.map((item,i)=>{
  const current=baseline.rows[i],best=optimized.rows[i];
  const currentValueKnown=currentValue(current),bestValue=best?.value??null;
  const gap=currentValueKnown!==null&&bestValue!==null?bestValue-currentValueKnown:null;
  let state='확인 필요',strength='확인 필요',recommendation=best?.card||null;
  if(!item.amount||!current||!best||bestValue===null)state='데이터 부족';
  else if(assignment[i]===starting[i]){state='최적';strength='유지 가능';recommendation=current.card;}
  else if(gap!==null&&gap<=100){state='비슷함';strength='유지 가능';recommendation=current.card;}
  else if(gap!==null&&gap>0){state='변경 추천';strength=currentValueKnown===0&&gap>=1000?'강력 추천':'추천';}
  else{state='확인 필요';recommendation=current?.card||best?.card;}
  const reason=best?.b?best.reason+' · '+(best.notes?.find(n=>n.includes('전월'))||'전월 실적 충족 가정 · 기본 구간')+(best.b.conditions?.[0]?' · '+best.b.conditions[0]:''):best?.reason||'공식 조건 확인 필요';
  return {item,current,best,state,strength,recommendation,currentValue:currentValueKnown,bestValue,gap,monthlySaving:state==='변경 추천'?Math.max(0,gap||0):0,reason,sharedCap:best?.b?.capGroup&&best?.b?.monthlyCap!==null?'관련 혜택은 월 통합 한도 '+money(best.b.monthlyCap)+'원입니다.':''};
 });
 const summary=analyses.reduce((s,a)=>({...s,total:s.total+1,[a.state]:(s[a.state]||0)+1,saving:s.saving+a.monthlySaving}),{total:0,최적:0,'변경 추천':0,비슷함:0,'확인 필요':0,'데이터 부족':0,saving:0});
 return {analyses,summary};
}
