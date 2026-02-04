import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    Gamepad2,
    Monitor,
    MessageSquare,
    FileText,
    Video,
    BookOpen,
    PlayCircle,
    ArrowRight
} from 'lucide-react';

const Tutorials = () => {
    const tutorialSections = [
        {
            title: 'Mission Center',
            icon: CheckSquare,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            description: 'Learn how to accept missions, track progress, and submit your work for review.',
            steps: [
                'Browse available missions in the Center.',
                'Click a mission to see details and objectives.',
                'Submit your findings or code via the upload portal.',
                'Track your ranking on the leaderboard.'
            ]
        },
        {
            title: 'Education Games',
            icon: Gamepad2,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            description: 'Interactive simulations aligned with your curriculum.',
            steps: [
                'Select a subject from the Games Library.',
                'Choose a simulation (e.g., Atom Builder).',
                'Use the Fullscreen mode for the best experience.',
                'Experiment with variables to see real-time results.'
            ]
        },
        {
            title: 'VM Rental System',
            icon: Monitor,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            description: 'Access powerful cloud machines for high-end tasks.',
            steps: [
                'Select a VM configuration that fits your needs.',
                'Rent your slot and wait for provisioning.',
                'Connect via VNC directly in your browser.',
                'Remember to stop the VM when finished.'
            ]
        },
        {
            title: 'Comms & Documents',
            icon: MessageSquare,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            description: 'Stay connected with the academy and access files.',
            steps: [
                'Use the Comms Channel for real-time chat.',
                'Download learning materials from Academy Files.',
                'Watch recorded sessions in the Video library.',
                'Update your profile and avatar in settings.'
            ]
        }
    ];

    return (
        <div className="p-6 md:p-10 min-h-screen bg-app">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-2xl">
                            <BookOpen size={32} className="text-cyan-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-primary">Academy Tutorials</h1>
                    </div>
                    <p className="text-secondary max-w-2xl text-lg">
                        Master the Unreal Cyber environment with these step-by-step guides.
                        Everything you need to succeed in your missions.
                    </p>
                </div>

                {/* Tutorial Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {tutorialSections.map((section, idx) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-panel border border-border rounded-[2rem] p-8 shadow-xl hover:shadow-cyan-500/5 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-4 rounded-2xl ${section.bg}`}>
                                    <section.icon size={32} className={section.color} />
                                </div>
                                <div className="flex items-center space-x-2 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-bold uppercase tracking-wider">Play Video</span>
                                    <PlayCircle size={20} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-primary mb-3">{section.title}</h2>
                            <p className="text-secondary mb-8 leading-relaxed">
                                {section.description}
                            </p>

                            <div className="space-y-4">
                                {section.steps.map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-start space-x-4">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-border flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0 mt-0.5">
                                            {sIdx + 1}
                                        </div>
                                        <p className="text-sm text-secondary leading-tight">{step}</p>
                                    </div>
                                ))}
                            </div>

                            <button className="mt-10 w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-border flex items-center justify-center space-x-3 text-primary font-bold transition-all group/btn">
                                <span>Get Started</span>
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Help Footer */}
                <div className="mt-16 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-[2.5rem] p-10 border border-cyan-500/20 text-center">
                    <h3 className="text-2xl font-bold text-primary mb-4">Still need help?</h3>
                    <p className="text-secondary mb-8 max-w-xl mx-auto">
                        Join our Discord or reach out to a mentor in the Comms Channel.
                        We're here to support your journey.
                    </p>
                    <button className="px-8 py-3 bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all">
                        Contact Support
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Tutorials;
