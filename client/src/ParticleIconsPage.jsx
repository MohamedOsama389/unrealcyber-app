import * as THREE from 'three';
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

const SVG_NETWORK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="M44 146h168a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H44a10 10 0 0 1-10-10v-26a10 10 0 0 1 10-10zm10 16a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm26 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm26 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/>
  <path d="M62 94h132a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H62a10 10 0 0 1-10-10v-24a10 10 0 0 1 10-10z"/>
  <path d="M86 36a8 8 0 0 1 8 8v50h-16V44a8 8 0 0 1 8-8zm84 0a8 8 0 0 1 8 8v50h-16V44a8 8 0 0 1 8-8z"/>
</svg>
`;

const SVG_CODE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="M52 64h152a10 10 0 0 1 10 10v90a10 10 0 0 1-10 10H52a10 10 0 0 1-10-10V74a10 10 0 0 1 10-10z"/>
  <path d="M26 196h204a10 10 0 0 1 10 10v6H16v-6a10 10 0 0 1 10-10z"/>
  <path d="M112 108l-24 20 24 20" fill="none" stroke="black" stroke-width="16"/>
  <path d="M144 108l24 20-24 20" fill="none" stroke="black" stroke-width="16"/>
</svg>
`;

const SVG_HACKING = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="M128 24c40 22 72 22 96 30v78c0 66-46 100-96 120C78 232 32 198 32 132V54c24-8 56-8 96-30z"/>
  <path d="M92 128a36 36 0 0 1 72 0v22a10 10 0 0 1-10 10H102a10 10 0 0 1-10-10v-22zm18 0a18 18 0 0 1 36 0v10h-36v-10z"/>
  <path d="M128 154a8 8 0 0 1 8 8v10h-16v-10a8 8 0 0 1 8-8z"/>
</svg>
`;

function makeDotTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function svgToParticlePositions(svgString, opts) {
  const {
    points = 30000,
    depth = 0.6,
    jitter = 0.01,
    scale = 0.022,
    center = true,
    edgeRatio = 0.85,
  } = opts;

  const loader = new SVGLoader();
  const data = loader.parse(svgString);

  const shapes = [];
  for (const p of data.paths) shapes.push(...SVGLoader.createShapes(p));

  const shapeData = [];
  for (const shape of shapes) {
    const outline = shape.getSpacedPoints(600);
    shapeData.push({ shape, outline });
  }

  const edgeCount = Math.floor(points * edgeRatio);
  const fillCount = points - edgeCount;

  const positions = new Float32Array(points * 3);
  const tmp2 = new THREE.Vector2();

  for (let i = 0; i < edgeCount; i += 1) {
    const pick = shapeData[(Math.random() * shapeData.length) | 0];
    const v = pick.outline[(Math.random() * pick.outline.length) | 0];
    tmp2.set(v.x, v.y);

    const z = (Math.random() - 0.5) * depth;
    positions[i * 3 + 0] = tmp2.x * scale + (Math.random() - 0.5) * jitter;
    positions[i * 3 + 1] = -tmp2.y * scale + (Math.random() - 0.5) * jitter;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter;
  }

  for (let i = edgeCount; i < points; i += 1) {
    const pick = shapeData[(Math.random() * shapeData.length) | 0];
    const shape = pick.shape;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const v of pick.outline) {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }

    let x = 0;
    let y = 0;
    for (let t = 0; t < 16; t += 1) {
      x = minX + Math.random() * (maxX - minX);
      y = minY + Math.random() * (maxY - minY);
      if (shape.containsPoint(new THREE.Vector2(x, y))) break;
    }

    const z = (Math.random() - 0.5) * depth;
    positions[i * 3 + 0] = x * scale + (Math.random() - 0.5) * jitter;
    positions[i * 3 + 1] = -y * scale + (Math.random() - 0.5) * jitter;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter;
  }

  if (center) {
    const n = points;
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let i = 0; i < n; i += 1) {
      cx += positions[i * 3 + 0];
      cy += positions[i * 3 + 1];
      cz += positions[i * 3 + 2];
    }
    cx /= n;
    cy /= n;
    cz /= n;
    for (let i = 0; i < n; i += 1) {
      positions[i * 3 + 0] -= cx;
      positions[i * 3 + 1] -= cy;
      positions[i * 3 + 2] -= cz;
    }
  }

  return positions;
}

function Dust({ count = 2000, radius = 7, color = '#6fbfff' }) {
  const geom = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = radius * Math.pow(Math.random(), 0.65);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count, radius]);

  const mat = useMemo(() => {
    const tex = makeDotTexture(128);
    return new THREE.PointsMaterial({
      map: tex,
      transparent: true,
      opacity: 0.35,
      color,
      size: 0.03,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [color]);

  const ref = useRef(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.03;
    ref.current.rotation.x += dt * 0.01;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

function ParticleIcon({ variant = 'network' }) {
  const svg = variant === 'network' ? SVG_NETWORK : variant === 'code' ? SVG_CODE : SVG_HACKING;

  const color = variant === 'hacking' ? '#B257FF' : '#00E5FF';

  const positions = useMemo(
    () =>
      svgToParticlePositions(svg, {
        points: 36000,
        depth: 0.7,
        jitter: 0.012,
        scale: 0.022,
        edgeRatio: 0.88,
      }),
    [svg]
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.computeBoundingSphere();
    return g;
  }, [positions]);

  const material = useMemo(() => {
    const tex = makeDotTexture(128);
    return new THREE.PointsMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      color,
      size: 0.04,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [color]);

  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.18) * 0.18;
    ref.current.rotation.x = Math.sin(t * 0.12) * 0.08;
    ref.current.position.y = Math.sin(t * 0.6) * 0.05;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

function Scene({ variant }) {
  return (
    <Canvas camera={{ position: [0, 0.2, 4.3], fov: 45 }}>
      <color attach="background" args={['#050A18']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={1.2} />
      <Dust color={variant === 'hacking' ? '#b58cff' : '#6fbfff'} />
      <ParticleIcon variant={variant} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

function btnStyle(active) {
  return {
    cursor: 'pointer',
    padding: '10px 12px',
    borderRadius: 12,
    border: active ? '1px solid rgba(0,229,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.04)',
    color: '#EAF0FF',
    fontWeight: 600,
    letterSpacing: 0.5,
  };
}

export default function ParticleIconsPage() {
  const [variant, setVariant] = useState('network');

  return (
    <div style={{ minHeight: '100vh', background: '#050A18', color: '#EAF0FF' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          gap: 10,
          padding: '14px 16px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(5,10,24,0.45)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button onClick={() => setVariant('network')} style={btnStyle(variant === 'network')}>
          Networking
        </button>
        <button onClick={() => setVariant('hacking')} style={btnStyle(variant === 'hacking')}>
          Ethical Hacking
        </button>
        <button onClick={() => setVariant('code')} style={btnStyle(variant === 'code')}>
          Programming
        </button>
      </div>

      <div style={{ height: '100vh' }}>
        <Scene variant={variant} />
      </div>

      <div style={{ padding: '28px 16px', maxWidth: 900, margin: '0 auto', opacity: 0.85 }}>
        <h2 style={{ margin: 0, fontSize: 18, letterSpacing: 1 }}>Current: {variant.toUpperCase()}</h2>
        <p style={{ marginTop: 10, lineHeight: 1.7 }}>
          This is SVG → particle point cloud (edge-heavy) with additive glow + dust. Replace the SVG strings with
          cleaner silhouettes to match your images even closer.
        </p>
      </div>
    </div>
  );
}
