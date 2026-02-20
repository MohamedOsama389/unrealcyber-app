import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowUpRight,
    Play,
    Network,
    Shield,
    Code2,
    Eye,
    FlaskConical,
    Cpu,
    Youtube,
    Send,
    MessageSquare,
    Instagram,
    Music,
    Facebook,
    Twitter,
    Linkedin
} from 'lucide-react';
import { DEFAULT_PUBLIC_CONTENT, normalizePublicContent } from '../data/publicSite';
import PublicNavbar from '../components/PublicNavbar';
import { useTheme } from '../context/ThemeContext';

const METHOD_STEPS = [
    {
        title: 'Watch',
        description: 'Learn core concepts through clear, practical walkthroughs.',
        icon: Eye,
    },
    {
        title: 'Test',
        description: 'Validate understanding with checkpoints and focused challenges.',
        icon: Cpu,
    },
    {
        title: 'Practice Hands-On',
        description: 'Apply everything in labs and realistic cybersecurity scenarios.',
        icon: FlaskConical,
    },
];

const SECTION_META = {
    networking: {
        icon: Network,
        accent: 'text-cyan-300',
        chip: 'bg-cyan-500/12 border-cyan-500/30',
        glow: 'shadow-[0_0_34px_rgba(18,216,255,0.18)]',
    },
    'ethical-hacking': {
        icon: Shield,
        accent: 'text-sky-300',
        chip: 'bg-sky-500/12 border-sky-500/30',
        glow: 'shadow-[0_0_34px_rgba(56,189,248,0.16)]',
    },
    programming: {
        icon: Code2,
        accent: 'text-blue-300',
        chip: 'bg-blue-500/12 border-blue-500/30',
        glow: 'shadow-[0_0_34px_rgba(59,130,246,0.16)]',
    },
};

const FALLBACK_PILLARS = [
    {
        key: 'networking',
        title: 'Networking',
        description: 'Design, route, and secure modern networks with confidence.',
        popularCourse: 'CCNA Foundations',
    },
    {
        key: 'ethical-hacking',
        title: 'Ethical Hacking',
        description: 'Train offensive and defensive workflows in controlled labs.',
        popularCourse: 'Penetration Testing Fundamentals',
    },
    {
        key: 'programming',
        title: 'Programming',
        description: 'Build automation tools that scale cybersecurity operations.',
        popularCourse: 'Python for Security Automation',
    },
];

const extractYouTubeId = (url = '') => {
    if (!url) return '';
    try {
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&]/)[0];
        if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
        if (url.includes('/embed/')) return url.split('/embed/')[1].split(/[?&]/)[0];
    } catch {
        return '';
    }
    return '';
};

const buildLatestFallback = (content) => {
    for (const section of content.sections || []) {
        for (const video of section.videos || []) {
            const id = extractYouTubeId(video.url || '');
            if (id) {
                return {
                    id,
                    title: video.title || 'Latest upload',
                    description: video.description || 'Watch the latest lesson from our channel.',
                    url: `https://www.youtube.com/watch?v=${id}`,
                    thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
                };
            }
        }
    }
    return null;
};

export default function PublicHome() {
    const [publicContent, setPublicContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [latestVideo, setLatestVideo] = useState(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('visible');
                });
            },
            { threshold: 0.15 }
        );

        document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [publicRes, latestRes] = await Promise.all([
                    axios.get('/api/public'),
                    axios.get('/api/public/youtube-latest').catch(() => ({ data: null })),
                ]);

                const normalized = normalizePublicContent(publicRes.data);
                setPublicContent(normalized);

                if (latestRes.data?.id) {
                    setLatestVideo(latestRes.data);
                } else {
                    setLatestVideo(buildLatestFallback(normalized));
                }
            } catch {
                setPublicContent(DEFAULT_PUBLIC_CONTENT);
                setLatestVideo(buildLatestFallback(DEFAULT_PUBLIC_CONTENT));
            }
        };
        load();
    }, []);

    const pillars = useMemo(() => {
        const sections = publicContent.sections || [];
        if (sections.length === 0) return FALLBACK_PILLARS;
        return FALLBACK_PILLARS.map((fallback) => {
            const section = sections.find((item) => item.key === fallback.key);
            const popular = section?.videos?.[0]?.title || fallback.popularCourse;
            return {
                ...fallback,
                title: section?.title || fallback.title,
                description: section?.description || fallback.description,
                popularCourse: popular,
            };
        });
    }, [publicContent.sections]);

    const footer = publicContent?.footer || DEFAULT_PUBLIC_CONTENT.footer;
    const footerColumns = footer?.columns || DEFAULT_PUBLIC_CONTENT.footer.columns;
    const footerHeadings = footer?.headings || DEFAULT_PUBLIC_CONTENT.footer.headings;
    const socialLinks = [
        { key: 'youtube', icon: Youtube },
        { key: 'telegram', icon: Send },
        { key: 'discord', icon: MessageSquare },
        { key: 'instagram', icon: Instagram },
        { key: 'tiktok', icon: Music },
        { key: 'facebook', icon: Facebook },
        { key: 'twitter', icon: Twitter },
        { key: 'linkedin', icon: Linkedin },
    ].filter((item) => publicContent?.socials?.[item.key]);

    const renderFooterLink = (item, idx) => {
        const href = item?.url || '#';
        const label = item?.label || `Link ${idx + 1}`;
        const isExternal = href.startsWith('http');
        if (href.startsWith('/')) {
            return (
                <Link key={`${label}-${idx}`} to={href} className="text-slate-300/85 hover:text-cyan-200 transition-colors">
                    {label}
                </Link>
            );
        }
        return (
            <a
                key={`${label}-${idx}`}
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noreferrer' : undefined}
                className="text-slate-300/85 hover:text-cyan-200 transition-colors"
            >
                {label}
            </a>
        );
    };

    return (
        <div className="min-h-screen bg-app text-primary relative overflow-x-hidden">
            <div className="fixed inset-0 theme-page-bg -z-10" />
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 left-0 h-[30rem] w-[30rem] rounded-full bg-cyan-500/8 blur-[120px]" />
                <div className="absolute right-0 top-44 h-[22rem] w-[22rem] rounded-full bg-blue-500/8 blur-[100px]" />
                <div className="absolute bottom-10 left-1/3 h-[26rem] w-[26rem] rounded-full bg-sky-500/6 blur-[120px]" />
            </div>

            <PublicNavbar />

            <main className="pt-24 md:pt-28 pb-20">
                <section className="section-padding reveal-on-scroll">
                    <div className="max-w-6xl mx-auto text-center glass-card p-8 md:p-14 scanline-overlay">
                        <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-300">UnrealCyber Academy</p>
                        <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-bold leading-[0.95]">
                            Become a{' '}
                            <span className="glitch-text is-active cyber-text-gradient" data-text="CYBERSECURITY EXPERT">
                                CYBERSECURITY EXPERT
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-slate-300/90 text-base sm:text-lg leading-relaxed">
                            Learn networking, ethical hacking, and programming through structured modules and practical labs.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/tracking"
                                className="glitch-hover inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-cyan-500/90 text-slate-950 font-bold uppercase tracking-[0.14em]"
                            >
                                Start Learning
                                <ArrowUpRight size={16} />
                            </Link>
                            <Link
                                to="/tracking"
                                className="glitch-hover inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/8 text-cyan-200 font-semibold uppercase tracking-[0.14em]"
                            >
                                Tracks
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="section-padding mt-16 reveal-on-scroll">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                            <h2 className="text-2xl md:text-3xl font-bold glitch-hover">Latest From Our Channel</h2>
                            {publicContent?.socials?.youtube && (
                                <a
                                    href={publicContent.socials.youtube}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
                                >
                                    <Youtube size={16} /> Visit Channel
                                </a>
                            )}
                        </div>

                        <div className="glass-card overflow-hidden border-cyan-500/22">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className={`aspect-video lg:aspect-auto min-h-[260px] ${isLight ? 'bg-[#dce9ff]' : 'bg-[#081327]'}`}>
                                    {latestVideo?.id ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${latestVideo.id}`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={latestVideo.title || 'Latest from channel'}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400">
                                            Channel video feed unavailable
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 md:p-8 flex flex-col justify-between gap-5">
                                    <div>
                                        {latestVideo?.thumbnail && (
                                            <img
                                                src={latestVideo.thumbnail}
                                                alt=""
                                                className="w-32 h-20 object-cover rounded-lg border border-white/10 mb-4"
                                                loading="lazy"
                                            />
                                        )}
                                        <h3 className="text-xl font-bold text-white leading-snug">
                                            {latestVideo?.title || 'Latest video will appear here'}
                                        </h3>
                                        <p className="mt-3 text-slate-300/80 text-sm leading-relaxed line-clamp-4">
                                            {latestVideo?.description || 'Connect your YouTube channel link in site settings to auto-load your latest upload.'}
                                        </p>
                                    </div>
                                    <a
                                        href={latestVideo?.url || publicContent?.socials?.youtube || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`glitch-hover inline-flex w-fit items-center gap-2 px-5 py-2.5 rounded-lg border font-semibold ${isLight
                                            ? 'bg-cyan-500/20 border-cyan-600/35 text-cyan-700'
                                            : 'bg-cyan-500/14 border-cyan-500/32 text-cyan-100'
                                            }`}
                                    >
                                        <Play size={14} /> Watch Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section-padding mt-20 reveal-on-scroll">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold mb-8">Three Pillars of Mastery</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pillars.map((pillar) => {
                                const meta = SECTION_META[pillar.key] || SECTION_META.networking;
                                const Icon = meta.icon;
                                return (
                                    <div key={pillar.key} className="flip-card h-72 md:h-80">
                                        <div className="flip-card-inner">
                                            <div className={`flip-card-front glass-card cyber-border-glow p-6 md:p-7 ${meta.glow}`}>
                                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${meta.chip}`}>
                                                    <Icon size={22} className={meta.accent} />
                                                </div>
                                                <h3 className="mt-5 text-2xl font-bold">{pillar.title}</h3>
                                                <p className="mt-3 text-slate-300/80 leading-relaxed text-sm">{pillar.description}</p>
                                            </div>
                                            <div className="flip-card-back glass-card p-6 md:p-7 bg-gradient-to-br from-[#0a1b39] to-[#071428]">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Most Popular Course</p>
                                                <h4 className="mt-5 text-xl font-semibold text-white">{pillar.popularCourse}</h4>
                                                <Link
                                                    to={`/vision/${pillar.key}`}
                                                    className={`mt-8 inline-flex items-center gap-2 ${meta.accent} font-semibold`}
                                                >
                                                    View Course <ArrowUpRight size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="section-padding mt-20 reveal-on-scroll">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold mb-8">A Proven Learning Method</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {METHOD_STEPS.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <article
                                        key={step.title}
                                        className="glass-card-hover p-6 md:p-7 group relative overflow-hidden"
                                    >
                                        <span className="absolute -right-3 top-1 text-7xl font-bold text-white/5">0{index + 1}</span>
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/12 border border-cyan-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Icon size={20} className="text-cyan-300" />
                                        </div>
                                        <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-300/80">{step.description}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="section-padding mt-20 reveal-on-scroll">
                    <div className="max-w-6xl mx-auto glass-card p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">Choose Your Track</h2>
                                <p className="text-slate-300/80 mt-2">Open a track and start with clear modules and session-by-session progress.</p>
                            </div>
                            <Link
                                to="/tracking"
                                className="glitch-hover inline-flex items-center gap-2 w-fit px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-100 font-semibold"
                            >
                                Open Learning Hub
                                <ArrowUpRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {footer?.enabled !== false && (
            <footer className="bg-[#031024] mt-24">
                <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="md:col-span-1">
                        <span className="text-2xl font-bold tracking-tight text-white">{footer?.brand || 'UNREALCYBER'}</span>
                        <p className="mt-6 text-slate-300/80 leading-relaxed text-lg max-w-sm">
                            {footer?.description || DEFAULT_PUBLIC_CONTENT.footer.description}
                        </p>
                        {socialLinks.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                {socialLinks.map(({ key, icon: Icon }) => (
                                    <a
                                        key={key}
                                        href={publicContent.socials[key]}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-cyan-200 hover:border-cyan-500/35 transition-all"
                                    >
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {(footerHeadings?.platform || (footerColumns?.platform || []).length > 0) && (
                    <div>
                        <h3 className="text-white font-bold text-2xl mb-4">{footerHeadings?.platform || 'Platform'}</h3>
                        <div className="flex flex-col gap-3 text-lg">
                            {(footerColumns?.platform || []).map(renderFooterLink)}
                        </div>
                    </div>
                    )}

                    {(footerHeadings?.resources || (footerColumns?.resources || []).length > 0) && (
                    <div>
                        <h3 className="text-white font-bold text-2xl mb-4">{footerHeadings?.resources || 'Resources'}</h3>
                        <div className="flex flex-col gap-3 text-lg">
                            {(footerColumns?.resources || []).map(renderFooterLink)}
                        </div>
                    </div>
                    )}

                    {(footerHeadings?.legal || (footerColumns?.legal || []).length > 0) && (
                    <div>
                        <h3 className="text-white font-bold text-2xl mb-4">{footerHeadings?.legal || 'Legal'}</h3>
                        <div className="flex flex-col gap-3 text-lg">
                            {(footerColumns?.legal || []).map(renderFooterLink)}
                        </div>
                    </div>
                    )}
                </div>

                <div>
                    <div className="max-w-7xl mx-auto px-6 py-7 text-sm md:text-base text-slate-300/70 flex flex-col md:flex-row items-center justify-between gap-3">
                        <span>{footer?.copyrightText || DEFAULT_PUBLIC_CONTENT.footer.copyrightText}</span>
                        <span>{footer?.madeWithText || DEFAULT_PUBLIC_CONTENT.footer.madeWithText}</span>
                    </div>
                </div>
            </footer>
            )}
        </div>
    );
}
