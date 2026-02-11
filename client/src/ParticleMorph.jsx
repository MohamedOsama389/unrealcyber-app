import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

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
    const particleCount = window.innerWidth < 768 ? 4000 : 8000;

    // 1. Generate Target Positions
    const targets = useMemo(() => {
        const networking = new Float32Array(particleCount * 3);
        const hacking = new Float32Array(particleCount * 3);
        const programming = new Float32Array(particleCount * 3);
        const random = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // --- Random (Scatter) ---
            random[i3] = (Math.random() - 0.5) * 30;
            random[i3 + 1] = (Math.random() - 0.5) * 30;
            random[i3 + 2] = (Math.random() - 0.5) * 30;

            // --- Shape 1: Detailed Router (Networking) ---
            if (i < particleCount * 0.4) {
                // Main Chassis
                networking[i3] = (Math.random() - 0.5) * 6;
                networking[i3 + 1] = (Math.random() - 0.5) * 2;
                networking[i3 + 2] = (Math.random() - 0.5) * 4;
            } else if (i < particleCount * 0.5) {
                // Left Antenna
                networking[i3] = -2.5;
                networking[i3 + 1] = Math.random() * 4;
                networking[i3 + 2] = 0;
            } else if (i < particleCount * 0.6) {
                // Right Antenna
                networking[i3] = 2.5;
                networking[i3 + 1] = Math.random() * 4;
                networking[i3 + 2] = 0;
            } else {
                // Ethernet Ports (scattered dots on front)
                networking[i3] = (Math.round(Math.random() * 5) - 2.5) * 1;
                networking[i3 + 1] = (Math.random() - 0.5) * 0.5;
                networking[i3 + 2] = 2.1;
            }

            // --- Shape 2: Shield + Lock (Hacking) ---
            const u = Math.random();
            const v = Math.random();
            const angle = u * Math.PI * 2;

            if (i < particleCount * 0.6) {
                // Shield Body
                const x = (u - 0.5) * 6;
                const curve = 1 - Math.pow(Math.abs(x) / 3, 2);
                hacking[i3] = x;
                hacking[i3 + 1] = (v - 0.5) * 7 + (curve * 1.5);
                hacking[i3 + 2] = (Math.random() - 0.5) * 0.5;
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
                programming[i3] = (Math.random() - 0.5) * 8;
                programming[i3 + 1] = -2;
                programming[i3 + 2] = (Math.random() - 0.5) * 6;
            } else if (i < particleCount * 0.8) {
                // Screen
                programming[i3] = (Math.random() - 0.5) * 8;
                const vert = (Math.random() - 0.5) * 6;
                programming[i3 + 1] = vert + 1;
                programming[i3 + 2] = -3;
            } else {
                // floating </> symbols
                const side = Math.random() > 0.5 ? 1 : -1;
                programming[i3] = side * (2 + Math.random() * 2);
                programming[i3 + 1] = (Math.random() - 0.5) * 3 + 1;
                programming[i3 + 2] = 2;
            }
        }

        return { random, networking, hacking, programming };
    }, [particleCount]);

    // 2. Morphing Logic
    useFrame((state) => {
        if (!pointsRef.current) return;
        const positions = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let targetBuffer;
        let progressInSection = 0;

        if (scrollProgress < 0.33) {
            targetBuffer = targets.networking;
            progressInSection = (scrollProgress / 0.33);
        } else if (scrollProgress < 0.66) {
            targetBuffer = targets.hacking;
            progressInSection = ((scrollProgress - 0.33) / 0.33);
        } else {
            targetBuffer = targets.programming;
            progressInSection = ((scrollProgress - 0.66) / 0.34);
        }

        const assemblyFactor = Math.pow(Math.sin(progressInSection * Math.PI), 0.5);

        // Responsive Offset: Center on mobile, shift right on desktop
        const isMobile = window.innerWidth < 1024;
        const xOffset = isMobile ? 0 : 2.5;
        const yOffset = isMobile ? 4 : 0; // Lift up on mobile to be above the card

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const noise = Math.sin(t * 1.5 + i) * 0.05;

            // Move towards target (with responsive offsets)
            positions[i3] += (targetBuffer[i3] + xOffset - positions[i3]) * 0.05 * assemblyFactor + noise;
            positions[i3 + 1] += (targetBuffer[i3 + 1] + yOffset - positions[i3 + 1]) * 0.05 * assemblyFactor + noise;
            positions[i3 + 2] += (targetBuffer[i3 + 2] - positions[i3 + 2]) * 0.05 * assemblyFactor + noise;

            // If not assembled, move slightly towards random (scattering effect)
            if (assemblyFactor < 0.2) {
                positions[i3] += (targets.random[i3] - positions[i3]) * 0.01;
                positions[i3 + 1] += (targets.random[i3 + 1] - positions[i3 + 1]) * 0.01;
                positions[i3 + 2] += (targets.random[i3 + 2] - positions[i3 + 2]) * 0.01;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Dynamic rotation based on scroll
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, (scrollProgress - 0.5) * Math.PI * 1.5, 0.05);
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
                size={0.18}
                color="#00e5ff"
                transparent
                opacity={0.8}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default ParticleMorph;
