import * as THREE from 'three';
import assert from 'node:assert/strict';
import { buildCinematicExhibits } from '../src/scene-objects.js';
const geometries=new Set(),materials=new Set();
const ownGeometry=g=>(geometries.add(g),g),ownMaterial=m=>(materials.add(m),m);
function roundedShape(w,h,r=.06){const x=-w/2,y=-h/2,s=new THREE.Shape();r=Math.min(r,w/2,h/2);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function surface(texture,w,h,{depth=.075,radius=.055}={}){const g=new THREE.Group();const geo=ownGeometry(new THREE.ExtrudeGeometry(roundedShape(w,h,radius),{depth,bevelEnabled:true,bevelSize:Math.min(.018,depth/4),bevelThickness:Math.min(.018,depth/4),bevelSegments:2,curveSegments:6,steps:1}));geo.translate(0,0,-depth/2);g.add(new THREE.Mesh(geo,ownMaterial(new THREE.MeshStandardMaterial())));return g;}
const texture=()=>new THREE.Texture({width:1700,height:1080});
const exhibits=buildCinematicExhibits({ownGeometry,ownMaterial,canvasTexture:texture,surface,browserTexture:texture,roundedShape,architecture:texture()});
const report=[];
for(const [index,e] of exhibits.entries()){
 let maxW=0,maxH=0,maxZ=0,maxXExtent=0,maxYExtent=0;
 const modes=[false,true];
 for(const mobile of modes)for(let t=0;t<=22;t+=.2)for(const intro of [0,1])for(const departure of [0,.7]){
  e.animate(t,intro,departure,mobile);e.root.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(e.root,true),size=b.getSize(new THREE.Vector3());
  maxW=Math.max(maxW,size.x);maxH=Math.max(maxH,size.y);maxZ=Math.max(maxZ,size.z);
  // BoundingBox includes hidden children, matching conservative mobile bounds.
  maxXExtent=Math.max(maxXExtent,Math.abs(b.min.x)*2,Math.abs(b.max.x)*2);
  maxYExtent=Math.max(maxYExtent,Math.abs(b.min.y)*2,Math.abs(b.max.y)*2);
  e.root.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position.array;if(!Array.from(p).every(Number.isFinite))throw Error('Non-finite vertices');}});
 }
 report.push({index,declaredWidth:e.width,declaredHeight:e.height,maxW:+maxW.toFixed(3),maxH:+maxH.toFixed(3),maxZ:+maxZ.toFixed(3),maxXExtent:+maxXExtent.toFixed(3),maxYExtent:+maxYExtent.toFixed(3)});
 // Absolute animation: pose A, B, A restores every local matrix exactly.
 e.animate(4.2,0,0,false);e.root.updateMatrixWorld(true);const a=[];e.root.traverse(o=>a.push(o.matrix.toArray().join(',')));
 e.animate(10.2,1,.7,false);e.animate(4.2,0,0,false);e.root.updateMatrixWorld(true);const b=[];e.root.traverse(o=>b.push(o.matrix.toArray().join(',')));
 if(a.join('|')!==b.join('|'))throw Error('Non-deterministic pose '+index);
}
console.log(JSON.stringify({report,geometries:geometries.size,materials:materials.size},null,2));
const fit=[];
for (const [index,e] of exhibits.entries()) {
 const camera=new THREE.PerspectiveCamera(38,390/844,.1,100);
 const z=[10.8,11.5,10.4,11.9][index]; camera.position.set(0,.1,z);camera.lookAt(0,.05,0);camera.updateMatrixWorld(true);
 const frustumH=2*z*Math.tan(THREE.MathUtils.degToRad(19)),frustumW=frustumH*camera.aspect;
 const slot={width:390,height:292.5,centerY:450};
 const world=new THREE.Group(); world.add(e.root);world.scale.setScalar(Math.min(frustumW/e.width,frustumH*(slot.height/844)/e.height)*.93);
 let xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity;
 for(let time=0;time<=22;time+=.25)for(const intro of [0,1]){
  e.root.position.set(0,Math.sin(time*.42)*.035,.24);e.root.rotation.set(0,0,-.025);e.animate(time,intro,0,true);world.updateMatrixWorld(true);
  camera.setViewOffset(390,844,0,0,390,844);
  const center=e.root.getWorldPosition(new THREE.Vector3()).project(camera);
  const centerY=(1-center.y)*844/2;camera.setViewOffset(390,844,0,centerY-slot.centerY,390,844);
  e.root.traverseVisible(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const box=o.geometry.boundingBox;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).applyMatrix4(o.matrixWorld).project(camera);const px=(p.x+1)*390/2,py=(1-p.y)*844/2;xMin=Math.min(xMin,px);xMax=Math.max(xMax,px);yMin=Math.min(yMin,py);yMax=Math.max(yMax,py);}});
 }
 fit.push({index,xMin:+xMin.toFixed(2),xMax:+xMax.toFixed(2),yMin:+yMin.toFixed(2),yMax:+yMax.toFixed(2),slotTop:slot.centerY-slot.height/2,slotBottom:slot.centerY+slot.height/2});
}
console.log(JSON.stringify({mobileProjection:fit},null,2));
const desktopFit=[];
for(const [index,e]of exhibits.entries()){
 const camera=new THREE.PerspectiveCamera(34,1200/728,.1,100);const baseZ=[10.8,11.5,10.4,11.9][index];
 const world=new THREE.Group();world.add(e.root);world.scale.setScalar(index===0?.7:.8);
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(let t=0;t<=22;t+=.25)for(const intro of index===0?[0,1]:[0]){
  camera.position.set(intro*1.8,.28,baseZ+intro*1.3);camera.lookAt(0,.15,0);camera.setViewOffset(1200,728,-1200*.17,0,1200,728);camera.updateMatrixWorld(true);
  e.root.position.set(0,(index===0?.25:0)+Math.sin(t*.42)*.035,.24);e.root.rotation.set(0,0,-.025);e.animate(t,intro,0,false);world.updateMatrixWorld(true);
  e.root.traverseVisible(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const box=o.geometry.boundingBox;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).applyMatrix4(o.matrixWorld).project(camera),px=(p.x+1)*600,py=(1-p.y)*364;left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}});
 }
 desktopFit.push({index,left:+left.toFixed(1),right:+right.toFixed(1),top:+top.toFixed(1),bottom:+bottom.toFixed(1)});
}
console.log(JSON.stringify({desktopProjection:desktopFit},null,2));

// These are numeric silhouette tests, not a WebGL/GPU or browser render test.
for (const item of fit) {
 assert.ok(item.xMin >= 0 && item.xMax <= 390, `Mobile horizontal fit: ${item.index}`);
 assert.ok(item.yMin >= item.slotTop && item.yMax <= item.slotBottom, `Mobile vertical fit: ${item.index}`);
}
for (const item of desktopFit) {
 assert.ok(item.left >= 480 && item.right <= 1140, `Desktop copy clearance: ${item.index}`);
 assert.ok(item.top >= 95 && item.bottom <= 650, `Desktop header/footer clearance: ${item.index}`);
}
console.log('PASS: finite vertices, reversible poses, mobile slots and desktop copy clearance for all four original models.');
