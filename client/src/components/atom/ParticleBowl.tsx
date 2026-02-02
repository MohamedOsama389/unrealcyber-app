import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus, Minus } from 'lucide-react';
import { ParticleType } from '../../dnd/dndTypes';

interface ParticleBowlProps {
    type: ParticleType;
    count: number;
    color: string;
    onAdd: () => void;
    onRemove: () => void;
}

const ParticleBowl: React.FC<ParticleBowlProps> = ({ type, count, color, onAdd, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `bowl-${type}`,
        data: { type }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
    } : undefined;

    // Simulate stacked particles in the bowl
    const particles = useMemo(() => {
        const p = [];
        const maxVisible = 20;
        const displayCount = Math.min(count, maxVisible);

        for (let i = 0; i < displayCount; i++) {
            // Random-ish but deterministic positions for gravity-packing look
            const seed = i * 123.45;
            const x = (Math.sin(seed) * 30) + 50; // 20-80%
            const y = (Math.cos(seed) * 15) + 60; // 45-75% (lower half of bowl)
            p.push({ x, y, id: i });
        }
        return p;
    }, [count]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative group w-32 h-32 md:w-40 md:h-40">
                {/* SVG Bowl */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                    <defs>
                        <radialGradient id={`grad-${type}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
                        </radialGradient>
                    </defs>
                    {/* Bowl Body */}
                    <path
                        d="M10 40 Q10 90 50 90 Q90 90 90 40 L85 40 Q85 85 50 85 Q15 85 15 40 Z"
                        fill="rgba(255,255,255,0.8)"
                        className="stroke-slate-200"
                        strokeWidth="0.5"
                    />
                    <path
                        d="M10 40 Q10 90 50 90 Q90 90 90 40"
                        fill={`url(#grad-${type})`}
                    />

                    {/* Visual Particles */}
                    {particles.map((p) => (
                        <circle
                            key={p.id}
                            cx={`${p.x}`}
                            cy={`${p.y}`}
                            r="4"
                            fill={color}
                            className="stroke-black/10"
                            strokeWidth="0.5"
                        />
                    ))}
                </svg>

                {/* Drag Handle */}
                <div
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    style={style}
                    className={`
                        absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing
                        ${isDragging ? 'opacity-0' : 'opacity-100'}
                    `}
                >
                    <div className={`
                        w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center
                        bg-white/20 backdrop-blur-sm group-hover:border-blue-400 transition-colors
                    `}>
                        <div className={`w-6 h-6 rounded-full shadow-md ${color} border border-black/10`} />
                    </div>
                </div>

                {/* Counter Overlay */}
                <div className="absolute top-0 right-0 bg-white shadow-md border rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {count}
                </div>
            </div>

            {/* Label & Controls */}
            <div className="mt-2 text-center">
                <span className="font-bold text-slate-600 block mb-2 capitalize">{type}s</span>
                <div className="flex items-center bg-white rounded-full shadow-sm border p-1 scale-90">
                    <button
                        onClick={onRemove}
                        disabled={count === 0}
                        className="p-1 px-2 rounded-full hover:bg-slate-100 text-red-500 disabled:opacity-20 translate-y-[1px]"
                    >
                        <Minus size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button
                        onClick={onAdd}
                        className="p-1 px-2 rounded-full hover:bg-slate-100 text-green-500 translate-y-[1px]"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParticleBowl;
