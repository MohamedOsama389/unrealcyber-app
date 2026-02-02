import React from 'react';
import { PERIODIC_TABLE } from '../../data/periodicTable';

const PeriodicTable = ({ protonCount, showElement }) => {
    return (
        <div className="w-full overflow-x-auto pb-2">
            {/* 18 columns grid using arbitrary value for JIT */}
            <div className="min-w-[600px] grid grid-cols-[repeat(18,minmax(0,1fr))] gap-[2px] p-2 bg-slate-50 border border-slate-200 rounded-xl select-none text-[8px] md:text-[10px] font-sans">
                {PERIODIC_TABLE.map((el) => {
                    const isActive = protonCount === el.number;
                    const isLanthanide = el.number >= 57 && el.number <= 71;
                    const isActinide = el.number >= 89 && el.number <= 103;

                    // Force specific placements for separate rows
                    let style = {};
                    if (isLanthanide) {
                        style = { gridRow: 9, gridColumn: (el.number - 57) + 3 }; // Shift to align under group 3 place
                    } else if (isActinide) {
                        style = { gridRow: 10, gridColumn: (el.number - 89) + 3 };
                    } else {
                        style = { gridRow: el.period, gridColumn: el.group };
                    }

                    return (
                        <div
                            key={el.number}
                            style={style}
                            className={`
                                aspect-square flex flex-col items-center justify-center border transition-all duration-300
                                ${isActive
                                    ? 'bg-red-500 text-white scale-125 z-10 shadow-lg ring-2 ring-red-400 rounded-sm'
                                    : 'bg-white text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                }
                                ${!showElement && isActive ? 'bg-red-500/50' : ''}
                            `}
                        >
                            <span className="text-[0.5em] opacity-70 leading-none mb-0.5">{el.number}</span>
                            <span className={`font-bold leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {el.symbol}
                            </span>
                        </div>
                    );
                })}

                {/* Labels/Placeholders for separated rows */}
                <div style={{ gridRow: 6, gridColumn: 3 }} className="aspect-square flex items-center justify-center text-[8px] text-slate-400 border border-dashed border-slate-300 rounded bg-slate-50/50">57-71</div>
                <div style={{ gridRow: 7, gridColumn: 3 }} className="aspect-square flex items-center justify-center text-[8px] text-slate-400 border border-dashed border-slate-300 rounded bg-slate-50/50">89-103</div>
            </div>
            {/* Legend for rows */}
            <div className="text-[10px] text-slate-400 pl-4 mt-1">
                Lanthanides & Actinides (bottom rows)
            </div>
        </div>
    );
};

export default PeriodicTable;
