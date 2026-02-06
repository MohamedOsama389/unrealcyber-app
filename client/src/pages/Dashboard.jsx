import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import StarRating from '../components/StarRating';
import { Activity, Calendar, CheckCircle, Award, Server, Play, FileText, Eye, Star, Folder, Layout, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom'; // Added import for useNavigate
import clsx from 'clsx'; // Added import for clsx
import CropModal from '../components/CropModal';

const Dashboard = () => {
    const { user, logout, updateUser } = useAuth(); // Added logout and updateUser
    const navigate = useNavigate(); // Added useNavigate
    const [isOpen, setIsOpen] = useState(false); // Added isOpen state


    const [stats, setStats] = useState({
        meetingActive: false,
        tasksTotal: 0,
        tasksCompleted: 0,
        averageRating: 0,
        vmOnlineCount: 0,
        vmTotalCount: 0
    });
    const [todos, setTodos] = useState([]);
    const [showTodoModal, setShowTodoModal] = useState(false);
    const [newTodo, setNewTodo] = useState({ title: '', type: 'personal' });

    const [featuredVideo, setFeaturedVideo] = useState(null);
    const [featuredFile, setFeaturedFile] = useState(null); const [featuredFolders, setFeaturedFolders] = useState([]);
    const [activeVotes, setActiveVotes] = useState([]);
    const [myVotes, setMyVotes] = useState({}); // { voteId: optionIndex }
    const [profile, setProfile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [settings, setSettings] = useState({ telegram_enabled: 'false', telegram_link: '' });

    // Party Re-join Logic
    const [partyActive, setPartyActive] = useState(false);
    const [partyHidden, setPartyHidden] = useState(false);

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

                setStats(prevStats => ({
                    ...prevStats,
                    meetingActive,
                    tasksTotal,
                    tasksCompleted,
                    averageRating,
                    vmOnlineCount,
                    vmTotalCount
                }));

                // Get Profile & Streak
                const profileRes = await axios.get('/api/profile/me');
                setProfile(profileRes.data);

                // Get Active Votes
                const votesRes = await axios.get('/api/votes/active');
                setActiveVotes(votesRes.data);

                // Get Settings
                const settingsRes = await axios.get('/api/settings');
                setSettings(settingsRes.data);

                // Get Todos
                const todosRes = await axios.get('/api/todos');
                setTodos(todosRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
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

        // Listen for Party Updates
        socket.on('party_update', (state) => {
            if (state && state.active) {
                setPartyActive(true);
            } else {
                setPartyActive(false);
                setPartyHidden(false); // Reset hidden state when party ends
            }
        });

        // Listen for local "Hide" event from Overlay
        const handlePartyHidden = () => setPartyHidden(true);
        window.addEventListener('party:hidden', handlePartyHidden);

        return () => {
            socket.disconnect();
            window.removeEventListener('party:hidden', handlePartyHidden);
        };
    }, [user?.role]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob) => {
        setShowCropper(false);
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', croppedBlob, 'avatar.jpg');
        try {
            console.log("[Dashboard] Sending avatar to server...");
            const res = await axios.post('/api/profile/upload-avatar', formData);
            const { avatar_id: newAvatarId, avatar_version: newVersion } = res.data;
            console.log(`[Dashboard] Upload successful. New Version: ${newVersion}`);

            // Update local state
            setProfile({ ...profile, avatar_id: newAvatarId, avatar_version: newVersion });

            // Update global context (for Navbar, Chat, etc.)
            if (updateUser) {
                updateUser({ avatar_id: newAvatarId, avatar_version: newVersion });
            }

            alert("Profile picture updated!");
        } catch (err) {
            console.error("[Dashboard] Upload failed:", err.response?.data || err.message);
            alert(`Upload failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setUploadingAvatar(false);
            setTempImage(null);
        }
    };

    const handleVote = async (voteId, optionIndex) => {
        try {
            await axios.post(`/api/votes/${voteId}/vote`, { optionIndex: optionIndex });
            setMyVotes({ ...myVotes, [voteId]: optionIndex });
            alert("Vote submitted!");
        } catch (err) {
            alert(err.response?.data?.error || "Vote failed");
        }
    };

    const getVideoEmbedUrl = (link) => {
        if (!link) return '';
        const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
        if (ytMatch) {
            const id = ytMatch[1].split('&')[0];
            return `https://www.youtube.com/embed/${id}`;
        }
        return link.replace('/view', '/preview');
    };

    if (!user) return null;

    if (!user) return null;

    const handleJoinParty = () => {
        setPartyHidden(false);
        // Dispatch event to Overlay to show itself
        window.dispatchEvent(new Event('party:show'));
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.title.trim()) return;
        try {
            await axios.post('/api/todos', newTodo);
            setNewTodo({ title: '', type: 'personal' });
            setShowTodoModal(false);
            // Refresh
            const res = await axios.get('/api/todos');
            setTodos(res.data);
        } catch (err) {
            alert("Failed to add goal");
        }
    };

    const handleToggleTodo = async (id, isCompleted) => {
        try {
            await axios.put(`/api/todos/${id}`, { is_completed: !isCompleted });
            setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !isCompleted } : t));
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleDeleteTodo = async (id) => {
        if (!window.confirm("Remove this goal?")) return;
        try {
            await axios.delete(`/api/todos/${id}`);
            setTodos(todos.filter(t => t.id !== id));
        } catch (err) {
            alert("Delete failed");
        }
    };

    const completedGoals = todos.filter(t => t.is_completed).length;
    const totalGoals = todos.length;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* PARTY RE-JOIN BANNER */}
            {partyActive && partyHidden && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-8 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="flex items-center gap-4 z-10">
                        <div className="p-3 bg-white/20 rounded-full animate-pulse">
                            <Play size={24} className="text-white fill-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Live Broadcast in Progress</h2>
                            <p className="text-white/80">You have hidden the active party. Click to rejoin the stream.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleJoinParty}
                        className="mt-4 md:mt-0 z-10 px-6 py-3 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Play size={18} fill="currentColor" />
                        JOIN BROADCAST
                    </button>
                </motion.div>
            )}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-1 shadow-2xl">
                            {user?.avatar_id ? (
                                <img
                                    src={`https://lh3.googleusercontent.com/d/${user.avatar_id}?v=${user.avatar_version || 0}`}
                                    className="w-full h-full rounded-full object-cover border-4 border-app"
                                    alt="Avatar"
                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=22d3ee&color=fff`; }}
                                />
                            ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center bg-panel text-3xl font-bold border-4 border-app text-primary">
                                    {user.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-full cursor-pointer hover:scale-110 transition-all shadow-lg border-2 border-app group-hover:bg-cyan-400">
                            <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={uploadingAvatar} />
                            <Award size={14} className="text-white" />
                        </label>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {settings.telegram_enabled === 'true' && (
                            <motion.a
                                href={settings.telegram_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                                className="group relative flex items-center justify-center p-3 bg-panel border border-cyan-500/30 rounded-2xl hover:bg-cyan-500/10 transition-all shadow-lg hover:shadow-cyan-500/20"
                            >
                                <img src="/telegram_logo.png" alt="Telegram" className="w-10 h-10 object-contain" />

                                {/* TOOLTIP */}
                                <div className="absolute top-full mt-3 right-0 w-48 p-2 bg-slate-900 border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
                                    <p className="text-[10px] text-primary font-bold leading-tight">
                                        don't forget to join the telegram bot for daily check up
                                    </p>
                                    <div className="absolute -top-1 right-5 w-2 h-2 bg-slate-900 border-l border-t border-border transform rotate-45"></div>
                                </div>
                            </motion.a>
                        )}

                        <div className="flex flex-col items-center md:items-end">
                            <h1 className="text-3xl font-bold text-primary">
                                Welcome, <span className="text-cyan-400">{user.username}</span>
                            </h1>
                            <p className="text-secondary flex items-center gap-2">
                                <Activity size={14} className="text-cyan-500" />
                                Academy OS v2.0 • {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="glass-panel px-6 py-4 flex flex-col items-center">
                        <div className="text-orange-500 font-bold text-2xl flex items-center gap-2">
                            🔥 {user?.streak_count || 0}
                        </div>
                        <div className="text-[10px] text-secondary uppercase tracking-widest font-bold">Day Streak</div>
                    </div>
                    <div className="glass-panel px-6 py-4 flex flex-col items-center group relative overflow-hidden">
                        <div className="text-green-500 font-bold text-2xl">
                            {completedGoals}/{totalGoals}
                        </div>
                        <div className="text-[10px] text-secondary uppercase tracking-widest font-bold">Goals Met</div>
                        <button
                            onClick={() => setShowTodoModal(true)}
                            className="absolute bottom-0 right-0 p-2 bg-green-500/10 text-green-500 opacity-0 group-hover:opacity-100 transition-all rounded-tl-xl hover:bg-green-500 hover:text-white"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* TODO LIST REVEAL SECTION */}
            {todos.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-green-500" /> Active Goals
                        </h2>
                        {user.role === 'admin' && (
                            <span className="text-[10px] text-cyan-500/70 italic px-2 py-1 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                                As Admin, you can set General goals for everyone
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todos.map(todo => (
                            <div
                                key={todo.id}
                                className={clsx(
                                    "glass-panel p-4 flex items-center justify-between border-l-4 transition-all hover:scale-[1.01]",
                                    todo.is_completed ? "border-l-green-500/50 bg-green-500/5" : "border-l-cyan-500",
                                    todo.type === 'general' && "ring-1 ring-cyan-400/20"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
                                        className={clsx(
                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                            todo.is_completed ? "bg-green-500 border-green-500 text-white" : "border-slate-700 hover:border-cyan-500"
                                        )}
                                    >
                                        {todo.is_completed && <CheckCircle size={14} />}
                                    </button>
                                    <div className="overflow-hidden">
                                        <p className={clsx("text-sm font-medium truncate", todo.is_completed ? "text-slate-500 line-through" : "text-primary")}>
                                            {todo.title}
                                        </p>
                                        {todo.type === 'general' && (
                                            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Global Target</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

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
                        <div className="w-full md:w-2/3 aspect-video bg-black/20">
                            <iframe
                                src={getVideoEmbedUrl(featuredVideo.drive_link)}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                title={featuredVideo.title}
                            ></iframe>
                        </div>
                        <div className="p-6 flex flex-col justify-center">
                            <h2 className="text-2xl font-bold text-primary mb-2">{featuredVideo.title}</h2>
                            <p className="text-secondary mb-4">Recommended viewing for this week's module.</p>
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

            {/* ACTIVE POLLS SECTION */}
            {activeVotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {activeVotes.map(vote => (
                        <motion.div
                            key={vote.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-6 border-l-4 border-l-yellow-500"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary flex items-center">
                                    <Star className="mr-2 text-yellow-500 fill-yellow-500" size={20} />
                                    Academy Poll
                                </h3>
                                <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full font-bold">ACTIVE</span>
                            </div>
                            <h4 className="text-lg text-secondary mb-6">{vote.title}</h4>
                            <div className="space-y-3">
                                {Array.isArray(vote.options) && vote.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleVote(vote.id, idx)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl border flex justify-between items-center transition-all",
                                            myVotes[vote.id] === idx
                                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10"
                                                : "bg-panel border-border text-secondary hover:bg-white/10 dark:hover:bg-slate-800/50 hover:text-primary"
                                        )}
                                    >
                                        <span className="font-bold">{opt}</span>
                                        {myVotes[vote.id] === idx && <CheckCircle size={18} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
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
                            <h2 className="text-2xl font-bold text-primary">{featuredFile.title}</h2>
                            <p className="text-secondary">Important PDF available for review.</p>
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
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-panel border border-border hover:bg-white/10 dark:hover:bg-slate-700 text-primary rounded-xl font-bold transition-all"
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
                                className="flex flex-col items-center p-4 bg-panel border-border rounded-xl hover:bg-white/10 dark:hover:bg-slate-800 transition-all group border-l-2 border-l-yellow-500 shadow-sm"
                            >
                                <Folder size={32} className="text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium text-secondary text-center truncate w-full">{folder.name || 'Quick Access'}</span>
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
                    className="glass-panel p-6 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors cursor-default relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-1 text-cyan-400">System Status</h3>
                            <p className="text-secondary text-sm uppercase tracking-wider">Connection</p>
                        </div>
                        <Activity className="text-cyan-500" size={24} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-primary font-mono">ONLINE</span>
                    </div>
                    <p className="text-secondary text-xs mt-2">Role: {user.role.toUpperCase()}</p>
                </motion.div>

                {/* MEETING STATUS CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`glass-panel p-6 transition-colors border-l-4 ${stats.meetingActive ? 'border-l-green-500 bg-green-500/10' : 'border-l-border bg-panel'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className={`text-xl font-semibold mb-1 ${stats.meetingActive ? 'text-green-400' : 'text-secondary'}`}>Session Status</h3>
                            <p className="text-secondary text-sm uppercase tracking-wider">Live Meetings</p>
                        </div>
                        <Calendar className={stats.meetingActive ? 'text-green-500' : 'text-secondary'} size={24} />
                    </div>
                    {stats.meetingActive ? (
                        <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold animate-pulse">
                            SESSION ACTIVE
                        </div>
                    ) : (
                        <div className="text-secondary text-sm">No active sessions. Standby.</div>
                    )}
                </motion.div>

                {/* VM STATUS CARD (New) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="glass-panel p-6 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-1 text-purple-400">VM Infrastructure</h3>
                            <p className="text-secondary text-sm uppercase tracking-wider">Lab Status</p>
                        </div>
                        <Server className="text-purple-500" size={24} />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-bold text-primary">{stats.vmOnlineCount} <span className="text-sm text-secondary font-normal">/ {stats.vmTotalCount}</span></div>
                            <span className="text-xs text-green-400">Running Instances</span>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${stats.vmOnlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-border'}`}></div>
                    </div>
                </motion.div>

                {/* STUDENT PROGRESS CARD */}
                {user.role === 'student' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-6 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold mb-1 text-purple-400">Performance</h3>
                                <p className="text-secondary text-sm uppercase tracking-wider">Mission Data</p>
                            </div>
                            <Award className="text-purple-500" size={24} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-secondary">Completion Rate</span>
                                    <span className="text-primary font-bold">{stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full transition-all duration-1000"
                                        style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-panel p-3 rounded-lg border border-border">
                                <span className="text-secondary text-sm">Avg Rating</span>
                                <StarRating rating={stats.averageRating} readonly />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
            {showCropper && (
                <CropModal
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                />
            )}

            {/* TODO MODAL */}
            <AnimatePresence>
                {showTodoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTodoModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-shadow"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Plus className="text-cyan-400" /> New Academy Goal
                            </h2>

                            <form onSubmit={handleAddTodo} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Goal Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTodo.title}
                                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                                        placeholder="What do you want to achieve?"
                                        className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    />
                                </div>

                                {user.role === 'admin' && (
                                    <div className="flex bg-slate-800 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setNewTodo({ ...newTodo, type: 'personal' })}
                                            className={clsx(
                                                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                                newTodo.type === 'personal' ? "bg-cyan-500 text-white" : "text-slate-500 hover:text-white"
                                            )}
                                        >
                                            PERSONAL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewTodo({ ...newTodo, type: 'general' })}
                                            className={clsx(
                                                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                                newTodo.type === 'general' ? "bg-cyan-500 text-white" : "text-slate-500 hover:text-white"
                                            )}
                                        >
                                            GENERAL
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTodoModal(false)}
                                        className="flex-1 px-6 py-3 bg-panel text-secondary font-bold rounded-xl hover:bg-white/5 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-sm"
                                    >
                                        Create Goal
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
