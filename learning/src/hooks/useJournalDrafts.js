import {useEffect,useRef,useState} from 'react';
import {api,today} from '../lib/api';

const memory=new Map();
export function normalizeTags(value){return [...new Set(value.split(',').map(tag=>tag.trim()).filter(Boolean))];}
export function draftSignature(draft){
 return JSON.stringify({title:draft.title,content:draft.content,date:draft.date,mood:draft.mood,favorite:draft.favorite,tags:normalizeTags(draft.tags),images:draft.images.map(image=>image.id),uploads:draft.uploads.map(file=>file.id),missingFiles:draft.missingFiles.map(file=>file.id)});
}
export function makeDraft(entry,content=''){
 const draft={id:entry?._id||null,title:entry?.title||'',content:entry?.content||'',date:entry?.date||today(),mood:entry?.mood||'okay',favorite:entry?.favorite||false,tags:(entry?.tags||[]).join(', '),images:entry?.images||[],uploads:[],missingFiles:[]};
 draft.baseline=draftSignature(draft);
 return content?{...draft,content}:draft;
}
export function isDirty(draft){return draftSignature(draft)!==draft.baseline;}
function storageKey(userId){return 'daybook-draft-'+userId+'-workspace';}
function loadDrafts(userId){
 if(memory.has(userId))return memory.get(userId);
 try{const stored=JSON.parse(sessionStorage.getItem(storageKey(userId)));if(stored?.version===1)return Object.fromEntries(Object.entries(stored.drafts).map(([key,draft])=>[key,{...draft,uploads:[],missingFiles:draft.missingFiles||[]}]));}catch{/* A fresh draft is still available if storage is unavailable. */}
 return {};
}
export default function useJournalDrafts(userId){
 const [drafts,setDrafts]=useState(()=>loadDrafts(userId));
 const [savingKey,setSavingKey]=useState(null),[errors,setErrors]=useState({});
 const inFlight=useRef(false);
 useEffect(()=>{
  memory.set(userId,drafts);
  const serializable=Object.fromEntries(Object.entries(drafts).map(([key,draft])=>[key,{...draft,uploads:[],missingFiles:[...draft.missingFiles,...draft.uploads.map(file=>({id:file.id,name:file.file.name}))]}]));
  try{sessionStorage.setItem(storageKey(userId),JSON.stringify({version:1,drafts:serializable}));}catch{/* Server saves remain available when tab storage is full. */}
 },[drafts,userId]);
 const hasUnsaved=Object.values(drafts).some(isDirty);
 useEffect(()=>{
  if(!hasUnsaved)return;
  function warn(event){event.preventDefault();event.returnValue='';}
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[hasUnsaved]);
 function getDraft(key,entry){return drafts[key]||makeDraft(entry);}
 function updateDraft(key,entry,patch){
  setDrafts(previous=>{const draft=previous[key]||makeDraft(entry);return {...previous,[key]:{...draft,...(typeof patch==='function'?patch(draft):patch)}};});
  setErrors(previous=>({...previous,[key]:''}));
 }
 function startTemplate(content){setDrafts(previous=>({...previous,new:makeDraft(null,content)}));}
 function addPhotos(key,entry,files){
  const photos=files.map(file=>({id:crypto.randomUUID(),file,url:URL.createObjectURL(file)}));
  updateDraft(key,entry,draft=>({...draft,uploads:[...draft.uploads,...photos],missingFiles:draft.missingFiles.filter(missing=>!files.some(file=>file.name===missing.name))}));
 }
 function removeUpload(key,entry,id){
  const draft=getDraft(key,entry),file=draft.uploads.find(file=>file.id===id);
  if(file)URL.revokeObjectURL(file.url);
  updateDraft(key,entry,{uploads:draft.uploads.filter(file=>file.id!==id)});
 }
 function discardDraft(key){
  const draft=drafts[key];draft?.uploads.forEach(file=>URL.revokeObjectURL(file.url));
  setDrafts(previous=>{const next={...previous};delete next[key];return next;});
  setErrors(previous=>({...previous,[key]:''}));
  try{sessionStorage.removeItem('daybook-draft-'+userId+'-'+key);}catch{/* Ignore unavailable storage. */}
 }
 function clearDrafts(){
  Object.values(drafts).forEach(draft=>draft.uploads.forEach(file=>URL.revokeObjectURL(file.url)));
  memory.delete(userId);setDrafts({});setErrors({});
  try{sessionStorage.removeItem(storageKey(userId));}catch{/* Ignore unavailable storage. */}
 }
 async function saveDraft(key,entry){
  if(inFlight.current)return null;
  const draft=getDraft(key,entry),tags=normalizeTags(draft.tags);
  let message='';
  if(!draft.title.trim())message='Enter a title before saving.';
  else if(tags.length>10||tags.some(tag=>tag.length>30))message='Use up to 10 tags, with at most 30 characters each.';
  else if(draft.missingFiles.length)message='Reattach or remove the missing photographs before saving.';
  if(message){setErrors(previous=>({...previous,[key]:message}));return null;}
  inFlight.current=true;setSavingKey(key);setErrors(previous=>({...previous,[key]:''}));
  const body=new FormData();
  for(const field of ['title','content','date','mood','favorite'])body.append(field,draft[field]);
  body.append('tags',JSON.stringify(tags));body.append('keepImages',JSON.stringify(draft.images.map(image=>image.id)));
  draft.uploads.forEach(file=>body.append('images',file.file));
  try{
   const data=await api('/entries'+(draft.id?'/'+draft.id:''),{method:draft.id?'PUT':'POST',body});
   return data.entry;
  }catch(error){setErrors(previous=>({...previous,[key]:error.message}));return null;}
  finally{inFlight.current=false;setSavingKey(null);}
 }
 return {drafts,getDraft,updateDraft,startTemplate,addPhotos,removeUpload,discardDraft,clearDrafts,saveDraft,savingKey,errors,hasUnsaved};
}
