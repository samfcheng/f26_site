import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSuspension, WALL_Z } from './suspension.js';
import { createRibbon } from './ribbon.js';
import { createHardware } from './hardware.js';
import { createSceneFilters } from './scene-filters.js';

const CARD_URL = '/assets/badge2.png';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function roundedShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  return s;
}

function surfaceTexture(kind) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(256, 256);
  let seed = 23;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i=0; i<data.data.length; i+=4) {
    const x=(i/4)%256, y=Math.floor(i/1024);
    const n=kind==='fabric' ? 110 + 50*Math.sin(x*Math.PI/2)*Math.sin(y*Math.PI/2)+random()*25 : 180+random()*50;
    data.data[i]=data.data[i+1]=data.data[i+2]=n; data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  if(kind==='plastic') {
    ctx.strokeStyle='rgba(80,80,80,.14)'; ctx.lineWidth=.4;
    for(let i=0;i<45;i++){const x=random()*256,y=random()*256;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*40,y+random()*5);ctx.stroke();}
  }
  const t=new THREE.CanvasTexture(canvas); t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(kind==='fabric'?4:1,kind==='fabric'?30:1); return t;
}


// Sparse, reproducible handling marks. Keep the window optically smooth;
// accumulation belongs near the welds, not in a uniform noise coating.
function sleeveWear() {
  const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=1536;
  const ctx=canvas.getContext('2d');
  let seed=617;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<950;i++) {
    let x=random()*1024,y=random()*1536;
    const edge=Math.min(x,1024-x,y,1536-y);
    if(edge>60 && !(y>165&&y<244) && random()>.09) continue;
    const radius=.3+random()*2.1;
    ctx.fillStyle=`rgba(${random()>.55?'70,66,53':'255,255,246'},${.12+random()*.38})`;
    ctx.beginPath();ctx.ellipse(x,y,radius,radius*(.45+random()),random()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<28;i++) {
    const x=random()>.5?25+random()*45:954+random()*40,y=250+random()*1220;
    ctx.strokeStyle=`rgba(240,242,230,${.1+random()*.2})`;ctx.lineWidth=.35+random()*.55;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+random()*5,y+12,x+random()*7,y+15+random()*38);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export async function createBadgeScene(canvas, getSettings, onState, cardUrl = CARD_URL) {
  await RAPIER.init();
  let disposed=false, raf=0, paused=false, dragging=false, activePointer=null, accumulator=0, lastTime=0;
  let inView=true;
  let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mediaChange=()=>{reduced=media.matches;}; media.addEventListener('change',mediaChange);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#efeee7');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  const unlitArtwork=getSettings().material.unlitArtwork === true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,unlitArtwork?2:1.5));
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const camera=new THREE.PerspectiveCamera(36,1,.1,60);
  camera.position.set(0,.8,13.8); camera.lookAt(0,.8,0);
  const filters=createSceneFilters(renderer,scene,camera);
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
  // Product-photography flags and strip lights make glancing reflections
  // readable on clear vinyl without turning the whole surface white.
  for(const [x,z,width,height,brightness,angle] of [[-3,3,1.0,7,5,.55],[3,3,1.5,7,.015,-.55],[.8,4,.28,6,7,-.2]]){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(width,height,.03),new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(brightness,brightness,brightness)}));
    panel.position.set(x,1,z);panel.rotation.y=angle;room.add(panel);
  }
  const env=pmrem.fromScene(room,.015); scene.environment=env.texture; scene.environmentIntensity=.65; room.dispose(); pmrem.dispose();
  const key=new THREE.DirectionalLight('#fff7e6',4.5); key.position.set(-3,6,7); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); Object.assign(key.shadow.camera,{left:-8,right:8,top:9,bottom:-7,near:.1,far:25});
  key.shadow.bias=-.0005; key.shadow.normalBias=.03; key.shadow.radius=5; scene.add(key);
  const fill=new THREE.DirectionalLight('#e8f0ff',.7); fill.position.set(5,2,4); scene.add(fill);
  scene.add(new THREE.AmbientLight('#ffffff',.35));
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.13}));
  wall.position.z=WALL_Z; wall.receiveShadow=true; scene.add(wall);
  const badge=new THREE.Group(); scene.add(badge);
  const plasticBump=surfaceTexture('plastic'), fabricBump=surfaceTexture('fabric'), wearTexture=sleeveWear();
  // Optically thin vinyl: composite only the Fresnel reflection over the
  // original scene. Screen-space volume refraction needlessly filtered the
  // printed insert even at near-zero thickness and made it look frosted.
  const filmUniforms={filtered:{value:false},clarity:{value:1},thickness:{value:.006},damage:{value:.55}};
  function filmMaterial(roughness, welded=false){
    const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',metalness:1,roughness,transparent:true,depthWrite:false,side:THREE.FrontSide,envMapIntensity:1});
    material.onBeforeCompile=shader=>{
      shader.uniforms.filmClarity=filmUniforms.clarity;
      shader.uniforms.filteredCapture=filmUniforms.filtered;
      shader.uniforms.filmEdgeDamage=filmUniforms.damage;
      shader.vertexShader='varying vec3 vFilmPosition; uniform float filmEdgeDamage;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vFilmPosition=position;
        ${welded ? `float edgeMask=smoothstep(1.20,1.30,abs(position.x));
        float nick=exp(-pow((position.y+1.72)*19.0,2.0)) + .6*exp(-pow((position.y-.7)*28.0,2.0));
        transformed.x -= sign(position.x)*nick*edgeMask*.014*filmEdgeDamage;` : ''}
      `);
      shader.uniforms.filmThickness=filmUniforms.thickness;
      shader.fragmentShader='uniform bool filteredCapture; varying vec3 vFilmPosition; uniform float filmClarity; uniform float filmThickness;\n'+shader.fragmentShader;
      if(!welded) shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        normal=normalize(normal + vec3(.018*sin(vFilmPosition.y*3.1 + vFilmPosition.x*1.4), .011*cos(vFilmPosition.x*4.2-vFilmPosition.y*1.3),0.0));
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`#include <opaque_fragment>
        float facing = clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
        float reflection = ${welded ? '0.18 + 0.82' : '0.035 + 0.965'} * pow(1.0 - facing, 5.0);
        reflection = max(reflection, ${welded ? '0.18' : '0.035'});
        reflection = clamp(reflection * (1.0 + filmThickness * 3.0), 0.0, 1.0);
        // Preserve bright strip-light highlights when compositing HDR
        // reflections onto an optically thin, transparent film.
        float energy=max(max(outgoingLight.r,outgoingLight.g),outgoingLight.b);
        reflection=max(reflection,smoothstep(.9,4.0,energy)*${welded ? '.65' : '.34'});
        gl_FragColor.a = mix(1.0, reflection, filmClarity);
        // Bound the film's reflection before HDR compositing. Otherwise a
        // bright studio light overwhelms the card before output tone mapping.
        if(filteredCapture) gl_FragColor.rgb=min(gl_FragColor.rgb,vec3(1.0));
      `);
    };
    material.customProgramCacheKey=()=> 'thin-vinyl-fresnel-v3-'+welded;
    return material;
  }
  const plastic=filmMaterial(.008),edgeMat=filmMaterial(.018,true);
  edgeMat.color.set('#858c88');
  const metal=new THREE.MeshStandardMaterial({color:'#d5d9d6',metalness:1,roughness:.16,bumpMap:plasticBump,bumpScale:.00012});
  function mesh(geo,mat,parent=badge,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
  // True punched holes in the sleeve header, plus a thin extruded vinyl shell.
  const sleeveShape=roundedShape(2.72,4.36,.19);
  for(const x of [-.88,.88]) {const hole=new THREE.Path();hole.absarc(x,1.89,.104,0,Math.PI*2,true);sleeveShape.holes.push(hole);}
  const slot=roundedShape(.66,.13,.064); const slotPath=new THREE.Path();
  slot.getPoints(16).reverse().forEach((p,i)=>i?slotPath.lineTo(p.x,p.y+1.88):slotPath.moveTo(p.x,p.y+1.88)); sleeveShape.holes.push(slotPath);
  const sleeveGeo=new THREE.ExtrudeGeometry(sleeveShape,{depth:.008,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.005,bevelThickness:.004,curveSegments:16});
  const sleeve=mesh(sleeveGeo,plastic,badge,0,0,.045); sleeve.renderOrder=3;
  const rearFilm=mesh(new THREE.ShapeGeometry(sleeveShape,16),plastic,badge,0,0,.005);
  rearFilm.rotation.y=Math.PI;rearFilm.renderOrder=2;
  const wearMat=new THREE.MeshBasicMaterial({map:wearTexture,transparent:true,opacity:.65,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const wear=mesh(new THREE.PlaneGeometry(2.52,3.87),wearMat,badge,0,-.12,.061);wear.renderOrder=4;
  function outline(w,h,r,z,radius=.015,mat=edgeMat,y=0){
    const pts=roundedShape(w,h,r).getPoints(24).map(p=>V(p.x,p.y+y,z)); if(pts[0].distanceTo(pts.at(-1))<.0001)pts.pop();
    pts.forEach((p,i)=>{p.z+=.002*Math.sin(i*1.7)+.0015*Math.sin(i*.47);});
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),220,radius,10,true),mat);
  }
  outline(2.72,4.36,.19,.032,.012); outline(2.58,4.2,.15,.05,.007);
  outline(.66,.13,.064,.053,.006,edgeMat,1.88);
  for(const x of [-.88,.88]) mesh(new THREE.TorusGeometry(.109,.013,8,40),edgeMat,badge,x,1.89,.053);
  // Parallel heat-sealed zipper ridges catch narrow specular highlights.
  for(let i=0;i<4;i++){
    const points=Array.from({length:38},(_,j)=>{
      const x=-1.275+j/37*2.55;
      return V(x,1.55+i*.032+.002*Math.sin(j*.81+i),.056+.002*Math.sin(j*.69+i*2));
    });
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),90,.010+i*.0008,8,false),edgeMat);
  }
  // Small trapped bubbles in the heat seal, differing in size and depth.
  const bubbleMat=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.015,transmission:1,thickness:.008,ior:1.1});
  for(let i=0;i<19;i++){
    const x=Math.sin(i*47.31)*1.17,y=1.565+(.5+.5*Math.sin(i*29.9))*.083;
    const bubble=mesh(new THREE.SphereGeometry(.004+(i%5)*.0017,10,6),bubbleMat,badge,x,y,.065);
    bubble.scale.set(1.8,.65,.4);
  }
  const paperMat=new THREE.MeshStandardMaterial({color:'#efebdf',roughness:.88});
  const paper=mesh(new RoundedBoxGeometry(2.40,3.52,.025,3,.019),paperMat,badge,0,-.30,.025);paper.castShadow=true;
  // Keep the unfiltered artwork's sRGB colors independent of studio lighting
  // and filmic tone mapping; the sleeve still supplies reflections and depth.
  const frontMat=unlitArtwork
    ? new THREE.MeshBasicMaterial({toneMapped:false})
    : new THREE.MeshStandardMaterial({roughness:.84,metalness:0,bumpMap:plasticBump,bumpScale:.00015});
  mesh(new THREE.PlaneGeometry(2.39,3.505),frontMat,badge,0,-.30,.04);
  const backMat=new THREE.MeshStandardMaterial({color:'#eeeadf',roughness:.9});
  const back=mesh(new THREE.PlaneGeometry(2.39,3.505),backMat,badge,0,-.30,.009); back.rotation.y=Math.PI;
  const fabricMat=new THREE.MeshStandardMaterial({color:'#30382d',roughness:.9,bumpMap:fabricBump,bumpScale:.003});
  const hardware=createHardware(metal,fabricMat);
  scene.add(hardware.clasp,hardware.eye,hardware.yoke);
  const suspension=createSuspension(getSettings().physics);
  const {world,body,restY}=suspension;
  const ribbons=suspension.straps.map(strap=>{
    const ribbon=createRibbon(fabricMat);scene.add(ribbon.mesh);
    return {...ribbon,points:Array.from({length:strap.links.length+2},()=>V())};
  });
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(10,10),plane=new THREE.Plane(V(0,0,1),0);
  const target=V(),localGrab=V(),lastPointer=V(),point=V(); let havePointer=false,lastPointerTime=0,textureRequest=0;
  const loader=new THREE.TextureLoader();
  async function setCard(url){
    const request=++textureRequest; let texture=await loader.loadAsync(url);
    if(disposed||request!==textureRequest){texture.dispose();return;}
    // Ignore transparent export padding, then cover the printed insert.
    const image=texture.image;
    const artwork=document.createElement('canvas');artwork.width=image.width;artwork.height=image.height;
    const context=artwork.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
    const pixels=context.getImageData(0,0,image.width,image.height).data;
    let left=image.width,top=image.height,right=-1,bottom=-1;
    for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
      if(pixels[(y*image.width+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    }
    if(right<left){left=0;top=0;right=image.width-1;bottom=image.height-1;}
    artwork.width=right-left+1;artwork.height=bottom-top+1;
    // Transparent pixels within the artwork reveal white paper, never black.
    context.fillStyle='#ffffff';context.fillRect(0,0,artwork.width,artwork.height);
    context.drawImage(image,left,top,artwork.width,artwork.height,0,0,artwork.width,artwork.height);
    texture.dispose();texture=new THREE.CanvasTexture(artwork);
    const imageAspect=artwork.width/artwork.height,cardAspect=2.39/3.505;
    if(imageAspect>cardAspect)texture.repeat.x=cardAspect/imageAspect;
    else texture.repeat.y=imageAspect/cardAspect;
    texture.offset.set((1-texture.repeat.x)/2,(1-texture.repeat.y)/2);
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    frontMat.map?.dispose(); frontMat.map=texture;frontMat.needsUpdate=true;
  }
  try {await setCard(cardUrl);} catch(error){renderer.dispose();world.free();throw error;}
  function coordinates(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function hit(){return raycaster.intersectObject(paper,false)[0];}
  function pointerdown(e){
    if(e.button!==0||paused)return;coordinates(e);const h=hit();if(!h)return;
    dragging=true;activePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(V()),h.point);raycaster.ray.intersectPlane(plane,target);localGrab.copy(badge.worldToLocal(h.point.clone()));
    canvas.style.cursor='grabbing';onState('dragging');
  }
  function pointermove(e){
    if(activePointer!==null&&e.pointerId!==activePointer)return;
    coordinates(e);raycaster.ray.intersectPlane(plane,point);
    if(dragging){target.copy(point);target.x=THREE.MathUtils.clamp(target.x,-4.5,4.5);target.y=THREE.MathUtils.clamp(target.y,-3.5,5);return;}
    const h=hit();canvas.style.cursor=h&&!paused?'grab':'default';
    const now=performance.now();
    if(h&&havePointer&&!paused&&!reduced&&e.pointerType!=='touch'){
      const dt=Math.max((now-lastPointerTime)/1000,.016), settings=getSettings();
      const vx=THREE.MathUtils.clamp((point.x-lastPointer.x)/dt,-12,12),vy=THREE.MathUtils.clamp((point.y-lastPointer.y)/dt,-8,8);
      body.applyImpulseAtPoint(V(vx*.008*settings.physics.mouseForce,vy*.004*settings.physics.mouseForce,0),h.point,true);
    }
    lastPointer.copy(point);lastPointerTime=now;havePointer=true;
  }
  function release(e){if(activePointer!==null&&e&&e.pointerId!==activePointer)return;dragging=false;if(activePointer!==null&&canvas.hasPointerCapture(activePointer))canvas.releasePointerCapture(activePointer);activePointer=null;canvas.style.cursor='grab';onState(paused?'paused':'live');}
  function leave(){havePointer=false;if(!dragging)canvas.style.cursor='default';}
  canvas.addEventListener('pointerdown',pointerdown);canvas.addEventListener('pointermove',pointermove);canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',leave);
  function resize(){const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);filters.resize(width,height);camera.aspect=width/height;camera.fov=width<700?43:36;camera.position.z=width<700?Math.max(13.8,6.4/camera.aspect):13.8;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const q=new THREE.Quaternion(),force=V(),r=V(),velocity=V(),ang=V();

  function step(settings){
    suspension.update(settings.physics,reduced);
    const oldMass=settings.physics.mass;
    if(dragging){
      q.copy(body.rotation());r.copy(localGrab).applyQuaternion(q);const position=body.translation();
      velocity.copy(body.linvel());ang.copy(body.angvel());velocity.add(ang.cross(r));
      // Account for rotation at the grab point rather than damping it as if
      // the full badge mass were concentrated there. Use an implicit spring
      // to avoid alternating impulses when a corner is pulled against a joint.
      const effectiveMass=oldMass/(1+r.lengthSq()/.65);
      const stiffness=settings.physics.grip*effectiveMass;
      const damping=2*Math.sqrt(settings.physics.grip)*effectiveMass;
      const implicit=1+(damping*world.timestep+stiffness*world.timestep**2)/effectiveMass;
      force.copy(target).sub(V(position.x,position.y,position.z).add(r)).multiplyScalar(stiffness).addScaledVector(velocity,-damping).divideScalar(implicit);
      force.clampLength(0,110*oldMass);body.applyImpulseAtPoint(force.multiplyScalar(world.timestep),V(position.x,position.y,position.z).add(r),true);
    }
    world.step();
  }
  const clearanceLocal=V(),clearanceRotation=new THREE.Quaternion();
  function keepRibbonClear(point){
    let changed=false;
    clearanceLocal.copy(point).sub(badge.position).applyQuaternion(clearanceRotation);
    const limits=[1.47,2.30,.18],axes=['x','y','z'];
    if(axes.every((axis,i)=>Math.abs(clearanceLocal[axis])<limits[i])){
      let axisIndex=0;
      for(let i=1;i<3;i++)if(limits[i]-Math.abs(clearanceLocal[axes[i]])<limits[axisIndex]-Math.abs(clearanceLocal[axes[axisIndex]]))axisIndex=i;
      const axis=axes[axisIndex];clearanceLocal[axis]=(Math.sign(clearanceLocal[axis])||1)*limits[axisIndex];
      point.copy(clearanceLocal).applyQuaternion(badge.quaternion).add(badge.position);changed=true;
    }
    if(point.z<WALL_Z+.12){point.z=WALL_Z+.12;changed=true;}
    return changed;
  }
  function render(time){
    raf=0;if(disposed||document.hidden||!inView)return;raf=requestAnimationFrame(render);
    const settings=getSettings();if(paused!==settings.paused)setPaused(settings.paused);const dt=Math.min((time-(lastTime||time))/1000,.05);lastTime=time;
    if(!paused){accumulator+=dt;while(accumulator>=world.timestep){step(settings);accumulator-=world.timestep;}}
    badge.position.copy(body.translation());badge.quaternion.copy(body.rotation());badge.updateMatrixWorld(true);
    for(const name of ['clasp','eye','yoke']){
      hardware[name].position.copy(suspension[name].translation());hardware[name].quaternion.copy(suspension[name].rotation());hardware[name].updateMatrixWorld(true);
    }
    clearanceRotation.copy(badge.quaternion).invert();
    suspension.straps.forEach((strap,index)=>{
      const ribbon=ribbons[index],points=ribbon.points,count=strap.links.length;
      // Render only the simulated chain. Extrapolating above a nearby anchor
      // created a sharp fold in the visible strap when the first link buckled.
      points[0].copy(strap.anchorPosition);
      strap.links.slice(0,-1).forEach((link,i)=>points[i+1].copy(link.translation()));
      points[count].copy(hardware.yoke.localToWorld(V(strap.attachment.x+Math.sign(strap.anchorPosition.x)*.025,strap.attachment.y+.055,strap.attachment.z)));
      points[count+1].copy(hardware.yoke.localToWorld(V().copy(strap.attachment)));
      ribbon.update(new THREE.CatmullRomCurve3(points),V(1,0,0).applyQuaternion(hardware.yoke.quaternion),dt,keepRibbonClear);
    });
    wearMat.opacity=settings.material.wear;filmUniforms.damage.value=settings.material.edgeDamage;plastic.roughness=settings.material.roughness;filmUniforms.clarity.value=settings.material.transmission;filmUniforms.thickness.value=settings.material.thickness;plastic.envMapIntensity=settings.lighting.reflections;edgeMat.envMapIntensity=settings.lighting.reflections;
    fabricMat.color.set(settings.material.strapColor);metal.roughness=settings.material.metalRoughness;
    renderer.toneMappingExposure=settings.lighting.exposure;key.intensity=settings.lighting.keyLight;wall.material.opacity=settings.lighting.shadow;
    const orbit=THREE.MathUtils.degToRad(settings.view.angle);
    const distance=(canvas.clientWidth<700?Math.max(13.8,6.4/camera.aspect):13.8)/settings.view.zoom;
    camera.position.set(Math.sin(orbit)*distance,.8,Math.cos(orbit)*distance);camera.lookAt(0,.8,0);
    // Composite an unfiltered backdrop beneath the transparent canvas.
    // With transparency enabled, underlying HTML supplies the backdrop.
    const background=settings.background;
    canvas.style.backgroundColor=background.transparent?'transparent':background.color;
    if(background.filterBackground&&!background.transparent){
      if(!scene.background)scene.background=new THREE.Color();
      scene.background.set(background.color);
    }else scene.background=null;
    filmUniforms.filtered.value=settings.filters.enabled||settings.plotter.enabled;
    filters.render(settings.filters,settings.plotter);
  }
  function reset(){release();suspension.reset();ribbons.forEach(r=>r.reset());accumulator=0;}
  function nudge(){if(paused)return;body.applyImpulseAtPoint(V(reduced?.3:1.4,0,.1),V(0,restY-.7,.06),true);}
  function setPaused(value){paused=value;release();lastTime=0;accumulator=0;onState(paused?'paused':'live');}
  function visibility(){lastTime=0;accumulator=0;if(document.hidden||!inView){cancelAnimationFrame(raf);raf=0;release();}else if(!raf&&!disposed)raf=requestAnimationFrame(render);}
  const intersection=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;visibility();});intersection.observe(canvas);document.addEventListener('visibilitychange',visibility);
  if(!reduced)body.applyImpulseAtPoint(V(.4,0,.04),V(0,restY-.7,0),true);
  raf=requestAnimationFrame(render);onState('live');
  return {setCard,reset,nudge,setPaused,dispose(){disposed=true;textureRequest++;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();media.removeEventListener('change',mediaChange);document.removeEventListener('visibilitychange',visibility);for(const [name,fn] of [['pointerdown',pointerdown],['pointermove',pointermove],['pointerup',release],['pointercancel',release],['lostpointercapture',release],['pointerleave',leave]])canvas.removeEventListener(name,fn);const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());frontMat.map?.dispose();plasticBump.dispose();fabricBump.dispose();wearTexture.dispose();key.shadow.dispose();env.dispose();world.free();filters.dispose();renderer.dispose();}};
}
