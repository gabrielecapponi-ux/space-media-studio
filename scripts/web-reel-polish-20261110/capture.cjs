/** Capture the actual five demo destinations; no synthetic screenshots. */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.SPACE_PLAYWRIGHT||'/Users/gabrielecapponi/.npm/_npx/31e32ef8478fbf80/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'outputs/campaign-web-revision-20261110/web/captures');
const base=process.env.SPACE_DEMO_URL||'http://127.0.0.1:5233/showcase/';
const scenes=['shift','vela','nude','basilico','oltre'];
(async()=>{const browser=await chromium.launch({channel:'chrome'}),records=[];try{for(const [profile,width,height] of [['desktop',1920,1080],['mobile',720,900]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage();
 await fs.mkdir(path.join(out,profile),{recursive:true});
 for(const scene of scenes){const url=new URL(base);url.searchParams.set('scene',scene);url.searchParams.set('capture','1');await page.goto(url.href,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.querySelectorAll('#demo img')].every(i=>i.complete&&i.naturalWidth>0));
 const geometry=await page.evaluate(()=>{const photo=document.querySelector('.phase-photo img'),rect=photo?.getBoundingClientRect();return{scene:document.body.dataset.scene,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,photo:photo&&{rect:rect.toJSON(),fit:getComputedStyle(photo).objectFit,position:getComputedStyle(photo).objectPosition,native:[photo.naturalWidth,photo.naturalHeight]},images:[...document.querySelectorAll('#demo img')].map(i=>({url:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight})),fontStatus:document.fonts.status}});assert.equal(geometry.scene,scene);assert.equal(geometry.overflow,false);assert.equal(geometry.fontStatus,'loaded');
 const file=path.join(out,profile,scene+'.png');await page.screenshot({path:file,animations:'disabled'});const buffer=await fs.readFile(file);records.push({profile,scene,dpr:2,geometry,file:path.relative(root,file),sha256:crypto.createHash('sha256').update(buffer).digest('hex'),bytes:buffer.length});console.log('Captured',profile,scene);
 }await context.close();}}finally{await browser.close()}
 const code=[];for(const f of ['public/showcase/index.html','public/showcase/showcase.css','public/showcase/showcase.js','public/showcase/phase-01/store.css']){const b=await fs.readFile(path.join(root,f));code.push({file:f,sha256:crypto.createHash('sha256').update(b).digest('hex')})}
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({created:new Date().toISOString(),base,code,records},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1});
