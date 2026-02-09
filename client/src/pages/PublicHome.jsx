import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, Play, ShieldCheck } from 'lucide-react';

const DEFAULT_PUBLIC_CONTENT = {
    hero: {
        title: 'Unreal Cyber Academy',
        subtitle: 'Cybersecurity learning, labs, and resources. Watch, practice, and build real skills.',
        ctaText: 'Watch on YouTube',
        ctaLink: 'https://www.youtube.com/'
    },
    about: {
        title: 'About the Academy',
        body: 'Hands-on cybersecurity learning with practical labs, short tutorials, and real-world walkthroughs.'
    },
    featured: {
        title: 'Featured Videos',
        items: [
            { title: 'Intro to Networking', description: 'Quick fundamentals to get started.', url: '' }
        ]
    },
    resources: {
        title: 'Files & Tools',
        items: [
            { title: 'Starter Toolkit', description: 'Download the essentials.', url: '' }
        ]
    },
    socials: {
        youtube: '',
        telegram: '',
        discord: ''
    }
};

const getYoutubeEmbed = (url) => {
    if (!url) return '';
    try {
        let videoId = '';
        if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
        else videoId = url;
        return `https://www.youtube.com/embed/${videoId}`;
    } catch {
        return '';
    }
};

const PublicHome = () => {
    const [content, setContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/public');
                setContent({ ...DEFAULT_PUBLIC_CONTENT, ...res.data });
            } catch {
                setContent(DEFAULT_PUBLIC_CONTENT);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const featuredItems = content.featured?.items || [];
    const resourceItems = content.resources?.items || [];

    return (
        <div className="min-h-screen bg-app text-primary">
            <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <ShieldCheck size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-wide">UNREAL CYBER</p>
                            <p className="text-[10px] text-secondary uppercase tracking-widest">Public Portal</p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
                        <a href="#about" className="hover:text-primary transition-colors">About</a>
                        <a href="#videos" className="hover:text-primary transition-colors">Videos</a>
                        <a href="#resources" className="hover:text-primary transition-colors">Resources</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <a
                            href={content.hero?.ctaLink || 'https://www.youtube.com/'}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                        >
                            <Play size={14} />
                            {content.hero?.ctaText || 'Watch on YouTube'}
                        </a>
                        <a
                            href="/private/login"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-secondary hover:text-primary hover:border-cyan-400/40 transition-colors text-xs font-bold"
                        >
                            Private Login
                            <ArrowUpRight size={14} />
                        </a>
                    </div>
                </div>
            </header>

            <main>
                <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-4">Cybersecurity Content</p>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                                {content.hero?.title}
                            </h1>
                            <p className="text-secondary text-lg leading-relaxed mb-8">
                                {content.hero?.subtitle}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href={content.hero?.ctaLink || 'https://www.youtube.com/'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-xl shadow-cyan-500/20"
                                >
                                    <Play size={16} />
                                    {content.hero?.ctaText || 'Watch on YouTube'}
                                </a>
                                <a
                                    href="#resources"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-secondary hover:text-primary hover:border-cyan-400/40 transition-colors font-bold"
                                >
                                    Download Resources
                                    <ArrowUpRight size={16} />
                                </a>
                            </div>
                        </div>
                        <div className="glass-panel border-cyan-500/20 p-6">
                            <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-4">Latest Focus</div>
                            <h3 className="text-xl font-bold mb-3">{content.featured?.title}</h3>
                            <p className="text-secondary text-sm leading-relaxed">
                                {featuredItems[0]?.description || 'Short, clear walkthroughs and practical labs tailored for learners.'}
                            </p>
                            <div className="mt-6 flex items-center gap-3 text-xs text-secondary">
                                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Hands-on</span>
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">Beginner to Pro</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="about" className="max-w-6xl mx-auto px-6 py-12">
                    <div className="glass-panel p-8 border-white/10">
                        <h2 className="text-2xl font-bold mb-4">{content.about?.title}</h2>
                        <p className="text-secondary leading-relaxed">{content.about?.body}</p>
                    </div>
                </section>

                <section id="videos" className="max-w-6xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">{content.featured?.title}</h2>
                        {content.socials?.youtube && (
                            <a
                                href={content.socials.youtube}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
                            >
                                Visit Channel
                            </a>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {featuredItems.map((item, idx) => {
                            const embed = getYoutubeEmbed(item.url);
                            return (
                                <div key={`${item.title}-${idx}`} className="glass-panel p-4 border-white/10">
                                    {embed ? (
                                        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 border border-white/5">
                                            <iframe
                                                src={embed}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-video w-full rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4">
                                            <Play className="text-cyan-400" />
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-secondary text-sm">{item.description}</p>
                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 mt-3"
                                        >
                                            Watch
                                            <ArrowUpRight size={14} />
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section id="resources" className="max-w-6xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">{content.resources?.title}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resourceItems.map((item, idx) => (
                            <div key={`${item.title}-${idx}`} className="glass-panel p-6 border-white/10">
                                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                <p className="text-secondary text-sm mb-4">{item.description}</p>
                                {item.url && (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                                    >
                                        Download
                                        <ArrowUpRight size={14} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 mt-12">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between text-sm text-secondary">
                    <p>Unreal Cyber Academy — Public Portal</p>
                    <div className="flex items-center gap-4">
                        {content.socials?.youtube && (
                            <a href={content.socials.youtube} target="_blank" rel="noreferrer" className="hover:text-primary">YouTube</a>
                        )}
                        {content.socials?.telegram && (
                            <a href={content.socials.telegram} target="_blank" rel="noreferrer" className="hover:text-primary">Telegram</a>
                        )}
                        {content.socials?.discord && (
                            <a href={content.socials.discord} target="_blank" rel="noreferrer" className="hover:text-primary">Discord</a>
                        )}
                    </div>
                </div>
            </footer>

            {loading && (
                <div className="fixed bottom-4 right-4 text-xs text-secondary bg-panel/80 border border-border rounded-full px-4 py-2">
                    Loading public content...
                </div>
            )}
        </div>
    );
};

export default PublicHome;
