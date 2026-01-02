import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import StarRating from '../components/StarRating';
import { Activity, Calendar, CheckCircle, Award, Server, Play, FileText, Eye, Star, Folder, Layout } from 'lucide-react';
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
    const [featuredFile, setFeaturedFile] = useState(null);
    const [featuredFolders, setFeaturedFolders] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get Meeting Status
                const meetingRes = await axios.get('/api/meetings');
                const meetingActive = meetingRes.data.is_active === 1;

                // Get featured content
                const featuredRes = await axios.get('/api/dashboard/featured');
                setFeaturedVideo(featuredRes.data.featuredVideo);
                setFeaturedFile(featuredRes.data.featuredFile);
                setFeaturedFolders(featuredRes.data.featuredFolders || []);

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

    const getVideoEmbedUrl = (link) => {
        if (!link) return '';
        const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
        if (ytMatch) {
            const id = ytMatch[1].split('&')[0];
            return `https://www.youtube.com/embed/${id}`;
        }
        return link.replace('/view', '/preview');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Welcome to <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Unreal Cyber Academy</span>
                </h1>
                <p className="text-xl text-slate-400">
                    Operated by <span className="text-cyan-400 font-semibold">Mohamed Osama</span>
                </p>
            </motion.div>

            {/* FEATURED VIDEO SECTION */}
            {featuredVideo && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 glass-panel p-1 overflow-hidden relative group"
                >
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10 flex items-center">
                        <Play size={12} className="mr-1 fill-white" /> FEATURED SESSION
                    </div>
                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-2/3 aspect-video bg-slate-900">
                            <iframe
                                src={getVideoEmbedUrl(featuredVideo.drive_link)}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                title={featuredVideo.title}
                            ></iframe>
                        </div>
                        <div className="p-6 flex flex-col justify-center">
                            <h2 className="text-2xl font-bold text-white mb-2">{featuredVideo.title}</h2>
                            <p className="text-slate-400 mb-4">Recommended viewing for this week's module.</p>
                            <a
                                href={featuredVideo.drive_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary text-center"
                            >
                                Open in Drive
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}

            {featuredFile && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 glass-panel p-6 border-l-4 border-l-purple-500 flex flex-col md:flex-row items-center justify-between group"
                >
                    <div className="flex items-center space-x-6">
                        <div className="p-4 bg-purple-500/10 rounded-2xl">
                            <FileText className="text-purple-400" size={32} />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
                                <Star size={12} fill="currentColor" />
                                <span>Featured Document</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">{featuredFile.title}</h2>
                            <p className="text-slate-400">Important PDF available for review.</p>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                        <a
                            href={featuredFile.folder_id ? `/files?folderId=${featuredFile.folder_id}&highlightId=${featuredFile.id}` : `/files?highlightId=${featuredFile.id}`}
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Layout size={18} />
                            <span>View in App</span>
                        </a>
                        <a
                            href={featuredFile.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
                        >
                            <Eye size={18} />
                            <span>Open Drive</span>
                        </a>
                    </div>
                </motion.div>
            )}

            {featuredFolders.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center">
                        <Star size={12} className="mr-2 text-yellow-500" /> Featured Categories
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {featuredFolders.map(folder => (
                            <a
                                key={folder.id}
                                href={folder.parent_id === '14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_' ? `/files?folderId=${folder.id}` : `/videos?folderId=${folder.id}`}
                                className="flex flex-col items-center p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all group border-l-2 border-l-yellow-500"
                            >
                                <Folder size={32} className="text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium text-slate-300 text-center truncate w-full">{folder.name || 'Quick Access'}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* SYSTEM STATUS CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6 hover:bg-slate-800/50 transition-colors cursor-default relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-1 text-cyan-400">System Status</h3>
                            <p className="text-slate-400 text-sm uppercase tracking-wider">Connection</p>
                        </div>
                        <Activity className="text-cyan-500" size={24} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white font-mono">ONLINE</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">Role: {user.role.toUpperCase()}</p>
                </motion.div>

                {/* MEETING STATUS CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`glass-panel p-6 transition-colors border-l-4 ${stats.meetingActive ? 'border-l-green-500 bg-green-500/10' : 'border-l-slate-700'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className={`text-xl font-semibold mb-1 ${stats.meetingActive ? 'text-green-400' : 'text-slate-400'}`}>Session Status</h3>
                            <p className="text-slate-400 text-sm uppercase tracking-wider">Live Meetings</p>
                        </div>
                        <Calendar className={stats.meetingActive ? 'text-green-500' : 'text-slate-600'} size={24} />
                    </div>
                    {stats.meetingActive ? (
                        <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold animate-pulse">
                            SESSION ACTIVE
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm">No active sessions. Standby.</div>
                    )}
                </motion.div>

                {/* VM STATUS CARD (New) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="glass-panel p-6 hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-1 text-purple-400">VM Infrastructure</h3>
                            <p className="text-slate-400 text-sm uppercase tracking-wider">Lab Status</p>
                        </div>
                        <Server className="text-purple-500" size={24} />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-bold text-white">{stats.vmOnlineCount} <span className="text-sm text-slate-500 font-normal">/ {stats.vmTotalCount}</span></div>
                            <span className="text-xs text-green-400">Running Instances</span>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${stats.vmOnlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    </div>
                </motion.div>

                {/* STUDENT PROGRESS CARD */}
                {user.role === 'student' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-6 hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold mb-1 text-purple-400">Performance</h3>
                                <p className="text-slate-400 text-sm uppercase tracking-wider">Mission Data</p>
                            </div>
                            <Award className="text-purple-500" size={24} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300">Completion Rate</span>
                                    <span className="text-white font-bold">{stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full transition-all duration-1000"
                                        style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                                <span className="text-slate-300 text-sm">Avg Rating</span>
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
