import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollSections = ({ onProgress }) => {
    const containerRef = useRef();

    useEffect(() => {
        const trigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                onProgress(self.progress);
            }
        });

        return () => trigger.kill();
    }, [onProgress]);

    return (
        <div ref={containerRef} className="relative z-10">
            {/* PART 1: Networking */}
            <section id="networking" className="h-[150vh] flex flex-col items-center justify-center px-6">
                <div className="max-w-4xl text-center space-y-6 bg-slate-950/40 backdrop-blur-sm p-12 rounded-3xl border border-white/5 shadow-2xl">
                    <h2 className="text-5xl md:text-7xl font-extrabold text-cyan-400 uppercase tracking-tighter">
                        Networking
                    </h2>
                    <p className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto leading-relaxed">
                        Master the flow of data. Understand routing, switching, and the architectural backbone of the digital world.
                    </p>
                    <div className="flex justify-center gap-4 mt-8">
                        <span className="px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest">Routing</span>
                        <span className="px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest">Switching</span>
                        <span className="px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest">OSI Model</span>
                    </div>
                </div>
            </section>

            {/* PART 2: Ethical Hacking */}
            <section id="hacking" className="h-[150vh] flex flex-col items-center justify-center px-6">
                <div className="max-w-4xl text-center space-y-6 bg-slate-950/40 backdrop-blur-sm p-12 rounded-3xl border border-white/5 shadow-2xl">
                    <h2 className="text-5xl md:text-7xl font-extrabold text-purple-400 uppercase tracking-tighter">
                        Ethical Hacking
                    </h2>
                    <p className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto leading-relaxed">
                        Become the guardian. Learn penetration testing, reconnaissance, and exploitation to build impenetrable defenses.
                    </p>
                    <div className="flex justify-center gap-4 mt-8">
                        <span className="px-4 py-2 rounded-full border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest">Pentesting</span>
                        <span className="px-4 py-2 rounded-full border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest">Recon</span>
                        <span className="px-4 py-2 rounded-full border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest">Security</span>
                    </div>
                </div>
            </section>

            {/* PART 3: Programming */}
            <section id="programming" className="h-[150vh] flex flex-col items-center justify-center px-6">
                <div className="max-w-4xl text-center space-y-6 bg-slate-950/40 backdrop-blur-sm p-12 rounded-3xl border border-white/5 shadow-2xl">
                    <h2 className="text-5xl md:text-7xl font-extrabold text-blue-400 uppercase tracking-tighter">
                        Programming
                    </h2>
                    <p className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto leading-relaxed">
                        Automate the defense. Master Python and JavaScript to build tools that outsmart current threats.
                    </p>
                    <div className="flex justify-center gap-4 mt-8">
                        <span className="px-4 py-2 rounded-full border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">Python</span>
                        <span className="px-4 py-2 rounded-full border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">JS / TS</span>
                        <span className="px-4 py-2 rounded-full border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">Automation</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ScrollSections;
