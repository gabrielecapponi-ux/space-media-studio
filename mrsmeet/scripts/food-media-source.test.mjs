import test from 'node:test';
import assert from 'node:assert/strict';
import {selectFoodVideo,recordFoodTransfer} from '../src/food-media-source.js';

const entry={video:'./burger-web.mp4',videoRetina:'./burger.mp4'};
const url='https://example.test/burger-web.mp4';
function browser(connection) {
  let time=1000, entries=[];
  const view={devicePixelRatio:3,navigator:{connection},performance:{now:()=>time,getEntriesByName:source=>source===url?entries:[]}};
  return {view,setTime:value=>{time=value;},sample:(body,transfer,end=500,start=0)=>{
    entries=[{startTime:start,responseEnd:end,encodedBodySize:body,transferSize:transfer}];
    recordFoodTransfer({currentSrc:url},view,0);
  }};
}
test('unknown bandwidth and non-Retina displays use the compact file',()=>{
  const {view}=browser();
  assert.equal(selectFoodVideo(entry,view,300),entry.video);
  view.navigator.connection={downlink:10};view.devicePixelRatio=1;
  assert.equal(selectFoodVideo(entry,view,420),entry.video);
});
test('a known fast connection can serve true Retina detail',()=>{
  const {view}=browser({downlink:10,effectiveType:'4g'});
  assert.equal(selectFoodVideo(entry,view,300),entry.videoRetina);
});
test('a recent slow transfer overrides optimistic reported bandwidth',()=>{
  const b=browser({downlink:10,effectiveType:'4g'});
  b.sample(200000,200300,1000);
  assert.equal(selectFoodVideo(entry,b.view,300),entry.video);
  b.setTime(31001);
  assert.equal(selectFoodVideo(entry,b.view,300),entry.videoRetina);
});
test('slow or data-saving connections override a previous fast sample',()=>{
  const b=browser();b.sample(500000,500300);
  for(const connection of [{downlink:1.6},{downlink:10,effectiveType:'3g'},{downlink:10,saveData:true}]){
    b.view.navigator.connection=connection;
    assert.equal(selectFoodVideo(entry,b.view,300),entry.video);
  }
});
test('real uncached transfers can inform Safari selection and expire',()=>{
  const b=browser();b.sample(500000,500300);
  assert.equal(selectFoodVideo(entry,b.view,300),entry.videoRetina);
  b.setTime(31001);
  assert.equal(selectFoodVideo(entry,b.view,300),entry.video);
});
test('cache hits, 304s and missing transfer sizes never claim fast bandwidth',()=>{
  for(const transferred of [0,300]){
    const b=browser();b.sample(500000,transferred,1);
    assert.equal(selectFoodVideo(entry,b.view,300),entry.video);
  }
  const b=browser();b.sample(200000,200300,1000);
  assert.equal(selectFoodVideo(entry,b.view,300),entry.video);
});
test('legacy menu films retain their existing source',()=>{
  const {view}=browser({downlink:10});
  assert.equal(selectFoodVideo({video:'./original.mp4'},view,420),'./original.mp4');
});
