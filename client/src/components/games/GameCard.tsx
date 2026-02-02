import React from 'react';
import { Play, ExternalLink, BookOpen } from 'lucide-react';
import { GameMetadata } from '../../data/gamesData';
import { useNavigate } from 'react-router-dom';

interface GameCardProps {
    game: GameMetadata;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
    const navigate = useNavigate();

    return (
        <div className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
            {/* Visual Header / Indicator */}
            <div className={`h-3 bg-gradient-to-r ${game.category === 'Science' ? 'from-blue-400 to-indigo-500' :
                    game.category === 'Math' ? 'from-emerald-400 to-teal-500' :
                        game.category === 'English' ? 'from-purple-400 to-pink-500' :
                            'from-orange-400 to-red-500'
                }`} />

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        {game.category}
                    </span>
                    {game.isPhET && (
                        <span className="text-[10px] font-bold text-blue-500 flex items-center">
                            PhET&reg; Official
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {game.title}
                </h3>

                <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-2 text-slate-500 text-xs">
                        <BookOpen size={14} className="mt-0.5 shrink-0" />
                        <span>{game.unit}</span>
                    </div>
                </div>

                <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                    {game.description}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {game.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] text-slate-400 font-medium">#{tag}</span>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate(`/games/${game.id}`)}
                        className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                    >
                        <span>Play</span>
                        <Play size={14} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameCard;
