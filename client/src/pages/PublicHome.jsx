import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, Play, ShieldCheck, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PUBLIC_CONTENT = {
    hero: {
        title: 'UnrealCyber Vision',
        subtitle: 'Networking, ethical hacking, and programming. Learn fast, build real skills.',
        ctaText: 'Watch on YouTube',
        ctaLink: 'https://www.youtube.com/'
    },
    pillars: [
        { title: 'Networking', description: 'Routing, switching, protocols, and real labs.' },
        { title: 'Ethical Hacking', description: 'Hands-on offensive security and defense.' },
        { title: 'Programming', description: 'Automation, scripts, and tools that scale.' }
    ],
    sections: [
        {
            key: 'networking',
            title: 'Networking',
            description: 'Core networking foundations and lab walkthroughs.',
            videos: [
                { title: 'Intro to Networking', description: 'Quick fundamentals to get started.', url: '', downloads: [] }
            ]
        },
        {
            key: 'ethical-hacking',
            title: 'Ethical Hacking',
            description: 'Red-team mindset, tooling, and practical exploits.',
            videos: []
        },
        {
            key: 'programming',
            title: 'Programming',
            description: 'Build scripts, automation, and security tooling.',
            videos: []
        }
    ],
    socials: {
        youtube: '',
        telegram: '',
        discord: ''
    }
};

const isDriveLink = (url) => {
    if (!url) return false;
    return url.includes('drive.google.com') || /[-\w]{15,}/.test(url);
};

const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
            else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
            else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
            else videoId = url;
            return `https://www.youtube.com/embed/${videoId}`;
        }

        const driveMatch = url.match(/(?:file\/d\/|open\?id=|uc\?id=|id=)([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
            return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }

        return url.replace('/view', '/preview');
    } catch {
        return '';
    }
};

const PublicHome = () => {
    const [content, setContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [loading, setLoading] = useState(true);
    const { user, loginWithGoogle, logout } = useAuth();
    const googleBtnRef = useRef(null);
    const [googleReady, setGoogleReady] = useState(false);
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('video');

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

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || user) return;

        const initGoogle = () => {
            if (!window.google || !googleBtnRef.current) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    await loginWithGoogle(response.credential, { requireAdmin: false });
                }
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: '220'
            });
            setGoogleReady(true);
        };

        if (window.google) {
            initGoogle();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.body.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [loginWithGoogle, user]);

    const pillars = content.pillars?.length ? content.pillars : DEFAULT_PUBLIC_CONTENT.pillars;
    const sections = (content.sections?.length ? content.sections : DEFAULT_PUBLIC_CONTENT.sections).map((section, sectionIndex) => ({
        ...section,
        videos: (section.videos || []).map((video, videoIndex) => ({
            ...video,
            downloads: Array.isArray(video.downloads) ? video.downloads : [],
            anchorId: `video-${sectionIndex}-${videoIndex}`,
            sectionKey: section.key || `section-${sectionIndex}`
        }))
    }));

    const latestVideos = sections.flatMap(section =>
        section.videos.map(video => ({ ...video, sectionTitle: section.title, sectionKey: section.key }))
    ).slice(0, 6);

    const openVideo = (video) => {
        if (!video) return;
        setActiveVideo(video);
        setActiveTab('video');
        if (video.anchorId) {
            const el = document.getElementById(video.anchorId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const closeVideo = () => {
        setActiveVideo(null);
        setActiveTab('video');
    };

    const toDownloadHref = (url) => {
        if (!url) return '';
        return isDriveLink(url) ? `/api/public/download/${encodeURIComponent(url)}` : url;
    };

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
                            <p className="text-[10px] text-secondary uppercase tracking-widest">Vision</p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-xs text-secondary uppercase tracking-[0.2em]">
                        <a href="#vision" className="hover:text-primary transition-colors">Vision</a>
                        <a href="#latest" className="hover:text-primary transition-colors">Latest</a>
                        {sections.map(section => (
                            <a key={section.key} href={`#${section.key}`} className="hover:text-primary transition-colors">
                                {section.title}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                        {!user && (
                            <div className="flex flex-col items-end">
                                <div ref={googleBtnRef} />
                                {!googleReady && (
                                    <span className="text-[10px] text-secondary mt-1">Set `VITE_GOOGLE_CLIENT_ID`</span>
                                )}
                            </div>
                        )}
                        {user && (
                            <div className="flex items-center gap-3 bg-panel/60 border border-white/10 px-3 py-2 rounded-xl">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-panel">
                                    {user.avatar_id ? (
                                        <img src={`https://lh3.googleusercontent.com/d/${user.avatar_id}?v=${user.avatar_version || 0}`} className="w-full h-full object-cover" alt="" />
                                    ) : user.avatar_url ? (
                                        <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600 uppercase">
                                            {(user.display_name || user.username)[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col text-[10px] text-secondary">
                                    <span className="text-primary font-semibold">{user.display_name || user.username}</span>
                                    <button onClick={logout} className="text-red-400 hover:text-red-300 text-left">Sign out</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main>
                <section id="vision" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
                    <div className="space-y-6">
                        <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">UnrealCyber Vision</p>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                            {content.hero?.title}
                        </h1>
                        <p className="text-secondary text-lg leading-relaxed max-w-2xl">
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
                            {content.socials?.telegram && (
                                <a
                                    href={content.socials.telegram}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-secondary hover:text-primary hover:border-cyan-400/40 transition-colors font-bold"
                                >
                                    Join Telegram
                                    <ArrowUpRight size={16} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {pillars.map((pillar, idx) => (
                            <div key={`${pillar.title}-${idx}`} className="glass-panel p-6 border-white/10">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Track {idx + 1}</p>
                                <h3 className="text-xl font-bold mt-2 mb-2">{pillar.title}</h3>
                                <p className="text-sm text-secondary leading-relaxed">{pillar.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="latest" className="max-w-6xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Latest Videos</h2>
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
                    {latestVideos.length === 0 ? (
                        <div className="glass-panel p-6 border-white/10 text-secondary text-sm">
                            Add videos under each section to show them here.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {latestVideos.map((video, idx) => (
                                <button
                                    key={`${video.title}-${idx}`}
                                    type="button"
                                    onClick={() => openVideo(video)}
                                    className="text-left glass-panel p-5 border-white/10 hover:border-cyan-400/40 transition-colors"
                                >
                                    <div className="aspect-video rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4">
                                        <Play className="text-cyan-400" />
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-secondary">{video.sectionTitle}</p>
                                    <h3 className="text-lg font-bold mt-2">{video.title}</h3>
                                    <p className="text-sm text-secondary mt-2">{video.description}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {sections.map((section) => (
                    <section key={section.key} id={section.key} className="max-w-6xl mx-auto px-6 py-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">{section.title}</h2>
                                {section.description && (
                                    <p className="text-secondary text-sm mt-2">{section.description}</p>
                                )}
                            </div>
                        </div>
                        {section.videos.length === 0 ? (
                            <div className="glass-panel p-6 border-white/10 text-secondary text-sm">
                                No videos added yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {section.videos.map((video) => (
                                    <button
                                        key={video.anchorId}
                                        id={video.anchorId}
                                        type="button"
                                        onClick={() => openVideo(video)}
                                        className="text-left glass-panel p-6 border-white/10 hover:border-cyan-400/40 transition-colors"
                                    >
                                        <div className="aspect-video rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4">
                                            <Play className="text-cyan-400" />
                                        </div>
                                        <h3 className="text-lg font-bold">{video.title}</h3>
                                        <p className="text-secondary text-sm mt-2">{video.description}</p>
                                        <div className="mt-4 text-xs font-bold text-cyan-400 flex items-center gap-2">
                                            Open Session
                                            <ArrowUpRight size={14} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </main>

            <footer className="border-t border-white/5 mt-12">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between text-sm text-secondary">
                    <p>Unreal Cyber Academy</p>
                    <div className="flex items-center gap-4 text-primary">
                        {content.socials?.youtube && (
                            <a href={content.socials.youtube} target="_blank" rel="noreferrer" className="hover:text-cyan-300 flex items-center gap-2">
                                <Play size={16} />
                            </a>
                        )}
                        {content.socials?.telegram && (
                            <a href={content.socials.telegram} target="_blank" rel="noreferrer" className="hover:text-cyan-300 flex items-center gap-2">
                                <Send size={16} />
                            </a>
                        )}
                        {content.socials?.discord && (
                            <a href={content.socials.discord} target="_blank" rel="noreferrer" className="hover:text-cyan-300 flex items-center gap-2">
                                <MessageCircle size={16} />
                            </a>
                        )}
                    </div>
                </div>
            </footer>

            {activeVideo && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl bg-slate-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Session</p>
                                <h3 className="text-lg font-bold">{activeVideo.title}</h3>
                            </div>
                            <button onClick={closeVideo} className="text-xs text-secondary hover:text-primary">Close</button>
                        </div>
                        <div className="flex border-b border-white/10">
                            <button
                                className={`flex-1 px-6 py-3 text-sm font-bold ${activeTab === 'video' ? 'text-white border-b-2 border-cyan-400' : 'text-secondary'}`}
                                onClick={() => setActiveTab('video')}
                            >
                                Watch
                            </button>
                            <button
                                className={`flex-1 px-6 py-3 text-sm font-bold ${activeTab === 'downloads' ? 'text-white border-b-2 border-cyan-400' : 'text-secondary'}`}
                                onClick={() => setActiveTab('downloads')}
                            >
                                Downloads
                            </button>
                        </div>
                        <div className="p-6">
                            {activeTab === 'video' && (
                                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900/70">
                                    {getVideoEmbedUrl(activeVideo.url) ? (
                                        <iframe
                                            src={getVideoEmbedUrl(activeVideo.url)}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={activeVideo.title}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-secondary text-sm">
                                            No video link provided.
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'downloads' && (
                                <div className="space-y-4">
                                    {activeVideo.downloads && activeVideo.downloads.length > 0 ? (
                                        activeVideo.downloads.map((item, idx) => (
                                            <a
                                                key={`${item.title}-${idx}`}
                                                href={toDownloadHref(item.url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 hover:border-cyan-400/40 text-sm text-secondary hover:text-primary transition-colors"
                                            >
                                                <span>{item.title}</span>
                                                <ArrowUpRight size={14} />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-sm text-secondary">No downloadable files attached.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed bottom-4 right-4 text-xs text-secondary bg-panel/80 border border-border rounded-full px-4 py-2">
                    Loading public content...
                </div>
            )}
        </div>
    );
};

export default PublicHome;
