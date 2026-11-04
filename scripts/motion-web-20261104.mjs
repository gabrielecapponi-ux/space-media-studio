/** Native interface film: original HTML demos → deterministic CSS3D frames → H.264.
 * Run against local Vite on5184. Requires existing PlaywrightCLI0.1.23 + FFmpeg.
 * Source stills and numbered frames stay in ignored outputs/web-reel.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { WEB_REEL, webReelFrame } from '../src/web-reel-motion.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.split('=')[1]||'frames';
if(!['open','close','frames','encode'].includes(mode))throw Error('Use frozen original captures, then frames/encode.');
const requested=process.argv.find(a=>a.startsWith('--variant='))?.split('=')[1]||'both';
const variants=requested==='both'?['desktop','mobile']:[requested];
const session='motion-web-nov4';
const dimensions={desktop:[1920,1080],mobile:[720,900]};
const output=join(root,'outputs/motion-web-20261104');mkdirSync(output,{recursive:true});
if(JSON.stringify(webReelFrame(0))!==JSON.stringify(webReelFrame(WEB_REEL.frames)))throw Error('Nonperiodic timeline');
const cli=(args)=>execFileSync('npm',['exec','--yes','--package=@playwright/cli@0.1.23','--','playwright-cli',`-s=${session}`,...args],{cwd:root,encoding:'utf8',maxBuffer:3e6});
const code=(source)=>{
 const file=join(output,'current-capture.js');writeFileSync(file,source);
 const result=cli(['--raw','run-code',`--filename=${file}`]);
 if(result.includes('### Error'))throw Error(result);
 return result;
};
if(mode==='open') { process.stdout.write(cli(['open','--browser=chrome']));process.exit(0); }
if(mode==='close') { process.stdout.write(cli(['close']));process.exit(0); }
for(const variant of variants){
 const [width,height]=dimensions[variant]||[];if(!width)throw Error('Unknown variant');
 const screens=join(output,'screens',variant),frames=join(output,'frames',variant);mkdirSync(screens,{recursive:true});mkdirSync(frames,{recursive:true});
 if(mode==='all'||mode==='screens'){
  const result=code(`async page=>{
   await page.setViewportSize({width:${width},height:${height}});const scenes=${JSON.stringify(WEB_REEL.scenes)};const results=[];
   for(const scene of scenes){
    await page.goto('http://127.0.0.1:5184/showcase/index.html?scene='+scene+'&capture=1');
    await page.evaluate(()=>window.__showcaseReady);
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
    await page.screenshot({path:${JSON.stringify(screens)}+'/'+scene+'.jpg',type:'jpeg',quality:96,scale:'css'});
    results.push(await page.evaluate(()=>({scene:document.documentElement.dataset.scene||document.body.dataset.scene,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,title:document.title})));
   }return results;
  }`);writeFileSync(join(output,`screens-${variant}-receipt.json`),result);console.log(`Captured5 ${variant} interfaces`);
 }
 if(mode==='all'||mode==='frames'){
  const proof=process.argv.includes('--proof');
  const ranges=proof?[[0,0],[102,102],[120,120],[240,240],[360,360],[480,480],[599,599]]:Array.from({length:10},(_,i)=>[i*60,i*60+59]);
  for(const [start,end]of ranges){
   const result=code(`async page=>{
    await page.setViewportSize({width:${width},height:${height}});
    const url='http://127.0.0.1:5184/scripts/motion-web-20261104-stage.html?variant=${variant}';if(page.url()!==url)await page.goto(url);
    await page.evaluate(()=>window.reelReady);
    for(let f=${start};f<=${end};f++){
     await page.evaluate(async f=>{window.renderReelFrame(f);await Promise.all([...document.images].map(image=>image.decode()));await new Promise(requestAnimationFrame);},f);
     await page.screenshot({path:${JSON.stringify(frames)}+'/'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:94,scale:'css'});
    }return {variant:'${variant}',native:[${width},${height}],first:${start},last:${end}};
   }`);console.log(result.trim());
  }
 }
 if(mode==='all'||mode==='encode'){
  const name=variant==='desktop'?'motion-web':'motion-web-mobile';const film=join(root,'public/films',name+'.mp4');
  execFileSync('ffmpeg',['-v','error','-y','-framerate',String(WEB_REEL.fps),'-start_number','0','-i',join(frames,'%04d.jpg'),'-frames:v',String(WEB_REEL.frames),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-threads','4','-crf','18','-profile:v','high','-level',variant==='desktop'?'4.2':'4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','60','-movflags','+faststart','-an',film],{stdio:'inherit'});
  copyFileSync(join(frames,'0000.jpg'),join(root,'public/images',name+'.jpg'));
  execFileSync('ffmpeg',['-v','error','-i',film,'-f','null','-'],{stdio:'inherit'});
  const probe=execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',film],{encoding:'utf8'});writeFileSync(join(output,`probe-${variant}.json`),probe);console.log(`Encoded and decoded ${film}`);
 }
}
