import {money} from './finance.js';

export function applySharedCaps(result,used){
 const key=result?.b?.capGroup?`${result.card.id}:${result.b.capGroup}`:null;
 if(!key||result.value===null||result.b.monthlyCap===null)return result;
 const cap=result.b.monthlyCap,capValue=result.capValue??result.value;
 const left=Math.max(0,cap-(used.get(key)||0)),limited=Math.min(capValue,left);
 used.set(key,(used.get(key)||0)+limited);
 if(limited===capValue)return result;
 const baseValue=result.base?Math.max(0,result.value-capValue):0;
 const value=baseValue+limited;
 return {...result,value,eligible:value>0,notes:[...result.notes,'같은 영역 월 통합 한도 '+money(cap)+'원 중 '+money(left)+'원 남음']};
}
