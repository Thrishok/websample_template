/* ============================================================
   Ambient Three.js scene
   - golden particle field
   - subtle camera parallax tied to mouse + scroll
   - cheap, GPU-friendly, full-screen background
   ============================================================ */
import * as THREE from 'three';

const canvas = document.getElementById('bg-canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene  = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0c0a08, 0.06);

/* theme palettes */
const THEMES = {
  dark:  { fog: 0x0c0a08, near: 0xd4a86a, far: 0xc8b896, density: 0.06 },
  light: { fog: 0xf5efe4, near: 0xa76a2a, far: 0x94836e, density: 0.045 }
};

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

/* ----- particle field ----- */
const COUNT  = 1800;
const RADIUS = 14;

const positions = new Float32Array(COUNT * 3);
const speeds    = new Float32Array(COUNT);
const offsets   = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++){
  const r     = Math.pow(Math.random(), 0.6) * RADIUS;
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);

  positions[i*3 + 0] = r * Math.sin(phi) * Math.cos(theta);
  positions[i*3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
  positions[i*3 + 2] = r * Math.cos(phi) - 4;

  speeds[i]  = 0.05 + Math.random() * 0.25;
  offsets[i] = Math.random() * Math.PI * 2;
}

const geom = new THREE.BufferGeometry();
geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

/* round soft sprite */
const spriteCanvas = document.createElement('canvas');
spriteCanvas.width = spriteCanvas.height = 64;
const sctx = spriteCanvas.getContext('2d');
const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
grad.addColorStop(0,    'rgba(231,200,150,1)');
grad.addColorStop(0.35, 'rgba(212,168,106,0.55)');
grad.addColorStop(1,    'rgba(212,168,106,0)');
sctx.fillStyle = grad;
sctx.fillRect(0, 0, 64, 64);
const sprite = new THREE.CanvasTexture(spriteCanvas);

const mat = new THREE.PointsMaterial({
  size: 0.085,
  map: sprite,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: 0xd4a86a
});

const points = new THREE.Points(geom, mat);
scene.add(points);

/* ----- a slow second layer for depth ----- */
const farPos = new Float32Array(600 * 3);
for (let i = 0; i < 600; i++){
  farPos[i*3 + 0] = (Math.random() - 0.5) * 60;
  farPos[i*3 + 1] = (Math.random() - 0.5) * 30;
  farPos[i*3 + 2] = -20 - Math.random() * 30;
}
const farGeom = new THREE.BufferGeometry();
farGeom.setAttribute('position', new THREE.BufferAttribute(farPos, 3));
const farMat = new THREE.PointsMaterial({
  size: 0.05,
  map: sprite,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: 0xc8b896,
  opacity: 0.35
});
const farPoints = new THREE.Points(farGeom, farMat);
scene.add(farPoints);

/* ----- theme sync (called now and on every toggle) ----- */
function applyTheme(name){
  const p = THEMES[name] || THEMES.dark;
  scene.fog.color.setHex(p.fog);
  scene.fog.density = p.density;
  mat.color.setHex(p.near);
  farMat.color.setHex(p.far);
}
window.addEventListener('theme-change', (e) => {
  applyTheme(e.detail && e.detail.theme);
});
applyTheme(document.body.classList.contains('light') ? 'light' : 'dark');

/* ----- pointer + scroll tracking ----- */
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('mousemove', (e) => {
  pointer.tx = (e.clientX / window.innerWidth)  * 2 - 1;
  pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

/* ----- resize ----- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

/* ----- animate ----- */
const clock = new THREE.Clock();
const posAttr = geom.getAttribute('position');

function tick(){
  const t  = clock.getElapsedTime();
  const dt = clock.getDelta();

  pointer.x += (pointer.tx - pointer.x) * 0.04;
  pointer.y += (pointer.ty - pointer.y) * 0.04;

  /* gently drift each particle on Y, subtle radial swirl */
  for (let i = 0; i < COUNT; i++){
    const ix = i * 3;
    posAttr.array[ix + 1] += Math.sin(t * speeds[i] + offsets[i]) * 0.0025;
  }
  posAttr.needsUpdate = true;

  points.rotation.y    = t * 0.04 + pointer.x * 0.25;
  points.rotation.x    = pointer.y * 0.15;
  farPoints.rotation.y = t * 0.015;

  /* depth tied to scroll — subtle dolly */
  camera.position.z = 8 + Math.min(scrollY, 4000) * 0.0015;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
