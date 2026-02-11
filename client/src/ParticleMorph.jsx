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
 * ParticleMorph
 * Elite WebGL particle system with section-aligned geometries based on reference images.
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobileViewport = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const particleCount = isMobileViewport ? 4000 : 9000;

    const colors = useMemo(() => ({
        networking: new THREE.Color('#5ae7ff'),
        hacking: new THREE.Color('#bf61ff'),
        programming: new THREE.Color('#4dabff'),
        ambient: new THREE.Color('#f2f8ff')
    }), []);

    const targets = useMemo(() => {
        const networking = new Float32Array(particleCount * 3);
        const hacking = new Float32Array(particleCount * 3);
        const programming = new Float32Array(particleCount * 3);
        const random = new Float32Array(particleCount * 3);
        const ambient = new Float32Array(particleCount * 3);

        const randomRightBias = isMobileViewport ? 0 : 5;
        const ambientBias = isMobileViewport ? 0 : 1;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const sr = (salt) => seeded(i, salt);

            // Scattering used between transitions.
            random[i3] = (sr(1) - 0.5) * 15 + randomRightBias;
            random[i3 + 1] = (sr(2) - 0.5) * 15;
            random[i3 + 2] = (sr(3) - 0.5) * 15;

            // Wide field for Hero and Footer.
            ambient[i3] = (sr(4) - 0.5) * 25 + ambientBias;
            ambient[i3 + 1] = (sr(5) - 0.5) * 15;
            ambient[i3 + 2] = (sr(6) - 0.5) * 15;

            // --- NETWORKING: Stacked Router/Server ---
            if (i < particleCount * 0.35) { // Bottom Box
                const [x, y, z] = sampleBoxSurface(sr(7), sr(8), sr(9), 7, 1.2, 4);
                networking[i3] = x;
                networking[i3 + 1] = y - 1.2;
                networking[i3 + 2] = z;
            } else if (i < particleCount * 0.6) { // Top Box
                const [x, y, z] = sampleBoxSurface(sr(10), sr(11), sr(12), 6.5, 1.1, 3.5);
                networking[i3] = x;
                networking[i3 + 1] = y + 0.3;
                networking[i3 + 2] = z;
            } else if (i < particleCount * 0.75) { // Antennas
                const side = sr(13) > 0.5 ? 1 : -1;
                networking[i3] = side * 1.8;
                networking[i3 + 1] = 0.8 + sr(14) * 3.5;
                networking[i3 + 2] = -0.5;
            } else if (i < particleCount * 0.9) { // Port Lights (Front)
                const layer = sr(15) > 0.5 ? 0.3 : -1;
                const slot = Math.floor(sr(16) * 12) - 6;
                networking[i3] = slot * 0.5;
                networking[i3 + 1] = layer + (sr(17) - 0.5) * 0.2;
                networking[i3 + 2] = 2.01;
            } else { // Internal Depth
                networking[i3] = (sr(18) - 0.5) * 6;
                networking[i3 + 1] = (sr(19) - 0.5) * 4;
                networking[i3 + 2] = (sr(20) - 0.5) * 3;
            }

            // --- HACKING: High-Def Shield + Lock ---
            if (i < particleCount * 0.45) { // Shield Outline
                const theta = sr(21) * Math.PI * 2;
                const r = 3 + (sr(22) - 0.5) * 0.2;
                let x = Math.cos(theta) * r;
                let y = Math.sin(theta) * r * 1.2;
                if (y < -0.5) { y *= 1.3; x *= 0.7; } // Pointy bottom
                hacking[i3] = x;
                hacking[i3 + 1] = y;
                hacking[i3 + 2] = (sr(23) - 0.5) * 0.2;
            } else if (i < particleCount * 0.7) { // Lock Body
                hacking[i3] = (sr(24) - 0.5) * 2;
                hacking[i3 + 1] = (sr(25) - 0.5) * 1.8 - 0.2;
                hacking[i3 + 2] = 0.15 + (sr(26) - 0.5) * 0.1;
            } else if (i < particleCount * 0.85) { // Lock Shackle (Arch)
                const angle = Math.PI * (0 + sr(27) * 1);
                hacking[i3] = Math.cos(angle) * 0.9;
                hacking[i3 + 1] = 0.7 + Math.sin(angle) * 1;
                hacking[i3 + 2] = 0.15;
            } else if (i < particleCount * 0.95) { // Keyhole
                if (sr(28) < 0.5) { // Circle top
                    const a = sr(29) * Math.PI * 2;
                    hacking[i3] = Math.cos(a) * 0.25;
                    hacking[i3 + 1] = -0.1 + Math.sin(a) * 0.25;
                } else { // Wedge bottom
                    hacking[i3] = (sr(30) - 0.5) * 0.15;
                    hacking[i3 + 1] = -0.3 - sr(31) * 0.4;
                }
                hacking[i3 + 2] = 0.25;
            } else { // Subtle Glow Fill
                hacking[i3] = (sr(32) - 0.5) * 6;
                hacking[i3 + 1] = (sr(33) - 0.5) * 6;
                hacking[i3 + 2] = (sr(34) - 0.5) * 4;
            }

            // --- PROGRAMMING: Isometric Laptop + Symbol ---
            if (i < particleCount * 0.3) { // Base Slab
                const [x, y, z] = sampleBoxSurface(sr(35), sr(36), sr(37), 8, 0.4, 6);
                programming[i3] = x;
                programming[i3 + 1] = -2 + (z * 0.1); // Slightly tilted
                programming[i3 + 2] = z + 1;
            } else if (i < particleCount * 0.6) { // Screen Frame
                const [x, y] = rectEdgePoint(sr(38), 7.5, 5);
                programming[i3] = x;
                programming[i3 + 1] = y + 1;
                programming[i3 + 2] = -2.5 + (y * 0.05);
            } else if (i < particleCount * 0.8) { // Screen Surface Fill
                programming[i3] = (sr(39) - 0.5) * 7;
                programming[i3 + 1] = (sr(40) - 0.5) * 4.5 + 1;
                programming[i3 + 2] = -2.48;
            } else if (i < particleCount * 0.95) { // Code Symbol </>
                const glyph = sr(41);
                let gx = 0, gy = 0;
                if (glyph < 0.4) { // <
                    const t = (glyph / 0.4);
                    gx = lerp(-1, -1.8, t < 0.5 ? t * 2 : (1 - t) * 2);
                    gy = lerp(0.8, -0.8, t);
                } else if (glyph < 0.8) { // >
                    const t = (glyph - 0.4) / 0.4;
                    gx = lerp(1, 1.8, t < 0.5 ? t * 2 : (1 - t) * 2);
                    gy = lerp(0.8, -0.8, t);
                } else { // /
                    const t = (glyph - 0.8) / 0.2;
                    gx = lerp(0.4, -0.4, t);
                    gy = lerp(1, -1, t);
                }
                programming[i3] = gx * 1.5;
                programming[i3 + 1] = gy * 1.5 + 1;
                programming[i3 + 2] = -2.4;
            } else { // Ambient Env
                programming[i3] = (sr(42) - 0.5) * 10;
                programming[i3 + 1] = (sr(43) - 0.5) * 10;
                programming[i3 + 2] = (sr(44) - 0.5) * 8;
            }
        }

        return { random, ambient, networking, hacking, programming };
    }, [isMobileViewport, particleCount]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const positions = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let targetBuffer, sectionColor;
        let progressInSection = 0;

        if (scrollProgress < 0.33) {
            targetBuffer = targets.networking;
            progressInSection = scrollProgress / 0.33;
            sectionColor = colors.networking;
        } else if (scrollProgress < 0.66) {
            targetBuffer = targets.hacking;
            progressInSection = (scrollProgress - 0.33) / 0.33;
            sectionColor = colors.hacking;
        } else {
            targetBuffer = targets.programming;
            progressInSection = (scrollProgress - 0.66) / 0.34;
            sectionColor = colors.programming;
        }

        const assemblyFactor = Math.pow(Math.sin(progressInSection * Math.PI), 0.7);
        const ambientBlend = Math.max(
            THREE.MathUtils.clamp((0.15 - scrollProgress) / 0.15, 0, 1),
            THREE.MathUtils.clamp((scrollProgress - 0.85) / 0.15, 0, 1)
        );

        const isMobile = state.size.width < 1024;
        // Desktop: Align with card on left (-4.5). Mobile: Lifted above card (3.5).
        const xOffset = isMobile ? 0 : -4.5;
        const yOffset = isMobile ? 3.5 : 0;

        const baseAttraction = delta * 1.5;
        const attraction = THREE.MathUtils.lerp(baseAttraction * (0.8 + assemblyFactor * 1.2), baseAttraction * 0.4, ambientBlend);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const wave = Math.sin(t * 0.5 + i * 0.05) * 0.05;

            const tx = THREE.MathUtils.lerp(targetBuffer[i3] + xOffset, targets.ambient[i3], ambientBlend);
            const ty = THREE.MathUtils.lerp(targetBuffer[i3 + 1] + yOffset, targets.ambient[i3 + 1], ambientBlend);
            const tz = THREE.MathUtils.lerp(targetBuffer[i3 + 2], targets.ambient[i3 + 2], ambientBlend);

            positions[i3] += (tx - positions[i3]) * attraction + wave;
            positions[i3 + 1] += (ty - positions[i3 + 1]) * attraction + wave;
            positions[i3 + 2] += (tz - positions[i3 + 2]) * attraction + wave;

            // Soft random scattering between states
            if (ambientBlend < 0.4 && assemblyFactor < 0.25) {
                positions[i3] += (targets.random[i3] - positions[i3]) * 0.01;
                positions[i3 + 1] += (targets.random[i3 + 1] - positions[i3 + 1]) * 0.01;
                positions[i3 + 2] += (targets.random[i3 + 2] - positions[i3 + 2]) * 0.01;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            materialRef.current.color.lerp(ambientBlend > 0.5 ? colors.ambient : sectionColor, 0.05);
        }

        const targetRot = isMobile ? 0 : (scrollProgress - 0.5) * 0.8;
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRot, 0.02);
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={targets.random}
                    itemSize={3}
                />
            </bufferGeometry>
            <PointMaterial
                ref={materialRef}
                size={isMobileViewport ? 0.09 : 0.12}
                color="#ffffff"
                transparent
                opacity={0.9}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default ParticleMorph;
