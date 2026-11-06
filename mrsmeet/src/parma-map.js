import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { parmaPose } from './parma-motion-state.js';

const BASE = import.meta.env.BASE_URL;
const names = ['bun_bottom', 'sauce', 'patty', 'cheese', 'pickles', 'bun_top'];
const baseURL = name => `${BASE}${name}`;
const color = {cream: '#fff9e9', ink: '#173e34', mint: '#39bd9d', pink: '#f2bbd1', sauce: '#efa84a'};

function releaseTree(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root?.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  });
  materials.forEach(material => { Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }); material.dispose(); });
  textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
  geometries.forEach(geometry => geometry.dispose());
}

// Fetch owns the network request; the short-lived blob URL owns image decoding.
// Closing the optional map cancels either step and always revokes the URL.
async function loadGroundTexture(url, signal) {
  const response = await fetch(url, {signal});
  if (!response.ok) throw new Error('Illustrazione della mappa non disponibile');
  const blob = await response.blob();
  signal.throwIfAborted();
  const image = new Image();
  image.decoding = 'async';
  const objectURL = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener('abort', abort);
      image.onload = image.onerror = null;
      URL.revokeObjectURL(objectURL);
    };
    const abort = () => {
      cleanup();
      image.removeAttribute('src');
      reject(signal.reason || new DOMException('Mappa chiusa', 'AbortError'));
    };
    image.onload = () => {
      if (signal.aborted) {abort(); return;}
      const texture = new THREE.Texture(image);
      texture.needsUpdate = true;
      cleanup();
      resolve(texture);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Illustrazione della mappa non leggibile'));
    };
    signal.addEventListener('abort', abort, {once:true});
    try {image.src = objectURL;} catch (error) {cleanup(); reject(error);}
  });
}

export async function mountParmaMap({root, signal: externalSignal} = {}) {
  if (!root) return {dispose() {}, ready:false, markerReady:false};
  const host = root.querySelector('[data-parma-canvas]');
  const controller = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px)');
  const meter = root.querySelector('[data-parma-progress]');
  const chapters = [...root.querySelectorAll('[data-parma-chapter]')];
  const label = root.querySelector('[data-parma-label]');
  let disposed = false, visible = false, renderer, environment, scene, observer, resizeObserver, pauseObserver, raf = 0, geometryData;
  let lastChapter = -1, width = 0, height = 0, burger = null, layers = [], renderImpl = null, lastProgress = 1;
  const request = () => { if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(render); };
  const teardown = () => {
    if (disposed) return;
    disposed = true; controller.abort(); cancelAnimationFrame(raf);
    externalSignal?.removeEventListener('abort',teardown);
    observer?.disconnect(); resizeObserver?.disconnect(); pauseObserver?.disconnect();
    releaseTree(scene); environment?.dispose(); renderer?.dispose(); renderer?.domElement.remove();
    root.classList.remove('map-ready', 'map-burger-ready', 'map-marker-fallback');
  };
  const result = () => ({dispose:teardown, ready:!disposed && root.classList.contains('map-ready'), markerReady:!disposed && root.classList.contains('map-burger-ready')});
  if(externalSignal?.aborted){teardown();return result();}
  externalSignal?.addEventListener('abort',teardown,{once:true});
  try {
    const response = await fetch(baseURL('maps/parma-quarter.json'), {signal: controller.signal});
    if (!response.ok) throw new Error('Mappa non disponibile');
    geometryData = await response.json();
    if (disposed) return result();
    renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact.matches ? 1.25 : 1.5));
    renderer.setClearColor(0,0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let room;
    try {
      room = new RoomEnvironment();
      environment = pmrem.fromScene(room, .04); scene.environment = environment.texture; scene.environmentIntensity = .62;
    } finally {room?.dispose(); pmrem.dispose();}
    scene.add(new THREE.HemisphereLight('#fff9e9', '#518a73', 2));
    const key = new THREE.DirectionalLight('#fff6df', 3); key.position.set(-4,12,8); scene.add(key);
    const rim = new THREE.DirectionalLight('#ffdfeb', 1.6); rim.position.set(7,7,-5); scene.add(rim);
    const bounds = geometryData.bounds;
    // Use precisely the same pixel projection as the SVG, including its border.
    const longitudeScale = geometryData.projection.cos_latitude;
    const svg = geometryData.projection.svg;
    const mapWidth = 16, mapDepth = mapWidth * svg.height / svg.width;
    const project = (lon,lat) => new THREE.Vector3(
      ((svg.offsetX + (lon-bounds.west)*longitudeScale*svg.scale)/svg.width-.5)*mapWidth,
      0,
      ((svg.offsetY + (bounds.north-lat)*svg.scale)/svg.height-.5)*mapDepth
    );
    const pin = project(geometryData.pin.lon,geometryData.pin.lat);
    const camera = new THREE.OrthographicCamera(-10,10,7,-7,.1,100);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(mapWidth+.18,.24,mapDepth+.18),new THREE.MeshPhysicalMaterial({color:color.mint,roughness:.3,clearcoat:.65}));
    ground.position.y=-.16; scene.add(ground);
    const underside = new THREE.Mesh(new THREE.BoxGeometry(mapWidth-.18,.12,mapDepth-.18),new THREE.MeshStandardMaterial({color:color.ink,roughness:.5}));
    underside.position.y=-.32;scene.add(underside);
    const floorTexture = await loadGroundTexture(baseURL('maps/parma-ground.svg'), controller.signal);
    if (disposed) {floorTexture.dispose();return result();}
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(),4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(mapWidth,mapDepth),new THREE.MeshStandardMaterial({map:floorTexture,roughness:.73}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
    const buildingGeometries=[];
    (geometryData.buildings || []).forEach(building => {
      if (building.points.length<4) return;
      const points=building.points.map(([lon,lat])=>project(lon,lat));
      // Keep a small clearing around the entrance marker; do not invent a new footprint.
      const midpoint=points.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(points.length);
      if(midpoint.distanceTo(pin)<.2)return;
      const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p.x,-p.z)));
      const extrusion=new THREE.ExtrudeGeometry(shape,{depth:.075,steps:1,bevelEnabled:false,curveSegments:1});
      extrusion.rotateX(-Math.PI/2);extrusion.translate(0,.015,0);buildingGeometries.push(extrusion);
    });
    if(buildingGeometries.length){
      const merged=mergeGeometries(buildingGeometries,false);
      buildingGeometries.forEach(geometry=>geometry.dispose());
      if(merged)scene.add(new THREE.Mesh(merged,new THREE.MeshStandardMaterial({color:'#e9e3c8',roughness:.65})));
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.025,10,64),new THREE.MeshStandardMaterial({color:color.ink,roughness:.2}));
    ring.rotation.x=-Math.PI/2;ring.position.set(pin.x,.12,pin.z);scene.add(ring);
    const pool=new THREE.Mesh(new THREE.SphereGeometry(.47,32,16),new THREE.MeshPhysicalMaterial({color:color.sauce,roughness:.19,clearcoat:1,clearcoatRoughness:.13}));
    pool.position.set(pin.x,.12,pin.z);scene.add(pool);
    const trail=new THREE.Group();trail.position.set(pin.x,0,pin.z);scene.add(trail);
    const sauceMaterial=new THREE.MeshPhysicalMaterial({color:'#f5ae48',roughness:.15,clearcoat:1,clearcoatRoughness:.1});
    const ribbonPath=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.12,1.18,.10),new THREE.Vector3(-.1,.91,.13),new THREE.Vector3(.05,.65,.10),new THREE.Vector3(.03,.28,.01),new THREE.Vector3(0,.13,0)
    ]);
    const sauceStream=new THREE.Mesh(new THREE.TubeGeometry(ribbonPath,36,.055,8,false),sauceMaterial);trail.add(sauceStream);
    const droplet=new THREE.Mesh(new THREE.SphereGeometry(.115,20,14),sauceMaterial);scene.add(droplet);
    // The existing Blender asset is used as a location marker only. Product photos stay untouched.
    const marker=new THREE.Group();marker.position.set(pin.x,1.27,pin.z);scene.add(marker);
    const ringShadow=new THREE.Mesh(new THREE.CircleGeometry(.72,48),new THREE.MeshBasicMaterial({color:'#173e34',transparent:true,opacity:.13,depthWrite:false}));
    ringShadow.rotation.x=-Math.PI/2;ringShadow.position.set(pin.x,.09,pin.z);scene.add(ringShadow);
    const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.append(canvas);
    root.classList.add('map-ready');
    const resize=()=>{const rect=host.getBoundingClientRect();width=rect.width;height=rect.height;if(!width||!height)return;renderer.setSize(width,height,false);const aspect=width/height;const horizontal=aspect<1?12.8:19;camera.left=-horizontal/2;camera.right=horizontal/2;camera.top=horizontal/aspect/2;camera.bottom=-horizontal/aspect/2;camera.updateProjectionMatrix();request();};
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
    function currentPose(){if(reduced.matches)return parmaPose(1,true);if(!document.body.classList.contains('motion-paused')){const rect=root.getBoundingClientRect();lastProgress=(36-rect.top)/Math.max(1,rect.height-window.innerHeight+36);}return parmaPose(lastProgress);}
    function draw(){
      const pose=currentPose();
      camera.position.set(4-pose.focus*1.4,12.5,12.7-pose.focus*1.5);
      camera.lookAt(pin.x*pose.focus*.68,.5+pose.focus*.15,pin.z*pose.focus*.68);
      camera.updateMatrixWorld();
      marker.position.y=1.27+(1-pose.arrival)*3.9;
      marker.rotation.y=-.25+(1-pose.arrival)*.33;
      marker.rotation.z=(1-pose.assembly)*-.055;
      layers.forEach(({node,position,index,scale})=>{node.position.copy(position);node.position.y+=(1-pose.assembly)*index*.38/scale;});
      trail.visible=pose.sauce>.001;trail.scale.set(1,pose.sauce,1);
      // The stream grows down from the burger, keeping the top attached.
      trail.position.y=1.18*(1-pose.sauce);
      droplet.visible=pose.sauce>.01 && pose.sauce<.98;
      droplet.position.set(pin.x,1.18*(1-pose.sauce)+.13,pin.z);droplet.scale.set(.8,1.25, .8);
      pool.scale.set(.05+pose.pool,.025+pose.pool*.085,.05+pose.pool*.82);pool.visible=pose.pool>.001;
      ring.scale.setScalar(1+pose.pool*.20);
      ringShadow.scale.setScalar(.6+pose.arrival*.4);
      if(meter)meter.style.transform=`scaleX(${pose.progress})`;
      if(label){const v=new THREE.Vector3(pin.x, .1, pin.z).project(camera);label.style.left=`${(v.x*.5+.5)*100}%`;label.style.top=`${(-v.y*.5+.5)*100}%`;label.classList.toggle('is-arrived',pose.progress>.69);}
      if(lastChapter!==pose.chapter){chapters.forEach((element,index)=>element.classList.toggle('is-active',index===pose.chapter));lastChapter=pose.chapter;}
      renderer.render(scene,camera);
    }
    renderImpl=draw;
    observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'80px'});observer.observe(host);
    window.addEventListener('scroll',request,{passive:true,signal:controller.signal});
    document.addEventListener('visibilitychange',request,{signal:controller.signal});
    reduced.addEventListener('change',request,{signal:controller.signal});
    pauseObserver=new MutationObserver(request);pauseObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    try{
      const modelResponse=await fetch(baseURL('models/parma-burger-web.glb'),{signal:controller.signal});
      if(!modelResponse.ok)throw new Error('Marker non disponibile');
      const gltf=await new GLTFLoader().parseAsync(await modelResponse.arrayBuffer(),'');
      if(disposed){releaseTree(gltf.scene);return result();}
      burger=gltf.scene;
      const box=new THREE.Box3().setFromObject(burger,true),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
      const scale=2.2/Math.max(size.x,size.z);
      burger.position.copy(center).multiplyScalar(-scale);burger.scale.setScalar(scale);
      burger.traverse(node=>{if(names.includes(node.name))layers.push({node,position:node.position.clone(),index:names.indexOf(node.name),scale});});
      marker.add(burger);root.classList.add('map-burger-ready');request();
    }catch(error){if(!disposed){root.classList.add('map-marker-fallback');console.info('Mappa disponibile con segnaposto semplice.',error.message);}}
    return result();
  }catch(error){teardown();if(error.name!=='AbortError')console.info('Mappa statica disponibile.',error.message);return result();}
  function render(){raf=0;if(!disposed&&visible&&!document.hidden)renderImpl?.();}
}
