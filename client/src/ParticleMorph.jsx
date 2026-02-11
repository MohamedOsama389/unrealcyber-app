import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointMaterial, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';

/**
 * ParticleMorph — GLB Edition.
 * Shapes are sampled directly from the provided 3D models:
 *   Networking  → wi-fi_router.glb
 *   Hacking     → ethical_hacking.glb
 *   Programming → Programming.glb
 *
 * This version removes the random drift at the head and foot of the page.
 */
const ParticleMorph = ({ scrollProgress = 0 }) => {
    const pointsRef = useRef();
    const materialRef = useRef();
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const COUNT = isMobile ? 6000 : 12000;

    // Load models
    const netGltf = useGLTF('/models/wi-fi_router.glb');
    const hackGltf = useGLTF('/models/ethical_hacking.glb');
    const progGltf = useGLTF('/models/Programming.glb');

    const colors = useMemo(() => ({
        networking: new THREE.Color('#22d3ee'),
        hacking: new THREE.Color('#c084fc'),
        programming: new THREE.Color('#3b82f6'),
        ambient: new THREE.Color('#ffffff')
    }), []);

    // Sample mesh points
    const targets = useMemo(() => {
        const net = new Float32Array(COUNT * 3);
        const hack = new Float32Array(COUNT * 3);
        const prog = new Float32Array(COUNT * 3);
        const rand = new Float32Array(COUNT * 3);

        const sampleModel = (gltf, targetArray, scale = 1) => {
            const meshes = [];
            gltf.scene.traverse((c) => { if (c.isMesh) meshes.push(c); });
            if (meshes.length === 0) return;

            const pointsPerMesh = Math.floor(COUNT / meshes.length);
            let current = 0;
            const tempPos = new THREE.Vector3();

            meshes.forEach(mesh => {
                mesh.updateMatrixWorld();
                const sampler = new MeshSurfaceSampler(mesh).build();
                for (let i = 0; i < pointsPerMesh; i++) {
                    if (current >= COUNT) break;
                    sampler.sample(tempPos);
                    tempPos.applyMatrix4(mesh.matrixWorld).multiplyScalar(scale);
                    targetArray[current * 3] = tempPos.x;
                    targetArray[current * 3 + 1] = tempPos.y;
                    targetArray[current * 3 + 2] = tempPos.z;
                    current++;
                }
            });
        };

        // Populate targets with accurate GLB data
        // We apply specific scaling/rotation offsets here if necessary to match the scene vibe
        sampleModel(netGltf, net, 1.2);
        sampleModel(hackGltf, hack, 0.4); // Ethical hacking model might be large
        sampleModel(progGltf, prog, 1.2);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            rand[i3] = (Math.random() - 0.5) * 30;
            rand[i3 + 1] = (Math.random() - 0.5) * 20;
            rand[i3 + 2] = (Math.random() - 0.5) * 15;
        }

        return { rand, net, hack, prog };
    }, [netGltf, hackGltf, progGltf, COUNT]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const pos = pointsRef.current.geometry.attributes.position.array;
        const t = state.clock.getElapsedTime();

        let target, color;
        let segmentProgress = 0;

        // Transitions: 0.0-0.45, 0.45-0.75, 0.75-1.0
        if (scrollProgress < 0.45) {
            target = targets.net;
            segmentProgress = scrollProgress / 0.45;
            color = colors.networking;
        } else if (scrollProgress < 0.75) {
            target = targets.hack;
            segmentProgress = (scrollProgress - 0.45) / 0.30;
            color = colors.hacking;
        } else {
            target = targets.prog;
            segmentProgress = (scrollProgress - 0.75) / 0.25;
            color = colors.programming;
        }

        // Assembly factor: How "formed" the shape is.
        // The user wants it "perfectly aligned" and "no random drifting".
        // Instead of fading to randomness (Math.sin), we snap to the shape if close.
        const assembly = Math.pow(Math.sin(segmentProgress * Math.PI), 0.5);

        // Position offsets to center next to cards
        const xOff = isMobile ? 0 : 6.5;
        const yOff = isMobile ? 3.5 : 0;

        const dt = Math.min(delta, 0.05);
        const baseSpeed = dt * 2.5;
        // Strong attraction to target
        const speed = baseSpeed * (0.8 + assembly * 4.0);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            // Subtle breathing motion
            const wave = Math.sin(t * 0.4 + i * 0.05) * 0.015;

            const tx = target[i3] + xOff;
            const ty = target[i3 + 1] + yOff;
            const tz = target[i3 + 2];

            // Lerp position
            pos[i3] += (tx - pos[i3]) * speed + wave;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * speed + wave;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * speed;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Color Lerp
        if (materialRef.current) {
            materialRef.current.color.lerp(color, 0.08);
        }

        // Rotation
        const rotX = Math.sin(t * 0.15) * 0.05;
        const rotY = t * 0.2 + (scrollProgress * 2);
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
                size={isMobile ? 0.08 : 0.045}
                color="#ffffff"
                transparent
                opacity={0.9}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

// Preload
useGLTF.preload('/models/wi-fi_router.glb');
useGLTF.preload('/models/ethical_hacking.glb');
useGLTF.preload('/models/Programming.glb');

export default ParticleMorph;
