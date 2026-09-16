import { Wifi,Check } from 'lucide-react';
import {money,percent,remaining} from '../utils/finance';
export default function CardVisual({card,onClick}){
 const body=<><div className="card-brand"><span>{card.visual.brand}</span><Wifi size={20}/></div><div className="card-art"><span className="chip-art"/><strong>{card.visual.label}</strong></div><div className="card-bottom"><div className="card-product">{card.displayName}</div><div className="card-numbers"><span><b>{money(card.currentSpentKRW)}</b><small> / {money(card.monthlyGoalKRW)}원</small></span><strong>{percent(card)}<small>%</small></strong></div><div className="progress"><i style={{width:`${Math.min(100,percent(card))}%`}}/></div><div className="card-status">{remaining(card)===0?<span><Check size={13}/> 목표 달성</span>:`목표까지 ${money(remaining(card))}원`}</div></div></>;
 return onClick?<button className={`bank-card ${card.visual.theme}`} onClick={onClick} aria-label={`${card.displayName} 상세 보기`}>{body}</button>:<div className={`bank-card ${card.visual.theme}`}>{body}</div>;
}
