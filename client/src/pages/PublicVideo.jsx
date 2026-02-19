import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Play, Download } from 'lucide-react';
import { DEFAULT_PUBLIC_CONTENT, normalizePublicContent, buildVideoSlug, getSectionTheme, getVideoEmbedUrl, toDownloadHref } from '../data/publicSite';
import PublicNavbar from '../components/PublicNavbar';

export default function PublicVideo() {
    const { sectionKey, videoSlug } = useParams();
    const [content, setContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [loading, setLoading] = useState(true);

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
                    downloads: Array.isArray(video.downloads) ? video.downloads : [],
                })),
            })),
        [content]
    );

    const section = sections.find((item) => item.key === sectionKey);
    const video = section?.videos.find((item) => item.slug === videoSlug);
    const theme = getSectionTheme(sectionKey);

    if (!section || !video) {
        return (
            <div className="min-h-screen bg-app text-primary">
                <PublicNavbar />
                <div className="pt-28 px-6 max-w-4xl mx-auto">
                    <div className="glass-card p-8">
                        <h1 className="text-2xl font-bold mb-3">Session not found</h1>
                        <p className="text-slate-300/80 mb-6">The requested session is not available.</p>
                        <Link to="/" className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200">
                            <ArrowLeft size={16} /> Back to Home
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
                <div className="absolute top-8 right-8 h-80 w-80 rounded-full bg-cyan-500/8 blur-[110px]" />
                <div className="absolute bottom-8 left-8 h-72 w-72 rounded-full bg-blue-500/8 blur-[110px]" />
            </div>

            <PublicNavbar />

            <main className="max-w-6xl mx-auto px-6 pt-24 md:pt-28 pb-20 relative z-10">
                <Link to={`/vision/${section.key}`} className="inline-flex items-center gap-2 text-xs text-slate-300/75 hover:text-white mb-7">
                    <ArrowLeft size={14} /> Back to {section.title}
                </Link>

                <section className={`glass-card border ${theme.border} ${theme.glow} p-7 md:p-10 bg-gradient-to-br ${theme.gradient}`}>
                    <div className={`inline-flex items-center px-3 py-1 text-[10px] uppercase tracking-[0.3em] rounded-full border ${theme.chip}`}>
                        {section.title}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mt-4">{video.title}</h1>
                    {video.description && <p className="text-slate-300/85 text-base md:text-lg mt-4 max-w-3xl">{video.description}</p>}
                    {video.url && (
                        <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-2 mt-6 text-sm font-semibold ${theme.accent} hover:opacity-85`}
                        >
                            Open Original Source
                            <ArrowUpRight size={14} />
                        </a>
                    )}
                </section>

                <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-7">
                    <article className="lg:col-span-2 glass-card p-4 md:p-5 border-white/12">
                        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#071327]">
                            {getVideoEmbedUrl(video.url) ? (
                                <iframe
                                    src={getVideoEmbedUrl(video.url)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={video.title}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300/80 text-sm">
                                    <Play className="text-cyan-300" />
                                    <p className="mt-2">No video link provided for this session.</p>
                                </div>
                            )}
                        </div>
                    </article>

                    <aside className="glass-card p-6 border-white/12 h-fit">
                        <h3 className="text-lg font-bold mb-4">Materials</h3>
                        {video.downloads.length === 0 ? (
                            <p className="text-sm text-slate-300/75">No downloadable files attached.</p>
                        ) : (
                            <div className="space-y-3">
                                {video.downloads.map((item, idx) => (
                                    <a
                                        key={`${item.title}-${idx}`}
                                        href={toDownloadHref(item.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 hover:border-cyan-400/35 text-sm text-slate-200 hover:text-white transition-colors"
                                    >
                                        <span className="truncate pr-3">{item.title}</span>
                                        <Download size={14} className="text-cyan-300" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </aside>
                </section>

                {loading && <div className="fixed bottom-5 right-5 text-xs text-slate-200 glass-card px-4 py-2">Loading session...</div>}
            </main>
        </div>
    );
}
