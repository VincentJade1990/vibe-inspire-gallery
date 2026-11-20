// Ideas 页气泡场：复用 Case 展示墙的着色器、调色板与漂浮参数
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

vec3 thinFilmIridescence(float cosTheta, float filmThickness) {
  float phase = filmThickness * sqrt(1.0 - cosTheta * cosTheta) * 3.14159;
  float r = 0.5 + 0.5 * cos(phase);
  float g = 0.5 + 0.5 * cos(phase - 2.094);
  float b = 0.5 + 0.5 * cos(phase - 4.189);
  return vec3(r, g, b);
}

void main() {
  vec3 viewDir = normalize(-vPosition);
  vec3 normal = normalize(vNormal);
  float ndotv = abs(dot(viewDir, normal));
  float fresnel = pow(1.0 - ndotv, 1.5);
  float fresnelSoft = pow(1.0 - ndotv, 0.8);
  float filmThickness = 6.0 + sin(uTime * 0.8) * 3.0 + sin(uTime * 1.3 + vUv.x * 6.28) * 1.5;
  vec3 irid = thinFilmIridescence(ndotv, filmThickness);
  vec3 filmColor = mix(uColor1, uColor2, irid.r);
  filmColor = mix(filmColor, uColor3, irid.g * 0.7);
  filmColor = mix(filmColor, vec3(0.9, 0.6, 0.3), irid.b * 0.4);
  vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
  vec3 reflectDir = reflect(-viewDir, normal);
  float envSpec = pow(max(dot(reflectDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.0);
  vec3 innerReflect = vec3(0.3, 0.2, 0.5) * (1.0 - fresnelSoft) * 0.15;
  vec3 color = vec3(0.0);
  color += filmColor * fresnel * 1.5;
  color += vec3(1.0, 0.95, 0.9) * spec * 2.0;
  color += vec3(0.7, 0.8, 1.0) * envSpec * 0.3;
  color += vec3(0.6, 0.3, 0.9) * fresnel * 0.25;
  color += innerReflect;
  float centerAlpha = fresnel * uOpacity + spec * 0.5 + 0.08;
  centerAlpha = clamp(centerAlpha, 0.0, 0.92);
  float rim = pow(1.0 - ndotv, 4.0);
  color += vec3(0.9, 0.85, 1.0) * rim * 0.4;
  gl_FragColor = vec4(color, centerAlpha);
}
`;

const PALETTES = [
  [[0.6, 0.2, 0.9], [0.95, 0.4, 0.7], [0.4, 0.6, 1.0]],
  [[0.2, 0.7, 0.95], [0.3, 0.9, 0.8], [0.1, 0.5, 0.9]],
  [[0.2, 0.85, 0.5], [0.5, 1.0, 0.3], [0.3, 0.7, 0.9]],
  [[0.95, 0.6, 0.2], [1.0, 0.4, 0.3], [0.9, 0.8, 0.3]],
  [[0.95, 0.3, 0.5], [1.0, 0.6, 0.7], [0.8, 0.3, 0.6]],
  [[0.5, 0.3, 0.8], [0.7, 0.5, 0.9], [0.9, 0.6, 0.8]],
  [[0.3, 0.6, 0.95], [0.5, 0.8, 1.0], [0.2, 0.9, 0.7]],
  [[1.0, 0.5, 0.4], [0.95, 0.7, 0.5], [1.0, 0.3, 0.5]],
  [[0.1, 0.9, 0.6], [0.3, 0.5, 0.9], [0.6, 0.9, 0.3]],
  [[0.9, 0.7, 0.2], [0.7, 0.5, 0.1], [1.0, 0.85, 0.4]]
];

const TAG_INDEX = {
  'AI应用': 0, '小程序': 1, 'Web应用': 2, '工具脚本': 3,
  'App': 4, '浏览器插件': 5, '设计工具': 6, '游戏': 7
};

let state = null;

// 固定种子，保证每次渲染的布局一致
function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function hashOf(str) {
  return String(str || '').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
}

function paletteFor(item, index) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  for (let i = 0; i < tags.length; i++) {
    if (TAG_INDEX[tags[i]] !== undefined) return PALETTES[TAG_INDEX[tags[i]]];
  }
  return PALETTES[(hashOf(item.id) + index) % PALETTES.length];
}

// 与展示墙一致：最多两行，超出省略
function wrapTitle(text, maxLen) {
  const clean = String(text || '').trim();
  const chars = Array.from(clean);
  const lines = [];
  let line = '';
  for (let i = 0; i < chars.length; i++) {
    line += chars[i];
    if (line.length >= maxLen) {
      lines.push(line);
      line = '';
      if (lines.length === 2) break;
    }
  }
  if (lines.length < 2 && line) lines.push(line);
  if (lines.length === 2 && lines.join('').length < clean.length) {
    lines[1] = lines[1].slice(0, -1) + '…';
  }
  return lines.slice(0, 2);
}

function destroy() {
  if (!state) return;
  cancelAnimationFrame(state.raf);
  if (state.resizeObserver) state.resizeObserver.disconnect();
  state.bubbles.forEach(function (b) {
    state.scene.remove(b.mesh);
    b.mesh.geometry.dispose();
    b.mesh.material.dispose();
  });
  state.renderer.dispose();
  if (state.renderer.domElement.parentNode) {
    state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
  }
  if (state.labelLayer.parentNode) state.labelLayer.parentNode.removeChild(state.labelLayer);
  state = null;
}

function mount(container, items, onSelect) {
  destroy();
  if (!container || !items || !items.length) return;

  let width = container.clientWidth;
  let height = container.clientHeight;
  if (width < 40 || height < 40) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
  camera.position.set(0, 0, 350);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.appendChild(renderer.domElement);

  const labelLayer = document.createElement('div');
  labelLayer.className = 'idea-bubble-labels';
  container.appendChild(labelLayer);

  const rand = seededRandom(20261120);
  const isMobile = width < 720;
  const maxCount = isMobile ? 14 : 26;
  const list = items.slice(0, maxCount);

  // 世界坐标与像素的换算，保证气泡铺满容器而不是挤在中间
  const pxPerUnit = (height / 2) / (Math.tan(Math.PI / 6) * 350);
  const marginX = isMobile ? 26 : 70;
  const marginY = isMobile ? 22 : 56;
  const xMin = -((width / 2) - marginX) / pxPerUnit;
  const xMax = ((width / 2) - marginX) / pxPerUnit;
  const yMin = -((height / 2) - marginY) / pxPerUnit;
  const yMax = ((height / 2) - marginY) / pxPerUnit;
  const areaW = xMax - xMin;
  const areaH = yMax - yMin;

  const cols = Math.max(1, Math.round(Math.sqrt(list.length * (areaW / areaH))));
  const rows = Math.ceil(list.length / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;

  // 气泡直径随格子大小自适应，保证文字放得下
  const cellPx = Math.min(cellW, cellH) * pxPerUnit;
  const radiusPx = Math.min(Math.max(cellPx * 0.34, 36), 82);
  const baseScaleFit = Math.min(Math.max((radiusPx / pxPerUnit) / 22, 1.15), 2.6);

  const points = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      points.push({ x: xMin + c * cellW + cellW / 2, y: yMin + r * cellH + cellH / 2 });
    }
  }
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = points[i]; points[i] = points[j]; points[j] = tmp;
  }

  const bubbles = [];
  list.forEach(function (item, index) {
    const baseScale = baseScaleFit * (0.94 + (index % 3) * 0.04 + rand() * 0.05);
    const palette = paletteFor(item, index);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Vector3(palette[0][0], palette[0][1], palette[0][2]) },
        uColor2: { value: new THREE.Vector3(palette[1][0], palette[1][1], palette[1][2]) },
        uColor3: { value: new THREE.Vector3(palette[2][0], palette[2][1], palette[2][2]) },
        uOpacity: { value: 0.85 }
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(22, 32, 32), material);
    const point = points[index % points.length];
    const baseX = point.x + (rand() - 0.5) * cellW * 0.2;
    const baseY = point.y + (rand() - 0.5) * cellH * 0.2;
    const baseZ = (rand() - 0.5) * 20;
    mesh.position.set(baseX, baseY, baseZ);
    mesh.scale.setScalar(baseScale);
    scene.add(mesh);

    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'idea-bubble-label';
    label.style.transform = 'translate(-50%,-50%)';
    label.innerHTML = wrapTitle(item.title, isMobile ? 7 : 8).join('<br>');

    const bubble = {
      mesh: mesh,
      label: label,
      baseX: baseX,
      baseY: baseY,
      baseZ: baseZ,
      phase: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 0.5,
      amplitude: 3 + rand() * 4,
      baseScale: baseScale,
      currentScale: baseScale,
      hovered: false
    };

    label.addEventListener('mouseenter', function () {
      bubble.hovered = true;
      label.classList.add('is-hover');
    });
    label.addEventListener('mouseleave', function () {
      bubble.hovered = false;
      label.classList.remove('is-hover');
    });
    label.addEventListener('click', function () {
      window.__lastIdeaBubbleRect = label.getBoundingClientRect();
      if (typeof onSelect === 'function') onSelect(item.id);
    });

    labelLayer.appendChild(label);
    bubbles.push(bubble);
  });

  const mouse = { x: -1, y: -1 };
  function onMove(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  }
  function onLeave() { mouse.x = -1; mouse.y = -1; }
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerleave', onLeave);

  const clock = new THREE.Clock();
  const projected = new THREE.Vector3();

  function frame() {
    if (!state) return;
    const t = clock.getElapsedTime();

    bubbles.forEach(function (b) {
      let targetX = b.baseX + Math.sin(t * b.speed + b.phase) * b.amplitude;
      let targetY = b.baseY + Math.cos(t * b.speed * 0.7 + b.phase) * b.amplitude * 0.5;
      b.mesh.position.z = b.baseZ + Math.sin(t * b.speed * 0.3 + b.phase) * 12;

      if (mouse.x > 0 && mouse.y > 0) {
        const mx = (mouse.x - width / 2) * 0.35;
        const my = -(mouse.y - height / 2) * 0.35;
        const dx = b.mesh.position.x - mx;
        const dy = b.mesh.position.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = 80 + 30 * b.baseScale;
        if (dist < radius && dist > 0.1) {
          const force = (1 - dist / radius) * 20;
          targetX += (dx / dist) * force;
          targetY += (dy / dist) * force;
        }
      }

      b.mesh.position.x += (targetX - b.mesh.position.x) * 0.08;
      b.mesh.position.y += (targetY - b.mesh.position.y) * 0.08;

      const scaleTarget = b.hovered ? b.baseScale * 1.2 : b.baseScale;
      b.currentScale += (scaleTarget - b.currentScale) * 0.1;
      b.mesh.scale.setScalar(b.currentScale);

      const opacityTarget = b.hovered ? 1.0 : 0.85;
      const u = b.mesh.material.uniforms.uOpacity;
      u.value += (opacityTarget - u.value) * 0.1;
      b.mesh.material.uniforms.uTime.value = t;

      projected.copy(b.mesh.position).project(camera);
      const sx = (projected.x * 0.5 + 0.5) * width;
      const sy = (-projected.y * 0.5 + 0.5) * height;
      b.label.style.transform = 'translate(-50%,-50%) translate(' + sx + 'px,' + sy + 'px)';
    });

    renderer.render(scene, camera);
    state.raf = requestAnimationFrame(frame);
  }

  const resizeObserver = new ResizeObserver(function () {
    if (!state) return;
    width = container.clientWidth;
    height = container.clientHeight;
    if (width < 40 || height < 40) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container);

  state = {
    scene: scene,
    renderer: renderer,
    labelLayer: labelLayer,
    bubbles: bubbles,
    resizeObserver: resizeObserver,
    raf: 0
  };
  state.raf = requestAnimationFrame(frame);
}

// ===== 项目页单气泡：与灵感库同材质，随阶段成长 =====
let hero = null;

function destroyHero() {
  if (!hero) return;
  cancelAnimationFrame(hero.raf);
  if (hero.resizeObserver) hero.resizeObserver.disconnect();
  hero.scene.remove(hero.mesh);
  hero.mesh.geometry.dispose();
  hero.mesh.material.dispose();
  hero.renderer.dispose();
  if (hero.renderer.domElement.parentNode) {
    hero.renderer.domElement.parentNode.removeChild(hero.renderer.domElement);
  }
  if (hero.label) hero.label.style.transform = '';
  hero = null;
}

function mountHero(container, options) {
  destroyHero();
  options = options || {};
  if (!container) return null;

  let width = container.clientWidth;
  let height = container.clientHeight;
  if (width < 40 || height < 40) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
  camera.position.set(0, 0, 350);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.insertBefore(renderer.domElement, container.firstChild);

  const palette = PALETTES[(options.paletteIndex == null ? 1 : options.paletteIndex) % PALETTES.length];
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Vector3(palette[0][0], palette[0][1], palette[0][2]) },
      uColor2: { value: new THREE.Vector3(palette[1][0], palette[1][1], palette[1][2]) },
      uColor3: { value: new THREE.Vector3(palette[2][0], palette[2][1], palette[2][2]) },
      uOpacity: { value: 0.92 }
    },
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), material);
  scene.add(mesh);

  const label = options.labelEl || null;
  let targetPx = options.sizePx || 150;
  let currentPx = targetPx;
  let pxPerUnit = (height / 2) / (Math.tan(Math.PI / 6) * 350);

  const projected = new THREE.Vector3();
  const clock = new THREE.Clock();

  function frame() {
    if (!hero) return;
    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;

    currentPx += (targetPx - currentPx) * 0.12;
    mesh.scale.setScalar(((currentPx / 2) * 0.84) / pxPerUnit);
    mesh.position.y = Math.sin(t * 0.9) * 4;
    mesh.position.x = Math.sin(t * 0.5) * 2.5;

    if (label) {
      projected.copy(mesh.position).project(camera);
      const sx = (projected.x * 0.5 + 0.5) * width;
      const sy = (-projected.y * 0.5 + 0.5) * height;
      label.style.transform = 'translate(-50%,-50%) translate(' + sx + 'px,' + sy + 'px)';
    }

    renderer.render(scene, camera);
    hero.raf = requestAnimationFrame(frame);
  }

  const resizeObserver = new ResizeObserver(function () {
    if (!hero) return;
    width = container.clientWidth;
    height = container.clientHeight;
    if (width < 40 || height < 40) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    pxPerUnit = (height / 2) / (Math.tan(Math.PI / 6) * 350);
  });
  resizeObserver.observe(container);

  hero = {
    scene: scene,
    renderer: renderer,
    mesh: mesh,
    label: label,
    resizeObserver: resizeObserver,
    raf: 0,
    setSize: function (px) { targetPx = px; },
    setPalette: function (index) {
      const p = PALETTES[index % PALETTES.length];
      material.uniforms.uColor1.value.set(p[0][0], p[0][1], p[0][2]);
      material.uniforms.uColor2.value.set(p[1][0], p[1][1], p[1][2]);
      material.uniforms.uColor3.value.set(p[2][0], p[2][1], p[2][2]);
    }
  };
  hero.raf = requestAnimationFrame(frame);
  return hero;
}

window.IdeaBubbles = { mount: mount, destroy: destroy, mountHero: mountHero, destroyHero: destroyHero };
window.dispatchEvent(new Event('idea-bubbles-ready'));
