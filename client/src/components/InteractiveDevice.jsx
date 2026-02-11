import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Placeholder interactive device (router/switch/laptop/code).
 * Replace box geometry with GLTF models when assets are ready.
 *
 * Props:
 * - position: [x,y,z]
 * - color: string
 * - meta: { id, title, desc, type }
 * - onCollect(meta): callback when clicked
 */
const InteractiveDevice = ({ position = [0, 0, 0], color = '#00e5ff', meta, onCollect }) => {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [pulse, setPulse] = useState(0);

    // Simple unique jitter per device
    const phase = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        meshRef.current.rotation.y += 0.35 * delta;
        meshRef.current.position.y = Math.sin(t * 1.2 + phase) * 0.25 + position[1];
        // Hover glow via emissive intensity
        const mat = meshRef.current.material;
        if (mat) mat.emissiveIntensity = hovered ? 0.9 : 0.4;

        if (pulse > 0 && meshRef.current.scale) {
            const s = 1 + pulse * 0.2;
            meshRef.current.scale.setScalar(s);
            setPulse(p => p * 0.88);
        } else if (meshRef.current.scale) {
            meshRef.current.scale.setScalar(1);
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            castShadow
            receiveShadow
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={() => {
                setPulse(1);
                onCollect?.(meta);
            }}
        >
            {/* Replace with <primitive object={gltf.scene} /> when a model is available */}
            <boxGeometry args={[1.6, 0.7, 1]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.4}
                roughness={0.25}
                metalness={0.65}
            />
        </mesh>
    );
};

export default InteractiveDevice;
