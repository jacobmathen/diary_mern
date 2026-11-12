import Icon from './Icon';
export default function JournalStats({entries,streak,words}){
 return <section className="stats" aria-label="Journal statistics">{[['book',entries,'Entries'],['chart',streak,'Day writing streak'],['edit',words.toLocaleString(),'Words written']].map(([icon,value,label])=><div key={label}><span className="stat-icon"><Icon name={icon}/></span><div><strong>{value}</strong><small>{label}</small></div></div>)}</section>;
}
