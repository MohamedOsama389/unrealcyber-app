import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Users, FileCheck, Search, Award } from 'lucide-react';
import clsx from 'clsx';
import StarRating from '../components/StarRating';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'submissions'
    const [users, setUsers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [grading, setGrading] = useState({ id: null, rating: 0, admin_notes: '' });

    useEffect(() => {
        fetchUsers();
        fetchSubmissions();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users");
        }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await axios.get('/api/tasks/uploads');
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions");
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

    const handleDelete = async (id) => {
        if (!confirm("Confirm removal of student mission data?")) return;
        try {
            await axios.delete(`/api/tasks/upload/${id}`);
            fetchSubmissions();
        } catch (err) {
            console.error("Failed to delete");
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
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all relative overflow-hidden",
                        activeTab === 'users'
                            ? "bg-neon-purple text-white shadow-neon-pink"
                            : "bg-glass-surface text-white/50 hover:bg-glass-hover hover:text-white border border-white/5"
                    )}
                >
                    <Users size={20} />
                    <span>Recruits Database</span>
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all relative overflow-hidden",
                        activeTab === 'submissions'
                            ? "bg-neon-cyan text-white shadow-neon"
                            : "bg-glass-surface text-white/50 hover:bg-glass-hover hover:text-white border border-white/5"
                    )}
                >
                    <FileCheck size={20} />
                    <span>Mission Reviews</span>
                </button>
            </div>

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="glass-panel overflow-hidden border border-white/10">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/20 text-white/40 uppercase text-xs tracking-wider border-b border-white/5 backdrop-blur-md">
                            <tr>
                                <th className="p-5 font-bold">ID</th>
                                <th className="p-5 font-bold">Username</th>
                                <th className="p-5 font-bold">Role</th>
                                <th className="p-5 font-bold">Joined</th>
                                <th className="p-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-5 font-mono text-white/30 group-hover:text-white/50">#{u.id}</td>
                                    <td className="p-5 font-bold text-white text-lg">{u.username}</td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${u.role === 'admin' ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' : 'bg-neon-accent/20 text-neon-accent border-neon-accent/30'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-5 text-white/40 text-sm">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => toggleRole(u.id, u.role)}
                                            className="text-xs font-bold px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors border border-white/5"
                                            disabled={u.username === 'Lloyed'} // Protect main admin
                                        >
                                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SUBMISSIONS TAB */}
            {activeTab === 'submissions' && (
                <div className="grid grid-cols-1 gap-6">
                    {submissions.length === 0 && <p className="text-white/30 text-center py-12 italic">No missions submitted for review.</p>}
                    {submissions.map((sub) => (
                        <motion.div
                            key={sub.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel p-6 border-l-4 border-l-neon-cyan relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="font-bold text-xl text-white mb-1 group-hover:text-neon-cyan transition-colors">{sub.task_title}</h3>
                                    <p className="text-sm text-neon-cyan/80 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-neon-cyan"></span>
                                        Agent: {sub.username}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-xs text-white/30 mb-2 font-mono">{new Date(sub.uploaded_at).toLocaleString()}</span>
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/20 transition-colors"
                                    >
                                        Remove Task
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/20 p-5 rounded-xl mb-6 text-sm border border-white/5 backdrop-blur-sm">
                                <p className="mb-2"><span className="text-white/40 uppercase text-xs font-bold tracking-wider w-16 inline-block">Link:</span> <a href={sub.upload_link} target="_blank" className="text-neon-blue hover:text-white underline truncate inline-block align-bottom max-w-[300px] transition-colors">{sub.upload_link}</a></p>
                                <p><span className="text-white/40 uppercase text-xs font-bold tracking-wider w-16 inline-block">Notes:</span> <span className="text-white/80">{sub.notes || 'None'}</span></p>
                            </div>

                            {grading.id === sub.id ? (
                                <form onSubmit={submitGrade} className="bg-white/5 p-5 rounded-xl animate-in fade-in border border-white/10">
                                    <div className="flex space-x-4 mb-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-white/50 uppercase font-bold mb-2 block">Rating</label>
                                            <StarRating
                                                rating={grading.rating}
                                                setRating={(r) => setGrading({ ...grading, rating: r })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-xs text-white/50 uppercase font-bold mb-2 block">Feedback</label>
                                        <input
                                            type="text"
                                            value={grading.admin_notes}
                                            onChange={e => setGrading({ ...grading, admin_notes: e.target.value })}
                                            className="input-field"
                                            placeholder="Mission feedback..."
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button type="button" onClick={() => setGrading({ id: null, rating: 0, admin_notes: '' })} className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold shadow-lg">Save Evaluation</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                    <div>
                                        {sub.rating ? (
                                            <div className="flex items-center space-x-3 text-neon-green text-sm font-bold">
                                                <Award size={18} />
                                                <StarRating rating={sub.rating} readonly />
                                                <span className="text-white/60 font-normal border-l border-white/10 pl-3">"{sub.admin_notes}"</span>
                                            </div>
                                        ) : (
                                            <span className="text-yellow-500/80 text-sm font-medium flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                                                Pending Review
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setGrading({ id: sub.id, rating: sub.rating || 0, admin_notes: sub.admin_notes || '' })}
                                        className="text-sm text-neon-cyan hover:text-white font-bold transition-colors uppercase tracking-wide text-[10px]"
                                    >
                                        Edit Evaluation
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
