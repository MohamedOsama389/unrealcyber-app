import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    User, Shield, Wifi, Code2, Zap, Award, Edit2,
    Video, TrendingUp, Target, BookOpen, Activity, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PublicNavbar from '../components/PublicNavbar';

gsap.registerPlugin(ScrollTrigger);

const FIELD_CONFIG = [
    { key: 'networking', label: 'Networking', icon: Wifi, color: '#00d4ff' },
    { key: 'ethical-hacking', label: 'Ethical Hacking', icon: Shield, color: '#a855f7' },
    { key: 'programming', label: 'Programming', icon: Code2, color: '#3b82f6' },
];

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState({
        totalVideosWatched: 0,
        fieldProgress: {
            networking: { watched: 0, total: 0 },
            'ethical-hacking': { watched: 0, total: 0 },
            programming: { watched: 0, total: 0 },
        },
        level: 1,
        xp: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    const pageRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const fetchProfileStats = async () => {
            try {
                const [publicRes, tracksRes] = await Promise.all([
                    axios.get('/api/public'),
                    axios.get('/api/tracks/progress/user').catch(() => ({ data: [] })),
                ]);

                const publicContent = publicRes.data;
                const userProgress = tracksRes.data;

                const completedSteps = userProgress.filter((p) => p.status === 'completed');
                const totalVideosWatched = completedSteps.length;

                const fieldProgress = {
                    networking: { watched: 0, total: 0 },
                    'ethical-hacking': { watched: 0, total: 0 },
                    programming: { watched: 0, total: 0 },
                };

                if (publicContent?.sections) {
                    publicContent.sections.forEach((section) => {
                        const fieldKey = section.key || '';
                        if (fieldProgress[fieldKey]) {
                            fieldProgress[fieldKey].total = section.videos?.length || 0;
                        }
                    });
                }

                const xp = totalVideosWatched * 100;
                const level = Math.floor(xp / 500) + 1;

                setStats({
                    totalVideosWatched,
                    fieldProgress,
                    level,
                    xp,
                    recentActivity: completedSteps.slice(0, 5),
                });
            } catch (err) {
                console.error('Failed to load profile stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileStats();
    }, [user]);

    useEffect(() => {
        if (loading || !user) return;
        const ctx = gsap.context(() => {
            gsap.from('.profile-card', { y: 30, opacity: 0, duration: 0.6 });
            gsap.from('.stat-item', {
                y: 40, opacity: 0, duration: 0.4, stagger: 0.08,
                scrollTrigger: { trigger: '.stats-section', start: 'top 85%' },
            });
            gsap.from('.field-bar', {
                y: 30, opacity: 0, duration: 0.4, stagger: 0.1,
                scrollTrigger: { trigger: '.fields-section', start: 'top 85%' },
            });
        }, pageRef);
        return () => ctx.revert();
    }, [loading, user]);

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0d1526] text-white">
                <PublicNavbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="glass-card p-10 text-center max-w-sm">
                        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-6">
                            <User className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
                        <p className="text-slate-400 text-sm mb-6">Please sign in to view your profile.</p>
                        <Link to="/login" className="btn-primary inline-block">Sign In</Link>
                    </div>
                </div>
            </div>
        );
    }

    const getProgressPercentage = (field) => {
        const { watched, total } = stats.fieldProgress[field];
        return total > 0 ? Math.round((watched / total) * 100) : 0;
    };

    const xpPercent = (stats.xp % 500) / 5;

    return (
        <div ref={pageRef} className="min-h-screen bg-[#0d1526] text-white">
            <PublicNavbar />

            {/* Decorative blobs */}
            <div className="fixed -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 -left-40 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

            <main className="pt-24 lg:pt-32 pb-16 section-padding">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Profile Card */}
                    <div className="profile-card grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
                        {/* ID Card */}
                        <div className="glass-card p-8 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative w-28 h-28 mx-auto rounded-2xl p-1 border-2 border-dashed border-cyan-500/30 mb-5">
                                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900/50">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-cyan-500">
                                            {(user.username || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append('avatar', file);
                                        try {
                                            setUploadingAvatar(true);
                                            const res = await axios.post('/api/profile/upload-avatar', formData);
                                            const { avatar_id, avatar_version } = res.data;
                                            updateUser({ avatar_id, avatar_version });
                                        } catch (err) {
                                            console.error('Avatar upload failed:', err);
                                        } finally {
                                            setUploadingAvatar(false);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute -bottom-1 -right-1 p-2 rounded-lg bg-cyan-500 text-slate-950 hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                                >
                                    <Edit2 size={14} className={uploadingAvatar ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold mb-1">{user.display_name || user.username}</h2>
                            <p className="text-cyan-400 text-sm font-medium mb-4">Level {stats.level}</p>

                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="p-3 rounded-xl bg-slate-900/50">
                                    <p className="text-xl font-bold text-cyan-400">{user.streak_count || 0}</p>
                                    <p className="text-xs text-slate-400">Day Streak</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-900/50">
                                    <p className="text-xl font-bold text-purple-400">{stats.xp}</p>
                                    <p className="text-xs text-slate-400">XP Earned</p>
                                </div>
                            </div>

                            {/* Level Progress */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-400">Level {stats.level}</span>
                                    <span className="text-slate-400">Level {stats.level + 1}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full progress-gradient rounded-full transition-all duration-700"
                                        style={{ width: `${xpPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{500 - (stats.xp % 500)} XP to next level</p>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="stats-section grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
                            {[
                                { icon: Video, value: stats.totalVideosWatched, label: 'Videos Watched', color: '#00d4ff' },
                                { icon: Target, value: `${getProgressPercentage('networking')}%`, label: 'Networking', color: '#f59e0b' },
                                { icon: Shield, value: `${getProgressPercentage('ethical-hacking')}%`, label: 'Hacking', color: '#ef4444' },
                                { icon: BookOpen, value: `${getProgressPercentage('programming')}%`, label: 'Programming', color: '#10b981' },
                                { icon: TrendingUp, value: stats.level, label: 'Current Level', color: '#a855f7' },
                                { icon: Award, value: user.streak_count || 0, label: 'Day Streak', color: '#eab308' },
                            ].map((s, i) => {
                                const Icon = s.icon;
                                return (
                                    <div key={i} className="stat-item glass-card-hover p-5 space-y-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${s.color}15` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: s.color }} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Field Progress Bars */}
                    <section className="fields-section glass-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-xl font-bold">Field Progress</h3>
                        </div>
                        <div className="space-y-5">
                            {FIELD_CONFIG.map((f) => {
                                const { watched, total } = stats.fieldProgress[f.key];
                                const pct = getProgressPercentage(f.key);
                                const Icon = f.icon;
                                return (
                                    <div key={f.key} className="field-bar">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" style={{ color: f.color }} />
                                                <span className="font-medium">{f.label}</span>
                                            </div>
                                            <span className="text-slate-400">{watched} / {total} videos</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: f.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-xl font-bold">Recent Activity</h3>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : stats.recentActivity.length > 0 ? (
                            <div className="space-y-1">
                                {stats.recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                <Award className="text-green-400" size={16} />
                                            </div>
                                            <span className="text-sm text-slate-300">Completed step #{activity.step_id}</span>
                                        </div>
                                        <span className="text-xs font-mono text-cyan-400/60">+100 XP</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <BookOpen className="mx-auto mb-3 text-slate-600" size={32} />
                                <p className="font-medium text-white mb-1">No activity yet</p>
                                <p className="text-sm">Start learning to track your progress!</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
