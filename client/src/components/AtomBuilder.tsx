import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { Maximize2, Minimize2, Trash2, RefreshCcw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AtomCanvas from './atom/AtomCanvas';
import ParticleBowl from './atom/ParticleBowl';
import PeriodicTable from './atom/PeriodicTable';
import { getElementByProtons } from '../data/periodicTable';
import { checkStability } from '../data/stableIsotopes';
import { DROP_ZONES, ParticleType } from '../dnd/dndTypes';
import { useDroppable } from '@dnd-kit/core';

const TrashZone = () => {
    const { setNodeRef, isOver } = useDroppable({ id: DROP_ZONES.TRASH });
    return (
        <div
            ref={setNodeRef}
            className={`
                absolute bottom-4 right-4 p-4 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center
                ${isOver ? 'bg-red-100 border-red-500 scale-110 text-red-600' : 'bg-white/50 border-slate-200 text-slate-400 opacity-50'}
            `}
        >
            <Trash2 size={24} />
            <span className="text-[10px] font-bold mt-1 uppercase">Remove</span>
        </div>
    );
};

const AtomBuilder: React.FC = () => {
    // State
    const [protons, setProtons] = useState(0);
    const [neutrons, setNeutrons] = useState(0);
    const [electrons, setElectrons] = useState(0);

    const [modelType, setModelType] = useState<'orbits' | 'cloud'>('orbits');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeDrag, setActiveDrag] = useState<ParticleType | null>(null);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    // Derived Logic
    const element = useMemo(() => getElementByProtons(protons), [protons]);
    const massNumber = protons + neutrons;
    const netCharge = protons - electrons;
    const isStable = useMemo(() => checkStability(protons, neutrons), [protons, neutrons]);

    const chargeLabel = useMemo(() => {
        if (netCharge === 0) return 'Neutral';
        return netCharge > 0 ? 'Cation' : 'Anion';
    }, [netCharge]);

    // Handlers
    const handleDragStart = (event: any) => {
        setActiveDrag(event.active.data.current?.type || null);
    };

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { over, active } = event;
        setActiveDrag(null);

        if (!over) return;

        const type = active.data.current?.type as ParticleType;
        if (!type) return;

        // Logic for adding to canvas
        if (over.id === DROP_ZONES.NUCLEUS && (type === 'proton' || type === 'neutron')) {
            if (type === 'proton') setProtons(p => Math.min(118, p + 1));
            else setNeutrons(n => Math.min(150, n + 1));
        } else if (over.id === DROP_ZONES.SHELLS && type === 'electron') {
            setElectrons(e => Math.min(118, e + 1));
        } else if (over.id === DROP_ZONES.TRASH) {
            removeParticle(type);
        }
    }, [protons]);

    const removeParticle = (type: ParticleType) => {
        if (type === 'proton') setProtons(p => Math.max(0, p - 1));
        if (type === 'neutron') setNeutrons(n => Math.max(0, n - 1));
        if (type === 'electron') setElectrons(e => Math.max(0, e - 1));
    };

    const addParticle = (type: ParticleType) => {
        if (type === 'proton') setProtons(p => Math.min(118, p + 1));
        if (type === 'neutron') setNeutrons(n => Math.min(150, n + 1));
        if (type === 'electron') setElectrons(e => Math.min(118, e + 1));
    };

    const reset = () => {
        setProtons(0);
        setNeutrons(0);
        setElectrons(0);
    };

    // Fullscreen API
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={`
                flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans
                ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}
            `}>

                {/* TOOLBAR */}
                <div className="absolute top-4 left-4 z-50 flex items-center space-x-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-white/90 backdrop-blur shadow-md border rounded-lg hover:bg-slate-50 transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                    <button
                        onClick={reset}
                        className="p-2 bg-white/90 backdrop-blur shadow-md border rounded-lg hover:bg-slate-50 transition-colors"
                        title="Reset Atom"
                    >
                        <RefreshCcw size={20} />
                    </button>
                    <div className="bg-white/90 backdrop-blur shadow-md border rounded-lg p-1 flex">
                        <button
                            onClick={() => setModelType('orbits')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${modelType === 'orbits' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Orbits
                        </button>
                        <button
                            onClick={() => setModelType('cloud')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${modelType === 'cloud' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Cloud
                        </button>
                    </div>
                </div>

                {/* LEFT: Main Workspace */}
                <div className="flex-1 flex flex-col relative p-4 lg:p-8">
                    <div className="flex-1 flex items-center justify-center relative">
                        <AtomCanvas
                            protons={protons}
                            neutrons={neutrons}
                            electrons={electrons}
                            modelType={modelType}
                        />
                        <TrashZone />
                    </div>

                    {/* BOWLS / TRAYS (Bottom) */}
                    <div className="mt-4 flex flex-wrap justify-center gap-4 lg:gap-8 overflow-x-auto py-2 px-4 scrollbar-hide">
                        <ParticleBowl
                            type="proton"
                            count={protons}
                            color="bg-red-500"
                            onAdd={() => addParticle('proton')}
                            onRemove={() => removeParticle('proton')}
                        />
                        <ParticleBowl
                            type="neutron"
                            count={neutrons}
                            color="bg-slate-400"
                            onAdd={() => addParticle('neutron')}
                            onRemove={() => removeParticle('neutron')}
                        />
                        <ParticleBowl
                            type="electron"
                            count={electrons}
                            color="bg-blue-500"
                            onAdd={() => addParticle('electron')}
                            onRemove={() => removeParticle('electron')}
                        />
                    </div>
                </div>

                {/* RIGHT: Data Panel */}
                <div className={`
                    lg:w-96 bg-white border-l border-slate-200 overflow-y-auto p-6 space-y-6 shadow-2xl transition-all
                    ${isFullscreen ? 'm-4 rounded-2xl border shadow-lg' : ''}
                `}>
                    {/* Element Status */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center">
                        <div className="relative mb-2">
                            <div className="text-7xl font-serif font-bold text-slate-800">
                                {element?.symbol || '--'}
                            </div>
                            <div className="absolute -top-2 -right-6 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                                {protons}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-600">{element?.name || 'Pick an Atom'}</h2>
                        <div className="mt-4 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isStable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {isStable ? 'Stable' : 'Unstable'} Isotope
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${netCharge === 0 ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                                {chargeLabel}
                            </span>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mass Number</p>
                            <p className="text-3xl font-mono font-bold text-slate-800">{massNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Charge</p>
                            <p className="text-3xl font-mono font-bold text-slate-800">
                                {netCharge > 0 ? `+${netCharge}` : netCharge}
                            </p>
                        </div>
                    </div>

                    {/* Periodic Table Mini */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periodic Table</p>
                            {element && <p className="text-[10px] text-blue-500 font-bold">{element.category}</p>}
                        </div>
                        <PeriodicTable protonCount={protons} showElement={true} />
                    </div>

                    {/* Controls/Help */}
                    <div className="pt-6 border-t">
                        <div className="flex gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs">
                            <Info size={16} className="shrink-0" />
                            <p>Drag particles from the bowls into the center. Protons and Neutrons clump in the nucleus, Electrons find their shells.</p>
                        </div>
                    </div>
                </div>

                {/* Drag Overlay (Visual Follower) */}
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.4',
                            },
                        },
                    }),
                }}>
                    {activeDrag ? (
                        <div className={`w-10 h-10 rounded-full shadow-2xl border-2 border-white/50 ${activeDrag === 'proton' ? 'bg-red-500' :
                            activeDrag === 'neutron' ? 'bg-slate-400' : 'bg-blue-500'
                            }`} />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default AtomBuilder;
