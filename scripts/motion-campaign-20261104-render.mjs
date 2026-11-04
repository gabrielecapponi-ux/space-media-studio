/** Authored 3-format campaign: native deterministic CSS3D frames → H.264. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,copyFileSync,readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.split('=')[1]||'proof';
const requested=process.argv.find(a=>a.startsWith('--variant='))?.split('=')[1]||'both';
const variants=requested==='both'?['desktop','mobile']:[requested];
const session='motion-campaign-v2',output=join(root,'outputs/motion-campaign-20261104');mkdirSync(output,{recursive:true});
const stageURL=pathToFileURL(join(root,'scripts/motion-campaign-20261104-stage.html')).href+'?source='+createHash('sha256').update(readFileSync(join(root,'scripts/motion-campaign-20261104-stage.html'))).digest('hex').slice(0,12)+(process.argv.includes('--motion')?'&motion=1':'');
const dimensions={desktop:[1920,1080],mobile:[720,900]};
const cli=args=>execFileSync('npm',['exec','--yes','--package=@playwright/cli@0.1.23','--','playwright-cli',`-s=${session}`,...args],{cwd:root,encoding:'utf8',maxBuffer:3e6});
const code=source=>{const file=join(output,'current-capture.js');writeFileSync(file,source);const result=cli(['--raw','run-code',`--filename=${file}`]);if(result.includes('### Error'))throw Error(result);return result;};
if(!['open','close','proof','frames','encode','preflight'].includes(mode))throw Error('Unknown mode');
if(mode==='open'||mode==='close'){process.stdout.write(cli(mode==='open'?['open','--browser=chrome']:['close']));process.exit(0);}
for(const variant of variants){
 const[width,height]=dimensions[variant]||[];if(!width)throw Error('Unknown variant');
 const frames=join(output,'frames',variant);mkdirSync(frames,{recursive:true});
 if(mode==='preflight'){
  const result=code(`async page=>{
   await page.setViewportSize({width:${width},height:${height}});await page.goto(${JSON.stringify(stageURL)});await page.evaluate(()=>window.campaignReady);
   return await page.evaluate(async()=>{const clip=motion;motion=null;const poses=[];for(let f=0;f<=360;f++)poses.push(await window.renderCampaignFrame(f));motion=clip;return {poses,video:'Temporarily excluded only for geometry preflight'};});
  }`);writeFileSync(join(output,`preflight-${variant}.json`),result);console.log(JSON.stringify({variant,preflight:'saved'}));
 }

 if(mode==='proof'||mode==='frames'){
  const ranges=mode==='proof'?[[0,0],[60,60],[144,144],[240,240],[359,359]]:Array.from({length:12},(_,i)=>[i*30,i*30+29]);
  for(const[start,end]of ranges){
   const result=code(`async page=>{
    const errors=[],poses=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.setViewportSize({width:${width},height:${height}});
    const url=${JSON.stringify(stageURL)};
    if(page.url()!==url)await page.goto(url);await page.evaluate(()=>window.campaignReady);
    for(let f=${start};f<=${end};f++){
     poses.push(await page.evaluate(async f=>{const pose=await window.renderCampaignFrame(f);await new Promise(requestAnimationFrame);return pose;},f));
     await page.screenshot({path:${JSON.stringify(frames)}+'/'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:95,scale:'css'});
    }return {poses,variant:'${variant}',native:[${width},${height}],first:${start},last:${end},errors,images:await page.locator('img').evaluateAll(images=>images.map(i=>({loaded:i.complete&&i.naturalWidth>0,native:[i.naturalWidth,i.naturalHeight]}))),video:await page.locator('video').evaluateAll(videos=>videos.map(v=>({native:[v.videoWidth,v.videoHeight],duration:v.duration,time:v.currentTime,paused:v.paused,readyState:v.readyState})))};
   }`);writeFileSync(join(output,`capture-${variant}-${start}-${end}.json`),result);console.log(JSON.stringify({variant,first:start,last:end,result:result.includes('\"errors\":[]')?'passed':'inspect'}));
  }
 }
 if(mode==='encode'){
  const name=variant==='desktop'?'motion-campaign':'motion-campaign-mobile',film=join(root,'public/films',name+'.mp4');
  execFileSync('ffmpeg',['-v','error','-y','-framerate','60','-start_number','0','-i',join(frames,'%04d.jpg'),'-frames:v','360','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-threads','4','-crf','18','-profile:v','high','-level',variant==='desktop'?'4.2':'4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','120','-movflags','+faststart','-an',film],{stdio:'inherit'});
  copyFileSync(join(frames,'0144.jpg'),join(root,'public/images',name+'.jpg'));
  execFileSync('ffmpeg',['-v','error','-i',film,'-f','null','-'],{stdio:'inherit'});
  const probe=execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',film],{encoding:'utf8'});writeFileSync(join(output,`probe-${variant}.json`),probe);console.log(`Encoded and fully decoded ${film}`);
 }
}
