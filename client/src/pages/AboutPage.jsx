import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Network, Shield, Code2, Eye, Cpu, FlaskConical, ArrowUpRight } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

const PILLARS = [
    {
        icon: Network,
        title: 'Networking',
        description: 'Build strong network fundamentals across routing, switching, and architecture.',
        popular: 'CCNA Foundations',
    },
    {
        icon: Shield,
        title: 'Ethical Hacking',
        description: 'Learn reconnaissance, exploitation testing, and defensive hardening.',
        popular: 'Penetration Testing Fundamentals',
    },
    {
        icon: Code2,
        title: 'Programming',
        description: 'Write security-oriented automation scripts and practical tooling.',
        popular: 'Python for Security Automation',
    },
];

const STEPS = [
    {
        icon: Eye,
        title: 'Watch',
        desc: 'Understand concepts quickly through concise lessons.',
    },
    {
        icon: Cpu,
        title: 'Test',
        desc: 'Validate your understanding through focused checks.',
    },
    {
        icon: FlaskConical,
        title: 'Practice Hands-On',
        desc: 'Apply knowledge in labs and scenario-driven exercises.',
    },
];

export default function AboutPage() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);
    return (
        <div className="min-h-screen bg-app text-primary relative overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#08152e] via-[#071226] to-[#08152e] -z-10" />
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-8 right-8 h-72 w-72 rounded-full bg-cyan-500/7 blur-[110px]" />
                <div className="absolute bottom-8 left-8 h-72 w-72 rounded-full bg-blue-500/7 blur-[110px]" />
            </div>

            <PublicNavbar />

            <main className="pt-24 md:pt-30 pb-20 section-padding space-y-16">
                <section className="max-w-6xl mx-auto glass-card p-8 md:p-12 text-center reveal-on-scroll">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300">Learning Blueprint</p>
                    <h1 className="mt-5 text-4xl md:text-5xl font-bold">
                        A Practical Path to <span className="cyber-text-gradient">Cybersecurity Mastery</span>
                    </h1>
                    <p className="mt-5 max-w-3xl mx-auto text-slate-300/85 leading-relaxed">
                        UnrealCyber focuses on real skill development. No inflated claims, no filler, just structured training that improves your technical ability.
                    </p>
                </section>

                <section className="max-w-6xl mx-auto reveal-on-scroll">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">Three Pillars of Mastery</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {PILLARS.map((pillar) => {
                            const Icon = pillar.icon;
                            return (
                                <div key={pillar.title} className="flip-card h-72">
                                    <div className="flip-card-inner">
                                        <article className="flip-card-front glass-card cyber-border-glow p-6">
                                            <div className="w-11 h-11 rounded-lg bg-cyan-500/12 border border-cyan-500/25 flex items-center justify-center">
                                                <Icon size={20} className="text-cyan-300" />
                                            </div>
                                            <h3 className="mt-4 text-2xl font-semibold">{pillar.title}</h3>
                                            <p className="mt-3 text-sm text-slate-300/80">{pillar.description}</p>
                                        </article>
                                        <article className="flip-card-back glass-card p-6 bg-gradient-to-br from-[#0a1b39] to-[#071428]">
                                            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Most Popular Course</p>
                                            <h4 className="mt-5 text-xl font-semibold">{pillar.popular}</h4>
                                            <Link to="/tracking" className="mt-8 inline-flex items-center gap-2 text-cyan-300 font-semibold">
                                                Start This Track <ArrowUpRight size={14} />
                                            </Link>
                                        </article>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="max-w-6xl mx-auto reveal-on-scroll">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">A Proven Learning Method</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <article key={step.title} className="glass-card-hover p-6 relative overflow-hidden">
                                    <span className="absolute top-0 right-2 text-7xl text-white/5 font-bold">0{idx + 1}</span>
                                    <div className="w-12 h-12 rounded-xl bg-cyan-500/12 border border-cyan-500/25 flex items-center justify-center">
                                        <Icon size={20} className="text-cyan-300" />
                                    </div>
                                    <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                                    <p className="mt-3 text-sm text-slate-300/80">{step.desc}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}

