import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import auth from './routes/auth.js';
import entries from './routes/entries.js';
export function createApp(){
const app=express(),origin=process.env.CLIENT_ORIGIN||'http://localhost:5173';
const allowedOrigins=new Set([origin]);
if(process.env.NODE_ENV!=='production'){
  const local=new URL(origin);
  if(['localhost','127.0.0.1','[::1]'].includes(local.hostname)){
    for(const hostname of ['localhost','127.0.0.1','[::1]']){
      const alias=new URL(local);alias.hostname=hostname;allowedOrigins.add(alias.origin);
    }
  }
}
app.disable('x-powered-by');app.use(helmet());app.use(cors({origin:(requestOrigin,callback)=>callback(null,!requestOrigin||allowedOrigins.has(requestOrigin)),credentials:true}));
app.use((req,res,next)=>{
if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('origin')&&!allowedOrigins.has(req.get('origin')))return res.status(403).json({message:'Untrusted request origin.'});
next();
});
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.use(express.json({limit:'1mb'}));app.use(cookieParser());
app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-8',legacyHeaders:false}));
app.get('/api/health',(req,res)=>res.json({status:'ok'}));
app.use('/api/auth',auth);app.use('/api/entries',entries);
app.use((req,res)=>res.status(404).json({message:'Not found.'}));
app.use((error,req,res,next)=>{
void next;
const status=error.code===11000?409:error.code==='LIMIT_FILE_SIZE'?413:['ValidationError','CastError','MulterError'].includes(error.name)?400:error.status||500;
if(status===500)console.error(error.message);
res.status(status).json({message:error.code===11000?'Email or username already exists.':status===500?'Something went wrong. Please try again.':error.message});
});return app;
}
