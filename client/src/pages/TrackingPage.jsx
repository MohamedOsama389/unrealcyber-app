import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle, Lock, Play, ChevronDown, ChevronUp,
    Wifi, Shield, Code2, ArrowRight, FileText, Video, BookOpen
} from 'lucide-react';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';

gsap.registerPlugin(ScrollTrigger);

const TRACK_ICONS = {
    networking: Wifi,
    'ethical-hacking': Shield,
    hacking: Shield,
    programming: Code2,
};

const TRACK_COLORS = {
    networking: {
        color: '#00d4ff',
        accent: 'text-cyan-400',
        border: 'border-cyan-500/20',
        bar: 'bg-cyan-500',
        glow: 'shadow-cyan-500/10',
        badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },
    'ethical-hacking': {
        color: '#a855f7',
        accent: 'text-purple-400',
        border: 'border-purple-500/20',
        bar: 'bg-purple-500',
        glow: 'shadow-purple-500/10',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    hacking: {
        color: '#a855f7',
        accent: 'text-purple-400',
        border: 'border-purple-500/20',
        bar: 'bg-purple-500',
        glow: 'shadow-purple-500/10',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    programming: {
        color: '#3b82f6',
        accent: 'text-blue-400',
        border: 'border-blue-500/20',
        bar: 'bg-blue-500',
        glow: 'shadow-blue-500/10',
        badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    },
};

const DEFAULT_COLOR = TRACK_COLORS.networking;

function getTrackKey(track) {
    const t = (track.title || '').toLowerCase();
    if (t.includes('network')) return 'networking';
    if (t.includes('hack')) return 'ethical-hacking';
    if (t.includes('program') || t.includes('code')) return 'programming';
    return 'networking';
}

export default function TrackingPage() {
    const { user } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedTrack, setExpandedTrack] = useState(null);
    const pageRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [tracksRes, progressRes] = await Promise.all([
                    axios.get('/api/tracks'),
                    user ? axios.get('/api/tracks/progress/user').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                ]);
                const trackList = tracksRes.data || [];
                const detailed = await Promise.all(
                    trackList.map((t) => axios.get(`/api/tracks/${t.id}`).then((r) => r.data).catch(() => t))
                );
                setTracks(detailed);
                const pMap = {};
                (progressRes.data || []).forEach((p) => { pMap[p.step_id] = p.status; });
                setProgress(pMap);
            } catch (err) {
                console.error('Failed to load tracking data:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.from('.tracking-hero', { y: 30, opacity: 0, duration: 0.6 });
            gsap.from('.overall-bar', {
                y: 30, opacity: 0, duration: 0.5, delay: 0.2,
            });
            gsap.from('.track-card', {
                y: 40, opacity: 0, duration: 0.5, stagger: 0.12,
                scrollTrigger: { trigger: '.tracks-list', start: 'top 85%' },
            });
        }, pageRef);
        return () => ctx.revert();
    }, [loading]);

    const totalSteps = tracks.reduce((sum, t) => sum + (t.steps?.length || 0), 0);
    const completedSteps = Object.values(progress).filter((s) => s === 'completed').length;
    const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return (
        <div ref={pageRef} className="min-h-screen bg-[#0d1526] text-white">
            <PublicNavbar />

            {/* Decorative blobs */}
            <div className="fixed -top-40 right-10 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 left-10 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

            <main className="pt-24 lg:pt-32 pb-20 section-padding">
                <div className="max-w-5xl mx-auto">

                    {/* Hero */}
                    <div className="tracking-hero text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            <span className="text-cyan-400 text-sm font-medium">Learning Hub</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            Your <span className="cyber-text-gradient">Cybersecurity</span> Journey
                        </h1>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            Follow structured learning paths. Complete modules, pass exams, earn badges.
                        </p>
                    </div>

                    {/* Overall Progress */}
                    {totalSteps > 0 && (
                        <div className="overall-bar glass-card p-6 mb-10">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-bold">Overall Progress</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {completedSteps} of {totalSteps} steps completed
                                    </p>
                                </div>
                                <span className="text-lg font-bold text-cyan-400">{overallPercent}%</span>
                            </div>
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="progress-gradient h-full rounded-full shimmer-effect transition-all duration-700"
                                    style={{ width: `${overallPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-20">
                            <div className="inline-flex items-center gap-3 text-cyan-400">
                                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                <span className="font-mono text-sm">Loading tracks...</span>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && tracks.length === 0 && (
                        <div className="glass-card p-10 text-center">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                            <p className="text-white font-medium mb-1">No tracks available yet</p>
                            <p className="text-slate-400 text-sm">Check back soon!</p>
                        </div>
                    )}

                    {/* Tracks */}
                    <div className="tracks-list space-y-5">
                        {tracks.map((track) => {
                            const key = getTrackKey(track);
                            const colors = TRACK_COLORS[key] || DEFAULT_COLOR;
                            const Icon = TRACK_ICONS[key] || Wifi;
                            const steps = track.steps || [];
                            const trackCompleted = steps.filter((s) => progress[s.id] === 'completed').length;
                            const trackPercent = steps.length > 0 ? Math.round((trackCompleted / steps.length) * 100) : 0;
                            const isExpanded = expandedTrack === track.id;

                            return (
                                <div
                                    key={track.id}
                                    className={`track-card glass-card overflow-hidden border ${colors.border} transition-all hover:shadow-lg ${colors.glow}`}
                                >
                                    {/* Track Header */}
                                    <div
                                        className="p-6 cursor-pointer group"
                                        onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div
                                                    className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: `${colors.color}15` }}
                                                >
                                                    <Icon size={22} strokeWidth={1.5} style={{ color: colors.color }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-bold truncate">{track.title}</h3>
                                                    <p className="text-slate-400 text-sm mt-0.5 truncate">
                                                        {track.description || 'Start your training.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colors.badge}`}>
                                                    {steps.length} steps
                                                </span>
                                                {isExpanded
                                                    ? <ChevronUp size={18} className="text-slate-400" />
                                                    : <ChevronDown size={18} className="text-slate-400" />}
                                            </div>
                                        </div>

                                        {/* Track progress bar */}
                                        <div className="mt-5 flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                                                    style={{ width: `${Math.max(trackPercent, 1)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${colors.accent}`}>{trackPercent}%</span>
                                        </div>
                                    </div>

                                    {/* Expanded Steps */}
                                    {isExpanded && steps.length > 0 && (
                                        <div className="px-6 pb-6 border-t border-white/5 pt-4">
                                            <div className="space-y-1.5">
                                                {steps.map((step, idx) => {
                                                    const status = progress[step.id] || 'locked';
                                                    const isCompleted = status === 'completed';
                                                    const isUnlocked = status === 'unlocked' || idx === 0;

                                                    return (
                                                        <div
                                                            key={step.id}
                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isCompleted
                                                                    ? 'bg-white/5'
                                                                    : isUnlocked
                                                                        ? 'bg-white/[0.02] hover:bg-white/5'
                                                                        : 'opacity-40'
                                                                }`}
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                                                            ) : isUnlocked ? (
                                                                <Play size={16} className={`${colors.accent} flex-shrink-0`} />
                                                            ) : (
                                                                <Lock size={16} className="text-slate-600 flex-shrink-0" />
                                                            )}
                                                            <span className={`text-sm font-medium flex-1 ${isCompleted ? 'text-slate-500 line-through' : ''}`}>
                                                                {step.title}
                                                            </span>
                                                            {step.type && (
                                                                <span className="text-slate-600">
                                                                    {step.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {isExpanded && steps.length === 0 && (
                                        <div className="px-6 pb-6 border-t border-white/5 pt-4 text-center">
                                            <p className="text-slate-500 text-sm">No steps added to this track yet.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom CTA */}
                    {!loading && (
                        <div className="mt-16 text-center">
                            <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Need help getting started?</p>
                            <Link
                                to="/tracking"
                                className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors group"
                            >
                                Explore Tracks
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
