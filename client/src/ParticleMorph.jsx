import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointMaterial, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

const seeded = (seed, salt = 0) => {
    const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
};

const lerp = (a, b, t) => a + (b - a) * t;

// Helper to sample points from a GLTF model
const sampleModel = (scene, count, scale, offset) => {
    const points = new Float32Array(count * 3);
    let mesh = null;

    scene.traverse((child) => {
        if (child.isMesh && !mesh) mesh = child;
    });

    if (!mesh) {
        console.warn("No mesh found in model, returning empty points.");
        return points;
    }

    const sampler = new MeshSurfaceSampler(mesh).build();
    const temp = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
        sampler.sample(temp);
        points[i * 3] = temp.x * scale + offset[0];
        points[i * 3 + 1] = temp.y * scale + offset[1];
        points[i * 3 + 2] = temp.z * scale + offset[2];
    }
    return points;
};

/**
 * ParticleMorph — 3D Model Edition
 * Replaces procedural shapes with sampled points from GLB models.
 * Models: Wi-Fi Router, Ethical Hacking Shield, Programming Laptop.
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const COUNT = isMobile ? 8000 : 15000; // Increased count for better model definition

    // Load Models (Suspends automatically)
    const { scene: netScene } = useGLTF('/models/wi-fi_router.glb');
    const { scene: hackScene } = useGLTF('/models/ethical_hacking.glb');
    const { scene: progScene } = useGLTF('/models/Programming.glb');

    const colors = useMemo(() => ({
        networking: new THREE.Color('#22d3ee'),
        hacking: new THREE.Color('#c084fc'),
        programming: new THREE.Color('#60a5fa'),
        ambient: new THREE.Color('#e2e8f0')
    }), []);

    const targets = useMemo(() => {
        const rand = new Float32Array(COUNT * 3);
        const amb = new Float32Array(COUNT * 3);

        const netS = 25.0; // Scaled for router (check visualization)
        const hackS = 0.5; // Shield might be huge, check scale
        const progS = 2.5; // Laptop scale

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
        }

        // Generate targets from models
        // Adjust offsets to center them relative to the "card" position
        // Previous procedural math had offsets, here we bake them into the points or apply at runtime.
        // Let's center the model points around (0,0,0) first, then apply offset in useFrame like before.
        // Actually, sampleModel adds offset. Let's obtain centered points first.

        const net = sampleModel(netScene, COUNT, netS, [0, -1.0, 0]);
        const hack = sampleModel(hackScene, COUNT, hackS, [0, 0, 0]);
        const prog = sampleModel(progScene, COUNT, progS, [0, -1.0, 0]);

        return { rand, amb, net, hack, prog };
    }, [isMobile, COUNT, netScene, hackScene, progScene]);

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

        // Braking Factor
        const braking = assembly > 0.9 ? 0.05 : 1.0;

        // Ambient blend logic
        const topFade = THREE.MathUtils.clamp((0.12 - scrollProgress) / 0.12, 0, 1);
        const botFade = THREE.MathUtils.clamp((scrollProgress - 0.88) / 0.12, 0, 1);
        const ambFactor = Math.max(topFade, botFade);

        // ADJUSTED OFFSET to bring closer to card
        const xOff = isMobile ? 0 : 4.5;
        const yOff = isMobile ? 3.5 : 0;

        const dt = Math.min(delta, 0.05);
        const baseSpeed = dt * 3.0;
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

            // Reduced Wave Amplitude
            const wave = Math.sin(t * 0.45 + i * 0.04) * 0.005;

            // Follow target with REDUCED lerp for smoother trails
            pos[i3] += (tx - pos[i3]) * speed * 0.8 + wave;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * speed * 0.8 + wave;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * speed * 0.8;

            // Inter-section scattering
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
                size={isMobile ? 0.06 : 0.04}
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
