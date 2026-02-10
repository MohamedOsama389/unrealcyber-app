import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PUBLIC_CONTENT, normalizePublicContent, buildVideoSlug, getSectionTheme, getVideoThumbnailUrl } from '../data/publicSite';

const PublicSection = () => {
    const { sectionKey } = useParams();
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
                slug: buildVideoSlug(video.title, videoIndex)
            }))
        }))
    ), [content]);

    const section = sections.find((item) => item.key === sectionKey);
    const theme = getSectionTheme(sectionKey);

    if (!section) {
        return (
            <div className="min-h-screen bg-app text-primary px-6 py-20">
                <div className="max-w-4xl mx-auto glass-panel p-8 border-white/10">
                    <h1 className="text-2xl font-bold mb-4">Section not found</h1>
                    <p className="text-secondary mb-6">The section you’re looking for doesn’t exist.</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 font-bold">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app text-primary relative overflow-hidden">
            <div className="absolute -top-40 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs text-secondary hover:text-primary">
                        <ArrowLeft size={14} /> Back to Home
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
                        Track
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mt-4">{section.title}</h1>
                    {section.description && (
                        <p className="text-secondary text-lg mt-4 max-w-3xl">{section.description}</p>
                    )}
                </div>

                <div className="mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Sessions</h2>
                        <span className={`text-xs font-bold ${theme.accent}`}>
                            {section.videos.length} total
                        </span>
                    </div>
                    {section.videos.length === 0 ? (
                        <div className="glass-panel p-6 border-white/10 text-secondary text-sm">
                            No videos added yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {section.videos.map((video) => {
                                const thumb = getVideoThumbnailUrl(video.url);
                                return (
                                    <Link
                                        key={video.slug}
                                        to={`/vision/${section.key}/${video.slug}`}
                                        className={`glass-panel p-6 border ${theme.border} hover:border-cyan-400/40 transition-all hover:-translate-y-1 bg-gradient-to-br ${theme.gradient}`}
                                    >
                                        <div className="aspect-video rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4 relative overflow-hidden">
                                            {thumb && (
                                                <img
                                                    src={thumb}
                                                    alt=""
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="relative z-10 w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                                                <Play className={theme.accent} />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold">{video.title}</h3>
                                        <p className="text-secondary text-sm mt-2">{video.description}</p>
                                        <div className={`mt-4 text-xs font-bold flex items-center gap-2 ${theme.accent}`}>
                                            Open Session
                                            <ArrowUpRight size={14} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="fixed bottom-4 right-4 text-xs text-secondary bg-panel/80 border border-border rounded-full px-4 py-2">
                        Loading section...
                    </div>
                )}
            </main>
        </div>
    );
};

export default PublicSection;
