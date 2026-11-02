import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Sheet layout, shared with Pinboard.svelte: FRAMES frames in a COLUMNS-wide
// grid, each FRAME px square, drawn at 3x the size it shows on the page.
export const FRAMES = 16, COLUMNS = 4, FRAME = 360;
// Rendered at this multiple and scaled down, for clean edges on the bevels.
const SUPERSAMPLE = 2;

export const PIN_COLORS = {
  orange: '#e8572a',
  blue: '#2a45d6',
  pink: '#e2467f',
  black: '#262626'
};

// A standard office push pin in mm, (radius, height) from the board up: thin
// base flange, waisted grip flaring under a flat cylindrical head. The tiny
// bevels keep the edges crisp, which is most of what makes it read as
// moulded plastic rather than a blob.
const PROFILE = [
  [0, 0], [3.9, 0], [4.05, .15], [4.05, .9], [3.85, 1.1],
  [2.45, 1.3], [2.15, 2.2], [2.05, 4.4], [2.2, 6.5], [2.85, 7.6],
  [4.85, 7.95], [5.12, 8.15], [5.25, 8.45], [5.25, 10.5], [5.14, 10.82],
  [4.8, 11.02], [4, 11.22], [2.6, 11.42], [0, 11.52]
];

// Pose at rest and fully lifted. tilt is how far the pin leans from pointing
// straight at the viewer; lean is the on-screen direction the head leans,
// 90° being straight up. lift is how far it is pulled out, in mm.
export const POSE = { rest: { tilt: 28, lean: 104 }, lifted: { tilt: 35, lean: 88 }, lift: 9 };

function softDisc(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,1)');
  gradient.addColorStop(.45, 'rgba(0,0,0,.55)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export async function renderPinSheets(pose = POSE) {
  const size = FRAME * SUPERSAMPLE;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;

  // Mostly lit by the room, which gives broad soft reflections; the key
  // light is there for the cast shadow and a little modelling.
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .85;

  // Close enough that pulling the pin toward the viewer visibly grows it,
  // the way it would in a photo; the frame still spans ~59mm.
  const camera = new THREE.PerspectiveCamera(36.5, 1, 10, 400);
  camera.position.set(0, 0, 90);

  // Warm key from the upper left like the badge, so shadows fall down-right.
  const key = new THREE.DirectionalLight('#fff4e4', 1.6);
  key.position.set(-30, 50, 70);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -.0004;
  key.shadow.blurSamples = 20;
  Object.assign(key.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 200 });
  scene.add(key);
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d4cc', .35));

  const board = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .2 }));
  board.receiveShadow = true;
  scene.add(board);
  // Contact shadow where the flange meets the board; it lets go as the pin
  // comes out, which is what sells the pin leaving the surface.
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: softDisc(), transparent: true, depthWrite: false, opacity: .3 }));
  contact.position.set(.6, -.6, .02);
  scene.add(contact);
  // The hole the needle leaves behind, hidden under the pin at rest.
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.62, 32), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .55, depthWrite: false }));
  hole.position.z = .01;
  scene.add(hole);

  // Anything behind the board is inside it, so it is clipped away: the
  // needle slides out of the hole rather than appearing.
  const cork = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
  const plasticGeometry = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 160).rotateX(Math.PI / 2);
  const plastic = new THREE.MeshPhysicalMaterial({ roughness: .34, clearcoat: .45, clearcoatRoughness: .12, specularIntensity: .55, ior: 1.46, clippingPlanes: cork });
  const needleGeometry = new THREE.LatheGeometry([[0, -9], [.1, -8.7], [.44, -7.6], [.44, .2], [0, .2]].map(([r, y]) => new THREE.Vector2(r, y)), 48).rotateX(Math.PI / 2);
  const steel = new THREE.MeshStandardMaterial({ color: '#cfd3d6', metalness: 1, roughness: .22, clippingPlanes: cork });

  const pin = new THREE.Group();
  const head = new THREE.Mesh(plasticGeometry, plastic);
  const needle = new THREE.Mesh(needleGeometry, steel);
  head.castShadow = needle.castShadow = true;
  pin.add(head, needle);
  scene.add(pin);

  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const sheets = [];
  for (const [name, color] of Object.entries(PIN_COLORS)) {
    plastic.color.set(color);
    const sheet = document.createElement('canvas');
    sheet.width = FRAME * COLUMNS;
    sheet.height = FRAME * Math.ceil(FRAMES / COLUMNS);
    const context = sheet.getContext('2d');
    context.imageSmoothingQuality = 'high';
    for (let frame = 0; frame < FRAMES; frame++) {
      // Lift is spaced evenly across frames so the page's easing sets the
      // timing; the wobble eases within that so it lags the pull a little.
      const t = frame / (FRAMES - 1);
      const lean = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(pose.rest.lean, pose.lifted.lean, ease(t)));
      const tilt = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(pose.rest.tilt, pose.lifted.tilt, ease(t)));
      pin.quaternion.setFromAxisAngle(new THREE.Vector3(-Math.sin(lean), Math.cos(lean), 0), tilt);
      // Pulled out along its own axis, as a pin is.
      pin.position.copy(new THREE.Vector3(0, 0, pose.lift * t).applyQuaternion(pin.quaternion));
      key.shadow.radius = 4 + 8 * t;
      board.material.opacity = .22 - .06 * t;
      contact.material.opacity = .32 * (1 - t) ** 2;
      renderer.render(scene, camera);
      context.drawImage(renderer.domElement, (frame % COLUMNS) * FRAME, Math.floor(frame / COLUMNS) * FRAME, FRAME, FRAME);
    }
    sheets.push({ name, url: sheet.toDataURL('image/png') });
  }
  renderer.dispose();
  return sheets;
}
