import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import StarRating from '../components/StarRating';
import { Activity, Calendar, CheckCircle, Award } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        meetingActive: false,
        tasksTotal: 0,
        tasksCompleted: 0,
        averageRating: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get Meeting Status
                const meetingRes = await axios.get('/api/meetings');
                const meetingActive = meetingRes.data.is_active === 1;

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

                setStats({ meetingActive, tasksTotal, tasksCompleted, averageRating });
            } catch (err) {
                console.error("Dashboard data fetch error", err);
            }
        };

        fetchData();
    }, [user.role]);

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
