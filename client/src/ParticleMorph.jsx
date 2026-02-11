import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const seeded = (seed, salt = 0) => {
    const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
};

/**
 * ParticleMorph
 * A premium WebGL particle system that morphs between shapes based on scroll progress.
 * 
 * Target Shapes:
 * 1. Router + Switch (Networking)
 * 2. Shield / Lock (Ethical Hacking)
 * 3. Laptop + {} (Programming)
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobileViewport = window.innerWidth < 1024;
    const particleCount = isMobileViewport ? 3000 : 6200;
    const sectionColors = useMemo(() => ({
        networking: new THREE.Color('#9ed8ff'),
        hacking: new THREE.Color('#b874ff'),
        programming: new THREE.Color('#84eaff')
    }), []);

    // 1. Generate Target Positions
    const targets = useMemo(() => {
        const networking = new Float32Array(particleCount * 3);
        const hacking = new Float32Array(particleCount * 3);
        const programming = new Float32Array(particleCount * 3);
        const random = new Float32Array(particleCount * 3);
        const randomRightBias = isMobileViewport ? 0 : 7.8;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const r1 = seeded(i, 1);
            const r2 = seeded(i, 2);
            const r3 = seeded(i, 3);
            const r4 = seeded(i, 4);
            const r5 = seeded(i, 5);
            const r6 = seeded(i, 6);
            const r7 = seeded(i, 7);
            const r8 = seeded(i, 8);
            const r9 = seeded(i, 9);
            const r10 = seeded(i, 10);
            const r11 = seeded(i, 11);
            const r12 = seeded(i, 12);
            const r13 = seeded(i, 13);
            const r14 = seeded(i, 14);
            const r15 = seeded(i, 15);
            const r16 = seeded(i, 16);
            const r17 = seeded(i, 17);
            const r18 = seeded(i, 18);

            // --- Random (Scatter) ---
            random[i3] = (r1 - 0.5) * 14 + randomRightBias;
            random[i3 + 1] = (r2 - 0.5) * 14;
            random[i3 + 2] = (r3 - 0.5) * 14;

            // --- Shape 1: Detailed Router (Networking) ---
            if (i < particleCount * 0.4) {
                // Main Chassis
                networking[i3] = (r4 - 0.5) * 6;
                networking[i3 + 1] = (r5 - 0.5) * 2;
                networking[i3 + 2] = (r6 - 0.5) * 4;
            } else if (i < particleCount * 0.5) {
                // Left Antenna
                networking[i3] = -2.5;
                networking[i3 + 1] = r7 * 4;
                networking[i3 + 2] = 0;
            } else if (i < particleCount * 0.6) {
                // Right Antenna
                networking[i3] = 2.5;
                networking[i3 + 1] = r8 * 4;
                networking[i3 + 2] = 0;
            } else {
                // Ethernet Ports (scattered dots on front)
                networking[i3] = (Math.round(r9 * 5) - 2.5) * 1;
                networking[i3 + 1] = (r10 - 0.5) * 0.5;
                networking[i3 + 2] = 2.1;
            }

            // --- Shape 2: Shield + Lock (Hacking) ---
            const u = r11;
            const v = r12;
            const angle = u * Math.PI * 2;

            if (i < particleCount * 0.6) {
                // Shield Body
                const x = (u - 0.5) * 6;
                const curve = 1 - Math.pow(Math.abs(x) / 3, 2);
                hacking[i3] = x;
                hacking[i3 + 1] = (v - 0.5) * 7 + (curve * 1.5);
                hacking[i3 + 2] = (r13 - 0.5) * 0.5;
            } else if (i < particleCount * 0.8) {
                // Lock Body (Circle)
                const r = 1.2 * Math.sqrt(v);
                hacking[i3] = Math.cos(angle) * r;
                hacking[i3 + 1] = Math.sin(angle) * r;
                hacking[i3 + 2] = 1;
            } else {
                // Lock Shackle (Arch)
                const r = 1.2;
                const archAngle = u * Math.PI;
                hacking[i3] = Math.cos(archAngle) * r;
                hacking[i3 + 1] = Math.sin(archAngle) * r + 1.2;
                hacking[i3 + 2] = 1;
            }

            // --- Shape 3: Laptop (Programming) ---
            if (i < particleCount * 0.4) {
                // Keyboard Base
                programming[i3] = (r14 - 0.5) * 8;
                programming[i3 + 1] = -2;
                programming[i3 + 2] = (r15 - 0.5) * 6;
            } else if (i < particleCount * 0.8) {
                // Screen
                programming[i3] = (r16 - 0.5) * 8;
                const vert = (r17 - 0.5) * 6;
                programming[i3 + 1] = vert + 1;
                programming[i3 + 2] = -3;
            } else {
                // floating </> symbols
                const side = r18 > 0.5 ? 1 : -1;
                programming[i3] = side * (2 + seeded(i, 19) * 2);
                programming[i3 + 1] = (seeded(i, 20) - 0.5) * 3 + 1;
                programming[i3 + 2] = 2;
            }
        }

        return { random, networking, hacking, programming };
    }, [isMobileViewport, particleCount]);

    // 2. Morphing Logic
    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const positions = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let targetBuffer;
        let progressInSection = 0;
        let targetColor = sectionColors.programming;

        if (scrollProgress < 0.33) {
            targetBuffer = targets.networking;
            progressInSection = (scrollProgress / 0.33);
            targetColor = sectionColors.networking;
        } else if (scrollProgress < 0.66) {
            targetBuffer = targets.hacking;
            progressInSection = ((scrollProgress - 0.33) / 0.33);
            targetColor = sectionColors.hacking;
        } else {
            targetBuffer = targets.programming;
            progressInSection = ((scrollProgress - 0.66) / 0.34);
            targetColor = sectionColors.programming;
        }

        const assemblyFactor = Math.pow(Math.sin(progressInSection * Math.PI), 0.55);
        const baseLerp = THREE.MathUtils.clamp(delta * 1.4, 0.004, 0.03);

        // Responsive Offset: Center on mobile, shift right on desktop
        const isMobile = state.size.width < 1024;
        const xOffset = isMobile ? 0 : 6.8;
        const yOffset = isMobile ? 3.2 : -0.1;
        const attraction = baseLerp * (0.7 + assemblyFactor);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const noise = Math.sin(t * 0.45 + i * 0.11) * 0.012;

            // Move towards target (with responsive offsets)
            positions[i3] += (targetBuffer[i3] + xOffset - positions[i3]) * attraction + noise;
            positions[i3 + 1] += (targetBuffer[i3 + 1] + yOffset - positions[i3 + 1]) * attraction + noise;
            positions[i3 + 2] += (targetBuffer[i3 + 2] - positions[i3 + 2]) * attraction + noise;

            // If not assembled, move slightly towards random (scattering effect)
            if (assemblyFactor < 0.24) {
                positions[i3] += (targets.random[i3] - positions[i3]) * (baseLerp * 0.5);
                positions[i3 + 1] += (targets.random[i3 + 1] - positions[i3 + 1]) * (baseLerp * 0.5);
                positions[i3 + 2] += (targets.random[i3 + 2] - positions[i3 + 2]) * (baseLerp * 0.5);
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (materialRef.current) {
            materialRef.current.color.lerp(targetColor, 0.05);
        }

        // Dynamic rotation based on scroll (slower for a calmer feel)
        const targetRotation = (scrollProgress - 0.5) * Math.PI * 0.45;
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotation, 0.02);
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
                size={isMobileViewport ? 0.13 : 0.15}
                color="#9ed8ff"
                transparent
                opacity={0.9}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default ParticleMorph;
