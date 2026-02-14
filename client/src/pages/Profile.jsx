import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Shield, Zap, Award, Edit2, Video, TrendingUp, Target, BookOpen, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState({
        totalVideosWatched: 0,
        fieldProgress: {
            networking: { watched: 0, total: 0 },
            'ethical-hacking': { watched: 0, total: 0 },
            programming: { watched: 0, total: 0 }
        },
        level: 1,
        xp: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const fetchProfileStats = async () => {
            try {
                // Fetch user's video watch history and progress
                const [publicRes, tracksRes] = await Promise.all([
                    axios.get('/api/public'),
                    axios.get('/api/tracks/progress/user').catch(() => ({ data: [] }))
                ]);

                const publicContent = publicRes.data;
                const userProgress = tracksRes.data;

                // Calculate total videos watched from track progress
                const completedSteps = userProgress.filter(p => p.status === 'completed');
                const totalVideosWatched = completedSteps.length;

                // Calculate field-specific progress
                const fieldProgress = {
                    networking: { watched: 0, total: 0 },
                    'ethical-hacking': { watched: 0, total: 0 },
                    programming: { watched: 0, total: 0 }
                };

                // Count total videos per field from public content
                if (publicContent?.sections) {
                    publicContent.sections.forEach(section => {
                        const fieldKey = section.key || '';
                        if (fieldProgress[fieldKey]) {
                            fieldProgress[fieldKey].total = section.videos?.length || 0;
                        }
                    });
                }

                // Calculate XP and level
                const xp = totalVideosWatched * 100; // 100 XP per video
                const level = Math.floor(xp / 500) + 1; // Level up every 500 XP

                setStats({
                    totalVideosWatched,
                    fieldProgress,
                    level,
                    xp,
                    recentActivity: completedSteps.slice(0, 5) // Last 5 completed
                });
            } catch (err) {
                console.error('Failed to load profile stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileStats();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d1526] text-white">
                <div className="text-center space-y-4">
                    <User size={64} className="mx-auto text-cyan-500 mb-4" />
                    <p className="text-lg text-slate-300">Please login to view your profile.</p>
                    <Link to="/" className="inline-block px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const getProgressPercentage = (field) => {
        const { watched, total } = stats.fieldProgress[field];
        return total > 0 ? Math.round((watched / total) * 100) : 0;
    };

    return (
        <div className="min-h-screen bg-[#0d1526] text-white p-6 pt-24 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase hover:text-cyan-400">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                <div className="text-xl font-black uppercase tracking-tighter text-cyan-500">Profile</div>
                <div className="w-10" />
            </header>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Profile Header Card */}
                <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
                    {/* ID Card */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-6 relative overflow-hidden group h-fit">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative w-32 h-32 mx-auto rounded-full p-1 border-2 border-dashed border-cyan-500/30">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white/5">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-cyan-500">{user.username[0].toUpperCase()}</div>
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
                                        console.error("Avatar upload failed:", err);
                                    } finally {
                                        setUploadingAvatar(false);
                                    }
                                }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 text-black hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                            >
                                <Edit2 size={14} className={uploadingAvatar ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase tracking-tight">{user.display_name || user.username}</h2>
                            <p className="text-xs font-mono text-cyan-500/60 uppercase tracking-widest">Level {stats.level}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="bg-white/5 rounded-xl p-3">
                                <div className="text-cyan-400 font-black text-xl">{user.streak_count || 0}</div>
                                <div className="text-[9px] uppercase tracking-widest text-secondary">Day Streak</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                                <div className="text-purple-400 font-black text-xl">{stats.xp}</div>
                                <div className="text-[9px] uppercase tracking-widest text-secondary">XP Earned</div>
                            </div>
                        </div>

                        {/* Level Progress Bar */}
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-400">Level {stats.level}</span>
                                <span className="text-slate-400">Level {stats.level + 1}</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${(stats.xp % 500) / 5}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{500 - (stats.xp % 500)} XP to next level</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-cyan-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Video className="text-cyan-400" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-cyan-400">{stats.totalVideosWatched}</div>
                                <div className="text-xs uppercase tracking-wider text-secondary">Videos Watched</div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-amber-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Target className="text-amber-400" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-amber-400">{getProgressPercentage('networking')}%</div>
                                <div className="text-xs uppercase tracking-wider text-secondary">Networking</div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-red-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Shield className="text-red-400" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-red-400">{getProgressPercentage('ethical-hacking')}%</div>
                                <div className="text-xs uppercase tracking-wider text-secondary">Hacking</div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-emerald-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <BookOpen className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-emerald-400">{getProgressPercentage('programming')}%</div>
                                <div className="text-xs uppercase tracking-wider text-secondary">Programming</div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-purple-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-purple-400">{stats.level}</div>
                                <div className="text-xs uppercase tracking-wider text-secondary">Current Level</div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-yellow-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                <Award className="text-yellow-400" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-yellow-400">{user.streak_count || 0}</div>
                                <div className="text-xs uppercase tracking-wider text-secondary">Day Streak</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Field Progress Bars */}
                <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center gap-4">
                        <Activity className="text-cyan-500" size={24} />
                        <h3 className="text-xl font-black uppercase tracking-tight">Field Progress</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { key: 'networking', label: 'Networking', color: 'cyan' },
                            { key: 'ethical-hacking', label: 'Ethical Hacking', color: 'amber' },
                            { key: 'programming', label: 'Programming', color: 'emerald' }
                        ].map(({ key, label, color }) => {
                            const { watched, total } = stats.fieldProgress[key];
                            const percentage = getProgressPercentage(key);

                            return (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-bold">{label}</span>
                                        <span className="text-slate-400">{watched} / {total} videos</span>
                                    </div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400 transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center gap-4">
                        <Zap className="text-yellow-500" size={24} />
                        <h3 className="text-xl font-black uppercase tracking-tight">Recent Activity</h3>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Loading activity...</div>
                    ) : stats.recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between text-sm py-3 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Award className="text-green-400" size={16} />
                                        </div>
                                        <span className="text-slate-300">Completed step #{activity.step_id}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-600">+100 XP</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <BookOpen className="mx-auto mb-2 text-slate-600" size={32} />
                            <p>No activity yet. Start learning to track your progress!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
