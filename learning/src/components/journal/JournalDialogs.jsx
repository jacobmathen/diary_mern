import {useEffect,useRef,useState} from 'react';
import {X,LogOut,Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
function Modal({title,onClose,children,className=''}){
 const ref=useRef(null);
 useEffect(()=>{const element=ref.current;element.showModal();return()=>element.close();},[]);
 return <dialog ref={ref} className={'wb-dialog '+className} aria-label={title} onCancel={e=>{e.preventDefault();onClose();}}><header><h2>{title}</h2><Button type="button" variant="ghost" size="icon-sm" aria-label="Close dialog" onClick={onClose}><X size={18}/></Button></header>{children}</dialog>;
}
export function AccountDialog({user,onClose,onSignout,signingOut}){
 return <Modal title="Account details" onClose={onClose}><dl className="wb-account-details">{[['Name',user.name],['Username','@'+user.username],['Email',user.email]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><footer><Button variant="outline" disabled={signingOut} onClick={onSignout}><LogOut size={16}/>Sign out</Button><Button onClick={onClose}>Done</Button></footer></Modal>;
}
export function DeleteEntryDialog({entry,onClose,onDelete}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function erase(){setBusy(true);try{await onDelete(entry);onClose();}catch(err){setError(err.message);setBusy(false);}}
 return <Modal title="Delete entry?" onClose={()=>{if(!busy)onClose();}}><div className="wb-delete-copy"><p><strong>{entry.title}</strong> and its photographs will be permanently deleted.</p>{error&&<p className="error" role="alert">{error}</p>}</div><footer><Button variant="outline" disabled={busy} onClick={onClose}>Keep entry</Button><Button variant="destructive" disabled={busy} onClick={erase}><Trash2 size={15}/>{busy?'Deleting…':'Delete permanently'}</Button></footer></Modal>;
}
export function PhotoDialog({url,onClose}){return <Modal title="Diary photograph" onClose={onClose} className="wb-photo-dialog"><img src={url} alt="Full-size diary photograph"/></Modal>;}
