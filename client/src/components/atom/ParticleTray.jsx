import React from 'react';
import { Minus, Plus } from 'lucide-react';

const ParticleTray = ({ type, count, onAdd, onRemove, color, label, onDragStart }) => {
    return (
        <div className="flex flex-col items-center">
            <div
                className={`
                    w-24 h-16 md:w-32 md:h-20 
                    bg-gradient-to-b ${color} 
                    border-2 border-slate-300 rounded-b-3xl 
                    relative flex justify-center items-end pb-2 
                    cursor-grab active:cursor-grabbing hover:brightness-105 transition-all
                `}
                onMouseDown={(e) => onDragStart(e, type)}
                // Accessible drag instructions could go here
                role="button"
                aria-label={`Drag to add ${label}`}
                tabIndex={0}
            >
                <span className="font-bold text-sm md:text-lg pointer-events-none text-slate-800 opacity-80">{label}</span>

                {/* Visual pile */}
                <div className="absolute -top-4 md:-top-6 flex flex-wrap justify-center w-20 md:w-24 gap-1 pointer-events-none">
                    {[...Array(Math.min(count + 3, 6))].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 md:w-6 md:h-6 rounded-full shadow-sm border border-black/10 ${type === 'proton' ? 'bg-red-500' :
                                    type === 'neutron' ? 'bg-slate-400' : 'bg-blue-500'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Accessible Controls */}
            <div className="flex items-center space-x-2 mt-2 bg-white rounded-full shadow-sm border p-1">
                <button
                    onClick={onRemove}
                    disabled={count <= 0}
                    className="p-1 md:p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 text-red-500 transition-colors"
                    aria-label={`Remove ${label}`}
                >
                    <Minus size={16} />
                </button>
                <span className="font-mono font-bold w-6 text-center text-sm md:text-base">{count}</span>
                <button
                    onClick={onAdd}
                    className="p-1 md:p-2 rounded-full hover:bg-slate-100 text-green-500 transition-colors"
                    aria-label={`Add ${label}`}
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};

export default ParticleTray;
