import {moods,today} from '../lib/api';
export default function Insights({entries}){
 const recent=entries.filter(e=>{const delta=(new Date(today())-new Date(e.date))/86400000;return delta>=0&&delta<30;});
 const counts=Object.fromEntries(Object.keys(moods).map(k=>[k,recent.filter(e=>e.mood===k).length]));
 return <section className="insights-panel"><span className="section-kicker">LAST 30 DAYS</span><div className="insights-heading"><h2>Mood distribution</h2><span>{recent.length} entries</span></div><p>Number of entries recorded for each mood.</p><div className="mood-chart" role="img" aria-label={Object.entries(moods).map(([k,m])=>m.label+': '+counts[k]).join(', ')}>{Object.entries(moods).map(([k,m])=><div key={k}><div className="bar-track"><div className="bar" style={{height:(recent.length?counts[k]/recent.length*100:0)+'%',background:['#D4AF37','#BDB76B','#CE8946','#b8946c','#9e7953'][Object.keys(moods).indexOf(k)]}}/></div><span>{m.icon}</span><strong>{counts[k]}</strong><small>{m.label}</small></div>)}</div>{!recent.length&&<p className="muted">Add entries with moods to see your distribution.</p>}</section>;
}
