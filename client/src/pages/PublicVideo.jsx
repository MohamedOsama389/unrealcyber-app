import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PUBLIC_CONTENT, normalizePublicContent, buildVideoSlug, getSectionTheme, getVideoEmbedUrl, toDownloadHref } from '../data/publicSite';

const PublicVideo = () => {
    const { sectionKey, videoSlug } = useParams();
    const [content, setContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/public');
                setContent(normalizePublicContent(res.data));
            } catch {
                setContent(DEFAULT_PUBLIC_CONTENT);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const sections = useMemo(() => (
        (content.sections || []).map((section, sectionIndex) => ({
            ...section,
            key: section.key || `section-${sectionIndex}`,
            videos: (section.videos || []).map((video, videoIndex) => ({
                ...video,
                slug: buildVideoSlug(video.title, videoIndex),
                downloads: Array.isArray(video.downloads) ? video.downloads : []
            }))
        }))
    ), [content]);

    const section = sections.find((item) => item.key === sectionKey);
    const video = section?.videos.find((item) => item.slug === videoSlug);
    const theme = getSectionTheme(sectionKey);

    if (!section || !video) {
        return (
            <div className="min-h-screen bg-app text-primary px-6 py-20">
                <div className="max-w-4xl mx-auto glass-panel p-8 border-white/10">
                    <h1 className="text-2xl font-bold mb-4">Video not found</h1>
                    <p className="text-secondary mb-6">The session you’re looking for doesn’t exist.</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 font-bold">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app text-primary relative overflow-hidden">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to={`/vision/${section.key}`} className="inline-flex items-center gap-2 text-xs text-secondary hover:text-primary">
                        <ArrowLeft size={14} /> Back to {section.title}
                    </Link>
                    <div className="flex items-center gap-3">
                        {user && (user.role === 'admin' || user.private_access) && (
                            <Link
                                to="/private/dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-secondary hover:text-primary hover:border-cyan-400/40 transition-colors"
                            >
                                Private Website
                                <ArrowUpRight size={14} />
                            </Link>
                        )}
                        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-secondary">UnrealCyber Vision</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                <div className={`glass-panel border ${theme.border} ${theme.glow} p-8 bg-gradient-to-br ${theme.gradient}`}>
                    <div className={`inline-flex items-center px-3 py-1 text-[10px] uppercase tracking-[0.3em] rounded-full border ${theme.chip}`}>
                        {section.title}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mt-4">{video.title}</h1>
                    {video.description && (
                        <p className="text-secondary text-lg mt-4 max-w-3xl">{video.description}</p>
                    )}
                    {video.url && (
                        <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-2 mt-6 text-xs font-bold ${theme.accent}`}
                        >
                            Open Original Link
                            <ArrowUpRight size={14} />
                        </a>
                    )}
                </div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-panel p-4 border-white/10">
                        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-900/70">
                            {getVideoEmbedUrl(video.url) ? (
                                <iframe
                                    src={getVideoEmbedUrl(video.url)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={video.title}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-secondary text-sm">
                                    <Play className={theme.accent} />
                                    <p className="mt-2">No video link provided.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="glass-panel p-6 border-white/10 h-fit">
                        <h3 className="text-lg font-bold mb-4">Materials & Downloads</h3>
                        {video.downloads.length === 0 ? (
                            <p className="text-sm text-secondary">No downloads attached to this session.</p>
                        ) : (
                            <div className="space-y-3">
                                {video.downloads.map((item, idx) => (
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
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="fixed bottom-4 right-4 text-xs text-secondary bg-panel/80 border border-border rounded-full px-4 py-2">
                        Loading session...
                    </div>
                )}
            </main>
        </div>
    );
};

export default PublicVideo;
