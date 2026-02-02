import React from 'react';
import { PERIODIC_TABLE } from '../../data/periodicTable';

interface PeriodicTableProps {
    protonCount: number;
    showElement: boolean;
}

const PeriodicTable: React.FC<PeriodicTableProps> = ({ protonCount, showElement }) => {
    return (
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="min-w-[650px] grid grid-cols-[repeat(18,minmax(0,1fr))] gap-[2px] p-2 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl select-none">
                {PERIODIC_TABLE.map((el) => {
                    const isActive = protonCount === el.number;
                    const isLanthanide = el.number >= 57 && el.number <= 71;
                    const isActinide = el.number >= 89 && el.number <= 103;

                    let style: React.CSSProperties = {};
                    if (isLanthanide) {
                        style = { gridRow: 9, gridColumn: (el.number - 57) + 3 };
                    } else if (isActinide) {
                        style = { gridRow: 10, gridColumn: (el.number - 89) + 3 };
                    } else {
                        style = { gridRow: el.period, gridColumn: el.group };
                    }

                    return (
                        <div
                            key={el.number}
                            style={style}
                            title={`${el.name} (${el.number})`}
                            className={`
                                aspect-square flex flex-col items-center justify-center border transition-all duration-300
                                ${isActive
                                    ? 'bg-blue-500 text-white scale-125 z-10 shadow-lg ring-2 ring-blue-300 rounded-sm'
                                    : 'bg-white/80 text-slate-400 hover:bg-white hover:text-slate-600 hover:border-slate-300'
                                }
                                ${!showElement && isActive ? 'bg-blue-500/40' : ''}
                            `}
                        >
                            <span className="text-[6px] opacity-70 leading-none mb-0.5">{el.number}</span>
                            <span className={`font-bold text-[9px] md:text-[10px] leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {el.symbol}
                            </span>
                        </div>
                    );
                })}

                {/* Lanthanide/Actinide row markers */}
                <div style={{ gridRow: 6, gridColumn: 3 }} className="aspect-square flex items-center justify-center text-[7px] text-slate-300">*</div>
                <div style={{ gridRow: 7, gridColumn: 3 }} className="aspect-square flex items-center justify-center text-[7px] text-slate-300">**</div>
                <div style={{ gridRow: 9, gridColumn: 2 }} className="col-span-1 flex items-center justify-end pr-2 text-[8px] italic text-slate-400 font-serif">*</div>
                <div style={{ gridRow: 10, gridColumn: 2 }} className="col-span-1 flex items-center justify-end pr-2 text-[8px] italic text-slate-400 font-serif">**</div>
            </div>
        </div>
    );
};

export default PeriodicTable;
