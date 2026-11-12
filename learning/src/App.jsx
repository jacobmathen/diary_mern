import {useEffect} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import {Navigate,Route,Routes} from 'react-router-dom';
import {loadSession} from './store';
import Home from './Pages/Home';
import Auth from './Pages/Auth';
import Journal from './Pages/Journal';
export default function App(){
 const dispatch=useDispatch(),{user,ready}=useSelector(s=>s.auth);
 useEffect(()=>{dispatch(loadSession());},[dispatch]);
 const loading=<div className="boot-screen" role="status">Loading diary…</div>;
 return <Routes><Route path="/" element={<Home/>}/><Route path="/journal" element={!ready?loading:user?<Journal/>:<Navigate to="/login" replace/>}/><Route path="/login" element={!ready?loading:user?<Navigate to="/journal" replace/>:<Auth key="login"/>}/><Route path="/signup" element={!ready?loading:user?<Navigate to="/journal" replace/>:<Auth key="signup" signup/>}/><Route path="/User" element={<Navigate to="/journal" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
}
