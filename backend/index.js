import 'dotenv/config';
import mongoose from 'mongoose';
import {createApp} from './app.js';
if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length<32)throw new Error('JWT_SECRET must contain at least 32 characters.');
await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:10000});
createApp().listen(process.env.PORT||3100,()=>console.log('Daybook API ready'));

