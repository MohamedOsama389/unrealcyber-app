import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw, Info, Settings, Maximize2 } from 'lucide-react';
import PeriodicTable from './atom/PeriodicTable';
import AtomCanvas from './atom/AtomCanvas';
import ParticleTray from './atom/ParticleTray';
import { getElementByProtons } from '../data/periodicTable';
import { checkStability } from '../data/stableIsotopes';

const AtomBuilder = () => {
    // State
    const [protons, setProtons] = useState(0);
    const [neutrons, setNeutrons] = useState(0);
    const [electrons, setElectrons] = useState(0);

    const [modelType, setModelType] = useState('orbits'); // 'orbits' | 'cloud'
    const [showOptions, setShowOptions] = useState({
        element: true,
        neutralIon: true,
        stableUnstable: false
    });

    // Derived State
    const element = getElementByProtons(protons); // Returns undefined if 0
    const massNumber = protons + neutrons;
    const netCharge = protons - electrons;
    const isStable = checkStability(protons, neutrons);

    // Limits
    const MAX_PARTICLES = 150; // Guardrail

    // Handlers
    const addParticle = (type) => {
        if (type === 'proton') {
            if (protons < 118) setProtons(p => p + 1);
        } else if (type === 'neutron') {
            if (neutrons < MAX_PARTICLES) setNeutrons(n => n + 1);
        } else if (type === 'electron') {
            if (electrons < 118) setElectrons(e => e + 1); // Limit to realistic
        }
    };

    const removeParticle = (type) => {
        if (type === 'proton') setProtons(p => Math.max(0, p - 1));
        if (type === 'neutron') setNeutrons(n => Math.max(0, n - 1));
        if (type === 'electron') setElectrons(e => Math.max(0, e - 1));
    };

    const reset = () => {
        setProtons(0);
        setNeutrons(0);
        setElectrons(0);
    };

    const toggleOption = (key) => {
        setShowOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Drag Drop Handlers (Unified)
    const [dragging, setDragging] = useState(null);

    const handleDragStart = (e, type) => {
        setDragging(type);
    };

    // Global Drop Listener
    useEffect(() => {
        const handleMouseUp = (e) => {
            if (dragging) {
                // Determine drop zones via elementFromPoint or simple connection
                // Here we assume ANY drop on the window adds a particle, 
                // OR logically restrict to the canvas area.
                // Let's restrict to canvas area roughly (center screen) or just 'anywhere outside controls'
                // For simplified UX effectively -> drop anywhere adds it.
                // Refine: Drop *above* the trays.
                if (e.clientY < window.innerHeight - 200) { // Rough "Main Area" check
                    addParticle(dragging);
                }
                setDragging(null);
            }
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [dragging, protons, neutrons, electrons]);


    return (
        <div className="flex flex-col lg:flex-row h-screen max-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 select-none">

            {/* Drag Follower (Cursor) */}
            {dragging && (
                <div
                    className={`fixed w-6 h-6 rounded-full shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border border-white ${dragging === 'proton' ? 'bg-red-500' :
                        dragging === 'neutron' ? 'bg-slate-400' : 'bg-blue-500'
                        }`}
                    style={{ left: 0, top: 0, opacity: 0 }} // Hidden init, could use mouse tracker
                />
            )}

            {/* LEFT / TOP PANEL: Canvas & Trays */}
            <div className="flex-1 flex flex-col relative">
                {/* Header / Toolbar */}
                <div className="absolute top-4 left-4 z-20 flex space-x-2">
                    <div className="bg-white/90 backdrop-blur border border-slate-200 p-2 rounded-lg text-xs font-mono text-slate-500 shadow-sm">
                        {protons}p {neutrons}n {electrons}e
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-sm p-1 flex">
                        <button
                            onClick={() => setModelType('orbits')}
                            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${modelType === 'orbits' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Orbits
                        </button>
                        <button
                            onClick={() => setModelType('cloud')}
                            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${modelType === 'cloud' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Cloud
                        </button>
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 p-4 md:p-8 flex flex-col">
                    <AtomCanvas
                        protons={protons}
                        neutrons={neutrons}
                        electrons={electrons}
                        modelType={modelType}
                    />
                </div>

                {/* Trays */}
                <div className="h-32 md:h-40 bg-white border-t border-slate-200 flex items-start justify-center gap-4 md:gap-12 pt-4 px-4 z-10 shadow-lg relative">
                    <ParticleTray
                        type="proton"
                        label="Protons"
                        color="from-red-100 to-red-200"
                        count={protons}
                        onAdd={() => addParticle('proton')}
                        onRemove={() => removeParticle('proton')}
                        onDragStart={handleDragStart}
                    />
                    <ParticleTray
                        type="neutron"
                        label="Neutrons"
                        color="from-slate-100 to-slate-200"
                        count={neutrons}
                        onAdd={() => addParticle('neutron')}
                        onRemove={() => removeParticle('neutron')}
                        onDragStart={handleDragStart}
                    />
                    <ParticleTray
                        type="electron"
                        label="Electrons"
                        color="from-blue-100 to-blue-200"
                        count={electrons}
                        onAdd={() => addParticle('electron')}
                        onRemove={() => removeParticle('electron')}
                        onDragStart={handleDragStart}
                    />
                </div>
            </div>

            {/* RIGHT / BOTTOM PANEL: Info & Grid */}
            <div className="lg:w-[450px] bg-slate-100 border-l border-slate-200 flex flex-col overflow-y-auto">
                <div className="p-6 space-y-6">

                    {/* Element Info Card */}
                    <div className={`
                        bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center relative transition-all duration-500
                        ${!showOptions.element ? 'grayscale opacity-60' : ''}
                    `}>
                        <div className="absolute top-4 right-4 w-8 h-8 rounded bg-red-500 text-white flex items-center justify-center font-bold shadow-sm">
                            {protons}
                        </div>
                        {element ? (
                            <>
                                <h1 className="text-6xl font-serif font-bold text-slate-800 mb-1">{element.symbol}</h1>
                                <p className="text-lg font-medium text-slate-500">{element.name}</p>
                                <p className="text-xs text-slate-400 mt-2 font-mono">Mass: {element.mass}</p>
                            </>
                        ) : (
                            <div className="h-24 flex items-center text-slate-400 font-bold tracking-widest uppercase">
                                Build an Atom
                            </div>
                        )}

                        {/* Stability Indicator */}
                        {showOptions.stableUnstable && protons > 0 && (
                            <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isStable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {isStable ? 'Stable' : 'Unstable'}
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all ${!showOptions.neutralIon ? 'opacity-50' : ''}`}>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Charge</h3>
                            <div className="flex items-baseline space-x-2">
                                <span className={`text-3xl font-bold ${netCharge > 0 ? 'text-orange-500' : netCharge < 0 ? 'text-blue-500' : 'text-slate-700'}`}>
                                    {netCharge > 0 ? `+${netCharge}` : netCharge}
                                </span>
                                <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                    {netCharge === 0 ? 'Neutral' : netCharge > 0 ? 'Cation' : 'Anion'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mass Number</h3>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-bold text-slate-700">{massNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* Periodic Table Mini */}
                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <PeriodicTable protonCount={protons} showElement={showOptions.element} />
                    </div>

                    {/* Controls */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Options</h3>
                        <div className="space-y-3">
                            {['element', 'neutralIon', 'stableUnstable'].map(key => (
                                <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className={`
                                        w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out
                                        ${showOptions[key] ? 'bg-green-500' : 'bg-slate-200 group-hover:bg-slate-300'}
                                    `}>
                                        <div className={`
                                            w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200
                                            ${showOptions[key] ? 'translate-x-4' : 'translate-x-0'}
                                        `} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={reset}
                        className="w-full py-4 rounded-xl bg-orange-50 text-orange-600 font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={20} />
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AtomBuilder;
