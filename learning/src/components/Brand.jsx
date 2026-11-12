import {Link} from 'react-router-dom';
import Icon from './Icon';
export default function Brand(){return <Link className="brand" to="/" aria-label="Daybook home"><span className="brand-mark"><Icon name="book" size={21}/></span><span>daybook<span className="brand-period">.</span></span></Link>;}
