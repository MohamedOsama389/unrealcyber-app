import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Users, FileCheck, Search, Award, Trash2, Key } from 'lucide-react';
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
                        activeTab === 'users' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    )}
                >
                    <Users size={20} />
                    <span>Recruits Database</span>
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={clsx(
                        "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all",
                        activeTab === 'submissions' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    )}
                >
                    <FileCheck size={20} />
                    <span>Mission Reviews</span>
                </button>
            </div>

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Username</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-mono text-slate-500">#{u.id}</td>
                                    <td className="p-4 font-bold text-white">{u.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => toggleRole(u.id, u.role)}
                                            className="text-xs font-bold px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                                            disabled={u.username === 'Lloyed'} // Protect main admin
                                        >
                                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(u.id, u.username)}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors"
                                            title="Reset Password"
                                        >
                                            <Key size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                            className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
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
                                    <h3 className="font-bold text-lg text-white">{sub.task_title}</h3>
                                    <p className="text-sm text-cyan-400">Agent: {sub.username}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-xs text-slate-500 mb-1">{new Date(sub.uploaded_at).toLocaleString()}</span>
                                    <button
                                        onClick={() => handleDeleteTask(sub.id)}
                                        className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                                    >
                                        Remove Task
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 rounded-lg mb-4 text-sm font-mono space-y-2">
                                <p><span className="text-slate-500">Link:</span> <a href={sub.upload_link} target="_blank" className="text-blue-400 underline truncate block">{sub.upload_link}</a></p>
                                <p><span className="text-slate-500">Notes:</span> <span className="text-slate-300">{sub.notes || 'None'}</span></p>
                            </div>

                            {grading.id === sub.id ? (
                                <form onSubmit={submitGrade} className="bg-slate-800 p-4 rounded-lg animate-in fade-in">
                                    <div className="flex space-x-4 mb-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-400 block mb-1">Rating (1-5 Stars)</label>
                                            <StarRating
                                                rating={grading.rating}
                                                setRating={(r) => setGrading({ ...grading, rating: r })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-xs text-slate-400 block mb-1">Feedback</label>
                                        <input
                                            type="text"
                                            value={grading.admin_notes}
                                            onChange={e => setGrading({ ...grading, admin_notes: e.target.value })}
                                            className="input-field py-1"
                                            placeholder="Great work!"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button type="button" onClick={() => setGrading({ id: null, rating: 0, admin_notes: '' })} className="px-3 py-1 text-sm bg-slate-700 rounded text-slate-300">Cancel</button>
                                        <button type="submit" className="px-3 py-1 text-sm bg-green-600 rounded text-white">Save Evaluation</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                                    <div>
                                        {sub.rating ? (
                                            <div className="flex items-center space-x-2 text-green-400 text-sm font-bold">
                                                <Award size={16} />
                                                <StarRating rating={sub.rating} readonly />
                                                <span className="text-slate-500 font-normal ml-2">"{sub.admin_notes}"</span>
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
        </div>
    );
};

export default AdminPanel;
