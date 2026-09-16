import { useEffect,useState } from 'react';
import {loadData,rollover,STORAGE_KEY} from '../utils/storage';
export function useCardStore(){
 const [error,setError]=useState('');
 const [data,setData]=useState(()=>{try{return loadData();}catch{return null;}});
 useEffect(()=>{if(!data)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));setError('');}catch{setError('저장 공간이 부족하거나 저장이 차단되어 있습니다. 데이터를 백업해 주세요.');}},[data]);
 useEffect(()=>{const tick=()=>setData(d=>d?rollover(d):d);const timer=setInterval(tick,60000);window.addEventListener('focus',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick);};},[]);
 const update=fn=>setData(d=>fn(rollover(d)));
 return {data,setData,update,error};
}
