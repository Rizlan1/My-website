import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('gl');
const mobile = matchMedia('(max-width: 820px)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  window.__glReady?.(); throw e; // CSS gradient fallback stays visible
}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07070b, 0.055);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(mobile ? 50 : 38, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);

/* ---------- Lights ---------- */
scene.add(new THREE.AmbientLight(0x2a1a22, 0.6));
const key = new THREE.PointLight(0xff8a4c, 22, 30); key.position.set(4, 3, 5); scene.add(key);
const rim = new THREE.PointLight(0x4ff0d0, 14, 30); rim.position.set(-5, -2, -3); scene.add(rim);
const top = new THREE.PointLight(0xe8c15a, 8, 20); top.position.set(0, 6, 2); scene.add(top);

/* ---------- Barber pole ---------- */
const pole = new THREE.Group();
pole.scale.setScalar(mobile ? 0.62 : 0.72);
scene.add(pole);

const stripeMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uSpeed: { value: 1 } },
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vView;
    void main(){ vUv=uv; vN=normalize(normalMatrix*normal);
      vec4 mv=modelViewMatrix*vec4(position,1.); vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vView;
    void main(){
      float s = fract(vUv.x*3.0 + vUv.y*2.4 - uTime*0.35);
      vec3 bone=vec3(.95,.90,.82), copper=vec3(1.0,.45,.18), ox=vec3(.42,.06,.10);
      vec3 c = s<.33 ? copper : (s<.5 ? bone : (s<.83 ? ox : bone));
      float edge = smoothstep(0.,.02,abs(fract(s*3.)-.5)-.47);
      float fres = pow(1.-max(dot(vN,vView),0.),2.);
      c = c*(0.55+0.6*max(dot(vN,normalize(vec3(.6,.5,.7))),0.)) + fres*vec3(1.,.55,.3)*.35;
      c *= 0.75 + (s<.33?0.25:0.);   // copper catches a little bloom
      gl_FragColor=vec4(c,1.);
    }`
});
const core = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.2, 96, 1, true), stripeMat);
pole.add(core);

const glass = new THREE.Mesh(
  new THREE.CylinderGeometry(0.78, 0.78, 4.3, 96, 1, true),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.4, ior: 1.4, transparent: true, opacity: 0.12, envMapIntensity: 0.6, clearcoat: 1 })
);
pole.add(glass);

const chrome = new THREE.MeshStandardMaterial({ color: 0xd8c3a5, metalness: 1, roughness: 0.18, envMapIntensity: 0.9 });
const brass = new THREE.MeshStandardMaterial({ color: 0xc9894e, metalness: 1, roughness: 0.28, envMapIntensity: 0.8 });
const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.32, 64), chrome); capTop.position.y = 2.3; pole.add(capTop);
const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), brass); dome.position.y = 2.46; pole.add(dome);
const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), chrome); finial.position.y = 3.15; pole.add(finial);
const capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.32, 64), chrome); capBot.position.y = -2.3; pole.add(capBot);
const cone = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.8, 64), brass); cone.position.y = -2.85; cone.rotation.x = Math.PI; pole.add(cone);
[2.05, -2.05].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.045, 16, 96), brass); r.rotation.x = Math.PI / 2; r.position.y = y; pole.add(r); });

/* ---------- Orbit rings (light trails) ---------- */
const rings = new THREE.Group(); scene.add(rings);
const ringMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.006, 8, 256), ringMat(0xff6a3d)); r1.rotation.set(1.2, 0.2, 0); rings.add(r1);
const r2 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.004, 8, 256), ringMat(0x4ff0d0)); r2.rotation.set(1.5, -0.4, 0.3); rings.add(r2);
const r3 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.003, 8, 256), ringMat(0xe8c15a)); r3.rotation.set(1.0, 0.6, -0.2); rings.add(r3);

/* ---------- Straight razor ---------- */
function razor() {
  const g = new THREE.Group();
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0); bladeShape.lineTo(2.1, 0); bladeShape.quadraticCurveTo(2.45, 0.05, 2.4, 0.45);
  bladeShape.lineTo(0.15, 0.55); bladeShape.quadraticCurveTo(-0.05, 0.4, 0, 0);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2 }),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 1, roughness: 0.12, envMapIntensity: 1.0 }));
  const hShape = new THREE.Shape();
  hShape.moveTo(0, 0); hShape.lineTo(-2.6, 0.08); hShape.quadraticCurveTo(-2.85, 0.28, -2.6, 0.5); hShape.lineTo(0, 0.55); hShape.quadraticCurveTo(0.12, 0.27, 0, 0);
  const handle = new THREE.Mesh(new THREE.ExtrudeGeometry(hShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }),
    new THREE.MeshPhysicalMaterial({ color: 0x3a1410, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 }));
  handle.position.z = -0.045;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 24), brass); pin.rotation.x = Math.PI / 2; pin.position.set(0.05, 0.27, 0.015);
  const pivot = new THREE.Group(); pivot.add(blade); blade.position.set(-0.05, -0.27, 0);
  pivot.position.set(0.05, 0.27, 0);
  g.add(handle, pin, pivot);
  g.userData.pivot = pivot;
  return g;
}
const rz = razor(); rz.scale.setScalar(0.62); rz.position.set(2.9, -1.1, 1.2); scene.add(rz);

/* ---------- Scissors (simple) ---------- */
function scissors() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xe9d7b8, metalness: 1, roughness: 0.2, envMapIntensity: 1.0 });
  const half = (flip) => {
    const h = new THREE.Group();
    const bs = new THREE.Shape(); bs.moveTo(0, 0); bs.lineTo(2.0, 0.04 * flip); bs.lineTo(0, 0.16 * flip); bs.lineTo(0, 0);
    const b = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.04, bevelEnabled: false }), mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 16, 48), mat); ring.position.set(-0.75, -0.28 * flip, 0.02);
    const shank = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.05), mat); shank.position.set(-0.32, -0.12 * flip, 0.02); shank.rotation.z = 0.45 * flip;
    h.add(b, ring, shank); return h;
  };
  const a = half(1), b = half(-1); b.position.z = 0.05;
  g.add(a, b); g.userData = { a, b };
  return g;
}
const sc = scissors(); sc.scale.setScalar(0.6); sc.position.set(-3.0, 1.3, 0.6); scene.add(sc);

/* ---------- Hair clippings / embers ---------- */
const COUNT = mobile ? 900 : 2600;
const pos = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT), col = new Float32Array(COUNT * 3);
const palette = [new THREE.Color(0xff6a3d), new THREE.Color(0xe8c15a), new THREE.Color(0xefe7da), new THREE.Color(0x4ff0d0)];
for (let i = 0; i < COUNT; i++) {
  const r = 2 + Math.random() * 9, a = Math.random() * Math.PI * 2;
  pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * 16; pos[i * 3 + 2] = Math.sin(a) * r - 2;
  seed[i] = Math.random();
  const c = palette[Math.random() < 0.08 ? 3 : Math.floor(Math.random() * 3)]; col.set([c.r, c.g, c.b], i * 3);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
pGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
  vertexShader: `attribute float aSeed; attribute vec3 aColor; uniform float uTime; uniform float uScroll; uniform float uPx; varying vec3 vC; varying float vA;
    void main(){ vec3 p=position; float t=uTime*(.15+aSeed*.25);
      p.y = mod(p.y - t - uScroll*6. + 8., 16.) - 8.;
      p.x += sin(t*2.+aSeed*20.)*.35; p.z += cos(t*1.7+aSeed*13.)*.35;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
      gl_PointSize = (4.+aSeed*10.)*uPx/ -mv.z; vC=aColor; vA=.35+.65*fract(aSeed*7.3+uTime*.2*aSeed); }`,
  fragmentShader: `varying vec3 vC; varying float vA;
    void main(){ vec2 d=gl_PointCoord-.5; float l=length(d); if(l>.5) discard; gl_FragColor=vec4(vC, (1.-l*2.)*vA); }`
});
scene.add(new THREE.Points(pGeo, pMat));

/* ---------- Post ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), mobile ? 0.35 : 0.5, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- Interaction ---------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { mouse.tx = (e.clientX / innerWidth - 0.5) * 2; mouse.ty = (e.clientY / innerHeight - 0.5) * 2; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
let sm = 0, visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
const baseX = mobile ? 0 : 2.2;

function tick() {
  requestAnimationFrame(tick);
  if (!visible) return;
  const t = reduce ? 0 : clock.getElapsedTime();
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const s = scrollY / max; sm += (s - sm) * 0.06;
  const hero = Math.min(1, scrollY / innerHeight);
  mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;

  stripeMat.uniforms.uTime.value = t * (1 + hero * 2);
  pMat.uniforms.uTime.value = t; pMat.uniforms.uScroll.value = sm;

  // pole drifts right on desktop hero, then recedes & tilts through the page
  pole.position.x = baseX * (1 - hero * 0.4) + Math.sin(sm * Math.PI * 2) * 0.8;
  pole.position.y = Math.sin(t * 0.6) * 0.12 - hero * 0.6;
  pole.position.z = -sm * 6;
  pole.rotation.y = t * 0.25 + sm * Math.PI * 4 + mouse.x * 0.3;
  pole.rotation.z = -0.18 + sm * 0.9 + mouse.x * -0.05;
  pole.rotation.x = mouse.y * 0.12;
  rings.position.copy(pole.position); rings.scale.setScalar(pole.scale.x * 1.1);
  rings.rotation.y = t * 0.08; rings.rotation.z = sm * 2;
  r1.rotation.z = t * 0.4; r2.rotation.z = -t * 0.3; r3.rotation.z = t * 0.2;

  rz.position.x = pole.position.x + 0.9 + Math.cos(t * 0.3) * 0.4;
  rz.position.y = -1.2 + Math.sin(t * 0.5) * 0.3 + sm * 3;
  rz.rotation.set(0.3 + mouse.y * 0.2, t * 0.4, 0.3 + Math.sin(t * 0.3) * 0.2);
  rz.userData.pivot.rotation.z = -Math.PI * 0.85 * (1 - Math.min(1, hero * 1.4)) - 0.05; // razor opens as you scroll
  sc.position.x = pole.position.x - (mobile ? 2.2 : 4.4) + Math.sin(t * 0.4) * 0.3;
  sc.position.y = 1.5 + Math.cos(t * 0.45) * 0.3 - sm * 3;
  sc.rotation.set(0.6, t * 0.35, -0.4 + mouse.x * 0.2);
  const snip = Math.abs(Math.sin(t * 1.4)) * 0.35;
  sc.userData.a.rotation.z = snip; sc.userData.b.rotation.z = -snip;

  camera.position.x = mouse.x * 0.5; camera.position.y = -mouse.y * 0.35 - sm * 1.5;
  camera.lookAt(0, -sm * 1.5, 0);
  key.position.x = 4 + Math.sin(t * 0.5) * 2;
  scene.fog.density = 0.05 + sm * 0.06;
  composer.render();
}
tick();
window.__glReady?.();
