import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// --- CONSTANTS & SVG STRINGS ---

// Router + Switch + antennas
const SVG_NETWORK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="M44 146h168a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H44a10 10 0 0 1-10-10v-26a10 10 0 0 1 10-10zm10 16a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm26 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm26 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/>
  <path d="M62 94h132a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H62a10 10 0 0 1-10-10v-24a10 10 0 0 1 10-10z"/>
  <path d="M86 36a8 8 0 0 1 8 8v50h-16V44a8 8 0 0 1 8-8zm84 0a8 8 0 0 1 8 8v50h-16V44a8 8 0 0 1 8-8z"/>
</svg>
`;

// Laptop + <> code
const SVG_CODE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="M52 64h152a10 10 0 0 1 10 10v90a10 10 0 0 1-10 10H52a10 10 0 0 1-10-10V74a10 10 0 0 1 10-10z"/>
  <path d="M26 196h204a10 10 0 0 1 10 10v6H16v-6a10 10 0 0 1 10-10z"/>
  <path d="M112 108l-24 20 24 20" fill="none" stroke="black" stroke-width="16"/>
  <path d="M144 108l24 20-24 20" fill="none" stroke="black" stroke-width="16"/>
</svg>
`;

// Shield + lock
const SVG_HACKING = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="M128 24c40 22 72 22 96 30v78c0 66-46 100-96 120C78 232 32 198 32 132V54c24-8 56-8 96-30z"/>
  <path d="M92 128a36 36 0 0 1 72 0v22a10 10 0 0 1-10 10H102a10 10 0 0 1-10-10v-22zm18 0a18 18 0 0 1 36 0v10h-36v-10z"/>
  <path d="M128 154a8 8 0 0 1 8 8v10h-16v-10a8 8 0 0 1 8-8z"/>
</svg>
`;

// --- UTILITIES ---

function makeDotTexture(size = 128) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.9)");
    g.addColorStop(0.6, "rgba(255,255,255,0.25)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
}

function svgToParticlePositions(svgString, opts) {
    const {
        points = 20000,
        depth = 0.6,
        jitter = 0.01,
        scale = 0.05, // Calibrated scale
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

    // Safety fallback
    if (shapeData.length === 0) return new Float32Array(points * 3);

    const edgeCount = Math.floor(points * edgeRatio);

    // Position array
    const positions = new Float32Array(points * 3);
    const tmp2 = new THREE.Vector2();

    // EDGE sampling
    for (let i = 0; i < edgeCount; i++) {
        const pick = shapeData[(Math.random() * shapeData.length) | 0];
        const v = pick.outline[(Math.random() * pick.outline.length) | 0];
        tmp2.set(v.x, v.y);

        const z = (Math.random() - 0.5) * depth;
        positions[i * 3 + 0] = tmp2.x * scale + (Math.random() - 0.5) * jitter;
        positions[i * 3 + 1] = -tmp2.y * scale + (Math.random() - 0.5) * jitter;
        positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter;
    }

    // FILL sampling
    for (let i = edgeCount; i < points; i++) {
        const pick = shapeData[(Math.random() * shapeData.length) | 0];
        const shape = pick.shape;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const v of pick.outline) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }

        let x = 0, y = 0;
        let found = false;

        // Try to find a point inside the shape's path
        if (shape && typeof shape.containsPoint === 'function') {
            const v2 = new THREE.Vector2();
            for (let t = 0; t < 12; t++) {
                x = minX + Math.random() * (maxX - minX);
                y = minY + Math.random() * (maxY - minY);
                v2.set(x, y);
                if (shape.containsPoint(v2)) {
                    found = true;
                    break;
                }
            }
        }

        // Fallback: If no point found or method missing, sample from outline with heavy jitter
        if (!found) {
            const v = pick.outline[(Math.random() * pick.outline.length) | 0];
            x = v.x + (Math.random() - 0.5) * (maxX - minX) * 0.4;
            y = v.y + (Math.random() - 0.5) * (maxY - minY) * 0.4;
        }

        const z = (Math.random() - 0.5) * depth;
        positions[i * 3 + 0] = x * scale + (Math.random() - 0.5) * jitter;
        positions[i * 3 + 1] = -y * scale + (Math.random() - 0.5) * jitter;
        positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter;
    }

    // Center points
    if (center) {
        let cx = 0, cy = 0, cz = 0;
        for (let i = 0; i < points; i++) {
            cx += positions[i * 3 + 0];
            cy += positions[i * 3 + 1];
            cz += positions[i * 3 + 2];
        }
        cx /= points; cy /= points; cz /= points;
        for (let i = 0; i < points; i++) {
            positions[i * 3 + 0] -= cx;
            positions[i * 3 + 1] -= cy;
            positions[i * 3 + 2] -= cz;
        }
    }

    return positions;
}

// --- COMPONENTS ---

// Ambient Dust Particle System
function Dust({ count = 2000, radius = 7 }) {
    const geom = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = radius * Math.pow(Math.random(), 0.65);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        return g;
    }, [count, radius]);

    const mat = useMemo(() => {
        const tex = makeDotTexture(128);
        return new THREE.PointsMaterial({
            map: tex,
            transparent: true,
            opacity: 0.35,
            color: '#6fbfff',
            size: 0.03,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }, []);

    const ref = useRef();
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.rotation.y += dt * 0.03;
        ref.current.rotation.x += dt * 0.01;
    });

    return <points ref={ref} geometry={geom} material={mat} />;
}

// Main Particle Morph System
const ParticleMorph = ({ scrollProgress = 0, sectionCount = 3 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const [mousePos] = useState(() => new THREE.Vector2());

    // Determine user device for performance
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

    // High density as requested by user ("shapes look much greater")
    const COUNT = isMobile ? 6000 : 15000;

    // Compute targets ONCE
    const targets = useMemo(() => {
        const opts = {
            points: COUNT,
            depth: 0.8,
            jitter: 0.015,
            scale: 0.024,
            edgeRatio: 0.9,
        };

        const net = svgToParticlePositions(SVG_NETWORK, opts);
        const hack = svgToParticlePositions(SVG_HACKING, opts);
        const prog = svgToParticlePositions(SVG_CODE, opts);

        const rand = new Float32Array(COUNT * 3);
        const swarm = new Float32Array(COUNT * 3);

        for (let i = 0; i < COUNT; i++) {
            rand[i * 3] = (Math.random() - 0.5) * 35;
            rand[i * 3 + 1] = (Math.random() - 0.5) * 25;
            rand[i * 3 + 2] = (Math.random() - 0.5) * 20;

            // Swarm target: A wide horizontal field (inspired by the provided wave image)
            swarm[i * 3] = (Math.random() - 0.5) * 45; // Very wide X
            swarm[i * 3 + 1] = (Math.random() - 0.5) * 1.5; // Thin base Y
            swarm[i * 3 + 2] = (Math.random() - 0.5) * 20; // Depth Z
        }

        return { net, hack, prog, rand, swarm };
    }, [COUNT]);

    const targetModels = useMemo(() => [targets.net, targets.hack, targets.prog], [targets]);

    const colors = useMemo(() => ({
        networking: new THREE.Color("#00E5FF"),
        hacking: new THREE.Color("#C084FC"),
        programming: new THREE.Color("#60A5FA"),
        ambient: new THREE.Color("#00a2ff") // Cyan-Blue ambient to match wave image
    }), []);

    const targetColors = useMemo(() => [colors.networking, colors.hacking, colors.programming], [colors]);

    // DYNAMIC SCROLL MAPPING (Page-wide)
    const centers = useMemo(() => {
        const c = [];
        const hHero = 1.0; // Hero is 100vh
        const hSec = isMobile ? 1.0 : 1.2; // Each section is 100vh or 120vh
        const hFooter = 0.5; // Footer is roughly 50vh

        const totalHeight = hHero + (sectionCount * hSec) + hFooter;

        for (let i = 0; i < sectionCount; i++) {
            // center of section i
            const pos = hHero + (i + 0.5) * hSec;
            const p = pos / totalHeight;
            c.push(THREE.MathUtils.clamp(p, 0, 1));
        }
        return c;
    }, [sectionCount, isMobile]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const { mouse, clock, size, viewport } = state;
        const pos = pointsRef.current.geometry.attributes.position.array;

        // DYNAMIC TARGET POSITIONING (Align with ScrollSections.jsx empty divs)
        let xTargetOff = 0;
        let yTargetOff = 0;

        if (!isMobile) {
            // Right column center logic:
            // container is max-w-7xl (1280px). If screen > 1280, it's centered.
            // Gap between columns is gap-20 (80px).
            // Center of right column is 340px to the right of screen center.
            const actualW = Math.min(size.width, 1280);
            const xOffPx = 0.25 * actualW + 20;
            xTargetOff = (xOffPx / size.width) * viewport.width;
            yTargetOff = -0.18 * viewport.height; // Shifted even lower for better visual alignment with card center
        } else {
            // Mobile: Adjusted lower to align better with the card content
            xTargetOff = 0;
            yTargetOff = 0.04 * viewport.height; // Slightly lower on mobile too
        }

        let target = targets.net;
        let targetColor = colors.networking;
        let dist = 1.0;
        let activeIdx = -1;

        const range = 0.12; // Tighter range for page-wide tracking
        let minDist = 1000;

        for (let i = 0; i < centers.length; i++) {
            const d = Math.abs(scrollProgress - centers[i]);
            if (d < range && d < minDist) {
                activeIdx = i;
                minDist = d;
            }
        }

        if (activeIdx !== -1) {
            target = targetModels[activeIdx % targetModels.length];
            targetColor = targetColors[activeIdx % targetColors.length];
            dist = minDist;
        }

        // Swang Factor: 0 = fully assembled, 1 = fully swang/ambient
        // Plateau: Stay fully assembled if dist < 0.05 (Page-wide units)
        const assemblyPlateau = 0.05;
        const focusFactor = THREE.MathUtils.clamp((dist - assemblyPlateau) / (range - assemblyPlateau), 0, 1);
        let ambFactor = THREE.MathUtils.smoothstep(focusFactor, 0.0, 1.0);

        // Remove top/bot fade to ensure models stay assembled even at scroll extremes
        // (ScrollSections is already offset from the very top/bottom of the page)

        // Colors
        if (materialRef.current) {
            materialRef.current.color.lerp(ambFactor > 0.5 ? colors.ambient : targetColor, 0.1);
        }

        // MOVEMENT
        const dt = Math.min(delta, 0.05);
        const t = clock.getElapsedTime();

        // Relaxed speed for swarm, SNAPPY for assembly with smooth damping
        const speed = ambFactor > 0.5 ? dt * 2.5 : dt * 6.5;

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;

            // Target Calc
            const tx = target[i3] + xTargetOff;
            const ty = target[i3 + 1] + yTargetOff;
            const tz = target[i3 + 2];

            // Flowing Sinusoidal Wave Motion (Inspired by the provided image)
            const baseX = targets.swarm[i3];
            const baseZ = targets.swarm[i3 + 2];

            // Primary wave
            const wave1 = Math.sin(t * 0.4 + baseX * 0.15 + baseZ * 0.1) * 3.5;
            // Secondary ripple for complexity
            const wave2 = Math.cos(t * 0.7 + baseX * 0.3) * 1.5;
            // Rolling depth wave
            const wave3 = Math.sin(t * 0.2 + baseZ * 0.2) * 2.0;

            const sx = baseX + Math.sin(t * 0.1 + baseZ * 0.1) * 2.0;
            const sy = targets.swarm[i3 + 1] + wave1 + wave2 + wave3;
            const sz = baseZ + Math.cos(t * 0.3 + baseX * 0.1) * 1.5;

            // Blend
            const fx = THREE.MathUtils.lerp(tx, sx, ambFactor);
            const fy = THREE.MathUtils.lerp(ty, sy, ambFactor);
            const fz = THREE.MathUtils.lerp(tz, sz, ambFactor);

            // Snappy position interpolation
            pos[i3] += (fx - pos[i3]) * speed;
            pos[i3 + 1] += (fy - pos[i3 + 1]) * speed;
            pos[i3 + 2] += (fz - pos[i3 + 2]) * speed;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Premium Mouse Rotation
        mousePos.lerp(mouse, 0.08);
        pointsRef.current.rotation.y = Math.sin(t * 0.12) * 0.08 + (mousePos.x * 0.4);
        pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.05 + (-mousePos.y * 0.3);
        pointsRef.current.rotation.z = (scrollProgress - 0.5) * 0.05;
    });

    const mat = useMemo(() => {
        const tex = makeDotTexture(128);
        return new THREE.PointsMaterial({
            map: tex,
            transparent: true,
            opacity: 0.95,
            color: "#ffffff",
            size: isMobile ? 0.09 : 0.055,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }, [isMobile]);

    return (
        <>
            <Dust count={isMobile ? 1000 : 2500} />
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={COUNT}
                        array={targets.rand} // Start scattered
                        itemSize={3}
                    />
                </bufferGeometry>
                <primitive ref={materialRef} object={mat} attach="material" />
            </points>
        </>
    );
};

export default ParticleMorph;
