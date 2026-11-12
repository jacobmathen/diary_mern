import Icon from './Icon';
import {moods,prettyDate} from '../lib/api';
export default function EntryCard({entry,onOpen}){
 const mood=moods[entry.mood];
 return <button className="entry-card" onClick={()=>onOpen(entry)}>{entry.images[0]&&<img className="card-photo" src={entry.images[0].url} alt="" loading="lazy"/>}<div className="card-body"><div className="card-meta"><span>{prettyDate(entry.date)}</span><span className="mood-symbol" title={mood.label}>{mood.icon} <span>{mood.label}</span></span></div><h3>{entry.title}</h3><p>{entry.content||'No text in this entry.'}</p><div className="card-footer"><div className="tags">{entry.tags.slice(0,2).map(t=><span key={t}>#{t}</span>)}</div>{entry.favorite&&<Icon name="star" size={16}/>}</div></div></button>;
}
