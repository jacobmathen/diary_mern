import mongoose from 'mongoose';
const schema=new mongoose.Schema({
owner:{type:mongoose.Schema.Types.ObjectId,ref:'users',required:true,index:true},
title:{type:String,required:true,trim:true,maxlength:160},
content:{type:String,default:'',maxlength:100000},
date:{type:String,required:true},mood:{type:String,enum:['radiant','good','okay','low','rough'],default:'okay'},
tags:{type:[String],default:[]},favorite:{type:Boolean,default:false},
images:[{data:Buffer,contentType:String,name:String}]
},{timestamps:true});
schema.index({owner:1,date:-1});
export default mongoose.model('Entry',schema);

