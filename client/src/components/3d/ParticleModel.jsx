import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';

/**
 * ParticleModel
 * Converts a GLB model into a high-fidelity particle silhouette.
 * Features:
 * - 35,000 sampled points from mesh surfaces
 * - Cyan #00E5FF glow with additive blending
 * - Subtle floating and rotation animations
 * - 1,500 ambient dust particles
 */
const ParticleModel = () => {
    const { scene } = useGLTF('/models/wi-fi_router.glb');
    const pointsRef = useRef();
    const dustRef = useRef();

    const { particles, dust } = useMemo(() => {
        const meshes = [];
        scene.traverse((child) => {
            if (child.isMesh) {
                // Ensure geometry is ready for sampling
                if (!child.geometry.attributes.position) return;
                meshes.push(child);
            }
        });

        const totalPoints = 35000;
        const positions = new Float32Array(totalPoints * 3);

        if (meshes.length === 0) return { particles: null, dust: null };

        // Sample points from all meshes
        const pointsPerMesh = Math.floor(totalPoints / meshes.length);
        let currentIdx = 0;

        const tempPosition = new THREE.Vector3();

        meshes.forEach((mesh) => {
            // Apply world matrix to geometry for correct sampling if needed, 
            // but MeshSurfaceSampler uses the mesh's current state.
            // We'll update world matrix just in case.
            mesh.updateMatrixWorld();

            const sampler = new MeshSurfaceSampler(mesh).build();

            for (let i = 0; i < pointsPerMesh; i++) {
                sampler.sample(tempPosition);
                // Transform point to world space to match the silhouette accurately
                tempPosition.applyMatrix4(mesh.matrixWorld);

                positions[currentIdx * 3] = tempPosition.x;
                positions[currentIdx * 3 + 1] = tempPosition.y;
                positions[currentIdx * 3 + 2] = tempPosition.z;
                currentIdx++;
            }
        });

        // Dust particles for atmosphere
        const dustCount = 1500;
        const dustPositions = new Float32Array(dustCount * 3);
        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 12;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
        }

        return {
            particles: new THREE.BufferAttribute(positions, 3),
            dust: new THREE.BufferAttribute(dustPositions, 3)
        };
    }, [scene]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Silhouette animation
        if (pointsRef.current) {
            pointsRef.current.rotation.y = t * 0.15;
            pointsRef.current.position.y = Math.sin(t * 0.4) * 0.15;

            // Subtle pulse
            const s = 1 + Math.sin(t * 0.8) * 0.02;
            pointsRef.current.scale.set(s, s, s);
        }

        // Dust animation
        if (dustRef.current) {
            dustRef.current.rotation.y = t * 0.05;
            dustRef.current.rotation.x = t * 0.02;
        }
    });

    if (!particles) return null;

    return (
        <group>
            {/* Main Object Particles */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        {...particles}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.025}
                    color="#00E5FF"
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    sizeAttenuation={true}
                />
            </points>

            {/* Ambient Dust */}
            <points ref={dustRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        {...dust}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.012}
                    color="#00E5FF"
                    transparent
                    opacity={0.3}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    sizeAttenuation={true}
                />
            </points>
        </group>
    );
};

// Preload the model asset
useGLTF.preload('/models/wi-fi_router.glb');

export default ParticleModel;
