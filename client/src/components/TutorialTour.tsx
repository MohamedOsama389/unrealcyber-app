import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
    {
        targetId: 'nav-dashboard',
        title: 'Your Command Center',
        content: 'Welcome to your Dashboard! This is where you can see your daily status, streaks, and current goals.',
        position: 'right'
    },
    {
        targetId: 'nav-tasks',
        title: 'Mission Center',
        content: 'Access all your academy missions here. Complete them to earn rewards and climb the leaderboard.',
        position: 'right'
    },
    {
        targetId: 'nav-games',
        title: 'Education Games',
        content: 'Explore interactive simulations for Science, Math, and more. Perfect for hands-on learning!',
        position: 'right'
    },
    {
        targetId: 'nav-vm-rental',
        title: 'Virtual Machines',
        content: 'Need more power? Rent a high-performance VM for your deep learning or development tasks.',
        position: 'right'
    },
    {
        targetId: 'nav-theme-toggle',
        title: 'Aesthetics',
        content: 'Switch between Dark and Light mode to find your perfect working environment.',
        position: 'right'
    },
    {
        targetId: 'nav-user-profile',
        title: 'Academy Identity',
        content: 'This is your profile. Keep your avatar updated and track your rank within the academy.',
        position: 'right'
    }
];

const TutorialTour = () => {
    const [currentStep, setCurrentStep] = useState(-1);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem('academy_tour_completed');
        if (!hasSeenTour) {
            setTimeout(() => setCurrentStep(0), 1500);
        } else {
            setIsComplete(true);
        }
    }, []);

    useEffect(() => {
        if (currentStep >= 0 && currentStep < TOUR_STEPS.length) {
            const step = TOUR_STEPS[currentStep];
            const element = document.getElementById(step.targetId);

            if (element) {
                const rect = element.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found (e.g. wrong page), skip or end
                handleNext();
            }
        }
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('academy_tour_completed', 'true');
        setCurrentStep(-1);
        setIsComplete(true);
    };

    if (isComplete || currentStep === -1) return null;

    const currentStepData = TOUR_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Dark Backdrop with Hole */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" />

            {/* Highlight Box */}
            <motion.div
                initial={false}
                animate={{
                    top: coords.top - 8,
                    left: coords.left - 8,
                    width: coords.width + 16,
                    height: coords.height + 16,
                    opacity: 1
                }}
                className="absolute border-2 border-cyan-400 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] z-[101]"
                style={{ position: 'absolute' }}
            />

            {/* Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        top: coords.top + coords.height / 2 - 100, // Balanced position
                        left: coords.left + coords.width + 24
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute w-80 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto z-[102]"
                    style={{
                        position: 'absolute',
                        // Handle collision with bottom of screen
                        transform: 'translateY(0)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-cyan-400">
                            <Sparkles size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Tutorial Guide</span>
                        </div>
                        <button onClick={handleComplete} className="text-slate-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-primary mb-2">{currentStepData.title}</h3>
                    <p className="text-sm text-secondary leading-relaxed mb-6">
                        {currentStepData.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex space-x-1">
                            {TOUR_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-cyan-500 w-4' : 'bg-slate-700'}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center space-x-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="p-2 text-secondary hover:text-primary transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default TutorialTour;
