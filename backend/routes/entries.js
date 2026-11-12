import {Router} from 'express';
import multer from 'multer';
import sharp from 'sharp';
import mongoose from 'mongoose';
import Entry from '../models/Entry.js';
import {requireAuth} from '../middleware/auth.js';
const router=Router();router.use(requireAuth);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:4,fields:10,fieldSize:120000},fileFilter:(req,file,cb)=>{
if(!['image/jpeg','image/png','image/webp'].includes(file.mimetype))return cb(Object.assign(new Error('Use JPEG, PNG or WebP images.'),{status:400}));cb(null,true);
}});
const serialize=entry=>{const value=entry.toObject();value.images=value.images.map(image=>({id:image._id,url:`/api/entries/${entry.id}/images/${image._id}`}));return value;};
function fields(body){
const {title,content='',date,mood='okay'}=body;let tags;
try{tags=JSON.parse(body.tags||'[]');}catch{throw Object.assign(new Error('Invalid tags.'),{status:400});}
if(typeof title!=='string'||!title.trim()||title.length>160||typeof content!=='string'||content.length>100000||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||!['radiant','good','okay','low','rough'].includes(mood)||!Array.isArray(tags)||tags.length>10||tags.some(t=>typeof t!=='string'||t.length>30))throw Object.assign(new Error('Check the title, date, mood and tags.'),{status:400});
return {title:title.trim(),content,date,mood,tags:[...new Set(tags.map(t=>t.trim()).filter(Boolean))],favorite:body.favorite==='true'};
}
async function images(files=[]){
try{return await Promise.all(files.map(async file=>({data:await sharp(file.buffer,{limitInputPixels:25000000}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer(),contentType:'image/webp',name:file.originalname.slice(0,100)})));}
catch{throw Object.assign(new Error('One of the images could not be decoded.'),{status:400});}
}
router.param('id',async(req,res,next,id)=>{
if(!mongoose.isValidObjectId(id))return res.status(404).json({message:'Entry not found.'});
req.entry=await Entry.findOne({_id:id,owner:req.user._id});
if(!req.entry)return res.status(404).json({message:'Entry not found.'});next();
});
router.get('/',async(req,res)=>{const entries=await Entry.find({owner:req.user._id}).select('-images.data').sort({date:-1,createdAt:-1});res.json({entries:entries.map(serialize)});});
router.post('/',upload.array('images',4),async(req,res)=>{const entry=await Entry.create({...fields(req.body),owner:req.user._id,images:await images(req.files)});res.status(201).json({entry:serialize(entry)});});
router.put('/:id',upload.array('images',4),async(req,res)=>{
const values=fields(req.body);let keep;
try{keep=JSON.parse(req.body.keepImages||'[]');}catch{return res.status(400).json({message:'Invalid attachments.'});}
if(!Array.isArray(keep))return res.status(400).json({message:'Invalid attachments.'});
const retained=req.entry.images.filter(image=>keep.includes(image.id));
if(retained.length+(req.files?.length||0)>4)return res.status(400).json({message:'Attach up to four images.'});
Object.assign(req.entry,values,{images:[...retained,...await images(req.files)]});
await req.entry.save();res.json({entry:serialize(req.entry)});
});
router.get('/:id/images/:imageId',(req,res)=>{const image=req.entry.images.find(item=>item.id===req.params.imageId);if(!image)return res.status(404).json({message:'Image not found.'});res.set('Cache-Control','private, no-store').type(image.contentType).send(image.data);});
router.delete('/:id',async(req,res)=>{await req.entry.deleteOne();res.json({message:'Entry deleted.'});});
export default router;
