import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { DROP_ZONES } from '../../dnd/dndTypes';
import { calculateElectronPositions } from '../../dnd/helpers';

interface AtomCanvasProps {
    protons: number;
    neutrons: number;
    electrons: number;
    modelType: 'orbits' | 'cloud';
}

const AtomCanvas: React.FC<AtomCanvasProps> = ({ protons, neutrons, electrons, modelType }) => {
    // Drop Zones
    const { setNodeRef: setNucleusRef, isOver: isOverNucleus } = useDroppable({
        id: DROP_ZONES.NUCLEUS,
    });

    const { setNodeRef: setShellsRef, isOver: isOverShells } = useDroppable({
        id: DROP_ZONES.SHELLS,
    });

    const electronPositions = useMemo(() => calculateElectronPositions(electrons), [electrons]);

    // Simple spiral packing for nucleus
    const nucleusParticles = useMemo(() => {
        const particles = [];
        const total = protons + neutrons;
        for (let i = 0; i < total; i++) {
            const angle = i * 137.5;
            const radius = Math.sqrt(i) * 5;
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            particles.push({
                x, y,
                type: i < protons ? 'proton' : 'neutron'
            });
        }
        return particles;
    }, [protons, neutrons]);

    return (
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden select-none">

            {/* Electron Shells Drop Zone (Background) */}
            <div
                ref={setShellsRef}
                className={`absolute inset-0 transition-colors duration-200 ${isOverShells ? 'bg-blue-50/30' : ''}`}
            />

            {/* Cloud Model */}
            <AnimatePresence>
                {modelType === 'cloud' && electrons > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, rgba(59, 130, 246, ${Math.min(0.5, electrons * 0.05)}) 0%, transparent 70%)`
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Bohr Shells */}
            <div className="relative flex items-center justify-center">
                {/* Shell Outlines */}
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const radius = 60 + idx * 35;
                    const maxShellReached = electronPositions.length > 0
                        ? electronPositions[electronPositions.length - 1].shellIndex
                        : 0;

                    if (idx > maxShellReached && idx > 0) return null;

                    return (
                        <div
                            key={`shell-outline-${idx}`}
                            className="absolute rounded-full border border-slate-300 border-dashed pointer-events-none"
                            style={{ width: radius * 2, height: radius * 2 }}
                        />
                    );
                })}

                {/* Electrons */}
                {modelType === 'orbits' && electronPositions.map((pos, i) => (
                    <motion.div
                        key={`e-${i}`}
                        layoutId={`electron-${i}`}
                        initial={{ scale: 0 }}
                        animate={{
                            scale: 1,
                            x: pos.x,
                            y: pos.y,
                        }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="absolute w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full shadow-sm border border-blue-600 z-30"
                    />
                ))}

                {/* Nucleus Drop Zone */}
                <div
                    ref={setNucleusRef}
                    className={`
                        relative z-20 w-24 h-24 flex items-center justify-center rounded-full transition-all duration-200
                        ${isOverNucleus ? 'scale-125 bg-red-100/20 ring-4 ring-red-400' : ''}
                    `}
                >
                    {/* Visual Clustered Nucleus */}
                    <div className="relative">
                        {nucleusParticles.map((p, i) => (
                            <motion.div
                                key={`${p.type}-${i}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, x: p.x, y: p.y }}
                                transition={{ type: 'spring', damping: 15 }}
                                className={`
                                    absolute w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/10 shadow-sm
                                    ${p.type === 'proton' ? 'bg-red-500' : 'bg-slate-400'}
                                `}
                                style={{
                                    left: -10, top: -10 // Offset to center
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Empty State Instructions */}
            {protons === 0 && neutrons === 0 && electrons === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="text-center">
                        <p className="text-2xl font-bold font-serif text-slate-400 uppercase tracking-widest">Atom Canvas</p>
                        <p className="text-sm text-slate-400">Drag particles here to begin</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AtomCanvas;
