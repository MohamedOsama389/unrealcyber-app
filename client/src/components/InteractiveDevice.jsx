import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Outlines } from '@react-three/drei';

/**
 * Interactive 3D object for the scroll journey.
 * 
 * Props:
 * - position: [x,y,z]
 * - color: string
 * - meta: { id, title, type }
 * - onCollect(meta): callback for collection
 */
const InteractiveDevice = ({ position = [0, 0, 0], color = '#00e5ff', meta, onCollect }) => {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [collected, setCollected] = useState(false);
    const [animationState, setAnimationState] = useState('idle'); // idle, collecting

    useFrame((state, delta) => {
        if (!meshRef.current || collected) return;

        const t = state.clock.getElapsedTime();

        if (animationState === 'idle') {
            // Floating animation
            meshRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.15;
            meshRef.current.rotation.y += delta * 0.5;

            // Subtle scale pulse on hover
            const s = hovered ? 1.1 : 1.0;
            meshRef.current.scale.lerp({ x: s, y: s, z: s }, 0.1);
        } else if (animationState === 'collecting') {
            // Spin and shrink animation
            meshRef.current.rotation.y += delta * 20;
            meshRef.current.scale.lerp({ x: 0, y: 0, z: 0 }, 0.15);

            if (meshRef.current.scale.x < 0.01) {
                setCollected(true);
            }
        }
    });

    const handleClick = (e) => {
        e.stopPropagation();
        if (collected || animationState === 'collecting') return;

        setAnimationState('collecting');
        onCollect?.(meta);
    };

    if (collected) return null;

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onClick={handleClick}
                onPointerOver={() => (document.body.style.cursor = 'pointer', setHovered(true))}
                onPointerOut={() => (document.body.style.cursor = 'default', setHovered(false))}
                castShadow
            >
                {/* Visual Representation based on type */}
                {meta.type === 'network' ? (
                    <boxGeometry args={[1.5, 0.4, 1.2]} />
                ) : meta.type === 'ethics' ? (
                    <boxGeometry args={[1.8, 0.1, 1.3]} />
                ) : (
                    <octahedronGeometry args={[0.8]} />
                )}

                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 2 : 0.5}
                    roughness={0.1}
                    metalness={0.8}
                />

                {/* High-quality hover outline */}
                {hovered && <Outlines thickness={0.05} color="white" />}
            </mesh>

            {/* Floating label on hover */}
            {hovered && !collected && (
                <Html position={[0, 1.5, 0]} center>
                    <div className="px-3 py-1 bg-black/80 border border-white/20 rounded-lg backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
                            Collect {meta.title}
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
};

export default InteractiveDevice;
