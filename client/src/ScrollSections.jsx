import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Play, ArrowRight, ExternalLink, Award } from 'lucide-react';

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
            {displaySections.map((section, idx) => {
                const popularCourse = section.videos && section.videos.length > 0 ? section.videos[0] : null;
                const thumbId = popularCourse ? extractDriveId(popularCourse.url) : null;

                return (
                    <section
                        key={section.key || idx}
                        id={section.key}
                        className="h-auto min-h-screen lg:h-[120vh] flex items-center px-4 md:px-20 py-20 lg:py-0"
                    >
                        <div className="max-w-7xl mx-auto w-full flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                            {/* Left: Content Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="group relative w-full"
                            >
                                <a
                                    href={popularCourse?.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-slate-950/60 backdrop-blur-3xl p-8 md:p-14 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-2xl space-y-8 transform transition-all duration-500 hover:bg-slate-900/80 hover:border-cyan-500/30 group-hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
                                >
                                    <div className="space-y-4">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-${section.color || 'cyan'}-500/20 border border-${section.color || 'cyan'}-500/30 text-[10px] font-black uppercase tracking-[0.3em] text-${section.color || 'cyan'}-400`}>
                                            <Award size={12} className="mr-1" />
                                            Most Popular Course
                                        </div>
                                        <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.95] break-words">
                                            {section.title}
                                        </h2>
                                        <p className="text-base md:text-lg text-secondary/80 leading-relaxed font-medium line-clamp-4">
                                            {section.description}
                                        </p>
                                    </div>

                                    {/* Video Preview */}
                                    {popularCourse ? (
                                        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-black/60 border border-white/5 p-3 md:p-4 group-hover:border-white/20 transition-all">
                                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start text-center sm:text-left">
                                                <div className="w-full sm:w-32 aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-slate-800 relative flex-shrink-0">
                                                    <img
                                                        src={thumbId ? `/api/proxy/thumbnail/${thumbId}` : ''}
                                                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                                                        alt=""
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Play size={24} className="text-white fill-white opacity-80" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-lg md:text-xl font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-center sm:justify-start gap-2">
                                                        {popularCourse.title} <ExternalLink size={16} />
                                                    </h4>
                                                    <p className="text-xs md:text-sm text-secondary/60 line-clamp-2 md:line-clamp-3">{popularCourse.description || 'Access full course content and labs.'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full py-10 rounded-3xl border border-dashed border-white/10 flex items-center justify-center">
                                            <p className="text-secondary/40 font-black uppercase tracking-widest text-xs">Content Loading...</p>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                        {(section.tags || ['Foundations', 'Labs', 'Training']).map(tag => (
                                            <span key={tag} className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-white/5 border border-white/5 text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest group-hover:border-white/10 group-hover:text-primary transition-all">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </a>
                            </motion.div>

                            {/* Right: Spacer for 3D model (On mobile, this should be the focal point above the card) */}
                            <div className="w-full h-[60vh] lg:h-full min-h-[300px] lg:min-h-[500px]" />
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default ScrollSections;
