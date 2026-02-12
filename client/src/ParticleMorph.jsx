import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const seeded = (seed, salt = 0) => {
    const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
};

const lerp = (a, b, t) => a + (b - a) * t;

const sampleBoxSurface = (a, b, c, width, height, depth) => {
    const face = Math.floor(a * 6);
    const u = b - 0.5;
    const v = c - 0.5;
    const hw = width * 0.5;
    const hh = height * 0.5;
    const hd = depth * 0.5;
    switch (face) {
        case 0: return [hw, u * height, v * depth];
        case 1: return [-hw, u * height, v * depth];
        case 2: return [u * width, hh, v * depth];
        case 3: return [u * width, -hh, v * depth];
        case 4: return [u * width, v * height, hd];
        default: return [u * width, v * height, -hd];
    }
};

const rectEdgePoint = (t, width, height) => {
    const p = (t % 1) * 4;
    const hw = width * 0.5;
    const hh = height * 0.5;
    if (p < 1) return [-hw + p * width, -hh];
    if (p < 2) return [hw, -hh + (p - 1) * height];
    if (p < 3) return [hw - (p - 2) * width, hh];
    return [-hw, hh - (p - 3) * height];
};

/**
 * ParticleMorph — Snappy Assembly Edition.
 * Procedural silhouettes with high-collection physics.
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const COUNT = isMobile ? 6000 : 12000;

    const colors = useMemo(() => ({
        networking: new THREE.Color('#22d3ee'),
        hacking: new THREE.Color('#c084fc'),
        programming: new THREE.Color('#60a5fa'),
        ambient: new THREE.Color('#e2e8f0')
    }), []);

    const targets = useMemo(() => {
        const net = new Float32Array(COUNT * 3);
        const hack = new Float32Array(COUNT * 3);
        const prog = new Float32Array(COUNT * 3);
        const rand = new Float32Array(COUNT * 3);
        const amb = new Float32Array(COUNT * 3);

        const netS = 1.5;
        const hackS = 1.5;
        const progS = 1.6;

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            const sr = (salt) => seeded(i, salt);

            // Scattered / Random Field
            rand[i3] = (sr(1) - 0.5) * 22 + (isMobile ? 0 : 6);
            rand[i3 + 1] = (sr(2) - 0.5) * 16;
            rand[i3 + 2] = (sr(3) - 0.5) * 14;

            // Ambient / Relaxed Field
            amb[i3] = (sr(4) - 0.5) * 30 + (isMobile ? 0 : 4);
            amb[i3 + 1] = (sr(5) - 0.5) * 20;
            amb[i3 + 2] = (sr(6) - 0.5) * 15;

            // NETWORKING — Stacked Router
            const netFrac = i / COUNT;
            if (netFrac < 0.25) {
                const [x, y, z] = sampleBoxSurface(sr(7), sr(8), sr(9), 5.5 * netS, 1.0 * netS, 3.2 * netS);
                net[i3] = x;
                net[i3 + 1] = y - (1.4 * netS);
                net[i3 + 2] = z;
            } else if (netFrac < 0.50) {
                const [x, y, z] = sampleBoxSurface(sr(10), sr(11), sr(12), 5.0 * netS, 0.9 * netS, 2.8 * netS);
                net[i3] = x;
                net[i3 + 1] = y + (0.1 * netS);
                net[i3 + 2] = z;
            } else if (netFrac < 0.62) {
                // Left antenna
                net[i3] = -1.6 * netS + (sr(13) - 0.5) * 0.1;
                net[i3 + 1] = 0.5 * netS + sr(14) * 4.5;
                net[i3 + 2] = (sr(15) - 0.5) * 0.1;
            } else if (netFrac < 0.74) {
                // Right antenna
                net[i3] = 1.6 * netS + (sr(16) - 0.5) * 0.1;
                net[i3 + 1] = 0.5 * netS + sr(17) * 4.5;
                net[i3 + 2] = (sr(18) - 0.5) * 0.1;
            } else {
                // LED ports
                const onTop = sr(19) > 0.5;
                const row = onTop ? 0.1 : -1.4;
                const slot = Math.floor(sr(20) * 12);
                net[i3] = (-2.5 + slot * 0.45) * netS;
                net[i3 + 1] = (row + (sr(21) - 0.5) * 0.3) * netS;
                net[i3 + 2] = (onTop ? 1.41 : 1.61) * netS;
            }

            // HACKING — Refined Heraldic Shield + Lock
            const hackFrac = i / COUNT;
            if (hackFrac < 0.45) {
                // HERALDIC SHIELD OUTLINE
                const t = sr(22);
                let x, y;
                if (t < 0.25) { // Top Arch
                    const a = (t / 0.25) * Math.PI;
                    x = Math.cos(a) * 3;
                    y = 1.5 + Math.sin(a) * 0.4;
                } else if (t < 0.4) { // Right Straight
                    x = 3;
                    y = lerp(1.5, -0.8, (t - 0.25) / 0.15);
                } else if (t < 0.6) { // Bottom Point Right
                    const v = (t - 0.4) / 0.2;
                    x = lerp(3, 0, v);
                    y = lerp(-0.8, -4.2, v);
                } else if (t < 0.8) { // Bottom Point Left
                    const v = (t - 0.6) / 0.2;
                    x = lerp(0, -3, v);
                    y = lerp(-4.2, -0.8, v);
                } else { // Left Straight
                    x = -3;
                    y = lerp(-0.8, 1.5, (t - 0.8) / 0.2);
                }
                hack[i3] = x * hackS + (sr(23) - 0.5) * 0.1;
                hack[i3 + 1] = y * hackS + (sr(24) - 0.5) * 0.1;
                hack[i3 + 2] = (sr(25) - 0.5) * 0.3;
            } else if (hackFrac < 0.72) {
                // Lock Body
                const bw = 1.8 * hackS, bh = 1.3 * hackS;
                const fill = sr(26) < 0.65;
                const [ex, ey] = rectEdgePoint(sr(27), bw, bh);
                hack[i3] = fill ? (sr(28) - 0.5) * bw : ex;
                hack[i3 + 1] = (fill ? (sr(29) - 0.5) * bh : ey) - (0.5 * hackS);
                hack[i3 + 2] = 0.2;
            } else {
                // Arch
                const a = sr(30) * Math.PI;
                const ar = 0.8 * hackS + (sr(31) - 0.5) * 0.15;
                hack[i3] = Math.cos(a) * ar;
                hack[i3 + 1] = 0.2 * hackS + Math.sin(a) * ar;
                hack[i3 + 2] = 0.2;
            }

            // PROGRAMMING — Laptop
            const progFrac = i / COUNT;
            if (progFrac < 0.25) {
                // Base
                const [x, y, z] = sampleBoxSurface(sr(32), sr(33), sr(34), 7 * progS, 0.4 * progS, 4.5 * progS);
                prog[i3] = x;
                prog[i3 + 1] = -2.5 * progS + y;
                prog[i3 + 2] = z + (1.2 * progS);
            } else if (progFrac < 0.60) {
                // Screen Frame
                const [ex, ey] = rectEdgePoint(sr(35), 6.5 * progS, 4.5 * progS);
                prog[i3] = ex;
                prog[i3 + 1] = ey + 0.8;
                prog[i3 + 2] = -2.0;
            } else if (progFrac < 0.90) {
                // Code Symbol </>
                const g = sr(36);
                let gx = 0, gy = 0;
                if (g < 0.35) { // < 
                    const t = g / 0.35;
                    const peak = t < 0.5 ? t * 2 : (1 - t) * 2;
                    gx = lerp(-0.3, -1.6, peak); gy = lerp(1.3, -1.3, t);
                } else if (g < 0.5) { // /
                    const t = (g - 0.36) / 0.15;
                    gx = lerp(0.5, -0.5, t); gy = lerp(1.3, -1.3, t);
                } else { // >
                    const t = (g - 0.5) / 0.5;
                    const peak = t < 0.5 ? t * 2 : (1 - t) * 2;
                    gx = lerp(0.3, 1.6, peak); gy = lerp(1.3, -1.3, t);
                }
                prog[i3] = gx * 1.3 * progS;
                prog[i3 + 1] = gy * 1.1 * progS + 0.8;
                prog[i3 + 2] = -1.9;
            } else {
                // Screen Surface
                prog[i3] = (sr(37) - 0.5) * 6 * progS;
                prog[i3 + 1] = (sr(38) - 0.5) * 4 * progS + 0.8;
                prog[i3 + 2] = -1.98;
            }
        }

        return { rand, amb, net, hack, prog };
    }, [isMobile, COUNT]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const pos = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let target, color;
        let progress = 0;

        // Assembly Mapping
        if (scrollProgress < 0.45) {
            target = targets.net;
            progress = scrollProgress / 0.45;
            color = colors.networking;
        } else if (scrollProgress < 0.75) {
            target = targets.hack;
            progress = (scrollProgress - 0.45) / 0.30;
            color = colors.hacking;
        } else {
            target = targets.prog;
            progress = (scrollProgress - 0.75) / 0.25;
            color = colors.programming;
        }

        // SNAPPY ASSEMBLY: Sharp sin power (0.3) makes the collection snap to target and hold longer
        const assembly = Math.pow(Math.sin(progress * Math.PI), 0.3);

        // Ambient blend logic
        const topFade = THREE.MathUtils.clamp((0.15 - scrollProgress) / 0.15, 0, 1);
        const botFade = THREE.MathUtils.clamp((scrollProgress - 0.85) / 0.15, 0, 1);
        const ambFactor = Math.max(topFade, botFade);

        const xOff = isMobile ? 0 : 6.5;
        const yOff = isMobile ? 3.5 : 0;

        const dt = Math.min(delta, 0.05);
        const baseSpeed = dt * 2.5;
        // High shapeSpeed for aggressive snap (x6.5)
        const shapeSpeed = baseSpeed * (1.0 + assembly * 6.5);
        const driftSpeed = baseSpeed * 0.4;
        const speed = lerp(shapeSpeed, driftSpeed, ambFactor);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            // Target blend
            const sx = target[i3] + xOff;
            const sy = target[i3 + 1] + yOff;
            const sz = target[i3 + 2];

            const ax = targets.amb[i3];
            const ay = targets.amb[i3 + 1];
            const az = targets.amb[i3 + 2];

            const tx = lerp(sx, ax, ambFactor);
            const ty = lerp(sy, ay, ambFactor);
            const tz = lerp(sz, az, ambFactor);

            const wave = Math.sin(t * 0.4 + i * 0.04) * 0.015;

            // Follow target
            pos[i3] += (tx - pos[i3]) * speed + wave;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * speed + wave;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * speed;

            // Scatter logic: snap out when not assembling
            if (ambFactor < 0.2 && assembly < 0.05) {
                const sc = baseSpeed * 0.65;
                pos[i3] += (targets.rand[i3] - pos[i3]) * sc;
                pos[i3 + 1] += (targets.rand[i3 + 1] - pos[i3 + 1]) * sc;
                pos[i3 + 2] += (targets.rand[i3 + 2] - pos[i3 + 2]) * sc;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            materialRef.current.color.lerp(ambFactor > 0.6 ? colors.ambient : color, 0.08);
        }

        // Subdued Rotation
        const rotX = Math.sin(t * 0.2) * 0.04;
        const rotY = (scrollProgress - 0.5) * 1.0;
        pointsRef.current.rotation.set(rotX, rotY, 0);
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={COUNT}
                    array={targets.rand}
                    itemSize={3}
                />
            </bufferGeometry>
            <PointMaterial
                ref={materialRef}
                size={isMobile ? 0.08 : 0.05}
                color="#ffffff"
                transparent
                opacity={0.92}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

export default ParticleMorph;
