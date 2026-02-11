import { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, Scroll, Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Scene1DataCenter from './3d/Scene1DataCenter';
import Scene2HomeOffice from './3d/Scene2HomeOffice';
import Scene3CommandConsole from './3d/Scene3CommandConsole';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

// Helper to manage camera movement based on scroll
const CameraController = () => {
    const { camera } = useThree();
    const scrollRef = useRef(0);

    useFrame(() => {
        // We'll use the scroll data from ScrollControls if available, 
        // but for high precision we use GSAP connected to the canvas container scroll
    });

    return null;
};

const NetworkScrollExperience = ({ onCollect }) => {
    const reduced = useReducedMotion();
    const containerRef = useRef();

    if (reduced) {
        return (
            <div className="w-full h-[600px] rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center justify-center text-secondary p-8 text-center">
                <h3 className="text-xl font-bold text-primary mb-2">3D Experience Paused</h3>
                <p className="max-w-md">The interactive network journey is simplified to respect your motion preferences.</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-[800px] md:h-screen rounded-3xl border border-white/5 overflow-hidden bg-[#050811] relative">
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={45} />

                <color attach="background" args={['#050811']} />
                <fog attach="fog" args={['#050811', 10, 40]} />

                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#00e5ff" />
                <pointLight position={[-10, -10, 10]} intensity={1} color="#7c5cff" />

                <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Suspense fallback={null}>
                    <ScrollControls pages={3} damping={0.2} infinite={false}>
                        <Scroll>
                            {/* Scene 1: Data Center */}
                            <group position={[0, 0, 0]}>
                                <Scene1DataCenter onCollect={onCollect} />
                            </group>

                            {/* Scene 2: Home Office */}
                            <group position={[0, -20, -10]}>
                                <Scene2HomeOffice onCollect={onCollect} />
                            </group>

                            {/* Scene 3: Command Console */}
                            <group position={[0, -40, -20]}>
                                <Scene3CommandConsole onCollect={onCollect} />
                            </group>
                        </Scroll>

                        {/* Text/HUD Overlays for each scene */}
                        <Scroll html>
                            <div className="w-full">
                                <section className="h-screen flex items-end p-12 pointer-events-none">
                                    <div className="max-w-xs bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl pointer-events-auto">
                                        <h4 className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">Phase 01</h4>
                                        <p className="text-white text-sm">Secure the Data Center. Locate and collect core infrastructure assets.</p>
                                    </div>
                                </section>
                                <section className="h-screen flex items-end p-12 pointer-events-none">
                                    <div className="max-w-xs bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl pointer-events-auto">
                                        <h4 className="text-purple-400 font-bold uppercase tracking-widest text-xs mb-2">Phase 02</h4>
                                        <p className="text-white text-sm">Analyze endpoints. Your Home Office is the frontline of defense.</p>
                                    </div>
                                </section>
                                <section className="h-screen flex items-end p-12 pointer-events-none">
                                    <div className="max-w-xs bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl pointer-events-auto">
                                        <h4 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Phase 03</h4>
                                        <p className="text-white text-sm">Command the Flow. Master the scripts that run the world.</p>
                                    </div>
                                </section>
                            </div>
                        </Scroll>
                    </ScrollControls>
                </Suspense>
            </Canvas>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-500/70">Scroll Journey</span>
            </div>
        </div>
    );
};

export default NetworkScrollExperience;
