import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Atom } from 'lucide-react';

const Games = () => {
    const navigate = useNavigate();

    const games = [
        {
            id: 'atom-builder',
            title: 'Atom Builder',
            description: 'Build atoms by dragging protons, neutrons, and electrons. Visualized on the periodic table.',
            icon: Atom,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
            border: 'border-cyan-400/20'
        }
    ];

    return (
        <div className="p-6 md:p-10 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <Gamepad2 size={32} className="text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">Education Games</h1>
                        <p className="text-secondary">Interactive learning experiences</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <motion.button
                            key={game.id}
                            onClick={() => navigate(`/games/${game.id}`)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                text-left p-6 rounded-2xl border ${game.border} ${game.bg}
                                hover:shadow-lg transition-all duration-300 group
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-app border border-white/5`}>
                                    <game.icon size={32} className={game.color} />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-app border border-white/5 text-xs text-secondary font-medium uppercase tracking-wider">
                                    Released
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-cyan-400 transition-colors">
                                {game.title}
                            </h3>
                            <p className="text-sm text-secondary leading-relaxed">
                                {game.description}
                            </p>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Games;
