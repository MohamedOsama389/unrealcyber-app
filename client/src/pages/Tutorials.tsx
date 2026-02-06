import React from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Play,
    Shield,
    Zap,
    Terminal,
    Globe,
    Cpu,
    LifeBuoy,
    ExternalLink,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

const Tutorials = () => {
    const restartTour = () => {
        localStorage.removeItem('academy_tour_completed');
        window.location.reload(); // Reload to trigger the useEffect in TutorialTour
    };

    const TUTORIAL_CARDS = [
        {
            title: "Getting Started",
            description: "Learn the basics of the Academy OS, your dashboard, and how to track your progress.",
            icon: Play,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
            action: restartTour,
            actionLabel: "Start Tour"
        },
        {
            title: "Mission Center",
            description: "Master the task system. Learn how to submit reports and earn academy status.",
            icon: Shield,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            action: () => window.location.href = '/tasks',
            actionLabel: "View Missions"
        },
        {
            title: "VM Infrastructure",
            description: "Deep dive into our high-performance VM rental system for development.",
            icon: Cpu,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            action: () => window.location.href = '/vm-rental',
            actionLabel: "Explore VMs"
        }
    ];

    const GUIDES = [
        {
            title: "Secure Terminal Access",
            duration: "5 min read",
            category: "Security",
            author: "Admin Lloyed"
        },
        {
            title: "Maximizing Learning Streaks",
            duration: "3 min read",
            category: "Efficiency",
            author: "System"
        },
        {
            title: "Collaborative Data Hub",
            duration: "8 min read",
            category: "Collaboration",
            author: "Dev Team"
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center space-x-3 text-cyan-400">
                    <BookOpen size={24} />
                    <span className="text-sm font-bold uppercase tracking-[0.3em]">Knowledge Base</span>
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight">
                    Tutorial <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Hub</span>
                </h1>
                <p className="text-secondary text-lg max-w-2xl">
                    Master the Unreal Cyber environment with our interactive guides and comprehensive documentation.
                </p>
            </header>

            {/* Quick Start Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TUTORIAL_CARDS.map((card, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass-panel p-8 flex flex-col items-start space-y-4 group cursor-pointer"
                        onClick={card.action}
                    >
                        <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                            <card.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-primary">{card.title}</h3>
                        <p className="text-secondary text-sm leading-relaxed">
                            {card.description}
                        </p>
                        <button className="pt-4 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-cyan-400 group-hover:text-cyan-300 transition-colors">
                            <span>{card.actionLabel}</span>
                            <Play size={12} className="fill-current" />
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Documentation Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Terminal size={22} className="text-purple-400" />
                            System Guides
                        </h2>
                        <button className="text-xs text-secondary hover:text-primary transition-colors uppercase font-bold tracking-widest">
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {GUIDES.map((guide, i) => (
                            <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group cursor-pointer">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-secondary group-hover:text-cyan-400 transition-colors">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary">{guide.title}</h4>
                                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                            <span>{guide.category}</span>
                                            <span>•</span>
                                            <span>{guide.duration}</span>
                                        </div>
                                    </div>
                                </div>
                                <ExternalLink size={16} className="text-slate-700 group-hover:text-primary" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 border-l-4 border-l-cyan-500">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Zap size={18} className="text-cyan-400" />
                            Need Live Help?
                        </h3>
                        <p className="text-sm text-secondary mb-6 leading-relaxed">
                            Our AI academy tutors and dev team are available on the Comms Channel 24/7.
                        </p>
                        <button
                            onClick={() => window.location.href = '/chat'}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                        >
                            Open Comms
                        </button>
                    </div>

                    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-400" />
                            Onboarding Progress
                        </h3>
                        <div className="space-y-3">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-purple-500" />
                            </div>
                            <p className="text-[10px] text-secondary uppercase tracking-widest text-center">
                                65% Completed
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Tutorials;
