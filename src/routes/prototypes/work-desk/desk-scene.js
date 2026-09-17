import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSceneFilters } from '$lib/badge/scene-filters.js';
import { badgeSettings } from '$lib/badge/settings.js';

import { screenLayout, tiles } from './layout.js';

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');canvas.width = width;canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function loadImage(url) {
  return new Promise((resolve, reject) => { const image = new Image();image.onload = () => resolve(image);image.onerror = reject;image.src = url; });
}
function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale, sh = height / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, width, height);
}

export async function createDeskScene(canvas, projects, onScreenTransform) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Geometry and lights are static: camera parallax can reuse the shadow map.
  renderer.shadowMap.autoUpdate = false;renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const lookAt = new THREE.Vector3(0, 2.6, .2);
  const cursor = new THREE.Vector2(), targetCursor = new THREE.Vector2();
  let cameraDistance = 15.7, lastTime = 0, visible = true, intersection;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const stage = canvas.parentElement;
  const filters = createSceneFilters(renderer, scene, camera);
  const textures = new Set(), materials = new Set(), geometries = new Set();
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);scene.environment = environment.texture;
  scene.environmentIntensity = .6;room.dispose();pmrem.dispose();
  let disposed = false, frame = 0, observer;
  function material(options) { const mat = new THREE.MeshStandardMaterial(options);materials.add(mat);return mat; }
  function mesh(geometry, mat, position, parent = scene) {
    geometries.add(geometry);const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);object.castShadow = true;object.receiveShadow = true;parent.add(object);return object;
  }
  function box(w, h, d, radius, mat, position, parent) {
    return mesh(new RoundedBoxGeometry(w, h, d, 3, radius), mat, position, parent);
  }
  const silver = material({ color: '#adb8c8', metalness: .9, roughness: .22 });
  const dark = material({ color: '#131416', metalness: .35, roughness: .3 });
  const white = material({ color: '#edf1f6', roughness: .46 });
  const light = new THREE.DirectionalLight('#e7efff', 2.8);light.position.set(-5, 10, 8);light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);Object.assign(light.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: .1, far: 35 });
  light.shadow.normalBias = .035;light.shadow.bias = -.0002;scene.add(light);
  const fill = new THREE.DirectionalLight('#dae7ff', 1.1);fill.position.set(6, 5, 4);scene.add(fill);
  scene.add(new THREE.AmbientLight('#f1f5ff', .55));

  // Cool matte desktop extends toward the viewer; its front edge crops the frame.
  const desk = material({ color: '#c9d1dc', roughness: .65, metalness: .08 });
  box(21, .32, 8.2, .09, desk, [0, -.19, 1.7]);
  const leg = material({ color: '#aeb9c9', roughness: .45, metalness: .45 });
  box(.28, 4, .4, .04, leg, [-8, -2.1, 4.6]);box(.28, 4, .4, .04, leg, [8, -2.1, 4.6]);

  // Thin aluminum enclosure, uniform black bezel and a gently tilted display.
  const monitor = new THREE.Group();monitor.position.y = screenLayout.y;
  monitor.rotation.x = -.055;scene.add(monitor);
  box(8.78, 5.12, .28, .075, silver, [0, 0, -.065], monitor);
  box(8.73, 5.07, .025, .06, dark, [0, 0, .089], monitor);
  const stand = box(1.65, 2.05, .12, .025, silver, [0, 1.02, -.24]);stand.rotation.x = -.19;
  box(2.85, .09, 2.05, .04, silver, [0, .045, .57]);
  // Rounded hinge where the aluminum support meets the back of the enclosure.
  const hinge = mesh(new THREE.CylinderGeometry(.14, .14, 1.5, 40), silver, [0, 2.01, -.42]);hinge.rotation.z = Math.PI / 2;
  const lens = material({ color: '#050c19', metalness: .65, roughness: .18 });
  const cameraLens = mesh(new THREE.CylinderGeometry(.028, .028, .008, 20), lens, [0, 2.45, .109], monitor);cameraLens.rotation.x = Math.PI / 2;

  // Notebook and pen sit independently on the left of the desk.
  const notebook = new THREE.Group();notebook.position.set(-4.9, .08, 2.15);notebook.rotation.y = -.2;scene.add(notebook);
  const cover = material({ color: '#34455e', roughness: .85 });
  box(2.4, .14, 2.95, .04, cover, [0, .01, 0], notebook);
  box(2.29, .095, 2.8, .018, white, [.02, .11, 0], notebook);
  const paper = canvasTexture(600, 800, (ctx, w, h) => {
    ctx.fillStyle = '#f0f3f7';ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#a3afc0';ctx.lineWidth = 4;
    for (let y = 160; y < h - 50; y += 48) { ctx.beginPath();ctx.moveTo(50, y);ctx.lineTo(w - 45, y);ctx.stroke(); }
    ctx.fillStyle = '#293c59';ctx.font = 'italic 52px Georgia';ctx.fillText('Make it matter.', 55, 103);
    ctx.font = '32px Georgia';ctx.fillText('A few things to make', 85, 202);ctx.fillText('something worth using.', 85, 247);
    ctx.strokeStyle = '#576d8a';ctx.lineWidth = 3;
    for (const y of [184, 330, 426]) { ctx.strokeRect(48, y, 17, 17); }
    ctx.beginPath();ctx.moveTo(48, 188);ctx.lineTo(56, 197);ctx.lineTo(71, 178);ctx.stroke();
    ctx.strokeRect(90, 360, 165, 95);ctx.strokeRect(280, 360, 220, 95);
    ctx.beginPath();ctx.moveTo(95, 580);ctx.bezierCurveTo(210, 540, 240, 630, 380, 563);ctx.stroke();
  });textures.add(paper);
  const paperMat = new THREE.MeshBasicMaterial({ map: paper, toneMapped: false });materials.add(paperMat);
  const paperPlane = mesh(new THREE.PlaneGeometry(2.26, 2.77), paperMat, [.02, .164, 0], notebook);paperPlane.rotation.x = -Math.PI / 2;
  const pen = new THREE.Group();pen.position.set(-6.55, .16, 2.1);pen.rotation.y = -.32;scene.add(pen);
  const barrel = mesh(new THREE.CylinderGeometry(.065, .065, 2.2, 20), dark, [0, 0, 0], pen);barrel.rotation.x = Math.PI / 2;
  const tip = mesh(new THREE.ConeGeometry(.066, .25, 20), silver, [0, 0, 1.22], pen);tip.rotation.x = Math.PI / 2;
  box(.025, .03, .6, .009, silver, [.045, .065, -.66], pen);

  // Glazed cup with a real rim, inset coffee surface, handle, and saucer.
  const mug = new THREE.Group();mug.position.set(5, .035, 2.2);scene.add(mug);
  mesh(new THREE.CylinderGeometry(.96, .86, .075, 64), white, [0, .04, 0], mug);
  const profile = [[.48, .08], [.55, .13], [.62, .9], [.63, 1.12], [.59, 1.17], [.55, 1.12], [.54, .24], [.45, .19]].map(([x,y]) => new THREE.Vector2(x,y));
  mesh(new THREE.LatheGeometry(profile, 64), white, [0, 0, 0], mug);
  const coffee = material({ color: '#28180e', roughness: .24, metalness: .08 });
  mesh(new THREE.CylinderGeometry(.548, .548, .015, 64), coffee, [0, 1.02, 0], mug);
  const handle = mesh(new THREE.TorusGeometry(.37, .095, 12, 40), white, [.73, .64, 0], mug);handle.scale.x = .78;

  // Project all four corners into a CSS homography. A bounding rectangle would
  // drift away from the screen as soon as the perspective camera moves.
  const projected = Array.from({ length: 4 }, () => new THREE.Vector3());
  function syncScreen() {
    const { width, height, z } = screenLayout;
    const corners = [[-width/2,height/2], [width/2,height/2], [width/2,-height/2], [-width/2,-height/2]];
    monitor.updateMatrixWorld(true);
    const points = corners.map(([x,y], i) => {
      const p = projected[i].set(x,y,z).applyMatrix4(monitor.matrixWorld).project(camera);
      return { x: (p.x+1)*canvas.clientWidth/2, y: (1-p.y)*canvas.clientHeight/2 };
    });
    const [p0,p1,p2,p3] = points;
    const dx1=p1.x-p2.x, dx2=p3.x-p2.x, dx3=p0.x-p1.x+p2.x-p3.x;
    const dy1=p1.y-p2.y, dy2=p3.y-p2.y, dy3=p0.y-p1.y+p2.y-p3.y;
    const denominator=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/denominator, h=(dx1*dy3-dx3*dy1)/denominator;
    const a=p1.x-p0.x+g*p1.x, b=p3.x-p0.x+h*p3.x;
    const d=p1.y-p0.y+g*p1.y, e=p3.y-p0.y+h*p3.y;
    const w=1000, ht=w*height/width;
    onScreenTransform(`matrix3d(${[a/w,d/w,0,g/w,b/ht,e/ht,0,h/ht,0,0,1,0,p0.x,p0.y,0,1].join(',')})`);
  }
  function positionCamera() {
    camera.position.set(-1.8+cursor.x*.95, 6.1-cursor.y*.55, cameraDistance);
    camera.lookAt(lookAt);camera.updateMatrixWorld();syncScreen();
  }
  function draw() { positionCamera();filters.render(badgeSettings.filters, badgeSettings.plotter); }
  function render(time) {
    frame=0;if(disposed||!visible||document.hidden)return;
    const dt=Math.min((time-(lastTime||time-16))/1000,.05);lastTime=time;
    // Exponential damping is interruptible and independent of display refresh rate.
    const alpha=1-Math.exp(-dt*9);
    if(reduced.matches)cursor.set(0,0);else cursor.lerp(targetCursor,alpha);
    if(cursor.distanceTo(targetCursor)<.001)cursor.copy(targetCursor);
    draw();
    if(!reduced.matches&&cursor.distanceTo(targetCursor)>.001)frame=requestAnimationFrame(render);
    else lastTime=0;
  }
  function wake() { if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(render); }
  function pointermove(event) {
    if(reduced.matches||!finePointer.matches||event.pointerType==='touch')return;
    const rect=canvas.getBoundingClientRect();
    targetCursor.set(THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1));wake();
  }
  function resetPointer() { targetCursor.set(0,0);wake(); }
  function visibilityChange() { cancelAnimationFrame(frame);frame=0;lastTime=0;if(!document.hidden)wake(); }
  function resize() {
    if(disposed)return;
    const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;
    camera.aspect=width/height;cameraDistance=Math.max(15.7,15.7*1.55/camera.aspect);
    camera.updateProjectionMatrix();renderer.setSize(width,height,false);filters.resize(width,height);
    draw();wake();
  }
  function dispose() {
    disposed=true;cancelAnimationFrame(frame);observer?.disconnect();intersection?.disconnect();
    stage.removeEventListener('pointermove',pointermove);stage.removeEventListener('pointerleave',resetPointer);
    reduced.removeEventListener('change',resetPointer);document.removeEventListener('visibilitychange',visibilityChange);
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    light.shadow.dispose();environment.dispose();filters.dispose();renderer.dispose();
  }
  try {
    const images = await Promise.all(projects.map(project => loadImage(project.images[0])));
    const screen = canvasTexture(1800, 1012, (ctx, w, h) => {
      ctx.fillStyle = '#e8edf4';ctx.fillRect(0, 0, w, h);
      tiles.forEach((tile, index) => {
        const x = tile.x * w, y = tile.y * h, tw = tile.w * w, th = tile.h * h;
        ctx.save();ctx.beginPath();ctx.roundRect(x, y, tw, th, 20);ctx.clip();
        ctx.fillStyle = ['#e3e2fa', '#fff7a2', '#e0e8dd'][index];ctx.fillRect(x, y, tw, th);
        drawCover(ctx, images[index], x, y, tw, th);
        // Reserve quiet space for the crisp, accessible project labels.
        const gradient = ctx.createLinearGradient(0, y + th * .52, 0, y + th);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');gradient.addColorStop(1, 'rgba(0,0,0,.5)');ctx.fillStyle = gradient;ctx.fillRect(x, y, tw, th);
        ctx.restore();
      });
    });textures.add(screen);
    const screenMat = new THREE.MeshBasicMaterial({ map: screen, toneMapped: false });materials.add(screenMat);
    const display = mesh(new THREE.PlaneGeometry(screenLayout.width, screenLayout.height), screenMat, [0, 0, screenLayout.z], monitor);display.castShadow = false;display.receiveShadow = false;
    stage.addEventListener('pointermove',pointermove);stage.addEventListener('pointerleave',resetPointer);
    reduced.addEventListener('change',resetPointer);document.addEventListener('visibilitychange',visibilityChange);
    intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;lastTime=0;}});intersection.observe(canvas);
    observer = new ResizeObserver(resize);observer.observe(canvas);resize();
    return { dispose };
  } catch (error) { dispose();throw error; }
}
