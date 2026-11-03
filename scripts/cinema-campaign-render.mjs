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
const session='cinema-campaign-render',output=join(root,'outputs/cinema-campaign');mkdirSync(output,{recursive:true});
const stageURL=pathToFileURL(join(root,'scripts/cinema-campaign-stage.html')).href+'?source='+createHash('sha256').update(readFileSync(join(root,'scripts/cinema-campaign-stage.html'))).digest('hex').slice(0,12)+(process.argv.includes('--motion')?'&motion=1':'');
const dimensions={desktop:[1920,1080],mobile:[720,900]};
const cli=args=>execFileSync('npm',['exec','--yes','--package=@playwright/cli@0.1.23','--','playwright-cli',`-s=${session}`,...args],{cwd:root,encoding:'utf8',maxBuffer:3e6});
const code=source=>{const file=join(output,'current-capture.js');writeFileSync(file,source);const result=cli(['--raw','run-code',`--filename=${file}`]);if(result.includes('### Error'))throw Error(result);return result;};
if(!['open','close','proof','frames','encode','prepare'].includes(mode))throw Error('Unknown mode');
if(mode==='prepare'){
 const source=join(output,'source/higgsfield-shift.mp4'),prepared=join(output,'source/motion-source.mp4');
 execFileSync('ffmpeg',['-v','error','-y','-i',source,'-map','0:v:0','-c:v','libx264','-preset','medium','-threads','4','-crf','18','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-g','24','-movflags','+faststart','-an',prepared],{stdio:'inherit'});
 execFileSync('ffmpeg',['-v','error','-y','-i',prepared,'-frames:v','1','-q:v','1',join(output,'source/higgsfield-shift-first.jpg')],{stdio:'inherit'});
 console.log('Prepared native-size/rate H.264 source and first-frame still');process.exit(0);
}
if(mode==='open'||mode==='close'){process.stdout.write(cli(mode==='open'?['open','--browser=chrome']:['close']));process.exit(0);}
for(const variant of variants){
 const[width,height]=dimensions[variant]||[];if(!width)throw Error('Unknown variant');
 const frames=join(output,'frames',variant);mkdirSync(frames,{recursive:true});
 if(mode==='proof'||mode==='frames'){
  const ranges=mode==='proof'?[[0,0],[55,55],[90,90],[179,179]]:Array.from({length:6},(_,i)=>[i*30,i*30+29]);
  for(const[start,end]of ranges){
   const result=code(`async page=>{
    const errors=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.setViewportSize({width:${width},height:${height}});
    const url=${JSON.stringify(stageURL)};
    if(page.url()!==url)await page.goto(url);await page.evaluate(()=>window.campaignReady);
    for(let f=${start};f<=${end};f++){
     await page.evaluate(async f=>{await window.renderCampaignFrame(f);await new Promise(requestAnimationFrame);},f);
     await page.screenshot({path:${JSON.stringify(frames)}+'/'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:95,scale:'css'});
    }return {variant:'${variant}',native:[${width},${height}],first:${start},last:${end},errors,images:await page.locator('img').evaluateAll(images=>images.map(i=>({loaded:i.complete&&i.naturalWidth>0,native:[i.naturalWidth,i.naturalHeight]}))),video:await page.locator('video').evaluateAll(videos=>videos.map(v=>({native:[v.videoWidth,v.videoHeight],duration:v.duration,time:v.currentTime,paused:v.paused,readyState:v.readyState})))};
   }`);console.log(result.trim());
  }
 }
 if(mode==='encode'){
  const name=variant==='desktop'?'cinema-campaign':'cinema-campaign-mobile',film=join(root,'public/films',name+'.mp4');
  execFileSync('ffmpeg',['-v','error','-y','-framerate','30','-start_number','0','-i',join(frames,'%04d.jpg'),'-frames:v','180','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-threads','4','-crf','18','-profile:v','high','-level','4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','60','-movflags','+faststart','-an',film],{stdio:'inherit'});
  copyFileSync(join(frames,'0055.jpg'),join(root,'public/images',name+'.jpg'));
  execFileSync('ffmpeg',['-v','error','-i',film,'-f','null','-'],{stdio:'inherit'});
  const probe=execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',film],{encoding:'utf8'});writeFileSync(join(output,`probe-${variant}.json`),probe);console.log(`Encoded and fully decoded ${film}`);
 }
}
