import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Wifi,
    Code2,
    Play,
    Award,
    TrendingUp,
    Target,
    BookOpen,
    Activity,
    Star,
    Zap,
    Trophy,
    Clock,
    CheckCircle,
    Lock,
    ChevronDown,
    ChevronUp,
    FileText,
    Video,
    ArrowRight
} from 'lucide-react';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';
import { useTheme } from '../context/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

const TRACK_META = {
    networking: { icon: Wifi, color: '#00d4ff' },
    'ethical-hacking': { icon: Shield, color: '#38bdf8' },
    hacking: { icon: Shield, color: '#38bdf8' },
    programming: { icon: Code2, color: '#3b82f6' },
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
        color: '#38bdf8',
        accent: 'text-sky-400',
        border: 'border-sky-500/20',
        bar: 'bg-sky-500',
        glow: 'shadow-sky-500/10',
        badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    },
    hacking: {
        color: '#38bdf8',
        accent: 'text-sky-400',
        border: 'border-sky-500/20',
        bar: 'bg-sky-500',
        glow: 'shadow-sky-500/10',
        badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
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

const ACHIEVEMENTS = [
    { icon: Star, label: 'First Login', unlocked: true, color: '#f59e0b' },
    { icon: Zap, label: 'Quick Learner', unlocked: true, color: '#00d4ff' },
    { icon: Trophy, label: 'First Module', unlocked: false, color: '#a855f7' },
    { icon: Target, label: 'Sharpshooter', unlocked: false, color: '#ef4444' },
    { icon: Award, label: 'Completionist', unlocked: false, color: '#10b981' },
    { icon: Shield, label: 'Defender', unlocked: false, color: '#3b82f6' },
];

function getTrackKey(track) {
    const t = (track.title || '').toLowerCase();
    if (t.includes('network')) return 'networking';
    if (t.includes('hack')) return 'ethical-hacking';
    if (t.includes('program') || t.includes('code')) return 'programming';
    return 'networking';
}

export default function Progress() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [tracks, setTracks] = useState([]);
    const [progress, setProgress] = useState({});
    const [expandedTrack, setExpandedTrack] = useState(null);
    const [loading, setLoading] = useState(true);
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

                const progressMap = {};
                (progressRes.data || []).forEach((p) => {
                    progressMap[p.step_id] = p.status;
                });
                setProgress(progressMap);
            } catch (err) {
                console.error('Failed to load progress/tracks:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.from('.progress-hero', { y: 30, opacity: 0, duration: 0.6 });
            gsap.from('.stats-card', {
                y: 40, opacity: 0, duration: 0.4, stagger: 0.1,
                scrollTrigger: { trigger: '.stats-grid', start: 'top 85%' },
            });
            gsap.from('.track-progress-card', {
                y: 40, opacity: 0, duration: 0.4, stagger: 0.1,
                scrollTrigger: { trigger: '.track-progress-section', start: 'top 85%' },
            });
            gsap.from('.track-system-card', {
                y: 40, opacity: 0, duration: 0.4, stagger: 0.08,
                scrollTrigger: { trigger: '.track-system-section', start: 'top 85%' },
            });
            gsap.from('.badge-item', {
                scale: 0.8, opacity: 0, duration: 0.3, stagger: 0.05,
                scrollTrigger: { trigger: '.badges-section', start: 'top 85%' },
            });
        }, pageRef);
        return () => ctx.revert();
    }, [loading]);

    const totalSteps = tracks.reduce((sum, t) => sum + (t.steps?.length || 0), 0);
    const completedSteps = Object.values(progress).filter((s) => s === 'completed').length;
    const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return (
        <div ref={pageRef} className="min-h-screen bg-app text-primary">
            <PublicNavbar />

            <div className="fixed inset-0 theme-page-bg -z-10" />
            <div className="fixed -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 -left-40 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

            <main className="pt-24 lg:pt-32 pb-16 section-padding">
                <div className="progress-hero max-w-4xl mx-auto text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                        {user ? (
                            <>Welcome back, <span className="cyber-text-gradient">{user.display_name || user.username}</span></>
                        ) : (
                            <span className="cyber-text-gradient">Your Learning Journey</span>
                        )}
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Track your overall progress and manage your full tracks system from one page.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center gap-3 text-cyan-400">
                            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-sm">Loading progress...</span>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-16">
                        <div className="glass-card p-6 lg:p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">Overall Progress</h3>
                                    <p className="text-slate-400 text-sm">{completedSteps} of {totalSteps} steps completed</p>
                                </div>
                                <span className="text-2xl font-bold text-cyan-400">{overallPercent}%</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full progress-gradient rounded-full shimmer-effect transition-all duration-700" style={{ width: `${overallPercent}%` }} />
                            </div>
                        </div>

                        <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            <div className="stats-card glass-card p-6 text-center">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className={`w-5 h-5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                                </div>
                                <p className="text-2xl font-bold">{tracks.length}</p>
                                <p className="text-slate-400 text-sm">Tracks</p>
                            </div>
                            <div className="stats-card glass-card p-6 text-center">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                    <Target className={`w-5 h-5 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
                                </div>
                                <p className="text-2xl font-bold">{totalSteps}</p>
                                <p className="text-slate-400 text-sm">Total Steps</p>
                            </div>
                            <div className="stats-card glass-card p-6 text-center">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                                    <TrendingUp className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                                </div>
                                <p className="text-2xl font-bold">{completedSteps}</p>
                                <p className="text-slate-400 text-sm">Completed</p>
                            </div>
                            <div className="stats-card glass-card p-6 text-center">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                                    <Clock className={`w-5 h-5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                                </div>
                                <p className="text-2xl font-bold">{overallPercent}%</p>
                                <p className="text-slate-400 text-sm">Completion</p>
                            </div>
                        </div>

                        <section className="track-progress-section space-y-6">
                            <h2 className="text-2xl font-bold">Track Progress Overview</h2>
                            <div className="grid gap-4">
                                {tracks.map((track) => {
                                    const key = getTrackKey(track);
                                    const meta = TRACK_META[key] || TRACK_META.networking;
                                    const Icon = meta.icon;
                                    const steps = track.steps || [];
                                    const done = steps.filter((s) => progress[s.id] === 'completed').length;
                                    const percent = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

                                    return (
                                        <div key={`overview-${track.id}`} className="track-progress-card glass-card-hover p-6 group">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: `${meta.color}15` }}
                                                >
                                                    <Icon className="w-6 h-6" style={{ color: meta.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="text-lg font-bold truncate">{track.title}</h3>
                                                        <span className="text-sm font-mono" style={{ color: meta.color }}>
                                                            {percent}%
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm mb-3">{steps.length} steps</p>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(percent, 1)}%`, backgroundColor: meta.color }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="track-system-section space-y-6">
                            <h2 className="text-2xl font-bold">Tracks System</h2>
                            {tracks.length === 0 && (
                                <div className="glass-card p-10 text-center">
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                                    <p className="text-white font-medium mb-1">No tracks available yet</p>
                                    <p className="text-slate-400 text-sm">Check back soon!</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {tracks.map((track) => {
                                    const key = getTrackKey(track);
                                    const colors = TRACK_COLORS[key] || DEFAULT_COLOR;
                                    const Icon = TRACK_META[key]?.icon || Wifi;
                                    const steps = track.steps || [];
                                    const trackCompleted = steps.filter((s) => progress[s.id] === 'completed').length;
                                    const trackPercent = steps.length > 0 ? Math.round((trackCompleted / steps.length) * 100) : 0;
                                    const isExpanded = expandedTrack === track.id;

                                    return (
                                        <div
                                            key={track.id}
                                            className={`track-system-card glass-card overflow-hidden border ${colors.border} transition-all hover:shadow-lg ${colors.glow}`}
                                        >
                                            <button
                                                className="w-full p-6 text-left hover:bg-white/[0.02] transition-colors"
                                                onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div
                                                            className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center"
                                                            style={{ backgroundColor: `${colors.color}15` }}
                                                        >
                                                            <Icon size={22} strokeWidth={1.5} style={{ color: colors.color }} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-xl font-bold truncate">{track.title}</h3>
                                                            <p className="text-slate-400 text-sm mt-0.5 truncate">{track.description || 'Start your training.'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colors.badge}`}>
                                                            {steps.length} steps
                                                        </span>
                                                        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                                    </div>
                                                </div>

                                                <div className="mt-5 flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${colors.bar} transition-all duration-700`} style={{ width: `${Math.max(trackPercent, 1)}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-bold ${colors.accent}`}>{trackPercent}%</span>
                                                </div>
                                            </button>

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
                        </section>

                        <section className="badges-section">
                            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                                {ACHIEVEMENTS.map((badge, index) => {
                                    const Icon = badge.icon;
                                    return (
                                        <div key={index} className={`badge-item glass-card p-4 text-center ${badge.unlocked ? '' : 'opacity-40'}`}>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${badge.color}15` }}>
                                                <Icon className="w-6 h-6" style={{ color: badge.unlocked ? badge.color : '#64748b' }} />
                                            </div>
                                            <p className="text-xs font-medium truncate">{badge.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
                            <div className="glass-card p-6 text-center text-slate-400">
                                <Activity className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                                <p className="font-medium text-white mb-1">No activity yet</p>
                                <p className="text-sm">Start learning to see your activity here.</p>
                                <Link to="/tracking" className="btn-primary inline-flex items-center gap-2 mt-6">
                                    Explore Tracks <ArrowRight size={14} />
                                </Link>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
