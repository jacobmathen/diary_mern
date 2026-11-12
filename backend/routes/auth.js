import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/userModel.js';
import {requireAuth} from '../middleware/auth.js';
const router=Router();
const options=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
const publicUser=u=>({id:u.id,name:u.name,username:u.username,email:u.email});
function session(res,user){
const token=jwt.sign({},process.env.JWT_SECRET,{subject:user.id,expiresIn:'7d',algorithm:'HS256'});
res.cookie('daybook_session',token,{...options(),maxAge:7*86400000});return res.json({user:publicUser(user)});
}
router.use(rateLimit({windowMs:15*60000,limit:60,message:{message:'Too many attempts. Try again in 15 minutes.'}}));
router.post('/signup',async(req,res)=>{
const {name,username,email,password}=req.body;
if(typeof name!=='string'||!name.trim()||name.length>80||typeof username!=='string'||!/^[a-zA-Z0-9_]{3,30}$/.test(username)||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<10||Buffer.byteLength(password)>72)return res.status(400).json({message:'Use a name, valid email, username (3–30 letters, numbers or underscores), and password of 10–72 bytes.'});
const user=await User.create({name,username,email,password:await bcrypt.hash(password,12)});
res.status(201);session(res,user);
});
router.post('/login',async(req,res)=>{
const {identifier,password}=req.body;
if(typeof identifier!=='string'||typeof password!=='string'||password.length>1000)return res.status(400).json({message:'Enter your email or username and password.'});
const value=identifier.trim().toLowerCase();
const user=await User.findOne({$or:[{email:value},{username:value}]}).select('+password');
if(!user||!/^\$2[aby]\$/.test(user.password)||!await bcrypt.compare(password,user.password))return res.status(401).json({message:'Email, username or password is incorrect.'});
session(res,user);
});
router.get('/me',requireAuth,(req,res)=>res.json({user:publicUser(req.user)}));
router.post('/logout',(req,res)=>{res.clearCookie('daybook_session',options());res.json({message:'Signed out.'});});
export default router;

