import React, { useState } from 'react';
import { Search, Rocket } from 'lucide-react';
import { GAMES_REGISTRY } from '../data/gamesData';
import GameCard from '../components/games/GameCard';
import { motion } from 'framer-motion';

const Games = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Science', 'Math', 'English', 'Social Studies', 'Arabic'];

    const filteredGames = GAMES_REGISTRY.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-6 md:p-10 min-h-screen bg-app">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-12">
                    <h1 className="text-4xl font-bold text-primary font-serif mb-2">Curriculum Games</h1>
                    <p className="text-secondary">Interactive simulations aligned with your current term goals.</p>
                </div>

                {/* Filter Bar */}
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search topics (e.g. 'equations')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/40 border border-white/5 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-2xl py-3 pl-12 pr-4 transition-all text-primary"
                        />
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-800/40 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300
                                    ${activeCategory === cat
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                        : 'text-secondary hover:text-primary hover:bg-white/5'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="max-w-7xl mx-auto">
                    {filteredGames.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredGames.map(game => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-slate-800/20 rounded-[2.5rem] border border-dashed border-white/5">
                            <Rocket className="mx-auto text-slate-600 mb-6" size={64} />
                            <h3 className="text-2xl font-bold text-secondary">No missions found</h3>
                            <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Games;
