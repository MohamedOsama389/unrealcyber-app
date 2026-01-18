import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, Upload, FileText, ExternalLink, Plus, Trash2, Send } from 'lucide-react';
import StarRating from '../components/StarRating';

// Sub-component for Admin Reviewing inside Tasks
const AdminTaskReviews = ({ taskId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [grading, setGrading] = useState({ id: null, rating: 0, admin_notes: '' });
    const [denyReasons, setDenyReasons] = useState({});
    const [actionMsg, setActionMsg] = useState('');
    const [showReviewed, setShowReviewed] = useState(false);

    useEffect(() => {
        fetchSubs();
    }, [taskId]);

    const fetchSubs = async () => {
        try {
            const res = await axios.get('/api/tasks/uploads');
            const relevant = res.data.filter(s => s.task_id === taskId);
            setSubmissions(relevant);
        } catch (err) {
            console.error("Failed to load subs");
        }
    };

    const handleConfirm = async (id) => {
        try {
            const res = await axios.post(`/api/tasks/confirm/${id}`);
            setActionMsg(res.data.message || 'Mission Confirmed! 🎉');
            setTimeout(() => setActionMsg(''), 3000);
            fetchSubs();
        } catch (err) {
            console.error(err);
            alert("Failed to confirm: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDeny = async (id) => {
        const reason = denyReasons[id];
        if (!reason) return alert("Please provide a reason for denial.");
        try {
            const res = await axios.post(`/api/tasks/deny/${id}`, { reason });
            setActionMsg(res.data.message || 'Mission Denied. ❌');
            setDenyReasons({ ...denyReasons, [id]: '' });
            setTimeout(() => setActionMsg(''), 3000);
            fetchSubs();
        } catch (err) {
            console.error(err);
            alert("Failed to deny: " + (err.response?.data?.error || err.message));
        }
    };

    const submitGrade = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/tasks/rate', grading);
            setGrading({ id: null, rating: 0, admin_notes: '' });
            fetchSubs();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this student submission?")) return;
        try {
            await axios.delete(`/api/tasks/upload/${id}`);
            fetchSubs();
        } catch (err) { console.error(err); }
    };

    const pendingSubs = submissions.filter(s => !s.status || s.status === 'pending');
    const reviewedSubs = submissions.filter(s => s.status === 'confirmed' || s.status === 'denied');

    if (submissions.length === 0) return <p className="text-xs text-secondary italic">No submissions yet.</p>;

    return (
        <div className="space-y-4">
            {actionMsg && <div className="text-[10px] text-cyan-400 font-bold animate-pulse mb-2">{actionMsg}</div>}

            {/* PENDING SECTION */}
            {pendingSubs.map(sub => (
                <div key={sub.id} className="bg-panel p-4 rounded-xl border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                    <div className="flex justify-between text-xs mb-3">
                        <span className="text-cyan-400 font-bold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></div>
                            {sub.username}
                        </span>
                        <div className="flex space-x-2">
                            <span className="text-secondary">{new Date(sub.uploaded_at).toLocaleDateString()}</span>
                            <button onClick={() => handleDelete(sub.id)} className="text-red-400 hover:text-red-300 font-bold transition-colors">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="text-xs mb-3 flex items-center justify-between">
                        <a href={sub.upload_link} target="_blank" className="underline text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold">
                            <ExternalLink size={10} /> View Submission
                        </a>
                        <div className="flex items-center gap-2">
                            {sub.status === 'confirmed' && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] font-black border border-green-500/30 uppercase">Confirmed</span>}
                            {sub.status === 'denied' && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-black border border-red-500/30 uppercase">Denied</span>}
                            {(!sub.status || sub.status === 'pending') && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[9px] font-black border border-yellow-500/30 uppercase">Pending</span>}
                        </div>
                    </div>

                    {/* TELEGRAM ACTIONS */}
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        <button
                            onClick={() => handleConfirm(sub.id)}
                            className="w-full py-1.5 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-[10px] font-bold hover:bg-green-600 hover:text-white transition-all"
                        >
                            ✅ Confirm & Notify Bot
                        </button>

                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-app border border-border rounded-lg text-[10px] px-2 text-primary focus:border-cyan-500 outline-none"
                                placeholder="Deny reason..."
                                value={denyReasons[sub.id] || ''}
                                onChange={(e) => setDenyReasons({ ...denyReasons, [sub.id]: e.target.value })}
                            />
                            <button
                                onClick={() => handleDeny(sub.id)}
                                className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all"
                            >
                                ❌ Deny
                            </button>
                        </div>
                    </div>

                    {grading.id === sub.id ? (
                        <form onSubmit={submitGrade} className="mt-2 bg-panel border border-border p-3 rounded-xl">
                            <StarRating rating={grading.rating} setRating={r => setGrading({ ...grading, rating: r })} />
                            <input
                                className="w-full bg-app text-primary text-xs p-2 rounded-lg mt-2 mb-2 border border-border"
                                value={grading.admin_notes}
                                onChange={e => setGrading({ ...grading, admin_notes: e.target.value })}
                                placeholder="Internal feedback..."
                            />
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setGrading({ id: null })} className="px-3 py-1 bg-panel border border-border text-[10px] rounded-lg text-primary">Cancel</button>
                                <button type="submit" className="px-3 py-1 bg-cyan-600 text-[10px] rounded-lg text-white font-bold">Save Rating</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-between items-center mt-2 border-t border-border pt-2">
                            <div>
                                {sub.rating ? (
                                    <div className="flex items-center space-x-1">
                                        <StarRating rating={sub.rating} readonly size={12} />
                                    </div>
                                ) : <span className="text-[10px] text-yellow-500 italic">Pending Review</span>}
                            </div>
                            <button onClick={() => setGrading({ id: sub.id, rating: sub.rating || 0, admin_notes: sub.admin_notes || '' })} className="text-[10px] text-secondary hover:text-cyan-400 transition-colors">Rate/Edit</button>
                        </div>
                    )}
                </div>
            ))}

            {reviewedSubs.length > 0 && (
                <div className="mt-6">
                    <button
                        onClick={() => setShowReviewed(!showReviewed)}
                        className="text-[10px] font-black text-secondary tracking-widest hover:text-cyan-400 transition-all flex items-center gap-2 uppercase"
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${showReviewed ? 'bg-cyan-500' : 'bg-secondary'}`}></div>
                        {showReviewed ? 'Hide' : 'View'} Reviewed Missions ({reviewedSubs.length})
                    </button>

                    {showReviewed && (
                        <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {reviewedSubs.map(sub => (
                                <div key={sub.id} className="bg-app/50 p-3 rounded-lg border border-border flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-primary">{sub.username}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {sub.status === 'confirmed' ? (
                                                <span className="text-[8px] font-black text-green-400 uppercase tracking-tighter">Confirmed</span>
                                            ) : (
                                                <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter">Denied</span>
                                            )}
                                            <a href={sub.upload_link} target="_blank" className="text-[8px] text-cyan-500 underline flex items-center gap-0.5">
                                                <ExternalLink size={8} /> Link
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StarRating rating={sub.rating || 0} readonly size={10} />
                                        <button onClick={() => handleDelete(sub.id)} className="text-red-500/40 hover:text-red-500 transition-colors">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Tasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', drive_link: '', notes: '', subject: '' });
    const [uploadData, setUploadData] = useState({ task_id: null, file: null, notes: '', isReupload: false });
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState({ telegram_enabled: 'false', telegram_link: '' });

    const [mySubmissions, setMySubmissions] = useState([]);

    useEffect(() => {
        if (user) {
            fetchTasks();
            fetchSettings();
            if (user.role === 'student') fetchMySubmissions();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            setSettings(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchTasks = async () => {
        try {
            const res = await axios.get('/api/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMySubmissions = async () => {
        try {
            const res = await axios.get('/api/tasks/my-submissions');
            setMySubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions");
        }
    };

    const getSubForTask = (taskId) => mySubmissions.find(s => s.task_id === taskId);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            setMessage('Task created!');
            setNewTask({ title: '', drive_link: '', notes: '', subject: '' });
            fetchTasks();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to create task');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setMessage('Initializing Secure Upload Uplink...');

        const formData = new FormData();
        formData.append('task_id', uploadData.task_id);
        formData.append('notes', uploadData.notes);
        if (uploadData.file) {
            formData.append('file', uploadData.file);
        }

        try {
            await axios.post('/api/tasks/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Task submitted successfully!');
            setUploadData({ task_id: null, file: null, notes: '', isReupload: false });
            fetchMySubmissions();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Upload failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to retract this mission submission?")) return;
        try {
            await axios.delete(`/api/tasks/upload/${id}`);
            setMessage('Submission retracted.');
            fetchMySubmissions();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to delete submission');
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm("Are you sure you want to delete this mission? This cannot be undone.")) return;
        try {
            await axios.delete(`/api/tasks/${id}`);
            setMessage('Mission deleted successfully.');
            fetchTasks();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to delete mission');
        }
    };

    if (!user) return <div className="p-8 text-center text-secondary">Loading Secure Mission Data...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-bold flex items-center space-x-3"
                >
                    <CheckSquare className="text-cyan-400" />
                    <span>Mission Center</span>
                </motion.h1>

                {settings.telegram_enabled === 'true' && (
                    <motion.a
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        href={settings.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center"
                        title="Join Telegram Academy"
                    >
                        <Send size={20} />
                    </motion.a>
                )}
            </div>

            {message && (
                <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300">
                    {message}
                </div>
            )}

            {/* ADMIN CREATE TASK */}
            {user.role === 'admin' && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-l-purple-500">
                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
                        <Plus className="mr-2" /> Assign New Mission
                    </h3>
                    <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Mission Title"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            className="input-field"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Subject (e.g. Science, Arabic)"
                            value={newTask.subject}
                            onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                            className="input-field"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Google Drive Resources Link"
                            value={newTask.drive_link}
                            onChange={(e) => setNewTask({ ...newTask, drive_link: e.target.value })}
                            className="input-field md:col-span-2"
                        />
                        <textarea
                            placeholder="Mission Brief / Notes"
                            value={newTask.notes}
                            onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                            className="input-field md:col-span-2 h-24"
                        />
                        <button type="submit" className="btn-primary md:col-span-2">
                            Publish Mission
                        </button>
                    </form>
                </div>
            )}

            {/* TASK LIST */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tasks.map((task) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-primary">{task.title}</h3>
                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-secondary opacity-50 hover:text-red-500 hover:opacity-100 transition-all p-1"
                                        title="Delete Mission"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                            <p className="text-secondary text-sm mb-4 whitespace-pre-wrap">{task.notes}</p>

                            {task.drive_link && (
                                <a
                                    href={task.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6 text-sm"
                                >
                                    <ExternalLink size={14} className="mr-1" />
                                    Access Resources (GDrive)
                                </a>
                            )}
                        </div>

                        {/* ADMIN REVIEW SECTION IN TASKS */}
                        {user.role === 'admin' && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="text-xs font-bold text-secondary uppercase mb-3">Student Submissions</h4>
                                <AdminTaskReviews taskId={task.id} />
                            </div>
                        )}

                        {user.role === 'student' && (
                            <div className="mt-4 pt-4 border-t border-border">
                                {getSubForTask(task.id) && !uploadData.isReupload ? (
                                    <div className={`bg-panel p-4 rounded-lg border ${getSubForTask(task.id).status === 'denied' ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-border'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`${getSubForTask(task.id).status === 'denied' ? 'text-red-400' : 'text-green-400'} text-sm font-bold flex items-center`}>
                                                {getSubForTask(task.id).status === 'denied' ? (
                                                    <><Trash2 size={16} className="mr-2" /> Mission Denied</>
                                                ) : (
                                                    <><CheckSquare size={16} className="mr-2" /> Mission Submitted</>
                                                )}
                                            </span>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs text-secondary">{new Date(getSubForTask(task.id).uploaded_at).toLocaleDateString()}</span>
                                                {getSubForTask(task.id).status === 'denied' ? (
                                                    <button
                                                        onClick={() => setUploadData({ ...uploadData, task_id: task.id, isReupload: true })}
                                                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                                                        title="Re-upload Solutions"
                                                    >
                                                        🔄 Re-upload
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(getSubForTask(task.id).id)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                        title="Retract Submission"
                                                    >
                                                        &times;
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {getSubForTask(task.id).status === 'denied' && (
                                            <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                                                <span className="font-bold">Reason:</span> {getSubForTask(task.id).admin_notes || "No specific reason provided."}
                                            </div>
                                        )}

                                        <div className="text-[10px] text-secondary italic text-right opacity-50 mt-1">
                                            {getSubForTask(task.id).status === 'denied' ? 'Review feedback above and re-submit.' : 'Delete to upload a new file'}
                                        </div>
                                        <p className="text-xs text-secondary mb-2 truncate">Link: {getSubForTask(task.id).upload_link}</p>

                                        {getSubForTask(task.id).rating ? (
                                            <div className="mt-3 pt-3 border-t border-border">
                                                <div className="flex items-center space-x-2 text-yellow-400 text-sm font-bold mb-1">
                                                    <span>Performance Rating:</span>
                                                    <StarRating rating={getSubForTask(task.id).rating} readonly />
                                                </div>
                                                <p className="text-sm text-secondary italic">"{getSubForTask(task.id).admin_notes}"</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-yellow-500 italic mt-2">Pending Commander Review...</p>
                                        )}
                                    </div>
                                ) : (
                                    uploadData.task_id === task.id ? (
                                        <form onSubmit={handleUpload} className="space-y-3">
                                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-cyan-500 transition-colors cursor-pointer relative bg-panel">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    required
                                                />
                                                <div className="text-secondary">
                                                    {uploadData.file ? (
                                                        <span className="text-cyan-400 font-bold">{uploadData.file.name}</span>
                                                    ) : (
                                                        <>
                                                            <Upload className="mx-auto mb-2 text-secondary opacity-30" />
                                                            <span>Drop Mission File or Click to Upload</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <textarea
                                                placeholder="Notes for instructor..."
                                                value={uploadData.notes}
                                                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                                className="input-field py-2 text-sm h-16"
                                            />
                                            <div className="flex space-x-2">
                                                <button type="submit" className="px-4 py-2 bg-green-600 rounded-lg text-sm font-bold hover:bg-green-500">
                                                    Submit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setUploadData({ task_id: null, file: null, notes: '' })}
                                                    className="px-4 py-2 bg-panel border border-border rounded-lg text-sm font-bold hover:bg-white/10 dark:hover:bg-slate-700 text-primary"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => setUploadData({ ...uploadData, task_id: task.id })}
                                            className="w-full py-2 bg-panel hover:bg-white/10 dark:hover:bg-slate-700 border border-border rounded-lg flex items-center justify-center text-primary transition-colors"
                                        >
                                            <Upload size={16} className="mr-2" />
                                            Upload Solution
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}

                {tasks.length === 0 && (
                    <div className="col-span-full text-center py-12 text-secondary opacity-50">
                        No active missions assigned yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
