import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export default function Sheet({title,onClose,children}){
 const ref=useRef();
 useEffect(()=>{const prior=document.activeElement;const before=document.body.style.overflow;document.body.style.overflow='hidden';ref.current.focus();const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=ref.current.querySelectorAll('button,input,textarea,select,[tabindex="0"]');const first=els[0],last=els[els.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',key);prior?.focus();};},[]);
 return <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><section className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}><div className="sheet-handle"/><header><h2>{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><X/></button></header>{children}</section></div>;
}
