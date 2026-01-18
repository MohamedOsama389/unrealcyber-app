// v2.0.1 - Force rebuild
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, FileCheck, Search, Award, Trash2, Key, Star, Edit, Trash, Music, Play, Square, Send, Globe, Pause, Settings } from 'lucide-react';
import clsx from 'clsx';
import StarRating from '../components/StarRating';
import io from 'socket.io-client';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'submissions', 'votes'
    const [users, setUsers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [votes, setVotes] = useState([]);
    const [editingVote, setEditingVote] = useState(null); // Added for editing
    const [grading, setGrading] = useState({ id: null, rating: 0, admin_notes: '' });
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'student' });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newVote, setNewVote] = useState({ title: '', options: ['', ''] });
    const [partyConfig, setPartyConfig] = useState({ active: false, source: '', type: 'drive', file: null });
    const [partyFiles, setPartyFiles] = useState([]);
    const [uploadingParty, setUploadingParty] = useState(false);
    const [siteSettings, setSiteSettings] = useState({ telegram_enabled: 'false', telegram_link: '' });
    const [stats, setStats] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchSubmissions();
        fetchVotes();
        fetchPartyFiles(); // Fetch party files on component mount
        fetchSiteSettings();
        fetchStats();

        const socket = io();
        socket.on('party_update', (state) => {
            setPartyConfig(prev => ({
                ...prev,
                active: state.active,
                isPlaying: state.isPlaying,
                type: state.type,
                source: state.videoSource
            }));
        });

        return () => socket.disconnect();
    }, []);

    const fetchPartyState = async () => {
        try {
            const res = await axios.get('/api/health'); // Or a dedicated endpoint, but index.js sends it on connect
            // For simplicity, let's assume we can GET the state or just rely on the toggle response
        } catch (err) { }
    };

    const fetchPartyFiles = async () => {
        try {
            const res = await axios.get('/api/party/files');
            setPartyFiles(res.data);
        } catch (err) {
            console.error("Failed to fetch party files:", err);
        }
    };

    const handlePartyConfig = async (e) => {
        e.preventDefault();
        setUploadingParty(true);
        const formData = new FormData();
        formData.append('source', partyConfig.source);
        formData.append('type', partyConfig.type);
        if (partyConfig.file) formData.append('video', partyConfig.file);

        try {
            await axios.post('/api/party/config', formData);
            alert("Party configuration updated!");
            fetchPartyFiles(); // Refresh files after potential upload
        } catch (err) {
            alert("Failed to update party config");
        } finally {
            setUploadingParty(false);
        }
    };

    const toggleParty = async () => {
        try {
            const res = await axios.post('/api/party/toggle');
            setPartyConfig({ ...partyConfig, active: res.data.active });
        } catch (err) { }
    };

    const fetchVotes = async () => {
        try {
            const res = await axios.get('/api/votes');
            setVotes(res.data);
        } catch (err) { }
    };

    const handleCreateVote = async (e) => {
        e.preventDefault();
        try {
            if (editingVote) {
                await axios.put(`/api/votes/${editingVote.id}`, newVote);
                setEditingVote(null);
                alert("Poll updated!");
            } else {
                await axios.post('/api/votes', newVote);
                alert("Poll created!");
            }
            setNewVote({ title: '', options: ['', ''] });
            fetchVotes();
        } catch (err) {
            alert("Operation failed");
        }
    };

    const toggleVoteStatus = async (id) => {
        try {
            await axios.post(`/api/votes/${id}/toggle`);
            fetchVotes();
        } catch (err) { }
    };

    const handleDeleteVote = async (id) => {
        if (!confirm("Are you sure you want to delete this poll? This will also remove all cast votes.")) return;
        try {
            await axios.delete(`/api/votes/${id}`);
            fetchVotes();
        } catch (err) { }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users");
        }
    };

    const fetchSiteSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            setSiteSettings(res.data);
        } catch (err) { console.error(err); }
    };

    const updateSiteSettings = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/settings', siteSettings);
            alert("Settings updated!");
        } catch (err) { alert("Failed to update settings"); }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await axios.get('/api/tasks/uploads');
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions");
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats");
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'student' : 'admin';
        try {
            await axios.post('/api/users/promote', { id: userId, role: newRole });
            fetchUsers();
        } catch (err) {
            console.error("Failed to update role");
        }
    };

    const submitGrade = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/tasks/rate', grading);
            setGrading({ id: null, rating: 0, admin_notes: '' });
            fetchSubmissions();
        } catch (err) {
            console.error("Failed to grade");
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm("Confirm removal of student mission data?")) return;
        try {
            await axios.delete(`/api/tasks/upload/${id}`);
            fetchSubmissions();
        } catch (err) {
            console.error("Failed to delete mission");
        }
    };

    const handleDeleteUser = async (id, username) => {
        if (username === 'Lloyed') return alert("Cannot delete main admin.");
        if (!confirm(`Are you sure you want to delete user ${username}? All their mission data will be lost.`)) return;
        try {
            await axios.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleResetPassword = async (id, username) => {
        const newPassword = prompt(`Enter new password for ${username}:`);
        if (!newPassword) return;
        try {
            await axios.put(`/api/users/${id}/password`, { password: newPassword });
            alert("Password updated successfully.");
        } catch (err) {
            alert("Failed to update password");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/users', newUser);
            setNewUser({ username: '', password: '', role: 'student' });
            setShowCreateForm(false);
            fetchUsers();
            alert("User created successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create user");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold mb-8 flex items-center space-x-3"
            >
                <Shield className="text-purple-400" />
                <span>Command Center</span>
            </motion.h1>

            <div className="flex space-x-4 mb-8">
                <button
                    onClick={() => setActiveTab('users')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'users' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "bg-panel text-secondary hover:bg-white/10 dark:hover:bg-slate-800 hover:text-primary border border-border"
                    )}
                >
                    <Users size={20} />
                    <span>Recruits Database</span>
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'submissions' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30" : "bg-panel text-secondary hover:bg-white/10 dark:hover:bg-slate-800 hover:text-primary border border-border"
                    )}
                >
                    <FileCheck size={20} />
                    <span>Mission Reviews</span>
                </button>
                <button
                    onClick={() => setActiveTab('votes')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'votes' ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/30" : "bg-panel text-secondary hover:bg-white/10 dark:hover:bg-slate-800 hover:text-primary border border-border"
                    )}
                >
                    <Star size={20} />
                    <span>Poll Management</span>
                </button>
                <button
                    onClick={() => setActiveTab('party')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'party' ? "bg-pink-600 text-white shadow-lg shadow-pink-500/30" : "bg-panel text-secondary hover:bg-white/10 dark:hover:bg-slate-800 hover:text-primary border border-border"
                    )}
                >
                    <Music size={20} />
                    <span>Party Option</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'settings' ? "bg-slate-600 text-white shadow-lg shadow-slate-500/30" : "bg-panel text-secondary hover:bg-white/10 dark:hover:bg-slate-800 hover:text-primary border border-border"
                    )}
                >
                    <Settings size={20} />
                    <span>Bot Settings</span>
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'stats' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-panel text-secondary hover:bg-white/10 dark:hover:bg-slate-800 hover:text-primary border border-border"
                    )}
                >
                    <Award size={20} />
                    <span>Recruit Stats</span>
                </button>
            </div>

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Create User Button/Form */}
                    <div className="glass-panel p-6 border-l-4 border-l-cyan-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-primary flex items-center">
                                <Users size={20} className="mr-2 text-cyan-400" /> Administrative Access
                            </h3>
                            <button
                                onClick={() => setShowCreateForm(!showCreateForm)}
                                className="px-4 py-2 bg-panel border border-border hover:bg-white/10 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-primary"
                            >
                                {showCreateForm ? 'Cancel' : 'Create New Recruit'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showCreateForm && (
                                <motion.form
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    onSubmit={handleCreateUser}
                                    className="overflow-hidden bg-panel p-6 rounded-2xl border border-border flex flex-col md:flex-row gap-4 mb-4 items-center"
                                >
                                    <div className="flex-1 w-full">
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            className="input-field w-full h-[48px]"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="input-field w-full h-[48px]"
                                            required
                                        />
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="input-field bg-panel h-[48px] min-w-[160px]"
                                        >
                                            <option value="student">Recruit (Student)</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary px-8 h-[48px] w-full md:w-auto whitespace-nowrap">
                                        Add Account
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        <div className="overflow-hidden rounded-xl border border-border">
                            <table className="w-full text-left">
                                <thead className="bg-panel border-b border-border text-secondary uppercase text-xs">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Username</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Joined</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/5 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 font-mono text-secondary">#{u.id}</td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-panel overflow-hidden border border-border shrink-0">
                                                        {u.avatar_id ? (
                                                            <img
                                                                src={`https://lh3.googleusercontent.com/d/${u.avatar_id}?v=${u.avatar_version || 0}`}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${u.username}&background=22d3ee&color=fff`; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600 uppercase">
                                                                {u.username[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-primary">{u.username}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-secondary text-sm">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => toggleRole(u.id, u.role)}
                                                    className="text-xs font-bold px-3 py-1 bg-panel border border-border hover:bg-white/10 dark:hover:bg-slate-700 rounded text-primary transition-colors"
                                                    disabled={u.username === 'Lloyed'} // Protect main admin
                                                >
                                                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(u.id, u.username)}
                                                    className="p-1.5 bg-panel border border-border hover:bg-panel/50 text-cyan-400 rounded-lg transition-colors"
                                                    title="Change Password"
                                                >
                                                    <Key size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                                    className="p-1.5 bg-panel border border-border hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                                    title="Delete User"
                                                    disabled={u.username === 'Lloyed'}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 bg-panel border-t border-border">
                                <p className="text-[10px] text-secondary flex items-center">
                                    <Shield size={10} className="mr-1" /> Passwords are cryptographically hashed and cannot be retrieved. Use the key icon to set a new password.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUBMISSIONS TAB */}
            {activeTab === 'submissions' && (
                <div className="grid grid-cols-1 gap-6">
                    {submissions.length === 0 && <p className="text-slate-500 text-center py-10">No missions submitted for review.</p>}
                    {submissions.map((sub) => (
                        <motion.div
                            key={sub.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel p-6 border-l-4 border-l-cyan-500"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-primary mb-1">{sub.task_title}</h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                                            {sub.avatar_id ? (
                                                <img
                                                    src={`https://lh3.googleusercontent.com/d/${sub.avatar_id}?v=${sub.avatar_version || 0}`}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${sub.username}&background=22d3ee&color=fff`; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600 uppercase">
                                                    {sub.username[0]}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-cyan-400">Agent: {sub.username}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-xs text-secondary mb-1">{new Date(sub.uploaded_at).toLocaleString()}</span>
                                    <button
                                        onClick={() => handleDeleteTask(sub.id)}
                                        className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                                    >
                                        Remove Task
                                    </button>
                                </div>
                            </div>

                            <div className="bg-panel border border-border p-4 rounded-lg mb-4 text-sm font-mono space-y-2">
                                <p><span className="text-secondary">Link:</span> <a href={sub.upload_link} target="_blank" className="text-blue-400 underline truncate block">{sub.upload_link}</a></p>
                                <p><span className="text-secondary">Notes:</span> <span className="text-secondary">{sub.notes || 'None'}</span></p>
                            </div>

                            {grading.id === sub.id ? (
                                <form onSubmit={submitGrade} className="bg-panel border border-border p-4 rounded-lg animate-in fade-in">
                                    <div className="flex space-x-4 mb-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-secondary block mb-1">Rating (1-5 Stars)</label>
                                            <StarRating
                                                rating={grading.rating}
                                                setRating={(r) => setGrading({ ...grading, rating: r })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-xs text-secondary block mb-1">Feedback</label>
                                        <input
                                            type="text"
                                            value={grading.admin_notes}
                                            onChange={e => setGrading({ ...grading, admin_notes: e.target.value })}
                                            className="input-field py-1"
                                            placeholder="Great work!"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button type="button" onClick={() => setGrading({ id: null, rating: 0, admin_notes: '' })} className="px-3 py-1 text-sm bg-panel border border-border rounded text-secondary">Cancel</button>
                                        <button type="submit" className="px-3 py-1 text-sm bg-green-600 rounded text-white">Save Evaluation</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex justify-between items-center border-t border-border pt-4">
                                    <div>
                                        {sub.rating ? (
                                            <div className="flex items-center space-x-2 text-green-400 text-sm font-bold">
                                                <Award size={16} />
                                                <StarRating rating={sub.rating} readonly />
                                                <span className="text-secondary font-normal ml-2">"{sub.admin_notes}"</span>
                                            </div>
                                        ) : (
                                            <span className="text-yellow-500 text-sm italic">Pending Review</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setGrading({ id: sub.id, rating: sub.rating || 0, admin_notes: sub.admin_notes || '' })}
                                        className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                                    >
                                        Edit Evaluation
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
            {activeTab === 'votes' && (
                <div className="space-y-6">
                    <form onSubmit={handleCreateVote} className="glass-panel p-6 border-l-4 border-l-yellow-500 space-y-4">
                        <h3 className="text-lg font-bold text-primary flex items-center justify-between">
                            <div className="flex items-center">
                                <Star className="mr-2 text-yellow-500" size={20} />
                                {editingVote ? 'Edit Academy Poll' : 'Create New Academy Poll'}
                            </div>
                            {editingVote && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingVote(null);
                                        setNewVote({ title: '', options: ['', ''] });
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </h3>
                        <input
                            type="text"
                            placeholder="Poll Question"
                            value={newVote.title}
                            onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                            className="input-field h-[48px]"
                            required
                        />
                        <div className="space-y-3">
                            {newVote.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const next = [...newVote.options];
                                            next[idx] = e.target.value;
                                            setNewVote({ ...newVote, options: next });
                                        }}
                                        className="input-field h-[48px]"
                                        required
                                    />
                                    {newVote.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = newVote.options.filter((_, i) => i !== idx);
                                                setNewVote({ ...newVote, options: next });
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded h-[48px]"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <button
                                type="button"
                                onClick={() => setNewVote({ ...newVote, options: [...newVote.options, ''] })}
                                className="text-xs font-bold text-yellow-500 hover:text-yellow-400 p-2"
                            >
                                + Add Another Option
                            </button>
                            <button type="submit" className="btn-primary px-8 h-[48px] w-full md:w-auto">
                                {editingVote ? 'Save Changes' : 'Launch Poll to Dashboard'}
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {votes.map(v => (
                            <div key={v.id} className="glass-panel p-6 border border-border relative shadow-sm hover:shadow-cyan-500/5 transition-all">
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <h4 className="font-bold text-primary flex-1 truncate">{v.title}</h4>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("[Admin] Editing vote:", v);
                                                setEditingVote(v);
                                                setNewVote({ title: v.title, options: [...v.options] });
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-panel border border-border hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all text-xs font-bold"
                                            title="Edit Poll"
                                        >
                                            <Edit size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleVoteStatus(v.id);
                                            }}
                                            className={`px-3 h-[32px] rounded-lg text-[10px] font-bold border transition-all ${v.is_active ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-panel text-secondary border-border'}`}
                                        >
                                            {v.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteVote(v.id);
                                            }}
                                            className="p-2 bg-panel hover:bg-red-500/20 text-red-400 rounded-lg border border-border transition-all"
                                            title="Delete Poll"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {Array.isArray(v.options) && v.options.map((opt, idx) => (
                                        <div key={idx} className="text-sm text-secondary flex justify-between p-2 bg-panel rounded border border-border">
                                            <span>{opt}</span>
                                            <span className="font-mono text-cyan-500 font-bold">{v.results ? v.results[idx] : 0} votes</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {votes.length === 0 && <p className="text-secondary text-center py-10 col-span-full">No polls created yet.</p>}
                    </div >
                </div >
            )}

            {/* PARTY TAB */}
            {activeTab === 'party' && (
                <div className="space-y-6">
                    <form onSubmit={handlePartyConfig} className="glass-panel p-6 border-l-4 border-l-pink-500 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-primary flex items-center">
                                <Music className="mr-3 text-pink-500" size={24} /> Party Command Center
                            </h3>
                            <button
                                type="button"
                                onClick={toggleParty}
                                className={clsx(
                                    "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                                    partyConfig.active ? "bg-red-500 text-white animate-pulse" : "bg-green-500 text-white"
                                )}
                            >
                                {partyConfig.active ? <Square size={16} /> : <Play size={16} />}
                                {partyConfig.active ? 'STOP GLOBAL PARTY' : 'START GLOBAL PARTY'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Stream Source</label>
                                    <select
                                        value={partyConfig.type} // Controlled by type
                                        onChange={(e) => setPartyConfig({ ...partyConfig, type: e.target.value, source: '' })} // Clear source when type changes
                                        className="input-field w-full"
                                    >
                                        <option value="drive">Google Drive File</option>
                                        <option value="youtube">YouTube URL</option>
                                    </select>
                                </div>

                                {partyConfig.type === 'drive' && (
                                    <div>
                                        <label className="block text-secondary text-xs font-bold uppercase mb-2">Select From Party Folder</label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setPartyConfig({ ...partyConfig, source: e.target.value, type: 'drive' });
                                                }
                                            }}
                                            className="input-field w-full mb-3"
                                            value={partyConfig.source} // Control the select value
                                        >
                                            <option value="" disabled>-- Select a Video --</option>
                                            {partyFiles.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-secondary text-xs py-1">- OR Upload New -</div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">
                                        {partyConfig.type === 'drive' ? 'Drive File ID (Manual)' : 'Video URL'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={partyConfig.type === 'drive' ? 'Enter Google Drive File ID' : 'Enter YouTube URL'}
                                        value={partyConfig.source}
                                        onChange={(e) => setPartyConfig({ ...partyConfig, source: e.target.value })}
                                        className="input-field w-full"
                                    />
                                    {partyConfig.type === 'drive' && (
                                        <div className="mt-2">
                                            <label className="block text-secondary text-xs font-bold uppercase mb-2">Upload New File</label>
                                            <input
                                                type="text"
                                                placeholder="Drive File ID (optional if uploading)"
                                                value={partyConfig.source}
                                                onChange={(e) => setPartyConfig({ ...partyConfig, source: e.target.value })}
                                                className="input-field"
                                            />
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setPartyConfig({ ...partyConfig, file: e.target.files[0] })}
                                                    className="text-xs text-secondary"
                                                    accept="video/*"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploadingParty}
                                    className="btn-primary w-full h-[48px]"
                                >
                                    {uploadingParty ? 'Broadcasting...' : 'Update Stream Resource'}
                                </button>
                            </div>

                            <div className="bg-panel/50 border border-border p-6 rounded-2xl flex flex-col justify-center text-center">
                                <Globe className="mx-auto text-pink-500 mb-4" size={48} />
                                <h4 className="font-bold text-primary mb-2">Global Synchronization</h4>
                                <p className="text-xs text-secondary leading-relaxed mb-6">
                                    Starting a party will trigger a synchronized video overlay for every connected user.
                                    Admins control playback globally.
                                </p>
                                {partyConfig.active && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const action = partyConfig.isPlaying ? 'pause' : 'play';
                                                    axios.post('/api/socket-relay', { event: 'party_action', data: { action } });
                                                }}
                                                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                {partyConfig.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                                {partyConfig.isPlaying ? 'GLOBAL PAUSE' : 'GLOBAL PLAY'}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => axios.post('/api/socket-relay', { event: 'party_action', data: { action: 'sync' } })}
                                            className="bg-white/5 hover:bg-white/10 text-white/60 py-2 rounded-lg text-xs transition-colors"
                                        >
                                            RE-SYNC ALL PLAYERS
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>

                    <div className="glass-panel p-6 border border-border">
                        <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                            <Send size={18} className="text-cyan-400" /> Administrative Broadcast Chat (WIP)
                        </h4>
                        <p className="text-sm text-secondary italic">Dedicated slider chat will appear globally when party is active.</p>
                    </div>
                </div>
            )}

            {/* STATISTICS TAB */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                    <div className="glass-panel p-6 border-l-4 border-l-indigo-500">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-primary flex items-center">
                                <Award size={24} className="mr-3 text-indigo-400" /> Recruit Performance Metrics
                            </h3>
                            <button
                                onClick={fetchStats}
                                className="px-4 py-2 bg-panel border border-border hover:bg-white/5 rounded-lg text-xs font-bold transition-colors"
                            >
                                Refresh Data
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-border">
                            <table className="w-full text-left">
                                <thead className="bg-panel border-b border-border text-secondary uppercase text-[10px] tracking-wider font-black">
                                    <tr>
                                        <th className="p-4">Recruit</th>
                                        <th className="p-4 text-center">Total Missions</th>
                                        <th className="p-4 text-center text-green-400">Confirmed</th>
                                        <th className="p-4 text-center text-yellow-500">Pending</th>
                                        <th className="p-4 text-center text-red-500">Denied</th>
                                        <th className="p-4 text-right pr-6">Efficiency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats.map((s, idx) => {
                                        const efficiency = s.total_missions > 0
                                            ? Math.round((s.confirmed / s.total_missions) * 100)
                                            : 0;
                                        return (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-primary">{s.username}</td>
                                                <td className="p-4 text-center text-secondary font-mono">{s.total_missions}</td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20">
                                                        {s.confirmed}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs font-bold border border-yellow-500/20">
                                                        {s.pending}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold border border-red-500/20">
                                                        {s.denied}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="w-24 h-1.5 bg-panel rounded-full overflow-hidden border border-border">
                                                            <div
                                                                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                                style={{ width: `${efficiency}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-mono text-xs font-bold text-primary">{efficiency}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {stats.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-secondary italic">
                                                No mission data detected in the database.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <form onSubmit={updateSiteSettings} className="glass-panel p-6 border-l-4 border-l-slate-500 space-y-6">
                        <h3 className="text-xl font-bold text-primary flex items-center">
                            <Settings className="mr-3 text-slate-400" size={24} /> Global Bot Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2">Telegram Integration</label>
                                <div className="flex items-center space-x-4 p-4 bg-panel rounded-xl border border-border">
                                    <span className="text-sm text-primary flex-1">Enable Bot Button on Website</span>
                                    <button
                                        type="button"
                                        onClick={() => setSiteSettings({ ...siteSettings, telegram_enabled: siteSettings.telegram_enabled === 'true' ? 'false' : 'true' })}
                                        className={clsx(
                                            "w-12 h-6 rounded-full transition-all relative",
                                            siteSettings.telegram_enabled === 'true' ? "bg-green-600" : "bg-slate-700"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                            siteSettings.telegram_enabled === 'true' ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2">Telegram Bot Link</label>
                                <input
                                    type="text"
                                    value={siteSettings.telegram_link}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, telegram_link: e.target.value })}
                                    className="input-field w-full"
                                    placeholder="https://t.me/YourBot"
                                />
                                <p className="text-[10px] text-secondary mt-1 italic">Tip: Use ?start=fromWebsite to track origins.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" className="btn-primary px-10 h-[48px]">
                                Save Critical Settings
                            </button>
                        </div>
                    </form>

                    <div className="bg-panel/30 border border-border p-6 rounded-2xl">
                        <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                            <Shield size={16} className="text-cyan-400" /> Environment Checklist
                        </h4>
                        <ul className="text-xs text-secondary space-y-2 list-disc pl-4">
                            <li>Make sure <code className="text-cyan-400">TELEGRAM_BOT_TOKEN</code> is set in Railway.</li>
                            <li>Ensure <code className="text-cyan-400">SITE_BASE_URL</code> is set to your Railway app domain.</li>
                            <li>Database persistence is handled by Google Drive backups.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div >
    );
};

export default AdminPanel;
