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

        // Intensity of assembly: peek at 50% of each section
        // Use a power of sin to make the assembly "linger" longer at the peak
        const assemblyFactor = Math.pow(Math.sin(progressInSection * Math.PI), 0.5);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Influence of target shape vs random scatter
            const noise = Math.sin(t * 1.5 + i) * 0.05;

            // Move towards target
            positions[i3] += (targetBuffer[i3] - positions[i3]) * 0.05 * assemblyFactor + noise;
            positions[i3 + 1] += (targetBuffer[i3 + 1] - positions[i3 + 1]) * 0.05 * assemblyFactor + noise;
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
