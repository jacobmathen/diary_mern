import {useEffect,useRef,useState} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import {Search,SlidersHorizontal,ArrowDownUp,CalendarDays,PanelRight,Plus,X,Tags,ChevronRight,BookOpen} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {loadEntries,logout,upsert,remove} from '../store';
import {useUI} from '../context/UIContext';
import {api,moods,today} from '../lib/api';
import Editor from '../components/Editor';
import Insights from '../components/Insights';
import JournalRail from '../components/journal/JournalRail';
import EntryList from '../components/journal/EntryList';
import useJournalDrafts,{isDirty,normalizeTags} from '../hooks/useJournalDrafts';
import JournalTools from '../components/journal/JournalTools';
import {AccountDialog,DeleteEntryDialog,PhotoDialog} from '../components/journal/JournalDialogs';
import '../styles/journal.css';
import '../styles/inline-editor.css';

const templates=[
 {name:'Daily log',description:'Events, notes, and plans',content:'Today\n\n\nNotes\n\n\nPlans for tomorrow\n'},
 {name:'Gratitude list',description:'A short numbered list',content:'Things I appreciate today\n\n1. \n2. \n3. \n'},
 {name:'Travel notes',description:'Locations and highlights',content:'Location\n\n\nPlaces visited\n\n\nHighlights\n'},
];
function wordCount(content){return content.trim()?content.trim().split(/\s+/).length:0;}
function writingStreak(entries){
 const dates=new Set(entries.map(e=>e.date)),d=new Date(today()+'T12:00:00');let count=0;
 if(!dates.has(today()))d.setDate(d.getDate()-1);
 while(dates.has(new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10))){count++;d.setDate(d.getDate()-1);}
 return count;
}
export default function Journal(){
 const dispatch=useDispatch(),{user}=useSelector(s=>s.auth),{items,loading,error}=useSelector(s=>s.entries);
 const {theme,toggleTheme,notify}=useUI();
 const [view,setView]=useState('all'),[query,setQuery]=useState(''),[mood,setMood]=useState(''),[date,setDate]=useState(''),[tag,setTag]=useState('');
 const [sort,setSort]=useState('newest'),[selectedId,setSelectedId]=useState(''),[creating,setCreating]=useState(false),[filtersOpen,setFiltersOpen]=useState(false),[toolsOpen,setToolsOpen]=useState(true);
 const [accountOpen,setAccountOpen]=useState(false),[deleteTarget,setDeleteTarget]=useState(null),[photo,setPhoto]=useState(''),[signingOut,setSigningOut]=useState(false);
 const readerRef=useRef(null),activeKeyRef=useRef(null);
 const {drafts,getDraft,updateDraft,startTemplate,addPhotos,removeUpload,discardDraft,clearDrafts,saveDraft,savingKey,errors,hasUnsaved}=useJournalDrafts(user.id);
 useEffect(()=>{dispatch(loadEntries());},[dispatch]);
 const visible=items.filter(e=>(view!=='favorites'||e.favorite)&&(!mood||e.mood===mood)&&(!date||e.date===date)&&(!tag||e.tags.includes(tag))&&[e.title,e.content,...e.tags].join(' ').toLowerCase().includes(query.toLowerCase())).toSorted((a,b)=>sort==='oldest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
 const selected=!loading&&!error?(visible.find(e=>e._id===selectedId)||visible[0]):null;
 const activeKey=creating?'new':selected?._id;
 const activeDraft=activeKey?getDraft(activeKey,creating?null:selected):null;
 const activeDirty=!!activeDraft&&isDirty(activeDraft);
 const dirtyIds=new Set(Object.entries(drafts).filter(([,draft])=>isDirty(draft)).map(([key])=>key));
 useEffect(()=>{activeKeyRef.current=activeKey;},[activeKey]);
 const words=items.reduce((count,e)=>count+wordCount(e.content),0);
 const month=today().slice(0,7),monthly=items.filter(e=>e.date.startsWith(month));
 const tagCounts=items.reduce((counts,e)=>{for(const tag of e.tags)counts.set(tag,(counts.get(tag)||0)+1);return counts;},new Map());
 const hasFilters=!!(query||mood||date||tag),activeFilters=[mood,date,tag].filter(Boolean).length;
 function clearFilters(){setQuery('');setMood('');setDate('');setTag('');}
 function selectEntry(id){setCreating(false);setSelectedId(id);setView('all'===view||view==='favorites'?view:'all');if(window.matchMedia('(max-width:740px)').matches)readerRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}
 function filterTag(value){setCreating(false);setTag(value);setView('all');}
 function exportJournal(){
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),entries:items.map(({images,...entry})=>({...entry,photoCount:images.length}))},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='daybook-'+today()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Journal exported. Photographs are not included in the JSON file.');
 }
 function changeView(next){setCreating(false);setView(next);}
 function startNew(content=''){
  if(savingKey)return;
  clearFilters();setView('all');setCreating(true);
  if(content){if(drafts.new&&isDirty(drafts.new)){notify('Save or discard your current new entry before choosing another template.');}else startTemplate(content);}
  if(window.matchMedia('(max-width:740px)').matches)readerRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function changeActive(patch){updateDraft(activeKey,creating?null:selected,{uploadError:'',...patch});}
 async function saveActive(){
  const key=activeKey,saved=await saveDraft(key,creating?null:selected);
  if(!saved)return;
  dispatch(upsert(saved));discardDraft(key);
  if(activeKeyRef.current===key){setSelectedId(saved._id);setCreating(false);clearFilters();if(key==='new'||!saved.favorite)setView('all');}
  notify(key==='new'?'Entry saved.':'Changes saved.');
 }
 function discardActive(){discardDraft(activeKey);if(creating)setCreating(false);}
 function attachPhotos(files){
  if(files.length+activeDraft.images.length+activeDraft.uploads.length>4){changeActive({uploadError:'Choose up to four photographs.'});return;}
  if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){changeActive({uploadError:'Use JPEG, PNG, or WebP images up to 5 MB each.'});return;}
  changeActive({uploadError:''});addPhotos(activeKey,creating?null:selected,files);
 }
 async function signout(){
  if(hasUnsaved){const key=Object.entries(drafts).find(([,draft])=>isDirty(draft))?.[0];setAccountOpen(false);clearFilters();setView('all');if(key==='new')setCreating(true);else{setCreating(false);setSelectedId(key);}notify('Save or discard your unsaved changes before signing out.');return;}
  setSigningOut(true);
  try{await dispatch(logout()).unwrap();clearDrafts();Object.keys(sessionStorage).filter(key=>key.startsWith('daybook-draft-'+user.id)).forEach(key=>sessionStorage.removeItem(key));}catch(error){notify(error.message);setSigningOut(false);}
 }
 async function deleteEntry(entry){await api('/entries/'+entry._id,{method:'DELETE'});dispatch(remove(entry._id));discardDraft(entry._id);sessionStorage.removeItem('daybook-draft-'+user.id+'-'+entry._id);notify('Entry deleted.');}
 async function copyEntry(entry){try{await navigator.clipboard.writeText(entry.title+'\n'+entry.date+'\n\n'+entry.content+(entry.tags.length?'\n\nTags: '+entry.tags.join(', '):''));notify('Entry text copied.');}catch{notify('Clipboard access is unavailable. You can export your journal instead.');}}
 return <div className={'wb-shell '+(!toolsOpen?'wb-without-tools':'')}>
  <JournalRail user={user} view={view} onView={changeView} onCreate={()=>startNew()} onAccount={()=>setAccountOpen(true)} onSignout={signout} signingOut={signingOut}/>
  <header className="wb-header">
   <div className="wb-search"><Search size={19}/><Input aria-label="Search diaries" placeholder="Search diaries" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<Button variant="ghost" size="icon-sm" aria-label="Clear search" onClick={()=>setQuery('')}><X size={15}/></Button>}<Button variant="ghost" size="icon-sm" className={filtersOpen||activeFilters?'wb-filter-active':''} aria-label="Filter entries" aria-expanded={filtersOpen} aria-controls="diary-filters" title="Filter entries" onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={18}/>{activeFilters>0&&<span className="wb-filter-dot"/>}</Button><span className="wb-search-divider"/><Button variant="ghost" size="icon-sm" aria-label={sort==='newest'?'Sort oldest first':'Sort newest first'} title={sort==='newest'?'Newest first — click to reverse':'Oldest first — click to reverse'} onClick={()=>setSort(sort==='newest'?'oldest':'newest')}><ArrowDownUp size={18}/></Button></div>
   <div className="wb-header-actions"><span className="wb-header-date">{new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><Button variant="outline" size="icon" className="wb-round-control" aria-label="Filter by date" title="Filter by date" onClick={()=>setFiltersOpen(!filtersOpen)}><CalendarDays size={18}/></Button><Button variant="outline" size="icon" className="wb-round-control" aria-label={toolsOpen?'Hide diary tools':'Show diary tools'} title={toolsOpen?'Hide diary tools':'Show diary tools'} aria-expanded={toolsOpen} onClick={()=>setToolsOpen(!toolsOpen)}><PanelRight size={18}/></Button></div>
   {filtersOpen&&<section id="diary-filters" className="wb-filter-panel" aria-label="Entry filters" onKeyDown={e=>{if(e.key==='Escape')setFiltersOpen(false);}}><div className="wb-filter-title"><h2>Filter entries</h2><Button variant="ghost" size="icon-xs" aria-label="Close filters" onClick={()=>setFiltersOpen(false)}><X size={16}/></Button></div><label>Mood<select aria-label="Filter by mood" value={mood} onChange={e=>setMood(e.target.value)}><option value="">All moods</option>{Object.entries(moods).map(([key,m])=><option key={key} value={key}>{m.icon} {m.label}</option>)}</select></label><label htmlFor="wb-filter-date">Date<Input id="wb-filter-date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Tag<select aria-label="Filter by tag" value={tag} onChange={e=>setTag(e.target.value)}><option value="">All tags</option>{[...tagCounts.keys()].sort().map(t=><option key={t} value={t}>{t}</option>)}</select></label><div className="wb-filter-footer"><Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button><Button size="sm" onClick={()=>setFiltersOpen(false)}>Done</Button></div></section>}
  </header>
  <div className="wb-list-column">{hasFilters&&<div className="wb-filter-summary"><span>{tag?'#'+tag:date||mood?'Filtered entries':'Search results'}</span><Button variant="ghost" size="icon-xs" aria-label="Clear all filters" onClick={clearFilters}><X size={14}/></Button></div>}{(creating||dirtyIds.has('new'))&&<button type="button" className={'wb-new-draft '+(creating?'is-active':'')} onClick={()=>startNew()}><Plus size={16}/><span>New entry draft</span><small>{dirtyIds.has('new')?'Unsaved':'New'}</small></button>}<EntryList entries={visible} selectedId={creating?null:selected?._id} dirtyIds={dirtyIds} onSelect={selectEntry} loading={loading} error={error} onRetry={()=>dispatch(loadEntries())} onCreate={()=>startNew()} view={view} total={items.length} onClear={clearFilters} hasFilters={hasFilters}/></div>
  <main className="wb-main" ref={readerRef} aria-label="Diary writing area"><div className="wb-main-toolbar"><Button className="wb-main-create" aria-pressed={creating} disabled={!!savingKey} onClick={()=>startNew()}><Plus size={18}/>New diary entry</Button></div>
   {view==='insights'?<section className="wb-reader-card wb-overview"><div className="wb-section-heading"><span className="wb-overline">DIARY STATISTICS</span><h2>Mood overview</h2><p>Your recorded moods over the last 30 days.</p></div>{loading?<p className="wb-list-message">Loading statistics…</p>:error?<p className="error" role="alert">{error}</p>:<Insights entries={items}/>}<Button variant="outline" onClick={()=>setView('all')}>Back to entries</Button></section>:view==='tags'?<section className="wb-reader-card wb-tag-browser"><div className="wb-section-heading"><span className="wb-overline">ORGANIZE YOUR DIARY</span><h2>All tags</h2><p>Choose a tag to find its entries.</p></div>{loading?<p role="status">Loading tags…</p>:error?<p className="error" role="alert">{error}</p>:tagCounts.size?<div className="wb-all-tags">{[...tagCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([label,count])=><button type="button" key={label} onClick={()=>filterTag(label)}><Tags size={17}/><span>{label}</span><strong>{count}</strong><ChevronRight size={15}/></button>)}</div>:<div className="wb-tags-empty"><Tags size={30}/><p>No tags yet. Add tags while editing an entry.</p></div>}</section>:activeDraft?<Editor key={activeKey} draft={activeDraft} dirty={activeDirty} isNew={creating} busy={savingKey===activeKey} error={errors[activeKey]} onChange={changeActive} onSave={saveActive} onDiscard={discardActive} onDelete={()=>setDeleteTarget(selected)} onCopy={()=>copyEntry({...activeDraft,tags:normalizeTags(activeDraft.tags)})} onTag={filterTag} onPhoto={setPhoto} onAddPhotos={attachPhotos} onRemoveUpload={id=>removeUpload(activeKey,creating?null:selected,id)}/>:<section className="wb-reader-card wb-reader-empty">{loading?<p role="status">Loading your diary…</p>:<><BookOpen size={34}/><h2>{error?'Unable to load your diary':'Select an entry or start a new one'}</h2><p>{error||'Choose an entry from the list, or use New diary entry above to write here.'}</p></>}</section>}
   <section className="wb-template-card"><div><span className="wb-overline">START A NEW ENTRY</span><h2>Entry templates</h2></div><div className="wb-template-options">{templates.map(template=><button type="button" key={template.name} onClick={()=>startNew(template.content)}><span><strong>{template.name}</strong><small>{template.description}</small></span><ChevronRight size={17}/></button>)}</div></section>
  </main>
  {toolsOpen&&<JournalTools theme={theme} onTheme={toggleTheme} onAccount={()=>setAccountOpen(true)} onCreate={()=>startNew()} onView={changeView} onExport={exportJournal} entries={items.length} words={words} streak={writingStreak(items)} favorites={items.filter(e=>e.favorite).length} monthlyEntries={monthly.length} monthlyWords={monthly.reduce((n,e)=>n+wordCount(e.content),0)} tagCount={tagCounts.size} view={view}/>}
  {accountOpen&&<AccountDialog user={user} onClose={()=>setAccountOpen(false)} onSignout={signout} signingOut={signingOut}/>}
  {deleteTarget&&<DeleteEntryDialog entry={deleteTarget} onClose={()=>setDeleteTarget(null)} onDelete={deleteEntry}/>}
  {photo&&<PhotoDialog url={photo} onClose={()=>setPhoto('')}/>}
 </div>;
}
