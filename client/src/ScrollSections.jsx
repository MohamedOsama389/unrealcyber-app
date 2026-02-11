import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, ArrowRight, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ScrollSections = ({ onProgress, sections }) => {
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

    const defaultSections = [
        {
            key: 'networking',
            title: 'Networking',
            description: 'Master the flow of data. Understand routing, switching, and the architectural backbone of the digital world.',
            color: 'cyan',
            tags: ['Routing', 'Switching', 'OSI Model']
        },
        {
            key: 'hacking',
            title: 'Ethical Hacking',
            description: 'Become the guardian. Learn penetration testing, reconnaissance, and exploitation to build impenetrable defenses.',
            color: 'purple',
            tags: ['Pentesting', 'Recon', 'Security']
        },
        {
            key: 'programming',
            title: 'Programming',
            description: 'Automate the defense. Master Python and JavaScript to build tools that outsmart current threats.',
            color: 'blue',
            tags: ['Python', 'JS / TS', 'Automation']
        }
    ];

    const displaySections = sections && sections.length > 0
        ? sections.map(s => ({ ...defaultSections.find(d => d.key === s.key), ...s }))
        : defaultSections;

    const extractDriveId = (raw) => {
        if (!raw) return null;
        if (!raw.startsWith('http')) return raw;
        try {
            const url = new URL(raw);
            return url.searchParams.get('id') || url.pathname.match(/\/(?:file\/d|folders|d)\/([^/]+)/)?.[1] || raw;
        } catch { return raw; }
    };

    return (
        <div ref={containerRef} className="relative z-10">
            {displaySections.map((section, idx) => (
                <section
                    key={section.key || idx}
                    id={section.key}
                    className="h-[120vh] flex items-center px-6 md:px-20"
                >
                    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* Left: Content Card */}
                        <div
                            className="bg-slate-900/40 backdrop-blur-xl p-10 md:p-16 rounded-[3rem] border border-white/5 shadow-2xl space-y-10 transform transition-all duration-500 hover:bg-slate-900/60 hover:border-white/10 group"
                        >
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-${section.color || 'cyan'}-500/10 border border-${section.color || 'cyan'}-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-${section.color || 'cyan'}-400`}>
                                    Most Popular Course
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                                    {section.title}
                                </h2>
                                <p className="text-xl text-secondary/70 leading-relaxed font-medium">
                                    {section.description}
                                </p>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-3">
                                {(section.tags || ['Foundations', 'Labs', 'Training']).map(tag => (
                                    <span key={tag} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-secondary uppercase tracking-widest group-hover:border-white/10 group-hover:text-primary transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Video Card (opens in new window) */}
                            {section.videos && section.videos.length > 0 ? (
                                <a
                                    href={section.videos[0].url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group/card relative overflow-hidden rounded-3xl bg-black/40 border border-white/5 p-4 hover:border-white/20 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex gap-6 items-center">
                                        <div className="w-32 aspect-video rounded-2xl overflow-hidden bg-slate-800 relative flex-shrink-0">
                                            <img
                                                src={`/api/public/thumbnail/${extractDriveId(section.videos[0].url)}`}
                                                className="w-full h-full object-cover opacity-50 group-hover/card:scale-110 transition-transform duration-500"
                                                alt=""
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play size={20} className="text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-lg font-bold text-white group-hover/card:text-cyan-400 transition-colors flex items-center gap-2">
                                                {section.videos[0].title} <ExternalLink size={14} className="opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                            </h4>
                                            <p className="text-sm text-secondary line-clamp-1">{section.videos[0].description || 'Professional training session'}</p>
                                        </div>
                                    </div>
                                </a>
                            ) : (
                                <button className="w-full py-6 rounded-3xl bg-white/5 border border-dashed border-white/10 text-secondary/40 font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all">
                                    Course Modules Loading...
                                </button>
                            )}
                        </div>

                        {/* Right: Spacer for 3D model */}
                        <div className="hidden lg:block h-full" />
                    </div>
                </section>
            ))}
        </div>
    );
};

export default ScrollSections;
