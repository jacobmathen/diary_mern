import mongoose from 'mongoose';
export default mongoose.model('users',new mongoose.Schema({
name:{type:String,required:true,trim:true,maxlength:80},
username:{type:String,required:true,unique:true,trim:true,lowercase:true},
email:{type:String,required:true,unique:true,trim:true,lowercase:true},
password:{type:String,required:true,select:false},
profile_picture:{type:String,default:''}
},{timestamps:true}));

