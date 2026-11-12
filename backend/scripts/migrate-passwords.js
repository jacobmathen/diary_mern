import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
await mongoose.connect(process.env.MONGO_URI);
let count=0;
for await (const user of User.find().select('+password').cursor()){
 if(!/^\$2[aby]\$/.test(user.password)){user.password=await bcrypt.hash(user.password,12);await user.save();count++;}
}
console.log('Hashed '+count+' legacy passwords.');
await mongoose.disconnect();
