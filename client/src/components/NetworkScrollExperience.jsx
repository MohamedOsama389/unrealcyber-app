import { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll, Stars, Html } from '@react-three/drei';
import InteractiveDevice from './InteractiveDevice';
import { useReducedMotion } from '../hooks/useReducedMotion';

const devices = [
    { id: 'router-1', title: 'Router', desc: 'Routing fundamentals', type: 'network', color: '#00e5ff', pos: [-4, 0, 0] },
    { id: 'switch-1', title: 'Switch', desc: 'Switching/VLANs', type: 'network', color: '#7c5cff', pos: [-1, 0, -1.5] },
    { id: 'laptop-1', title: 'Laptop', desc: 'Offense tools', type: 'ethics', color: '#ff6fff', pos: [2, 0, -2.5] },
    { id: 'code-1', title: 'Code Node', desc: 'Python & JS snippets', type: 'programming', color: '#4fc3f7', pos: [4, 0, -1] },
];

const laneY = (lane) => 0 + lane * -3.2;

const NetworkScrollExperience = ({ onCollect }) => {
    const reduced = useReducedMotion();
    const [collectedIds, setCollectedIds] = useState([]);

    const handleCollect = (meta) => {
        if (!meta || collectedIds.includes(meta.id)) return;
        setCollectedIds((prev) => [...prev, meta.id]);
        onCollect?.(meta);
    };

    const grouped = useMemo(() => ([
        devices.slice(0, 2),
        devices.slice(2),
    ]), []);

    if (reduced) {
        return (
            <div className="w-full h-[480px] rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-secondary text-sm">
                Interactive 3D journey reduced for motion preference.
            </div>
        );
    }

    return (
        <div className="w-full h-[520px] md:h-[640px] rounded-3xl border border-white/10 overflow-hidden bg-black/60">
            <Canvas camera={{ position: [0, 2, 12], fov: 45 }} shadows>
                <color attach="background" args={['#050811']} />
                <fog attach="fog" args={['#050811', 12, 26]} />
                <ambientLight intensity={0.35} />
                <pointLight position={[6, 6, 6]} intensity={1.2} color="#00e5ff" />
                <pointLight position={[-6, -4, 4]} intensity={1.0} color="#7c5cff" />

                <ScrollControls pages={grouped.length} damping={0.18}>
                    <Scroll>
                        <Stars radius={30} depth={40} count={1200} factor={2} saturation={0} fade speed={0.4} />
                        {grouped.map((laneDevices, laneIdx) => (
                            <group key={laneIdx} position={[0, laneY(laneIdx), -laneIdx * 6]}>
                                {laneDevices.map((d, idx) => (
                                    <InteractiveDevice
                                        key={d.id}
                                        position={d.pos}
                                        color={d.color}
                                        meta={d}
                                        onCollect={handleCollect}
                                    />
                                ))}
                                {/* Subtle grid plane */}
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -2]}>
                                    <planeGeometry args={[24, 24]} />
                                    <meshBasicMaterial color="#0c1324" opacity={0.35} transparent />
                                </mesh>
                            </group>
                        ))}
                    </Scroll>
                    <Scroll html>
                        {grouped.map((laneDevices, laneIdx) => (
                            <div
                                key={`html-${laneIdx}`}
                                style={{
                                    position: 'absolute',
                                    top: `${laneIdx * 100}vh`,
                                    left: 0,
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    paddingTop: '80px',
                                    pointerEvents: 'none',
                                }}
                            >
                                <div className="bg-slate-950/70 border border-white/10 rounded-2xl px-5 py-3 text-xs text-secondary shadow-lg pointer-events-auto">
                                    {laneIdx === 0 ? 'Data Center: collect routers & switches' : 'Home Office: collect endpoints & code'}
                                </div>
                            </div>
                        ))}
                    </Scroll>
                </ScrollControls>
            </Canvas>
        </div>
    );
};

export default NetworkScrollExperience;
