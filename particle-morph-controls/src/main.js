import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import vectorShapeUrl from "./vector-shape.svg?url";
import "./styles.css";

let scene;
let camera;
let renderer;
let particles;
let piLines;
let stars;
let composer;
let bloomPass;
let vectorShapeTexture;
let vectorFormData;
let piPointData;
let time = 0;
let currentPattern = 0;
let transitionProgress = 0;
let isTransitioning = false;
let scrollProgress = 0;

const screenMouse = new THREE.Vector2(10000, 10000);
const tiltMouse = new THREE.Vector2(0, 0);
const worldMouse = new THREE.Vector3(10000, 10000, 0);
const particleCount = 40000;
const starCount = 6000;
const PI_TEXT = "\u03c0\u2080.\u2085";
const transitionSpeed = 0.012;
const patternNames = ["Vector Prism", `${PI_TEXT} Dot Text`, "Cosmic Sphere", "Quantum Helix", "Stardust Grid", "Celestial Torus"];
const clock = new THREE.Clock();

const controls = {
  primaryColor: "#ffffff",
  secondaryColor: "#f23872",
  accentColor: "#d8d8d8",
  bloomStrength: 0.11,
  bloomRadius: 0.21,
  bloomThreshold: 0.43,
  particleGlow: 0.92,
  ambientGlow: 0.43,
  particleShape: 0,
  formDepth: 15.5,
  particleDensity: 40000,
  particleSize: 1.35,
  interactionMode: "gather",
};

function createVectorPrism(i) {
  const index = i * 3;
  if (!vectorFormData) return createSphere(i, particleCount);
  const x = vectorFormData[index];
  const y = vectorFormData[index + 1];
  const depthSeed = vectorFormData[index + 2];
  const bevel = Math.sin((x * 0.08 + y * 0.05) + depthSeed * Math.PI) * 1.4;
  return new THREE.Vector3(x, y, depthSeed * controls.formDepth + bevel);
}

function createPiDotText(i) {
  const index = i * 3;
  if (!piPointData) return createSphere(i, particleCount);
  const x = piPointData[index];
  const y = piPointData[index + 1];
  const depthSeed = piPointData[index + 2];
  const bevel = Math.sin((x * 0.08 + y * 0.04) + depthSeed * Math.PI) * 0.8;
  return new THREE.Vector3(x, y, depthSeed * controls.formDepth + bevel);
}

function createSphere(i, count) {
  const t = i / count;
  const phi = Math.acos(2 * t - 1);
  const theta = 2 * Math.PI * (i / count) * Math.sqrt(count);
  const radius = 35;
  return new THREE.Vector3(Math.sin(phi) * Math.cos(theta) * radius, Math.sin(phi) * Math.sin(theta) * radius, Math.cos(phi) * radius);
}

function createSpiral(i, count) {
  const t = i / count;
  const numArms = 3;
  const armIndex = i % numArms;
  const angleOffset = (2 * Math.PI / numArms) * armIndex;
  const angle = Math.pow(t, 0.7) * 15 + angleOffset;
  const radius = t * 40;
  const height = Math.sin(t * Math.PI * 2) * 5;
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, height);
}

function createGrid(i, count) {
  const sideLength = Math.ceil(Math.cbrt(count));
  const spacing = 72 / sideLength;
  const halfGrid = ((sideLength - 1) * spacing) / 2;
  const iz = Math.floor(i / (sideLength * sideLength));
  const iy = Math.floor((i % (sideLength * sideLength)) / sideLength);
  const ix = i % sideLength;
  return new THREE.Vector3(ix * spacing - halfGrid, iy * spacing - halfGrid, iz * spacing - halfGrid);
}

function createHelix(i, count) {
  const numHelices = 2;
  const helixIndex = i % numHelices;
  const t = Math.floor(i / numHelices) / Math.floor(count / numHelices);
  const angle = t * Math.PI * 10;
  const radius = 22;
  const height = (t - 0.5) * 72;
  const angleOffset = helixIndex * Math.PI;
  return new THREE.Vector3(Math.cos(angle + angleOffset) * radius, Math.sin(angle + angleOffset) * radius, height);
}

function createTorus() {
  const majorRadius = 24;
  const minorRadius = 11;
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = Math.random() * Math.PI * 2;
  return new THREE.Vector3(
    (majorRadius + minorRadius * Math.cos(angle2)) * Math.cos(angle1),
    (majorRadius + minorRadius * Math.cos(angle2)) * Math.sin(angle1),
    minorRadius * Math.sin(angle2),
  );
}

const patterns = [createVectorPrism, createPiDotText, createSphere, createHelix, createGrid, createTorus];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function createVectorFormData() {
  const image = await loadImage(vectorShapeUrl);
  const canvas = document.createElement("canvas");
  const size = 320;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, size, size);

  const padding = 24;
  const scale = Math.min((size - padding * 2) / image.width, (size - padding * 2) / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const pixels = ctx.getImageData(0, 0, size, size).data;
  const filled = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const alpha = pixels[(y * size + x) * 4 + 3];
      if (alpha > 20) filled.push([x, y]);
    }
  }

  const data = new Float32Array(particleCount * 3);
  const formWidth = 72;
  const formHeight = 72;
  for (let i = 0; i < particleCount; i += 1) {
    const [x, y] = filled[Math.floor(Math.random() * filled.length)];
    const jitterX = Math.random() - 0.5;
    const jitterY = Math.random() - 0.5;
    data[i * 3] = ((x + jitterX - size / 2) / drawWidth) * formWidth;
    data[i * 3 + 1] = -((y + jitterY - size / 2) / drawHeight) * formHeight;
    data[i * 3 + 2] = Math.random() * 2 - 1;
  }
  return data;
}

function createTextLineSystem() {
  const canvas = document.createElement("canvas");
  const size = 420;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 174px system-ui, sans-serif";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fff";
  ctx.strokeText(PI_TEXT, size / 2, size / 2 + 6);

  const hatchCanvas = document.createElement("canvas");
  hatchCanvas.width = size;
  hatchCanvas.height = size;
  const hatch = hatchCanvas.getContext("2d");
  hatch.strokeStyle = "#fff";
  hatch.lineWidth = 2;
  hatch.lineCap = "round";
  hatch.globalAlpha = 0.55;
  for (let y = 136; y <= 286; y += 16) {
    hatch.beginPath();
    hatch.moveTo(88, y);
    hatch.lineTo(332, y);
    hatch.stroke();
  }
  hatch.globalAlpha = 1;
  hatch.globalCompositeOperation = "destination-in";
  hatch.fillStyle = "#fff";
  hatch.textAlign = "center";
  hatch.textBaseline = "middle";
  hatch.font = ctx.font;
  hatch.fillText(PI_TEXT, size / 2, size / 2 + 6);
  ctx.drawImage(hatchCanvas, 0, 0);

  const pixels = ctx.getImageData(0, 0, size, size).data;
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const alpha = pixels[(y * size + x) * 4 + 3];
      if (alpha > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const textWidth = Math.max(1, maxX - minX);
  const textHeight = Math.max(1, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = 72 / Math.max(textWidth, textHeight);
  const positions = [];
  const colors = [];
  const primary = new THREE.Color(controls.primaryColor);
  const secondary = new THREE.Color(controls.secondaryColor);
  const accent = new THREE.Color(controls.accentColor);
  const lineLayers = [-controls.formDepth * 0.34, 0, controls.formDepth * 0.34];

  for (let y = minY; y <= maxY; y += 5) {
    let runStart = null;
    for (let x = minX; x <= maxX + 1; x += 1) {
      const alpha = x <= maxX ? pixels[(y * size + x) * 4 + 3] : 0;
      if (alpha > 24 && runStart === null) runStart = x;
      if ((alpha <= 24 || x > maxX) && runStart !== null) {
        const runEnd = x - 1;
        if (runEnd - runStart > 2) {
          const c = y % 3 === 0 ? secondary : y % 5 === 0 ? accent : primary;
          lineLayers.forEach((z, layerIndex) => {
            const inset = layerIndex - 1;
            positions.push((runStart - centerX) * scale + inset * 0.45, -(y - centerY) * scale + inset * 0.28, z);
            positions.push((runEnd - centerX) * scale + inset * 0.45, -(y - centerY) * scale + inset * 0.28, z);
            const shade = 0.72 + layerIndex * 0.14;
            colors.push(c.r * shade, c.g * shade, c.b * shade, c.r * shade, c.g * shade, c.b * shade);
          });
        }
        runStart = null;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.visible = false;
  return lines;
}

function createPiPointData() {
  const canvas = document.createElement("canvas");
  const size = 420;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 174px system-ui, sans-serif";
  ctx.fillText(PI_TEXT, size / 2, size / 2 + 6);

  const pixels = ctx.getImageData(0, 0, size, size).data;
  const filled = [];
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const alpha = pixels[(y * size + x) * 4 + 3];
      if (alpha > 24) {
        filled.push([x, y]);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const textWidth = Math.max(1, maxX - minX);
  const textHeight = Math.max(1, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = 72 / Math.max(textWidth, textHeight);
  const data = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const [x, y] = filled[Math.floor(Math.random() * filled.length)];
    const jitterX = Math.random() - 0.5;
    const jitterY = Math.random() - 0.5;
    data[i * 3] = (x + jitterX - centerX) * scale;
    data[i * 3 + 1] = -(y + jitterY - centerY) * scale;
    data[i * 3 + 2] = Math.random() * 2 - 1;
  }

  return data;
}
function hexToRgb(hex) {
  const color = new THREE.Color(hex);
  return `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`;
}

function getPalette() {
  const primary = new THREE.Color(controls.primaryColor);
  const secondary = new THREE.Color(controls.secondaryColor);
  const accent = new THREE.Color(controls.accentColor);
  return [
    primary,
    secondary,
    accent,
    primary.clone().lerp(accent, 0.42),
    secondary.clone().lerp(accent, 0.36),
  ];
}

function createColors() {
  const colors = new Float32Array(particleCount * 3);
  const palette = getPalette();
  for (let i = 0; i < particleCount; i += 1) {
    const weightedIndex = Math.random();
    const base = weightedIndex < 0.46 ? palette[0] : weightedIndex < 0.74 ? palette[1] : palette[Math.floor(Math.random() * palette.length)];
    const variation = 0.76 + Math.random() * 0.48;
    const final = base.clone().multiplyScalar(variation);
    colors[i * 3] = final.r;
    colors[i * 3 + 1] = final.g;
    colors[i * 3 + 2] = final.b;
  }
  return colors;
}

function createStarfield() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const starInfo = new Float32Array(starCount);
  const color = new THREE.Color();
  const starRadius = 700;

  for (let i = 0; i < starCount; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    positions[i * 3] = starRadius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = starRadius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = starRadius * Math.cos(phi);

    if (Math.random() < 0.78) {
      color.setHSL(0, 0, Math.random() * 0.2 + 0.7);
    } else {
      color.set(controls.accentColor).lerp(new THREE.Color(0xffffff), Math.random() * 0.65);
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    starInfo[i] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("starInfo", new THREE.BufferAttribute(starInfo, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pointSize: { value: 1.7 } },
    vertexShader: `
      attribute float starInfo;
      varying vec3 vColor;
      varying float vStarInfo;
      uniform float pointSize;
      void main() {
        vColor = color;
        vStarInfo = starInfo;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = pointSize * (150.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vColor;
      varying float vStarInfo;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);
        if (dist > 0.5) discard;
        float speed = vStarInfo * 2.0 + 0.5;
        float offset = vStarInfo * 6.28;
        float twinkle = sin(time * speed + offset) * 0.2 + 0.8;
        float alpha = pow(1.0 - dist * 2.0, 1.5);
        gl_FragColor = vec4(vColor, alpha * twinkle * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const starPoints = new THREE.Points(geometry, material);
  starPoints.renderOrder = -1;
  return starPoints;
}

function createParticleSystem() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const indices = new Float32Array(particleCount);
  const particleTypes = new Float32Array(particleCount);
  const colors = createColors();

  for (let i = 0; i < particleCount; i += 1) {
    indices[i] = i;
    particleTypes[i] = Math.floor(Math.random() * 3);
    const pos = patterns[0](i, particleCount);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    sizes[i] = 1 + Math.random() * 1.5;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("index", new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute("particleType", new THREE.BufferAttribute(particleTypes, 1));
  geometry.userData.currentColors = new Float32Array(colors);
  geometry.setDrawRange(0, controls.particleDensity);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mousePos: { value: new THREE.Vector3(10000, 10000, 0) },
      glowPower: { value: controls.particleGlow },
      shapeMode: { value: controls.particleShape },
      interactionMode: { value: 0 },
      pointScale: { value: controls.particleSize },
      globalOpacity: { value: 1 },
      shapeTexture: { value: vectorShapeTexture },
    },
    vertexShader: `
      uniform float time;
      uniform vec3 mousePos;
      uniform float shapeMode;
      uniform float interactionMode;
      uniform float pointScale;
      attribute float size;
      attribute float index;
      attribute float particleType;
      varying vec3 vColor;
      varying float vDistanceToMouse;
      varying float vType;
      varying float vIndex;
      float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        vColor = color;
        vType = particleType;
        vIndex = index;
        vec3 pos = position;
        float T = time * 0.5;
        float idx = index * 0.01;
        float noiseFactor1 = sin(idx * 30.0 + T * 15.0) * 0.4 + 0.6;
        vec3 offset1 = vec3(
          cos(T * 1.2 + idx * 5.0) * noiseFactor1,
          sin(T * 0.9 + idx * 6.0) * noiseFactor1,
          cos(T * 1.1 + idx * 7.0) * noiseFactor1
        ) * 0.4;
        float noiseFactor2 = rand(vec2(idx, idx * 0.5)) * 0.5 + 0.5;
        float speedFactor = 0.3;
        vec3 offset2 = vec3(
          sin(T * speedFactor * 1.3 + idx * 1.1) * noiseFactor2,
          cos(T * speedFactor * 1.7 + idx * 1.2) * noiseFactor2,
          sin(T * speedFactor * 1.1 + idx * 1.3) * noiseFactor2
        ) * 0.8;
        pos += offset1 + offset2;

        vec3 toMouse = mousePos - pos;
        float dist = length(toMouse);
        vDistanceToMouse = 0.0;
        float interactionRadius = interactionMode < 0.5 ? 34.0 : 46.0;
        float falloffStart = 5.0;
        if (dist < interactionRadius) {
          float influence = smoothstep(interactionRadius, falloffStart, dist);
          vec3 repelDir = normalize(pos - mousePos + vec3(rand(vec2(index, 0.1)) - 0.5, rand(vec2(index, 0.2)) - 0.5, rand(vec2(index, 0.3)) - 0.5) * 0.01);
          float power = interactionMode < 0.5 ? 24.0 : -19.0;
          pos += repelDir * influence * power;
          if (interactionMode > 0.5) {
            pos.z += sin(index * 0.17 + time * 3.0) * influence * 3.5;
          }
          vDistanceToMouse = influence;
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float perspectiveFactor = 700.0 / -mvPosition.z;
        float shapeScale = shapeMode > 5.5 ? 2.4 : 1.0;
        gl_PointSize = size * perspectiveFactor * shapeScale * pointScale * (1.0 + vDistanceToMouse * 0.5);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float glowPower;
      uniform float shapeMode;
      uniform float globalOpacity;
      uniform sampler2D shapeTexture;
      varying vec3 vColor;
      varying float vDistanceToMouse;
      varying float vType;
      varying float vIndex;

      vec3 rgb2hsl(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      vec3 hsl2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      float shapeMask(vec2 uv, float mode) {
        float d = length(uv);
        if (mode < 0.5) {
          return 1.0 - smoothstep(0.92, 1.0, d);
        }
        if (mode < 1.5) {
          float diamond = abs(uv.x) + abs(uv.y);
          return 1.0 - smoothstep(0.92, 1.0, diamond);
        }
        if (mode < 2.5) {
          vec2 p = uv;
          p.y += 0.18;
          float k = sqrt(3.0);
          p.x = abs(p.x) - 0.55;
          p.y = p.y + 0.32;
          if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
          p.x -= clamp(p.x, -1.1, 0.0);
          float tri = -length(p) * sign(p.y);
          return smoothstep(-0.06, 0.03, tri);
        }
        if (mode < 3.5) {
          float square = max(abs(uv.x), abs(uv.y));
          return 1.0 - smoothstep(0.88, 0.98, square);
        }
        if (mode < 4.5) {
          float angle = atan(uv.y, uv.x);
          float rays = abs(cos(angle * 5.0));
          float starRadius = mix(0.42, 0.98, pow(rays, 3.0));
          return 1.0 - smoothstep(starRadius - 0.08, starRadius, d);
        }
        float ring = abs(d - 0.62);
        if (mode < 5.5) {
          return 1.0 - smoothstep(0.12, 0.2, ring);
        }
        vec4 icon = texture2D(shapeTexture, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
        float ink = max(icon.a, max(icon.r, max(icon.g, icon.b)));
        return smoothstep(0.08, 0.28, ink);
      }

      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float dist = length(uv);
        float mask = shapeMask(uv, shapeMode);
        if (mask <= 0.01) discard;

        vec3 baseColor = vColor;
        vec3 hsl = rgb2hsl(baseColor);
        float hueShift = sin(time * 0.05 + vIndex * 0.001) * 0.02;
        hsl.x = fract(hsl.x + hueShift);
        baseColor = hsl2rgb(hsl);

        float alpha = 0.0;
        if (vType < 0.5) {
          float core = smoothstep(0.2, 0.15, dist) * 0.9;
          float glow = pow(max(0.0, 1.0 - dist), 3.0) * 0.5;
          alpha = core + glow;
        } else if (vType < 1.5) {
          float ringWidth = 0.1;
          float ringCenter = 0.65;
          float ringShape = exp(-pow(dist - ringCenter, 2.0) / (2.0 * ringWidth * ringWidth));
          alpha = smoothstep(0.1, 0.5, ringShape) * 0.8;
          alpha += smoothstep(0.3, 0.0, dist) * 0.1;
        } else {
          float pulse = sin(dist * 5.0 - time * 2.0 + vIndex * 0.1) * 0.1 + 0.9;
          alpha = pow(max(0.0, 1.0 - dist), 2.5) * pulse * 0.9;
        }

        vec3 finalColor = mix(baseColor, baseColor * 1.3 + 0.1, vDistanceToMouse);
        alpha = clamp(alpha * 0.9 * glowPower * mask * globalOpacity, 0.0, 1.0);
        gl_FragColor = vec4(finalColor * alpha * glowPower, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  return new THREE.Points(geometry, material);
}

async function init() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  scene = new THREE.Scene();
  vectorShapeTexture = new THREE.TextureLoader().load(vectorShapeUrl);
  vectorShapeTexture.colorSpace = THREE.SRGBColorSpace;
  vectorShapeTexture.minFilter = THREE.LinearFilter;
  vectorShapeTexture.magFilter = THREE.LinearFilter;
  vectorFormData = await createVectorFormData();
  piPointData = createPiPointData();
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById("container").appendChild(renderer.domElement);

  stars = createStarfield();
  scene.add(stars);
  particles = createParticleSystem();
  scene.add(particles);
  piLines = createTextLineSystem();
  scene.add(piLines);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), controls.bloomStrength, controls.bloomRadius, controls.bloomThreshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  bindEvents();
  bindControls();
  applyControlValues();
  updatePatternName(patternNames[currentPattern], true);
}

function bindEvents() {
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("mousemove", (event) => updateScreenMouse(event.clientX, event.clientY));
  document.addEventListener("mousedown", onCanvasClick);
  document.addEventListener("touchstart", onTouchStart, { passive: false });
  document.addEventListener("touchmove", onTouchMove, { passive: false });
}

function bindControls() {
  document.querySelector(".control-panel").addEventListener("pointerdown", (event) => event.stopPropagation());
  document.querySelector(".control-panel").addEventListener("mousedown", (event) => event.stopPropagation());
  document.querySelector(".control-panel").addEventListener("touchstart", (event) => event.stopPropagation(), { passive: true });

  Object.entries(controls).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if (input) input.value = value;
  });

  ["primaryColor", "secondaryColor", "accentColor"].forEach((id) => {
    document.getElementById(id).addEventListener("input", (event) => {
      controls[id] = event.target.value;
      retintParticles();
      applyControlValues();
    });
  });

  document.getElementById("interactionMode").addEventListener("change", (event) => {
    controls.interactionMode = event.target.value;
    applyControlValues();
  });

  ["bloomStrength", "bloomRadius", "bloomThreshold", "particleGlow", "ambientGlow", "formDepth", "particleDensity", "particleSize"].forEach((id) => {
    document.getElementById(id).addEventListener("input", (event) => {
      controls[id] = Number(event.target.value);
      applyControlValues();
      if (id === "formDepth") updateVectorDepth();
      if (id === "particleDensity") updateParticleDensity();
    });
  });

  document.getElementById("particleShape").addEventListener("change", (event) => {
    controls.particleShape = Number(event.target.value);
    applyControlValues();
  });

  document.getElementById("previousPattern").addEventListener("click", () => forcePatternChange(-1));
  document.getElementById("nextPattern").addEventListener("click", () => forcePatternChange(1));
  document.getElementById("resetControls").addEventListener("click", resetControls);
}

function applyControlValues() {
  document.documentElement.style.setProperty("--primary-rgb", hexToRgb(controls.primaryColor));
  document.documentElement.style.setProperty("--secondary-rgb", hexToRgb(controls.secondaryColor));
  document.documentElement.style.setProperty("--accent-rgb", hexToRgb(controls.accentColor));
  document.documentElement.style.setProperty("--ambient", controls.ambientGlow);

  if (bloomPass) {
    bloomPass.strength = controls.bloomStrength;
    bloomPass.radius = controls.bloomRadius;
    bloomPass.threshold = controls.bloomThreshold;
  }
  if (particles?.material.uniforms.glowPower) {
    particles.material.uniforms.glowPower.value = controls.particleGlow;
  }
  if (particles?.material.uniforms.shapeMode) {
    particles.material.uniforms.shapeMode.value = controls.particleShape;
  }
  if (particles?.material.uniforms.interactionMode) {
    particles.material.uniforms.interactionMode.value = controls.interactionMode === "gather" ? 1 : 0;
  }
  if (particles?.material.uniforms.pointScale) {
    particles.material.uniforms.pointScale.value = controls.particleSize;
  }
  updateParticleDensity();

  Object.entries(controls).forEach(([key, value]) => {
    const valueEl = document.getElementById(`${key}Value`);
    if (valueEl && typeof value === "number") {
      valueEl.textContent = key === "particleDensity" ? String(Math.round(value)) : value.toFixed(2);
    }
  });
}

function updateParticleDensity() {
  if (!particles) return;
  particles.geometry.setDrawRange(0, Math.round(controls.particleDensity));
}

function retintParticles() {
  if (!particles) return;
  const colors = createColors();
  const attr = particles.geometry.attributes.color;
  attr.array.set(colors);
  attr.needsUpdate = true;
  particles.geometry.userData.currentColors = new Float32Array(colors);
  if (isTransitioning) {
    particles.userData.fromColors = new Float32Array(colors);
    particles.userData.toColors = new Float32Array(colors);
  }
  rebuildPiLines();
}

function rebuildPiLines() {
  if (!scene || !piLines) return;
  const visible = piLines.visible;
  const opacity = piLines.material.opacity;
  const rotation = piLines.rotation.clone();
  scene.remove(piLines);
  piLines.geometry.dispose();
  piLines.material.dispose();
  piLines = createTextLineSystem();
  piLines.visible = visible;
  piLines.material.opacity = opacity;
  piLines.rotation.copy(rotation);
  scene.add(piLines);
}

function resetControls() {
  Object.assign(controls, {
    primaryColor: "#ffffff",
    secondaryColor: "#f23872",
    accentColor: "#d8d8d8",
    bloomStrength: 0.11,
    bloomRadius: 0.21,
    bloomThreshold: 0.43,
    particleGlow: 0.92,
    ambientGlow: 0.43,
    particleShape: 0,
    formDepth: 15.5,
    particleDensity: 40000,
    particleSize: 1.35,
    interactionMode: "gather",
  });

  Object.entries(controls).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if (input) input.value = value;
  });
  retintParticles();
  applyControlValues();
  updateVectorDepth();
}

function updateVectorDepth() {
  if (!particles || isTransitioning || (currentPattern !== 0 && currentPattern !== 1)) return;
  const positions = particles.geometry.attributes.position.array;
  const patternFn = patterns[currentPattern];
  for (let i = 0; i < particleCount; i += 1) {
    const pos = patternFn(i, particleCount);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

function onWindowResize() {
  if (!camera || !renderer || !composer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function updateScreenMouse(clientX, clientY) {
  screenMouse.x = (clientX / window.innerWidth) * 2 - 1;
  screenMouse.y = -(clientY / window.innerHeight) * 2 + 1;
  tiltMouse.x = THREE.MathUtils.clamp(screenMouse.x, -1, 1);
  tiltMouse.y = THREE.MathUtils.clamp(screenMouse.y, -1, 1);
}

function onCanvasClick(event) {
  if (event.target.closest(".control-panel")) return;
  if (scrollProgress > 0.5) return;
  event.preventDefault();
  forcePatternChange(1);
}

function onTouchStart(event) {
  if (event.target.closest(".control-panel")) return;
  if (scrollProgress > 0.5) return;
  event.preventDefault();
  if (event.touches.length > 0) updateScreenMouse(event.touches[0].clientX, event.touches[0].clientY);
  forcePatternChange(1);
}

function onTouchMove(event) {
  if (event.target.closest(".control-panel")) return;
  event.preventDefault();
  if (event.touches.length > 0) updateScreenMouse(event.touches[0].clientX, event.touches[0].clientY);
}

function forcePatternChange(direction) {
  if (isTransitioning) completeCurrentTransition();
  const nextPattern = (currentPattern + direction + patterns.length) % patterns.length;
  transitionToPattern(nextPattern);
  updatePatternName(patternNames[nextPattern]);
}

function completeCurrentTransition() {
  if (!isTransitioning || !particles?.userData.toPositions || !particles.userData.toColors) {
    isTransitioning = false;
    transitionProgress = 0;
    return;
  }

  const positions = particles.geometry.attributes.position.array;
  const colors = particles.geometry.attributes.color.array;
  positions.set(particles.userData.toPositions);
  colors.set(particles.userData.toColors);
  particles.geometry.userData.currentColors = new Float32Array(particles.userData.toColors);
  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
  currentPattern = particles.userData.targetPattern;
  delete particles.userData.fromPositions;
  delete particles.userData.scatterPositions;
  delete particles.userData.toPositions;
  delete particles.userData.fromColors;
  delete particles.userData.toColors;
  isTransitioning = false;
  transitionProgress = 0;
}

function updatePatternName(name, instant = false) {
  const el = document.getElementById("patternName");
  el.textContent = name;
  if (instant) {
    el.style.transition = "none";
    el.style.opacity = "1";
    return;
  }
  el.style.transition = "opacity 0.5s ease";
  el.style.opacity = "1";
  window.clearTimeout(updatePatternName.timeout);
  updatePatternName.timeout = window.setTimeout(() => {
    el.style.opacity = "0.35";
  }, 2500);
}

function transitionToPattern(newPattern) {
  if (!particles) return;
  isTransitioning = true;
  const posAttr = particles.geometry.attributes.position;
  const colAttr = particles.geometry.attributes.color;
  const curPos = new Float32Array(posAttr.array);
  const curCol = particles.geometry.userData.currentColors ? new Float32Array(particles.geometry.userData.currentColors) : new Float32Array(colAttr.array);
  const newPos = new Float32Array(curPos.length);
  const patternFn = patterns[newPattern];

  for (let i = 0; i < particleCount; i += 1) {
    const p = patternFn(i, particleCount);
    newPos[i * 3] = p.x;
    newPos[i * 3 + 1] = p.y;
    newPos[i * 3 + 2] = p.z;
  }

  const newCol = createColors();
  particles.userData.fromPositions = curPos;
  particles.userData.scatterPositions = createScatterPositions(curPos, newPos);
  particles.userData.toPositions = newPos;
  particles.userData.fromColors = curCol;
  particles.userData.toColors = newCol;
  particles.userData.targetPattern = newPattern;
  transitionProgress = 0;
}

function createScatterPositions(fromPos, toPos) {
  const scatter = new Float32Array(fromPos.length);
  for (let i = 0; i < fromPos.length / 3; i += 1) {
    const index = i * 3;
    const sx = fromPos[index];
    const sy = fromPos[index + 1];
    const sz = fromPos[index + 2];
    const tx = toPos[index];
    const ty = toPos[index + 1];
    const tz = toPos[index + 2];
    const seed = i * 12.9898;
    const angle = seed % (Math.PI * 2);
    const ring = 58 + ((i * 37) % 45);
    const lift = (((i * 53) % 100) / 100 - 0.5) * 92;
    scatter[index] = (sx + tx) * 0.18 + Math.cos(angle) * ring;
    scatter[index + 1] = (sy + ty) * 0.18 + Math.sin(angle) * ring;
    scatter[index + 2] = (sz + tz) * 0.12 + lift;
  }
  return scatter;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function updateScrollScene() {
  scrollProgress = THREE.MathUtils.clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);
  const lineOpacity = smoothstep(0.68, 0.98, scrollProgress);
  const pointOpacity = 1 - smoothstep(0.72, 0.98, scrollProgress);

  if (scrollProgress > 0.28 && currentPattern !== 1 && !isTransitioning) {
    transitionToPattern(1);
    updatePatternName(patternNames[1]);
  } else if (scrollProgress < 0.12 && currentPattern === 1 && !isTransitioning) {
    transitionToPattern(0);
    updatePatternName(patternNames[0]);
  }

  if (particles?.material.uniforms.globalOpacity) {
    particles.material.uniforms.globalOpacity.value = pointOpacity;
    particles.visible = pointOpacity > 0.015;
  }

  if (piLines) {
    piLines.visible = lineOpacity > 0.015;
    piLines.material.opacity = lineOpacity;
  }

  const patternName = document.getElementById("patternName");
  if (patternName) {
    patternName.textContent = scrollProgress > 0.72 ? `${PI_TEXT} Triple Stroke` : patternNames[currentPattern];
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !composer || !camera || !scene) return;

  const deltaTime = clock.getDelta();
  time += deltaTime;
  updateScrollScene();

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(screenMouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersectPoint = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, intersectPoint) && screenMouse.x < 9000) {
    worldMouse.lerp(intersectPoint, 0.1);
  }

  if (stars?.material.uniforms.time) stars.material.uniforms.time.value = time;
  if (particles?.material.uniforms.time && particles.material.uniforms.mousePos) {
    particles.material.uniforms.time.value = time;
    particles.material.uniforms.mousePos.value.copy(worldMouse);
  }

  if (
    isTransitioning &&
    particles?.userData.fromPositions &&
    particles.userData.scatterPositions &&
    particles.userData.toPositions &&
    particles.userData.fromColors &&
    particles.userData.toColors
  ) {
    transitionProgress += transitionSpeed;
    if (transitionProgress >= 1) {
      transitionProgress = 1;
      completeCurrentTransition();
    } else {
      interpolateTransition();
    }
  }

  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 105;
  camera.lookAt(0, 0, 0);

  if (particles) {
    const maxTilt = THREE.MathUtils.degToRad(30);
    particles.rotation.y = THREE.MathUtils.lerp(particles.rotation.y, tiltMouse.x * maxTilt, 0.06);
    particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, -tiltMouse.y * maxTilt, 0.06);
    particles.rotation.z = THREE.MathUtils.lerp(particles.rotation.z, 0, 0.06);
    particles.position.set(0, 0, 0);
  }

  if (piLines) {
    const maxTilt = THREE.MathUtils.degToRad(30);
    piLines.rotation.y = THREE.MathUtils.lerp(piLines.rotation.y, tiltMouse.x * maxTilt, 0.06);
    piLines.rotation.x = THREE.MathUtils.lerp(piLines.rotation.x, -tiltMouse.y * maxTilt, 0.06);
    piLines.rotation.z = THREE.MathUtils.lerp(piLines.rotation.z, 0, 0.06);
    piLines.position.set(0, 0, 0);
  }

  if (stars) stars.rotation.y += 0.0001;
  composer.render(deltaTime);
}

function interpolateTransition() {
  const positions = particles.geometry.attributes.position.array;
  const colors = particles.geometry.attributes.color.array;
  const fromPos = particles.userData.fromPositions;
  const scatterPos = particles.userData.scatterPositions;
  const toPos = particles.userData.toPositions;
  const fromCol = particles.userData.fromColors;
  const toCol = particles.userData.toColors;
  const t = transitionProgress;
  const scatterEnd = 0.34;
  const shatter = t < scatterEnd;
  const localT = shatter ? t / scatterEnd : (t - scatterEnd) / (1 - scatterEnd);
  const ease = shatter ? easeOutCubic(localT) : easeOutBack(Math.min(localT, 1));

  for (let i = 0; i < positions.length / 3; i += 1) {
    const index = i * 3;
    const startPos = shatter ? fromPos : scatterPos;
    const endPos = shatter ? scatterPos : toPos;
    positions[index] = startPos[index] * (1 - ease) + endPos[index] * ease;
    positions[index + 1] = startPos[index + 1] * (1 - ease) + endPos[index + 1] * ease;
    positions[index + 2] = startPos[index + 2] * (1 - ease) + endPos[index + 2] * ease;
    colors[index] = fromCol[index] * (1 - ease) + toCol[index] * ease;
    colors[index + 1] = fromCol[index + 1] * (1 - ease) + toCol[index + 1] * ease;
    colors[index + 2] = fromCol[index + 2] * (1 - ease) + toCol[index + 2] * ease;
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
  particles.geometry.userData.currentColors = new Float32Array(colors);
}

init().then(() => animate());

