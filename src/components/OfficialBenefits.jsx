import {useEffect,useMemo,useState} from 'react';
import catalog from '../data/official-benefits.json';
import status from '../data/benefit-status.json';
import {benefitLabel,capFor,compareBenefits,freshness,previousMonth,productFor,recommendedForProgress} from '../utils/benefits';
import {money,normalize} from '../utils/finance';
import {popularMerchants,resolveMerchant} from '../data/merchants';

export function ProductSettings({card,onChange}){
 const selected=productFor(card,catalog)?.id||'';
 return <><label className="field">공식 혜택 상품 연결<select value={selected} onChange={e=>onChange('officialProductId',e.target.value)}><option value="">확인 필요 / 다른 Edition</option>{catalog.products.filter(p=>p.cardId===card.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <p className="fine">카드사 앱의 정확한 상품명과 일치할 때만 연결하세요. 네이버 Edition2·3은 아직 검토되지 않아 계산하지 않습니다. KB의 ALL YOU NEED 문구만으로 상품을 확정하지 마세요.</p>
 {card.id==='samsung'&&selected&&<label className="field">현재 적용 중인 삼성 패키지<select value={card.samsungPackage||''} onChange={e=>onChange('samsungPackage',e.target.value)}><option value="">확인 필요</option>{['스타벅스 + 오픈마켓','스타벅스 + 소셜커머스','스타벅스 + 트렌디숍','커피전문점 + 오픈마켓','커피전문점 + 소셜커머스','커피전문점 + 트렌디숍'].map((v,i)=><option key={v} value={String(i+1)}>{i+1}. {v}</option>)}</select></label>}
 <p className="fine">이 선택은 카드사 설정을 바꾸지 않습니다. PACK·패키지 변경은 카드사에서 다음 달 적용 여부를 확인한 후 여기에 반영하세요.</p></>;
}
export function OfficialBenefits({card,onEdit,onHistory}){
 const product=productFor(card,catalog),state=freshness(product,status),prev=previousMonth();
 const benefits=product?.benefits.filter(b=>!b.packages||!card.samsungPackage||b.packages.includes(card.samsungPackage))||[];
 return <section className="official-section"><div className="section-title"><h2>공식 카드 혜택</h2><button className="text-button" onClick={onEdit}>상품 확인·변경</button></div><p className={`data-status ${state==='공식 정보'?'':'warning'}`}>{state}{product&&` · ${product.name}`}</p>
 <button className="previous-record" onClick={onHistory}><span>전월실적 · {prev}</span><b>{card.history[prev]===undefined?'기록 추가':`${money(card.history[prev])}원 · 수정`}</b></button><p className="fine">카드사에서 인정한 실적을 입력하세요. 현재월 사용액·목표·예정 고정비는 전월실적에 포함하지 않습니다.</p>
 {!product?<div className="panel"><h3>보유한 상품을 확인해주세요</h3><p className="muted">Edition 또는 서비스 PACK이 확인되면 수치와 예상 혜택을 표시합니다.</p><button className="secondary" onClick={onEdit}>공식 상품 연결</button></div>:benefits.map(b=><article className="benefit-tile" key={b.id}><div className="section-title"><span>{b.merchant}</span><span className="badge">{b.category}</span></div><strong className="benefit-number">{benefitLabel(b)}</strong>
 <div className="benefit-facts"><span>{b.monthlyCap===null?(b.frequency?'횟수 한도 적용':'월 금액 한도 없음'):`월 최대 ${money(capFor(b,card.history[prev]))}${b.unit}`}{b.capGroup?' · 영역 통합':''}</span><span>{b.previousSpend?`전월실적 ${money(b.previousSpend)}원 이상`:'전월실적 조건 없음'}</span></div>
 {b.packages&&!card.samsungPackage&&<p className="warning">선택 패키지 확인 필요 · 조건부 혜택</p>}
 {b.tiers&&<p className="fine">전월 80만원 이상이면 영역별 월 15,000원</p>}
 <p className="benefit-condition">{b.conditions[0]}</p><a className="source-link" href={b.sourceUrl} target="_blank" rel="noreferrer">공식 확인 {b.checkedAt.replaceAll('-','.')} ↗</a>
 <details><summary>조건·한도·제외사항</summary><ul>{b.conditions.map((s,i)=><li key={i}>{s}</li>)}{b.minPayment>0&&<li>건당 최소 결제 {money(b.minPayment)}원</li>}{b.perTransactionCap!==null&&<li>건당 최대 {money(b.perTransactionCap)}{b.unit}</li>}{b.dailyCap!==null&&<li>일 최대 {money(b.dailyCap)}{b.unit}</li>}{b.monthlySpendCap!==null&&<li>월 대상 결제금액 {money(b.monthlySpendCap)}원까지</li>}{b.frequency&&<li>{Object.entries(b.frequency).map(([k,v])=>`${{day:'일',month:'월',year:'연'}[k]} ${v}회`).join(' · ')}</li>}</ul><p>혜택 제외: {b.exclusions.join(', ')}</p>{b.spendExclusions.length>0&&<p>전월실적 제외: {b.spendExclusions.join(', ')}</p>}<p>실제 남은 한도·횟수 및 신규 발급 실적 유예는 카드사 앱에서 확인하세요.</p></details></article>)}
 </section>;
}
const modeLabels={recurring:'공식 정기결제 / 자동납부', 'naver-plus':'네이버 적립 대상 · 멤버십 회원','naver-nonmember':'네이버 적립 대상 · 비회원'};
function ResultCard({result,leader,onDetail}){
 const r=result,personal=r.card.merchantRules.filter(rule=>rule.keywords.some(k=>normalize(k)===normalize(r.merchant?.label||''))).map(rule=>rule.benefitLabel);
 const amount=r.value===null?(r.b?benefitLabel(r.b):'확인 필요'):r.value===0?'현재 조건 혜택 0':`${r.value===null?'':'최대 약 '}${money(r.value)}${r.unit}`;
 return <button className="recommend-card" onClick={()=>onDetail(r.card.id)}><div className="recommend-card-head"><span className={`mini-card ${r.card.visual.theme}`}>{r.card.visual.label.slice(0,5)}</span><span><b>{r.card.displayName}</b><small>{r.reason}</small></span><span className="muted">상세 ↗</span></div><strong className="estimate-value">{amount}</strong>{r.value!==null&&r.unit==='P'&&<small>예상 가치 약 {money(r.value)}원 (1P=1원)</small>}<small>{r.notes.slice(0,3).join(' · ')}</small>{r.state!=='공식 정보'&&<p className="warning">{r.state}</p>}{personal.length>0&&<small>나의 참고: {personal.join(' · ')}</small>}</button>;
}
export function RecommendationResults({cards,query,onQueryChange,onDetail,onSearch,favorites,recentSearches,customMerchants,onAddFavorite,onAddCustom}){
 const [amount,setAmount]=useState(''),[mode,setMode]=useState('direct'),[submitted,setSubmitted]=useState(false);
 useEffect(()=>{setSubmitted(false);setMode('direct');},[query]);
 const merchant=useMemo(()=>resolveMerchant(query,customMerchants),[query,customMerchants]);
 const previewResults=useMemo(()=>query.trim()?compareBenefits(cards,catalog,status,query,amount,mode,new Date(),customMerchants):[],[cards,query,amount,mode,customMerchants]);
 const results=submitted?previewResults:[];
 const leader=results.find(r=>r.eligible&&r.rankingValue>0);
 const progress=useMemo(()=>recommendedForProgress(results,amount),[results,amount]);
 const relevantModes=[...new Set(previewResults.map(r=>r.b?.mode).filter(Boolean))];
 const submit=e=>{e?.preventDefault();if(!query.trim())return;setSubmitted(true);onSearch(merchant?.label||query.trim());};
 const pick=value=>{onQueryChange(value);setTimeout(()=>setSubmitted(true),0);onSearch(resolveMerchant(value,customMerchants)?.label||value);};
 return <><form className="payment-input" onSubmit={submit}><label className="field">결제 예정 금액 <span className="optional">선택</span><div className="amount-field"><input inputMode="numeric" aria-label="결제 예정 금액" placeholder="예: 13,000" value={amount===''?'':money(amount)} onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,12);setAmount(v===''?'':Number(v));}}/><span>원</span></div></label>
 {relevantModes.length>0&&<label className="field">결제 방법<select aria-label="결제 방법" value={mode} onChange={e=>setMode(e.target.value)}><option value="direct">일반 카드결제</option>{relevantModes.map(value=><option value={value} key={value}>{modeLabels[value]}</option>)}</select></label>}
 <button className="primary recommend-submit">카드 추천 보기</button></form>
 {!submitted&&<><section className="quick-places"><h3>자주 쓰는 곳</h3><div className="chips horizontal">{[...favorites,...popularMerchants].filter((v,i,a)=>a.indexOf(v)===i).slice(0,10).map(place=><button className="place-chip" type="button" key={place} onClick={()=>pick(place)}>{place}</button>)}</div></section>{recentSearches.length>0&&<section className="recent-places"><h3>최근 검색</h3><div className="chips horizontal">{recentSearches.map(place=><button className="place-chip" type="button" key={place} onClick={()=>pick(place)}>{place}</button>)}</div></section>}</>}
 {submitted&&<section className="recommendation-results" aria-label="결제 카드 추천">{leader?<><div className="recommend-hero"><span>여기서는</span><div className="hero-card-row"><span className={`hero-card ${leader.card.visual.theme}`}>{leader.card.visual.label}</span><strong>{leader.card.displayName}</strong></div><b>{leader.reason}</b><span className="hero-label">{amount===''?'가장 높은 혜택률':'예상 최대 혜택'}</span><em>{amount===''?benefitLabel(leader.b):`${money(leader.value)}${leader.unit}`}</em>{leader.unit==='P'&&amount!==''&&<small>예상 가치 약 {money(leader.value)}원 (1P=1원)</small>}<p>{results[1]?.rankingValue!==undefined&&leader.rankingValue>results[1].rankingValue?`다른 카드 대비 약 ${money(leader.rankingValue-results[1].rankingValue)}원 더 유리`:'한도·조건 확인 후 결정하세요.'}</p><ul><li>{leader.reason}이 적용됩니다.</li><li>{leader.notes.find(n=>n.includes('전월')||n.includes('실적'))||'전월실적 조건 없음'}</li><li>{leader.notes.find(n=>n.includes('한도'))||'가맹점·결제 조건 확인'}</li></ul><button className="secondary" type="button" onClick={()=>onDetail(leader.card.id)}>이 카드 상세 보기</button></div>
 {progress&&<div className="progress-advice"><b>실적도 함께 볼까요?</b><p>최대 혜택은 {progress.leader.card.displayName}이지만 차이는 {money(progress.difference)}원입니다. {progress.candidate.card.displayName}은 목표까지 {money(progress.remaining)}원 남았어요.</p></div>}</>:<div className="comparison-summary"><strong>{amount>0?'적용 조건을 확인해주세요':'확인된 혜택률을 비교할 수 없습니다.'}</strong><p>상품·Edition 또는 결제방식을 확인하면 더 정확해져요.</p></div>}
 {!merchant?.matched&&<button className="add-custom-place" type="button" onClick={()=>onAddCustom(merchant)}>“{merchant?.label}”을 내 매장으로 등록</button>}
 <button className="text-button favorite-result" type="button" onClick={()=>onAddFavorite(merchant?.label||query)}>★ 자주 쓰는 곳에 추가</button>
 <details className="other-cards"><summary>다른 카드 비교 ({Math.max(0,results.length-(leader?1:0))})</summary>{results.filter(r=>r!==leader).map(r=><ResultCard key={r.card.id} result={r} leader={leader} onDetail={onDetail}/>)}</details>
 <p className="fine">월 할인한도·횟수 사용량을 모르면 최대값으로 표시합니다. 전월 기록이 없거나 결제 방식이 다른 경우 확정 추천으로 보지 마세요.</p></section>}
 </>;
}
export function officialSummary(card){const p=productFor(card,catalog);return p?`${p.name} · 공식 혜택 ${p.benefits.length}개`:'상품·Edition 확인 필요';}
