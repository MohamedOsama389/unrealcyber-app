import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Network,
    Gamepad2,
    Search,
    Rocket,
    ExternalLink,
    Zap,
    Cpu,
    Plus,
    FlaskConical,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import { GAMES_REGISTRY } from '../data/gamesData';
import GameCard from '../components/games/GameCard';
import LabCard from '../components/labs/LabCard';
import LabUploadModal from '../components/labs/LabUploadModal';

interface Lab {
    id: number;
    title: string;
    description: string;
    thumbnail_link: string;
    drive_link: string;
    file_id: string;
}

const HandsOn = () => {
    const [activeTab, setActiveTab] = useState('simulators'); // 'games', 'simulators', or 'labs'
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [labs, setLabs] = useState<Lab[]>([]);
    const [isLoadingLabs, setIsLoadingLabs] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const categories = ['All', 'Science', 'Math', 'English', 'Social Studies', 'Arabic'];

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setIsAdmin(user.role === 'admin');
        if (activeTab === 'labs') {
            fetchLabs();
        }
    }, [activeTab]);

    const fetchLabs = async () => {
        setIsLoadingLabs(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/labs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLabs(res.data);
        } catch (err) {
            console.error("Failed to fetch labs:", err);
        } finally {
            setIsLoadingLabs(false);
        }
    };

    const filteredGames = GAMES_REGISTRY.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredLabs = labs.filter(lab =>
        lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lab.description && lab.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 md:p-10 min-h-screen bg-app">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-10 relative">
                    <div className="flex items-center space-x-3 text-cyan-400 mb-4">
                        <Cpu size={24} />
                        <span className="text-sm font-bold uppercase tracking-[0.3em]">Skill Lab</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-5xl font-extrabold tracking-tight mb-4">
                                Hands-On <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Space</span>
                            </h1>
                            <p className="text-secondary text-lg max-w-2xl leading-relaxed">
                                The ultimate training ground. Master complex systems through interactive simulations, curriculum games, and specialized labs.
                            </p>
                        </div>
                        {isAdmin && activeTab === 'labs' && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-3xl font-bold shadow-xl shadow-cyan-500/20 hover:scale-105 transition-transform"
                            >
                                <Plus size={20} />
                                <span>Add New Lab App</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="max-w-7xl mx-auto mb-12">
                    <div className="inline-flex p-1.5 bg-slate-800/40 rounded-[2rem] border border-white/5 backdrop-blur-xl flex-wrap">
                        <button
                            onClick={() => setActiveTab('simulators')}
                            className={`flex items-center space-x-2 px-8 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500 ${activeTab === 'simulators'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                        >
                            <Network size={18} />
                            <span>Network Simulator</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('games')}
                            className={`flex items-center space-x-2 px-8 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500 ${activeTab === 'games'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                        >
                            <Gamepad2 size={18} />
                            <span>Education Games</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('labs')}
                            className={`flex items-center space-x-2 px-8 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500 ${activeTab === 'labs'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                        >
                            <FlaskConical size={18} />
                            <span>Hands-On Lab</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'simulators' && (
                        <motion.div
                            key="sims"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="max-w-7xl mx-auto"
                        >
                            <div className="glass-panel overflow-hidden border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                                            <FlaskConical size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-primary">Digital Logic & Networking Lab</h3>
                                            <p className="text-[10px] text-secondary uppercase tracking-widest mt-0.5">Interactive Logic Sandbox • High Precision</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2 text-[10px] font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            <span>LIVE SANDBOX</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="aspect-video w-full bg-black relative group">
                                    <iframe
                                        src="https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab_all.html"
                                        title="Network & Logic Simulator"
                                        className="w-full h-full border-none"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 bg-slate-900/80 backdrop-blur rounded-lg text-secondary border border-white/10 hover:text-primary">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-800/20">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-cyan-400">Logic Fundamentals</h4>
                                        <p className="text-xs text-secondary leading-relaxed">Master the basic building blocks of connectivity through interactive logic and circuit simulations.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-cyan-400">Signal Analysis</h4>
                                        <p className="text-xs text-secondary leading-relaxed">Visualize signal flow and test theories in a precise virtual sandbox environment.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-cyan-400">Proximity Labs</h4>
                                        <p className="text-xs text-secondary leading-relaxed">Practice real-world concepts directly in the browser with high-fidelity interactive models.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'games' && (
                        <motion.div
                            key="games"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-7xl mx-auto space-y-8"
                        >
                            {/* Filter Bar */}
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search curriculum topics..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-800/40 border border-white/5 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-2xl py-3 pl-12 pr-4 transition-all text-primary shadow-inner"
                                    />
                                </div>

                                <div className="flex items-center space-x-1 bg-slate-800/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`
                                                px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300
                                                ${activeCategory === cat
                                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                                    : 'text-secondary hover:text-primary hover:bg-white/5'}
                                            `}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredGames.length > 0 ? (
                                    filteredGames.map(game => (
                                        <GameCard key={game.id} game={game} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-24 glass-panel border-dashed border-white/10">
                                        <Rocket className="mx-auto text-slate-600 mb-6" size={64} />
                                        <h3 className="text-2xl font-bold text-secondary">No missions found</h3>
                                        <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'labs' && (
                        <motion.div
                            key="labs"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-7xl mx-auto space-y-8"
                        >
                            {/* Filter Bar */}
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search specialized labs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-800/40 border border-white/5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-2xl py-3 pl-12 pr-4 transition-all text-primary shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Grid */}
                            {isLoadingLabs ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                    <Loader2 className="text-emerald-500 animate-spin" size={48} />
                                    <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Application Lab...</p>
                                </div>
                            ) : filteredLabs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredLabs.map(lab => (
                                        <LabCard key={lab.id} lab={lab} />
                                    ))}
                                </div>
                            ) : (
                                <div className="col-span-full text-center py-24 glass-panel border-dashed border-white/10">
                                    <Box className="mx-auto text-slate-600 mb-6" size={64} />
                                    <h3 className="text-2xl font-bold text-secondary">No labs deployed yet</h3>
                                    <p className="text-slate-500 mt-2">Check back soon for new training applications.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <LabUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchLabs}
            />
        </div>
    );
};

export default HandsOn;
