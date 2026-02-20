import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Play, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { DEFAULT_PUBLIC_CONTENT, normalizePublicContent, buildVideoSlug, getSectionTheme, getVideoThumbnailUrl } from '../data/publicSite';
import PublicNavbar from '../components/PublicNavbar';

const getYouTubePlaylistEmbed = (url = '') => {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        const list = parsed.searchParams.get('list');
        return list ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}` : '';
    } catch {
        return '';
    }
};

export default function PublicSection() {
    const { sectionKey } = useParams();
    const [content, setContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState({});

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

    const sections = useMemo(
        () =>
            (content.sections || []).map((section, sectionIndex) => ({
                ...section,
                key: section.key || `section-${sectionIndex}`,
                videos: (section.videos || []).map((video, videoIndex) => ({
                    ...video,
                    slug: buildVideoSlug(video.title, videoIndex),
                })),
            })),
        [content]
    );

    const section = sections.find((item) => item.key === sectionKey);
    const theme = getSectionTheme(sectionKey);
    const playlistEmbedUrl = getYouTubePlaylistEmbed(section?.playlistUrl || '');

    const toggleModule = (index) => {
        setExpandedModules((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    if (!section) {
        return (
            <div className="min-h-screen bg-app text-primary">
                <PublicNavbar />
                <div className="pt-28 px-6 max-w-4xl mx-auto">
                    <div className="glass-card p-8">
                        <h1 className="text-2xl font-bold mb-3">Track not found</h1>
                        <p className="text-slate-300/80 mb-6">The requested course track does not exist.</p>
                        <Link to="/" className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200">
                            <ArrowLeft size={15} /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app text-primary relative overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#08152e] via-[#071226] to-[#08152e] -z-10" />
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-8 right-8 h-72 w-72 rounded-full bg-cyan-500/8 blur-[110px]" />
                <div className="absolute bottom-8 left-8 h-72 w-72 rounded-full bg-blue-500/7 blur-[110px]" />
            </div>

            <PublicNavbar />

            <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 md:pt-28 pb-20">
                <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-300/75 hover:text-white transition-colors mb-7">
                    <ArrowLeft size={14} /> Back to Home
                </Link>

                <section className={`glass-card border ${theme.border} ${theme.glow} p-7 md:p-10 bg-gradient-to-br ${theme.gradient}`}>
                    <div className={`inline-flex items-center px-3 py-1 text-[10px] uppercase tracking-[0.3em] rounded-full border ${theme.chip}`}>
                        Course Track
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mt-4 glitch-hover">{section.title}</h1>
                    {section.description && <p className="text-slate-300/85 text-base md:text-lg mt-4 max-w-3xl">{section.description}</p>}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            to={section.videos?.[0] ? `/vision/${section.key}/${section.videos[0].slug}` : `/vision/${section.key}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/12 text-cyan-200 text-sm font-semibold"
                        >
                            <Play size={14} /> Start Playlist
                        </Link>
                        {section.playlistUrl && (
                            <a
                                href={section.playlistUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-slate-200 text-sm font-semibold"
                            >
                                <ArrowUpRight size={14} /> Open YouTube Playlist
                            </a>
                        )}
                    </div>
                </section>

                {playlistEmbedUrl && (
                    <section className="mt-6">
                        <div className="glass-card p-4 border-white/12">
                            <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-300 mb-3">Playlist Preview</h2>
                            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#071327]">
                                <iframe
                                    src={playlistEmbedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`${section.title} playlist`}
                                />
                            </div>
                        </div>
                    </section>
                )}

                <section className="mt-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl font-bold">Sessions</h2>
                        <span className={`text-xs uppercase tracking-[0.2em] font-semibold ${theme.accent}`}>
                            {section.videos.length} modules
                        </span>
                    </div>

                    {section.videos.length === 0 ? (
                        <div className="glass-card p-10 text-center">
                            <BookOpen className="w-11 h-11 text-slate-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Course content coming soon.</h3>
                            <p className="text-slate-300/75 text-sm max-w-md mx-auto">
                                This track is being prepared. New sessions will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {section.videos.map((video, index) => {
                                const thumb = getVideoThumbnailUrl(video.url);
                                const isExpanded = expandedModules[index];
                                return (
                                    <article
                                        key={video.slug}
                                        className={`glass-card overflow-hidden border ${theme.border} transition-all hover:border-cyan-400/30`}
                                    >
                                        <button
                                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
                                            onClick={() => toggleModule(index)}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className={`text-xs font-bold ${theme.accent} w-8`}>{String(index + 1).padStart(2, '0')}</span>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-semibold text-white truncate">{video.title}</h3>
                                                    {video.description && (
                                                        <p className="text-slate-400 text-xs mt-1 line-clamp-1">{video.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp size={16} className="text-slate-300" />
                                            ) : (
                                                <ChevronDown size={16} className="text-slate-300" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-white/8 p-5 bg-[#0b1831]/65">
                                                {thumb && (
                                                    <div className="aspect-video rounded-xl bg-slate-900/70 border border-white/10 overflow-hidden mb-4">
                                                        <img
                                                            src={thumb}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}
                                                {video.description && <p className="text-slate-300/80 text-sm mb-4">{video.description}</p>}
                                                <Link
                                                    to={`/vision/${section.key}/${video.slug}`}
                                                    className={`inline-flex items-center gap-2 text-sm font-semibold ${theme.accent} hover:opacity-85 transition-opacity glitch-hover`}
                                                >
                                                    <Play size={14} /> Open Session <ArrowUpRight size={14} />
                                                </Link>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {loading && (
                    <div className="fixed bottom-5 right-5 text-xs text-slate-200 glass-card px-4 py-2">Loading section...</div>
                )}
            </main>
        </div>
    );
}
