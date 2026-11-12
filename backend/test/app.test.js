import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';
import request from 'supertest';
import sharp from 'sharp';
import {createApp} from '../app.js';
import User from '../models/userModel.js';
let mongo,app;
before(async()=>{process.env.JWT_SECRET='test-secret-with-more-than-thirty-two-characters';mongo=await MongoMemoryServer.create({binary:{downloadDir:process.env.MONGOMS_DOWNLOAD_DIR||'../.mongodb-binaries'}});await mongoose.connect(mongo.getUri());await User.init();app=createApp();});
after(async()=>{await mongoose.disconnect();await mongo?.stop();});
const signup=(agent,name)=>agent.post('/api/auth/signup').send({name,username:name,email:name+'@example.com',password:'a-long-safe-password'});
test('authenticated journal lifecycle, private images and owner isolation',async()=>{
 const alice=request.agent(app),bob=request.agent(app);
 await request(app).get('/api/entries').expect(401);
 const registered=await signup(alice,'alice').expect(201);
 assert.equal(registered.body.user.username,'alice');
 assert.equal(registered.body.user.password,undefined);
 assert.match(registered.headers['set-cookie'][0],/HttpOnly/);
 await signup(bob,'bobby').expect(201);
 await signup(request.agent(app),'alice').expect(409);
 const stored=await User.findOne({username:'alice'}).select('+password');assert.match(stored.password,/^\$2/);
 await alice.get('/api/auth/me').expect(200);
 const png=await sharp({create:{width:12,height:12,channels:3,background:'#94a885'}}).png().toBuffer();
 const created=await alice.post('/api/entries').field('title','A small joy').field('content','A lovely walk.').field('date','2026-11-07').field('mood','good').field('tags','["nature"]').attach('images',png,{filename:'walk.png',contentType:'image/png'}).expect(201);
 const entry=created.body.entry,id=entry._id,url=entry.images[0].url;
 assert.equal(entry.images[0].data,undefined);
 await alice.get(url).expect('Content-Type',/image\/webp/).expect(200);
 await request(app).get(url).expect(401);await bob.get(url).expect(404);
 await bob.put('/api/entries/'+id).field('title','stolen').expect(404);
 await bob.delete('/api/entries/'+id).expect(404);
 assert.equal((await bob.get('/api/entries')).body.entries.length,0);
 const updated=await alice.put('/api/entries/'+id).field('title','An even better day').field('content','A lovely walk.').field('date','2026-11-07').field('mood','radiant').field('favorite','true').field('tags','["nature","gratitude"]').field('keepImages',JSON.stringify([entry.images[0].id])).expect(200);
 assert.equal(updated.body.entry.favorite,true);assert.equal(updated.body.entry.images.length,1);
 await alice.post('/api/entries').field('title','Bad date').field('date','2026-02-31').expect(400);
 await alice.post('/api/entries').field('title','Bad image').field('date','2026-11-07').attach('images',Buffer.from('not an image'),{filename:'fake.png',contentType:'image/png'}).expect(400);
 await alice.post('/api/entries').field('title','Unsafe').field('date','2026-11-07').attach('images',Buffer.from('<svg/>'),{filename:'a.svg',contentType:'image/svg+xml'}).expect(400);
 await alice.post('/api/entries').set('Origin','https://evil.example').field('title','No').expect(403);
 await alice.delete('/api/entries/'+id).expect(200);await alice.get(url).expect(404);
 await alice.post('/api/auth/logout').expect(200);await alice.get('/api/auth/me').expect(401);
 await alice.post('/api/auth/login').send({identifier:'alice',password:'wrong'}).expect(401);
 await alice.post('/api/auth/login').send({identifier:'alice@example.com',password:'a-long-safe-password'}).expect(200);
});

test('origin validation accepts local aliases and rejects foreign origins',async()=>{
 for(const origin of ['http://localhost:5173','http://127.0.0.1:5173','http://[::1]:5173']){
  await request(app).post('/api/auth/signup').set('Origin',origin).send({}).expect(400).expect('Access-Control-Allow-Origin',origin);
 }
 await request(app).post('/api/auth/signup').set('Origin','http://localhost:9999').send({}).expect(403);
 await request(app).post('/api/auth/signup').set('Origin','https://evil.example').send({}).expect(403);
 const previous=process.env.NODE_ENV;process.env.NODE_ENV='production';
 try{
  const production=createApp();
  await request(production).post('/api/auth/signup').set('Origin','http://127.0.0.1:5173').send({}).expect(403);
  await request(production).post('/api/auth/signup').set('Origin','http://localhost:5173').send({}).expect(400);
 }finally{if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}
});