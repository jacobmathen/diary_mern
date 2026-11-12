import {useEffect,useState} from 'react';
import {UIContext} from './UIContext';
export default function UIProvider({children}){
 const [theme,setTheme]=useState(()=>localStorage.getItem('daybook-theme')||'light');
 const [toast,setToast]=useState('');
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('daybook-theme',theme);},[theme]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(id);},[toast]);
 return <UIContext.Provider value={{theme,toggleTheme:()=>setTheme(t=>t==='light'?'dark':'light'),notify:setToast}}>{children}{toast&&<div className="toast" role="status">{toast}</div>}</UIContext.Provider>;
}
