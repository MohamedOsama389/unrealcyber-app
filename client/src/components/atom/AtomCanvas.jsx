import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const AtomCanvas = ({ protons, neutrons, electrons, modelType }) => {

    // --- Render Helpers ---

    const renderNucleus = () => {
        // Dynamic scaling of nucleus cluster based on particle count
        const totalParticles = protons + neutrons;
        const radius = Math.max(20, Math.sqrt(totalParticles) * 8);

        const particles = [];

        // Seeded random-ish placement for stability in visuals (re-calc on update is fine)
        const generatePosition = (i) => {
            const angle = i * 137.5; // Golden angle
            const dist = Math.sqrt(i) * 6; // Phyllotaxis spiral
            return {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            };
        };

        // Interleave protons and neutrons for a mixed nucleus look
        let pCount = protons;
        let nCount = neutrons;
        let index = 0;

        while (pCount > 0 || nCount > 0) {
            if (pCount > 0) {
                const pos = generatePosition(index);
                particles.push(
                    <motion.div
                        key={`p-${index}`}
                        layoutId={`p-${index}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                        className="absolute w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 border border-red-700 shadow-sm z-10"
                    />
                );
                pCount--;
                index++;
            }
            if (nCount > 0) {
                const pos = generatePosition(index);
                particles.push(
                    <motion.div
                        key={`n-${index}`}
                        layoutId={`n-${index}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                        className="absolute w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border border-slate-500 shadow-sm"
                    />
                );
                nCount--;
                index++;
            }
        }

        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {particles}
                    </div>
                    {/* Nucleus Label */}
                    {(protons > 0 || neutrons > 0) && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold opacity-0 hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap bg-black/50 px-2 py-1 rounded text-xs">
                            {protons}p {neutrons}n
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderShells = () => {
        if (modelType !== 'orbits') return null;

        const shellCapacities = [2, 8, 18, 32, 32, 18, 8];
        const orbits = [];
        let electronsLeft = electrons;

        shellCapacities.forEach((capacity, index) => {
            // Even if empty, we might want to show at least one shell if there are electrons? 
            // Better: only show shells that contain electrons, plus maybe one empty outer?
            // User spec: "auto-distribute to lowest available shell"
            if (electronsLeft <= 0 && index > 0) return; // Stop rendering empty outer shells beyond the first empty one? 
            // Actually, let's just render occupied shells for cleanliness, 
            // unless atom is empty, then maybe show 1st shell hint?

            const count = Math.min(electronsLeft, capacity);
            electronsLeft -= count;

            // Just skip if this shell (and naturally higher ones) has no electrons
            if (count === 0 && electrons === 0 && index > 0) return;
            if (count === 0 && electrons > 0) return;

            const shellRadius = 60 + (index * 35); // Adjust radius logic

            orbits.push(
                <div
                    key={`shell-${index}`}
                    className="absolute rounded-full border border-dashed border-slate-300 pointer-events-none"
                    style={{ width: shellRadius * 2, height: shellRadius * 2 }}
                >
                    {/* Electrons */}
                    {Array.from({ length: count }).map((_, i) => {
                        const angle = (360 / capacity) * i; // Distribute evenly based on capacity or count? 
                        // Standard visuals usually distribute evenly based on COUNT present, not capacity.
                        // Let's use count for better symmetry.
                        const posAngle = (360 / count) * i - 90; // Start top

                        return (
                            <motion.div
                                key={`e-${index}-${i}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: 360 }}
                                transition={{
                                    rotate: { duration: 10 + index * 5, repeat: Infinity, ease: "linear" }, // Orbit animation
                                    scale: { duration: 0.2 }
                                }}
                                className="absolute w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full shadow-sm shadow-blue-400 border border-blue-600 z-20"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    // Fix the electron to the orbit path visually
                                    // wrapper rotates, this pushes it out
                                    transform: `rotate(${posAngle}deg) translate(${shellRadius}px) rotate(-${posAngle}deg)`
                                    // NOTE: To animate orbit, we rotate the container OR the individual transforms.
                                    // Simple way: Apply rotation to the shell container? No, electrons need to spread.
                                    // Let's just static place them for inputs this complex, or simple css animation on the shell `div`?
                                }}
                            />
                        );
                    })}
                </div>
            );
        });

        return (
            <div className="absolute inset-0 flex items-center justify-center">
                {orbits}
            </div>
        );
    };

    const renderCloud = () => {
        if (modelType !== 'cloud' || electrons === 0) return null;

        // Fuzzy representation
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-64 h-64 rounded-full bg-gradient-radial from-blue-400/50 via-blue-200/20 to-transparent blur-xl animate-pulse"
                />
                <div className="absolute text-blue-600/50 font-bold tracking-widest uppercase text-xs mt-32">
                    Electron Cloud
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden">
            {/* Background Grid/Design */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />

            {renderCloud()}
            {renderShells()}
            {renderNucleus()}
        </div>
    );
};

export default AtomCanvas;
