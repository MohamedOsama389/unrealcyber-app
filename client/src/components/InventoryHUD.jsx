import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const InventoryHUD = ({ items = [] }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-4 left-4 z-30">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/10 text-xs font-bold text-secondary hover:text-primary hover:border-cyan-400/40 transition-colors"
            >
                <ShieldCheck size={14} className="text-cyan-400" />
                Inventory ({items.length})
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="mt-2 p-3 rounded-2xl bg-slate-950/90 border border-white/10 shadow-xl shadow-cyan-500/10 backdrop-blur"
                    >
                        {items.length === 0 ? (
                            <p className="text-secondary text-xs">Collect devices to unlock content.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {items.map((it) => (
                                    <div
                                        key={it.id}
                                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-primary"
                                    >
                                        {it.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryHUD;
