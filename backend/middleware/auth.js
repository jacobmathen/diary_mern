import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
export async function requireAuth(req,res,next){
try{
const token=jwt.verify(req.cookies.daybook_session||'',process.env.JWT_SECRET,{algorithms:['HS256']});
req.user=await User.findById(token.sub);
if(!req.user)return res.status(401).json({message:'Please sign in again.'});
next();
}catch{res.status(401).json({message:'Please sign in again.'});}
}

