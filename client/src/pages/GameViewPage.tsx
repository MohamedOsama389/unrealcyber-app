import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Info } from 'lucide-react';
import SimEmbed from '../components/games/SimEmbed';
import { GAMES_REGISTRY } from '../data/gamesData';

const GameViewPage: React.FC = () => {
    const { gameId } = useParams();

    const game = useMemo(() =>
        GAMES_REGISTRY.find(g => g.id === gameId),
        [gameId]);

    if (!game) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-400 mb-4">Game Not Found</h1>
                <Link to="/private/games" className="text-blue-500 hover:underline flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Library
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header Navigation */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/private/games"
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        title="Back to Library"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-none">{game.title}</h1>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                            {game.category} | {game.lesson}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <Share2 size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 lg:p-8 flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">

                    {/* The Simulation */}
                    <SimEmbed src={game.simUrl} title={game.title} />

                    {/* Meta Data & Instructions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm leading-relaxed">
                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Info className="text-blue-500" size={24} />
                                Educational Goals
                            </h2>
                            <p className="text-slate-600 mb-6">{game.description}</p>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h3 className="font-bold text-slate-700 text-sm mb-1">Unit Alignment</h3>
                                    <p className="text-sm text-slate-500">{game.unit}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h3 className="font-bold text-slate-700 text-sm mb-1">Lesson Focus</h3>
                                    <p className="text-sm text-slate-500">{game.lesson}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col">
                            <h2 className="text-lg font-bold mb-4">Quick Hints</h2>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    Use the Fullscreen button for the best experience.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    PhET simulations work great on both touch and mouse.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    Explore the "Game" tab (if available) for progression levels.
                                </li>
                            </ul>

                            <div className="mt-auto pt-6">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Source</p>
                                <p className="text-xs text-blue-400 truncate">{game.simUrl}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GameViewPage;
