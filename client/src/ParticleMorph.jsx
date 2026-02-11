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
            random[i3] = (Math.random() - 0.5) * 20;
            random[i3 + 1] = (Math.random() - 0.5) * 20;
            random[i3 + 2] = (Math.random() - 0.5) * 20;

            // --- Shape 1: Router (Networking) ---
            // Two stacked boxes
            if (i < particleCount * 0.6) {
                networking[i3] = (Math.random() - 0.5) * 4;
                networking[i3 + 1] = (Math.random() - 0.5) * 0.8;
                networking[i3 + 2] = (Math.random() - 0.5) * 3;
            } else {
                networking[i3] = (Math.random() - 0.5) * 4;
                networking[i3 + 1] = (Math.random() - 0.5) * 0.8 + 1;
                networking[i3 + 2] = (Math.random() - 0.5) * 3;
            }

            // --- Shape 2: Shield/Lock (Hacking) ---
            // Simple Shield Silhouette
            const u = Math.random();
            const v = Math.random();
            if (i < particleCount * 0.8) {
                // Shield body
                hacking[i3] = (u - 0.5) * 4 * (1 - v * 0.5);
                hacking[i3 + 1] = (v - 0.5) * 5;
                hacking[i3 + 2] = (Math.random() - 0.5) * 0.5;
            } else {
                // Shield handle/top
                hacking[i3] = Math.cos(u * Math.PI) * 1.5;
                hacking[i3 + 1] = Math.sin(u * Math.PI) * 1 + 2.5;
                hacking[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }

            // --- Shape 3: Laptop + {} (Programming) ---
            if (i < particleCount * 0.5) {
                // Laptop base
                programming[i3] = (Math.random() - 0.5) * 6;
                programming[i3 + 1] = -1.5;
                programming[i3 + 2] = (Math.random() - 0.5) * 4;
            } else if (i < particleCount * 0.9) {
                // Screen
                programming[i3] = (Math.random() - 0.5) * 6;
                programming[i3 + 1] = (Math.random() - 0.5) * 4 + 1;
                programming[i3 + 2] = -2;
            } else {
                // {} Braces
                const side = Math.random() > 0.5 ? 4 : -4;
                programming[i3] = side + (Math.random() - 0.5) * 1;
                programming[i3 + 1] = (Math.random() - 0.5) * 4;
                programming[i3 + 2] = 0;
            }
        }

        return { random, networking, hacking, programming };
    }, [particleCount]);

    // 2. Morphing Logic
    useFrame((state) => {
        if (!pointsRef.current) return;
        const positions = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        // Determine current phase based on scrollProgress (0 to 1)
        // section 1: 0 - 0.33
        // section 2: 0.33 - 0.66
        // section 3: 0.66 - 1.0

        let targetBuffer;
        let progressInSection = 0;

        if (scrollProgress < 0.33) {
            targetBuffer = targets.networking;
            progressInSection = (scrollProgress / 0.33); // 0 to 1
        } else if (scrollProgress < 0.66) {
            targetBuffer = targets.hacking;
            progressInSection = ((scrollProgress - 0.33) / 0.33);
        } else {
            targetBuffer = targets.programming;
            progressInSection = ((scrollProgress - 0.66) / 0.34);
        }

        // Intensity of assembly: peek at 50% of each section
        // 0% scattered, 50% assembled, 100% scattered/morphing
        const assemblyFactor = Math.sin(progressInSection * Math.PI);

        // Lerp between current and target
        // We use a slightly faster lerp for the initial scatter drift
        const lerpFactor = assemblyFactor < 0.1 ? 0.02 : 0.08;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Influence of target shape vs random scatter
            const targetX = targetBuffer[i3];
            const targetY = targetBuffer[i3 + 1];
            const targetZ = targetBuffer[i3 + 2];

            const scatterX = targets.random[i3];
            const scatterY = targets.random[i3 + 1];
            const scatterZ = targets.random[i3 + 2];

            // Mix based on assembly factor
            const goalX = THREE.MathUtils.lerp(scatterX, targetX, assemblyFactor);
            const goalY = THREE.MathUtils.lerp(scatterY, targetY, assemblyFactor);
            const goalZ = THREE.MathUtils.lerp(scatterZ, targetZ, assemblyFactor);

            positions[i3] += (goalX - positions[i3]) * lerpFactor;
            positions[i3 + 1] += (goalY - positions[i3 + 1]) * lerpFactor;
            positions[i3 + 2] += (goalZ - positions[i3 + 2]) * lerpFactor;

            // Add sine jiggle
            positions[i3] += Math.sin(t + i) * 0.01;
            positions[i3 + 1] += Math.cos(t + i) * 0.01;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Tilt the whole system based on mouse or scroll for parallax
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, (scrollProgress - 0.5) * Math.PI, 0.05);
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
            <pointMaterial
                size={0.12}
                color="#00e5ff"
                transparent
                opacity={0.6}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default ParticleMorph;
