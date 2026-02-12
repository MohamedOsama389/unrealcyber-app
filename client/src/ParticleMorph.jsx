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
 * ParticleMorph — Final Calibrated Edition.
 * Re-aligned thresholds (0.33, 0.66, 1.0) to match visual centers.
 * High-collection physics and heraldic security silhouette.
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

        const netS = 1.6;
        const hackS = 1.6;
        const progS = 1.7;

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            const sr = (salt) => seeded(i, salt);

            // Scattered / Random Field — Used between sections
            rand[i3] = (sr(1) - 0.5) * 25 + (isMobile ? 0 : 6);
            rand[i3 + 1] = (sr(2) - 0.5) * 18;
            rand[i3 + 2] = (sr(3) - 0.5) * 15;

            // Ambient / Relaxed Field — Used at top/bottom
            amb[i3] = (sr(4) - 0.5) * 35 + (isMobile ? 0 : 5);
            amb[i3 + 1] = (sr(5) - 0.5) * 22;
            amb[i3 + 2] = (sr(6) - 0.5) * 15;

            // NETWORKING — Stacked High-Tech Router
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

            // HACKING — DENSE SHIELD + SOLID PADLOCK
            // Double outline for shield
            const hackFrac = i / COUNT;
            if (hackFrac < 0.5) {
                // SHIELD SILHOUETTE (Inner & Outer Layer)
                const t = sr(22);
                const layer = sr(22.1) > 0.5 ? 1.0 : 0.92; // Two distinct layers
                let x, y;
                if (t < 0.2) { // Top Flat Edge with slight arch
                    x = lerp(-3.2, 3.2, t / 0.2);
                    y = 1.8 + Math.sin((t / 0.2) * Math.PI) * 0.2;
                } else if (t < 0.4) { // Right Straight Side
                    x = 3.2;
                    y = lerp(1.8, -1.0, (t - 0.2) / 0.2);
                } else if (t < 0.6) { // Bottom Point Right
                    const v = (t - 0.4) / 0.2;
                    x = lerp(3.2, 0, v);
                    y = lerp(-1.0, -4.8, v);
                } else if (t < 0.8) { // Bottom Point Left
                    const v = (t - 0.6) / 0.2;
                    x = lerp(0, -3.2, v);
                    y = lerp(-4.8, -1.0, v);
                } else { // Left Straight Side
                    x = -3.2;
                    y = lerp(-1.0, 1.8, (t - 0.8) / 0.2);
                }
                hack[i3] = x * hackS * layer + (sr(23) - 0.5) * 0.1;
                hack[i3 + 1] = y * hackS * layer + (sr(24) - 0.5) * 0.1;
                hack[i3 + 2] = (sr(25) - 0.5) * 0.2;
            } else if (hackFrac < 0.85) {
                // Padlock Body - GRID FILL
                const bw = 1.8 * hackS, bh = 1.4 * hackS;
                // Grid distribution approx
                const gx = Math.floor(sr(26) * 20) / 20;
                const gy = Math.floor(sr(27) * 15) / 15;

                const [ex, ey] = rectEdgePoint(sr(27.1), bw, bh);
                const fill = sr(26.1) < 0.8; // High fill rate

                hack[i3] = fill ? (gx - 0.5) * bw : ex;
                hack[i3 + 1] = (fill ? (gy - 0.5) * bh : ey) - (0.6 * hackS);
                hack[i3 + 2] = 0.3;
            } else {
                // Shackle - Thick
                const a = sr(30) * Math.PI;
                const thickness = sr(30.1) * 0.3;
                const ar = (0.8 + thickness * 0.15) * hackS;
                hack[i3] = Math.cos(a) * ar;
                hack[i3 + 1] = 0.15 * hackS + Math.sin(a) * ar;
                hack[i3 + 2] = 0.3;
            }

            // PROGRAMMING — Tech Laptop
            const progFrac = i / COUNT;
            if (progFrac < 0.25) {
                // Base
                const [x, y, z] = sampleBoxSurface(sr(32), sr(33), sr(34), 7.2 * progS, 0.4 * progS, 4.8 * progS);
                prog[i3] = x;
                prog[i3 + 1] = -2.8 * progS + y;
                prog[i3 + 2] = z + (1.3 * progS);
            } else if (progFrac < 0.60) {
                // Screen Frame
                const [ex, ey] = rectEdgePoint(sr(35), 6.8 * progS, 4.8 * progS);
                prog[i3] = ex;
                prog[i3 + 1] = ey + 1.0;
                prog[i3 + 2] = -2.2;
            } else if (progFrac < 0.90) {
                // Code Symbol </>
                const g = sr(36);
                let gx = 0, gy = 0;
                if (g < 0.35) { // < 
                    const t = g / 0.35;
                    const peak = t < 0.5 ? t * 2 : (1 - t) * 2;
                    gx = lerp(-0.4, -1.8, peak); gy = lerp(1.4, -1.4, t);
                } else if (g < 0.5) { // /
                    const t = (g - 0.36) / 0.15;
                    gx = lerp(0.6, -0.6, t); gy = lerp(1.4, -1.4, t);
                } else { // >
                    const t = (g - 0.5) / 0.5;
                    const peak = t < 0.5 ? t * 2 : (1 - t) * 2;
                    gx = lerp(0.4, 1.8, peak); gy = lerp(1.4, -1.4, t);
                }
                prog[i3] = gx * 1.4 * progS;
                prog[i3 + 1] = gy * 1.2 * progS + 1.0;
                prog[i3 + 2] = -2.1;
            } else {
                // Screen Surface
                prog[i3] = (sr(37) - 0.5) * 6.3 * progS;
                prog[i3 + 1] = (sr(38) - 0.5) * 4.3 * progS + 1.0;
                prog[i3 + 2] = -2.18;
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

        // CALIBRATED MAPPING
        if (scrollProgress < 0.33) {
            target = targets.net;
            progress = scrollProgress / 0.33;
            color = colors.networking;
        } else if (scrollProgress < 0.66) {
            target = targets.hack;
            progress = (scrollProgress - 0.33) / 0.33;
            color = colors.hacking;
        } else {
            target = targets.prog;
            progress = (scrollProgress - 0.66) / 0.34;
            color = colors.programming;
        }

        // AGGRESSIVE ASSEMBLY BUT SMOOTH BRAKING
        const assembly = Math.pow(Math.sin(progress * Math.PI), 0.25);

        // Braking Factor: If assembly is high (>0.9), slow down drastically to lock shape
        const braking = assembly > 0.9 ? 0.05 : 1.0;

        // Ambient blend logic
        const topFade = THREE.MathUtils.clamp((0.12 - scrollProgress) / 0.12, 0, 1);
        const botFade = THREE.MathUtils.clamp((scrollProgress - 0.88) / 0.12, 0, 1);
        const ambFactor = Math.max(topFade, botFade);

        // ADJUSTED OFFSET: 4.5 to bring closer to card (was 6.5)
        const xOff = isMobile ? 0 : 4.5;
        const yOff = isMobile ? 3.5 : 0;

        const dt = Math.min(delta, 0.05);
        const baseSpeed = dt * 3.0;
        // Peak speed 5.0 (was 8.5), applied with braking
        const shapeSpeed = baseSpeed * (1.2 + assembly * 5.0) * braking;
        const driftSpeed = baseSpeed * 0.45;
        const speed = lerp(shapeSpeed, driftSpeed, ambFactor);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            // Target
            const sx = target[i3] + xOff;
            const sy = target[i3 + 1] + yOff;
            const sz = target[i3 + 2];

            const ax = targets.amb[i3];
            const ay = targets.amb[i3 + 1];
            const az = targets.amb[i3 + 2];

            const tx = lerp(sx, ax, ambFactor);
            const ty = lerp(sy, ay, ambFactor);
            const tz = lerp(sz, az, ambFactor);

            // Reduced Wave Amplitude (Noise) for stability
            const wave = Math.sin(t * 0.45 + i * 0.04) * 0.005;

            // Follow target with REDUCED lerp for smoother trails (0.05 vs 0.1)
            pos[i3] += (tx - pos[i3]) * speed * 0.8 + wave;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * speed * 0.8 + wave;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * speed * 0.8;

            // Inter-section scattering: Aggressive dispersal
            if (ambFactor < 0.15 && assembly < 0.05) {
                const sc = baseSpeed * 0.75;
                pos[i3] += (targets.rand[i3] - pos[i3]) * sc;
                pos[i3 + 1] += (targets.rand[i3 + 1] - pos[i3 + 1]) * sc;
                pos[i3 + 2] += (targets.rand[i3 + 2] - pos[i3 + 2]) * sc;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            materialRef.current.color.lerp(ambFactor > 0.65 ? colors.ambient : color, 0.1);
        }

        // Subdued Rotation
        const rotX = Math.sin(t * 0.18) * 0.035;
        const rotY = (scrollProgress - 0.5) * 0.8;
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
