import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Info, Check, X, Minus, Plus } from 'lucide-react';

const PERIODIC_TABLE_DATA = {
    1: { symbol: 'H', name: 'Hydrogen' },
    2: { symbol: 'He', name: 'Helium' },
    3: { symbol: 'Li', name: 'Lithium' },
    4: { symbol: 'Be', name: 'Beryllium' },
    5: { symbol: 'B', name: 'Boron' },
    6: { symbol: 'C', name: 'Carbon' },
    7: { symbol: 'N', name: 'Nitrogen' },
    8: { symbol: 'O', name: 'Oxygen' },
    9: { symbol: 'F', name: 'Fluorine' },
    10: { symbol: 'Ne', name: 'Neon' },
    // Simplified for this demo
};

const AtomGame = () => {
    const [protons, setProtons] = useState(0);
    const [neutrons, setNeutrons] = useState(0);
    const [electrons, setElectrons] = useState(0);

    const [showElement, setShowElement] = useState(true);
    const [showNeutralIon, setShowNeutralIon] = useState(true);
    const [showStableUnstable, setShowStableUnstable] = useState(false);
    const [modelType, setModelType] = useState('orbits'); // 'orbits' or 'cloud'

    const [draggingType, setDraggingType] = useState(null);
    const atomRef = useRef(null);

    // Initial drag state (mouse position relative to viewport)
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

    const handleDragStart = (e, type) => {
        setDraggingType(type);
        setDragPosition({ x: e.clientX, y: e.clientY });
    };

    const handleDragEnd = (e) => {
        if (!draggingType || !atomRef.current) return;

        const atomRect = atomRef.current.getBoundingClientRect();

        // Check if dropped within the atom area
        if (
            e.clientX >= atomRect.left &&
            e.clientX <= atomRect.right &&
            e.clientY >= atomRect.top &&
            e.clientY <= atomRect.bottom
        ) {
            if (draggingType === 'proton') setProtons(p => p + 1);
            if (draggingType === 'neutron') setNeutrons(n => n + 1);
            if (draggingType === 'electron') setElectrons(e => e + 1);
        }

        setDraggingType(null);
    };

    // For better UX during drag (mock element following cursor)
    // In a real sophisticated implementation, we'd use useDrag controls or HTML5 DnD.
    // Here we will use simple mouseup listener on window to catch drops anywhere.
    useEffect(() => {
        const handleWindowMouseUp = (e) => {
            if (draggingType) {
                handleDragEnd(e);
            }
        };

        const handleWindowMouseMove = (e) => {
            if (draggingType) {
                setDragPosition({ x: e.clientX, y: e.clientY });
            }
        };

        window.addEventListener('mouseup', handleWindowMouseUp);
        window.addEventListener('mousemove', handleWindowMouseMove);

        return () => {
            window.removeEventListener('mouseup', handleWindowMouseUp);
            window.removeEventListener('mousemove', handleWindowMouseMove);
        };
    }, [draggingType]);


    const resetGame = () => {
        setProtons(0);
        setNeutrons(0);
        setElectrons(0);
    };

    const massNumber = protons + neutrons;
    const netCharge = protons - electrons;
    const element = PERIODIC_TABLE_DATA[protons] || { symbol: '?', name: 'Unknown' };
    const isStable = protons > 0 && Math.abs(protons - neutrons) <= 1; // Extremely simplified stability rule

    // Render Particles in Nucleus
    const renderNucleus = () => {
        const particles = [];
        for (let i = 0; i < protons; i++) particles.push(<div key={`p-${i}`} className="w-4 h-4 rounded-full bg-red-500 border border-red-600 shadow-sm absolute transition-all duration-500" style={{ transform: `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px)` }} />);
        for (let i = 0; i < neutrons; i++) particles.push(<div key={`n-${i}`} className="w-4 h-4 rounded-full bg-slate-300 border border-slate-400 shadow-sm absolute transition-all duration-500" style={{ transform: `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px)` }} />);

        return (
            <div className="relative flex items-center justify-center w-24 h-24 bg-yellow-500/0 rounded-full">
                <div className="text-yellow-400 text-4xl font-bold opacity-0 lg:opacity-100 absolute z-10 select-none pointer-events-none">
                    {protons > 0 && 'X'}
                </div>
                {particles}
            </div>
        );
    };

    // Render Electrons in Orbits
    const renderElectrons = () => {
        // Cloud Model Visualization
        if (modelType === 'cloud') {
            if (electrons === 0) return null;
            return (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000">
                    <div
                        className="rounded-full bg-blue-400 blur-xl opacity-40 animate-pulse absolute"
                        style={{ width: 100 + (electrons * 10), height: 100 + (electrons * 10) }}
                    />
                    <div
                        className="absolute rounded-full bg-blue-500 blur-3xl opacity-20"
                        style={{ width: 150 + (electrons * 15), height: 150 + (electrons * 15) }}
                    />
                </div>
            );
        }

        const orbits = [];

        // Simplified orbit logic: 2 in first, 8 in second, etc.
        const orbitCapacities = [2, 8, 18];
        let electronsLeft = electrons;

        orbitCapacities.forEach((capacity, index) => {
            if (electronsLeft <= 0) return;

            const count = Math.min(electronsLeft, capacity);
            electronsLeft -= count;

            const radius = 80 + (index * 60); // Base radius + increment

            orbits.push(
                <div key={`orbit-${index}`} className="absolute rounded-full border border-dashed border-slate-400"
                    style={{ width: radius * 2, height: radius * 2 }}>
                    {/* Electrons on this orbit */}
                    {Array.from({ length: count }).map((_, i) => {
                        const angle = (360 / count) * i;
                        return (
                            <div
                                key={`e-${index}-${i}`}
                                className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                                }}
                            />
                        );
                    })}
                </div>
            );
        });

        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {orbits}
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 select-none">

            {/* Dragging Overlay */}
            {draggingType && (
                <div
                    className="fixed w-8 h-8 rounded-full pointer-events-none z-50 shadow-xl border-2 border-white"
                    style={{
                        left: dragPosition.x,
                        top: dragPosition.y,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: draggingType === 'proton' ? '#ef4444' : draggingType === 'neutron' ? '#cbd5e1' : '#3b82f6'
                    }}
                />
            )}

            {/* LEFT SIDE: ATOM VIEW */}
            <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-white flex flex-col justify-center items-center p-8 overflow-hidden">

                <div className="absolute top-8 left-8 bg-[#d4e4bc] border border-[#a6c48a] p-4 rounded-lg shadow-sm w-48 font-mono text-sm text-[#5c7a3c] space-y-1 z-10">
                    <div className="flex justify-between"><span>Protons:</span> <span>{protons}</span></div>
                    <div className="flex justify-between"><span>Neutrons:</span> <span>{neutrons}</span></div>
                    <div className="flex justify-between"><span>Electrons:</span> <span>{electrons}</span></div>
                </div>

                {/* Model Toggle */}
                <div className="absolute top-8 right-8 flex flex-col items-start gap-2 z-10">
                    <span className="text-slate-700 font-bold">Model:</span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="model"
                            value="orbits"
                            checked={modelType === 'orbits'}
                            onChange={() => setModelType('orbits')}
                            className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600">Orbits</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="model"
                            value="cloud"
                            checked={modelType === 'cloud'}
                            onChange={() => setModelType('cloud')}
                            className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600">Cloud</span>
                    </label>
                </div>

                {/* Main Atom Visualization Area */}
                <div ref={atomRef} className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
                    {/* Dashed background circles for effect */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-96 h-96 rounded-full border-4 border-slate-300"></div>
                    </div>

                    {renderElectrons()}
                    {renderNucleus()}
                </div>

                {/* Particle Bins */}
                <div className="absolute bottom-10 flex gap-8 w-full max-w-3xl justify-center">
                    {/* Protons */}
                    <div className="flex flex-col items-center">
                        <div
                            className="w-32 h-20 bg-gradient-to-b from-orange-100 to-orange-200 border-2 border-orange-300 rounded-b-3xl relative flex justify-center items-end pb-2 cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleDragStart(e, 'proton')}
                        >
                            <span className="text-orange-800 font-bold text-lg pointer-events-none">Protons</span>
                            {/* Visual pile */}
                            <div className="absolute -top-6 flex flex-wrap justify-center w-24 gap-1 pointer-events-none">
                                {[...Array(6)].map((_, i) => <div key={i} className="w-6 h-6 rounded-full bg-red-500 border border-red-600 shadow-sm" />)}
                            </div>
                        </div>
                    </div>

                    {/* Neutrons */}
                    <div className="flex flex-col items-center">
                        <div
                            className="w-32 h-20 bg-gradient-to-b from-slate-200 to-slate-300 border-2 border-slate-400 rounded-b-3xl relative flex justify-center items-end pb-2 cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleDragStart(e, 'neutron')}
                        >
                            <span className="text-slate-700 font-bold text-lg pointer-events-none">Neutrons</span>
                            <div className="absolute -top-6 flex flex-wrap justify-center w-24 gap-1 pointer-events-none">
                                {[...Array(6)].map((_, i) => <div key={i} className="w-6 h-6 rounded-full bg-slate-300 border border-slate-400 shadow-sm" />)}
                            </div>
                        </div>
                    </div>

                    {/* Electrons */}
                    <div className="flex flex-col items-center">
                        <div
                            className="w-32 h-20 bg-gradient-to-b from-blue-100 to-blue-200 border-2 border-blue-300 rounded-b-3xl relative flex justify-center items-end pb-2 cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleDragStart(e, 'electron')}
                        >
                            <span className="text-blue-800 font-bold text-lg pointer-events-none">Electrons</span>
                            <div className="absolute -top-6 flex flex-wrap justify-center w-24 gap-1 pointer-events-none">
                                {[...Array(6)].map((_, i) => <div key={i} className="w-6 h-6 rounded-full bg-blue-500 border border-blue-600 shadow-sm" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: INFO PANELS */}
            <div className="w-full lg:w-96 bg-white border-l border-slate-200 p-6 flex flex-col gap-4 overflow-y-auto">

                {/* Element Panel */}
                <div className={`bg-[#d4e4bc] border-2 border-[#a6c48a] rounded-xl p-4 transition-all ${showElement ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[#5c7a3c] font-bold text-xl">Element</h3>
                        <div className="w-6 h-6 bg-red-400 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">-</div>
                    </div>

                    <div className="flex justify-center my-4">
                        <div className="w-32 h-32 bg-white border-2 border-slate-800 flex flex-col items-center justify-center relative shadow-sm">
                            <span className="absolute top-1 left-2 font-bold text-lg">{protons > 0 ? protons : ''}</span>
                            <span className="text-5xl font-bold font-serif">{element.symbol}</span>
                            <span className="text-sm font-medium mt-1">{element.name}</span>
                        </div>
                    </div>

                    {/* Mini Periodic Table (Simplified) */}
                    <div className="grid grid-cols-8 gap-0.5 text-[0.5rem] mt-4 opacity-80">
                        {/* Row 1 */}
                        <div className={`aspect-square border flex items-center justify-center ${protons === 1 ? 'bg-red-500 text-white' : 'bg-white'}`}>H</div>
                        <div className="col-span-6"></div>
                        <div className={`aspect-square border flex items-center justify-center ${protons === 2 ? 'bg-red-500 text-white' : 'bg-white'}`}>He</div>
                        {/* Row 2 */}
                        {['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'].map((el, i) => (
                            <div key={el} className={`aspect-square border flex items-center justify-center ${protons === i + 3 ? 'bg-red-500 text-white' : 'bg-white'}`}>{el}</div>
                        ))}
                    </div>
                </div>

                {/* Net Charge Panel */}
                <div className={`bg-[#d4e4bc] border-2 border-[#a6c48a] rounded-xl p-3 flex justify-between items-center transition-all ${showNeutralIon ? 'opacity-100' : 'opacity-50'}`}>
                    <span className="text-[#5c7a3c] font-bold text-lg">Net Charge</span>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-slate-700">{netCharge > 0 ? `+${netCharge}` : netCharge}</span>
                        {/* Status Label */}
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-bold ${netCharge === 0 ? 'bg-green-500' : 'bg-orange-500'}`}>
                            {netCharge === 0 ? 'NEUTRAL' : 'ION'}
                        </span>
                    </div>
                </div>

                {/* Mass Number Panel */}
                <div className="bg-[#d4e4bc] border-2 border-[#a6c48a] rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[#5c7a3c] font-bold text-lg">Mass Number</span>
                    <span className="text-2xl font-bold text-slate-700">{massNumber}</span>
                </div>

                {/* Controls */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <h3 className="font-bold text-slate-700 mb-3 text-center">Show</h3>
                    <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-400 transition-colors">
                            <input type="checkbox" checked={showElement} onChange={(e) => setShowElement(e.target.checked)} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-slate-700">Element</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-400 transition-colors">
                            <input type="checkbox" checked={showNeutralIon} onChange={(e) => setShowNeutralIon(e.target.checked)} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-slate-700">Neutral/Ion</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-400 transition-colors">
                            <input type="checkbox" checked={showStableUnstable} onChange={(e) => setShowStableUnstable(e.target.checked)} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-slate-700">Stable/Unstable</span>
                        </label>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="mt-auto bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center self-end w-14 h-14"
                >
                    <RefreshCcw size={24} />
                </motion.button>
            </div>
        </div>
    );
};

export default AtomGame;
