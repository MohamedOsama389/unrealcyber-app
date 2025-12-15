import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import StarRating from '../components/StarRating';
import { Activity, Calendar, CheckCircle, Award, Server, Play } from 'lucide-react';
import io from 'socket.io-client';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        meetingActive: false,
        tasksTotal: 0,
        tasksCompleted: 0,
        averageRating: 0,
        vmOnlineCount: 0,
        vmTotalCount: 0
    });
    const [featuredVideo, setFeaturedVideo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get Meeting Status
                const meetingRes = await axios.get('/api/meetings');
                const meetingActive = meetingRes.data.is_active === 1;

                // Get featured video
                const videosRes = await axios.get('/api/videos');
                const featured = videosRes.data.find(v => v.is_featured);
                setFeaturedVideo(featured);

                // Get VM Stats
                const vmsRes = await axios.get('/api/vms');
                const vmTotalCount = vmsRes.data.length;
                const vmOnlineCount = vmsRes.data.filter(vm => vm.status === 'online').length;

                let tasksTotal = 0;
                let tasksCompleted = 0;
                let averageRating = 0;

                if (user.role === 'student') {
                    // Get Tasks Count
                    const tasksRes = await axios.get('/api/tasks');
                    tasksTotal = tasksRes.data.length;

                    // Get My Submissions
                    const subsRes = await axios.get('/api/tasks/my-submissions');
                    tasksCompleted = subsRes.data.length;

                    // Calculate Rating
                    const ratedSubs = subsRes.data.filter(s => s.rating > 0);
                    if (ratedSubs.length > 0) {
                        const totalRating = ratedSubs.reduce((acc, curr) => acc + curr.rating, 0);
                        averageRating = Math.round(totalRating / ratedSubs.length);
                    }
                }

                setStats({ meetingActive, tasksTotal, tasksCompleted, averageRating, vmOnlineCount, vmTotalCount });
            } catch (err) {
                console.error("Dashboard data fetch error", err);
            }
        };

        fetchData();

        // Real-time Socket Updates
        const socket = io();

        socket.on('meeting_update', () => {
            console.log("Meeting update received");
            fetchData();
        });

        socket.on('vm_update', () => {
            console.log("VM update received");
            fetchData();
        });

        return () => socket.disconnect();
    }, [user.role]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 relative"
            >
                {/* Header Glow */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-neon-cyan/20 rounded-full blur-[100px] pointer-events-none" />

                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg relative z-10">
                    Welcome to <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-blue bg-clip-text text-transparent drop-shadow-neon">Unreal Cyber</span>
                </h1>
                <p className="text-xl text-glass-muted flex items-center gap-2 relative z-10">
                    Operated by <span className="text-neon-cyan font-bold tracking-wide">Mohamed Osama</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/50">SYSADMIN</span>
                </p>
            </motion.div>

            {/* FEATURED VIDEO SECTION */}
            {featuredVideo && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 glass-panel p-1 overflow-hidden relative group border-t border-white/20"
                >
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-neon-blue to-neon-cyan text-black text-xs font-bold px-4 py-1.5 rounded-br-xl z-10 flex items-center shadow-neon">
                        <Play size={12} className="mr-1 fill-black" /> FEATURED SESSION
                    </div>
                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-2/3 aspect-video bg-black/50 relative group-hover:shadow-[0_0_40px_rgba(79,172,254,0.3)] transition-all duration-500">
                            <iframe
                                src={featuredVideo.drive_link.replace('/view', '/preview')}
                                className="w-full h-full"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                                title={featuredVideo.title}
                            ></iframe>
                        </div>
                        <div className="p-8 flex flex-col justify-center bg-gradient-to-b from-transparent to-black/30">
                            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{featuredVideo.title}</h2>
                            <p className="text-glass-muted mb-6">Recommended viewing for this week's module.</p>
                            <a
                                href={featuredVideo.drive_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary text-center shadow-neon"
                            >
                                Open in Drive
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* SYSTEM STATUS CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6 glass-card-hover cursor-default relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-cyan/20 transition-all duration-500" />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold mb-1 text-white group-hover:text-neon-cyan transition-colors">System Status</h3>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Connection</p>
                        </div>
                        <Activity className="text-neon-cyan group-hover:scale-110 transition-transform duration-300" size={24} />
                    </div>
                    <div className="flex items-center space-x-3 relative z-10">
                        <div className="relative">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse relative z-10" />
                            <div className="absolute inset-0 bg-green-500 blur-md animate-pulse" />
                        </div>
                        <span className="text-white font-mono font-bold tracking-wider text-lg">ONLINE</span>
                    </div>
                    <p className="text-white/30 text-[10px] mt-4 font-mono border-t border-white/5 pt-2">USER ROLE: <span className="text-neon-cyan">{user.role.toUpperCase()}</span></p>
                </motion.div>

                {/* MEETING STATUS CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`glass-panel p-6 glass-card-hover relative overflow-hidden transition-all duration-500 ${stats.meetingActive ? 'border-neon-accent/50 shadow-[0_0_30px_rgba(66,255,213,0.15)]' : ''}`}
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h3 className={`text-xl font-bold mb-1 transition-colors ${stats.meetingActive ? 'text-neon-accent' : 'text-white'}`}>Session Status</h3>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Live Meetings</p>
                        </div>
                        <Calendar className={stats.meetingActive ? 'text-neon-accent drop-shadow-neon' : 'text-white/30'} size={24} />
                    </div>
                    {stats.meetingActive ? (
                        <div className="inline-flex items-center px-4 py-1.5 bg-neon-accent/10 border border-neon-accent/30 text-neon-accent rounded-full text-sm font-bold animate-pulse shadow-neon relative z-10">
                            <span className="w-2 h-2 bg-neon-accent rounded-full mr-2 animate-ping" />
                            SESSION ACTIVE
                        </div>
                    ) : (
                        <div className="text-white/40 text-sm font-medium italic relative z-10">No active sessions. Standby.</div>
                    )}
                </motion.div>

                {/* VM STATUS CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="glass-panel p-6 glass-card-hover group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-purple/20 transition-all duration-500" />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold mb-1 text-white group-hover:text-neon-purple transition-colors">VM Infrastructure</h3>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Lab Status</p>
                        </div>
                        <Server className="text-neon-purple group-hover:scale-110 transition-transform duration-300" size={24} />
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <div className="text-4xl font-bold text-white tracking-tight">{stats.vmOnlineCount} <span className="text-lg text-white/30 font-normal">/ {stats.vmTotalCount}</span></div>
                            <span className="text-xs text-neon-accent uppercase font-bold tracking-wider">Running Instances</span>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${stats.vmOnlineCount > 0 ? 'bg-neon-accent shadow-neon animate-pulse' : 'bg-white/10'}`}></div>
                    </div>
                </motion.div>

                {/* STUDENT PROGRESS CARD */}
                {user.role === 'student' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-6 glass-card-hover group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-pink/20 transition-all duration-500" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold mb-1 text-white group-hover:text-neon-pink transition-colors">Performance</h3>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Mission Data</p>
                            </div>
                            <Award className="text-neon-pink group-hover:scale-110 transition-transform duration-300" size={24} />
                        </div>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/60 font-medium">Completion Rate</span>
                                    <span className="text-white font-bold">{stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="bg-gradient-to-r from-neon-pink to-neon-purple h-full transition-all duration-1000 shadow-[0_0_10px_rgba(240,147,251,0.5)]"
                                        style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-sm">
                                <span className="text-white/60 text-sm font-medium">Avg Rating</span>
                                <StarRating rating={stats.averageRating} readonly />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
