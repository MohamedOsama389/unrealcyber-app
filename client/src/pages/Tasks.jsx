import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, Upload, FileText, ExternalLink, Plus, Trash2 } from 'lucide-react';
import StarRating from '../components/StarRating';

// Sub-component for Admin Reviewing inside Tasks
const AdminTaskReviews = ({ taskId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [grading, setGrading] = useState({ id: null, rating: 0, admin_notes: '' });

    useEffect(() => {
        fetchSubs();
    }, [taskId]);

    const fetchSubs = async () => {
        try {
            const res = await axios.get('/api/tasks/uploads');
            // Filter client-side or backend, here client-side for simplicity matching TaskID
            const relevant = res.data.filter(s => s.task_id === taskId);
            setSubmissions(relevant);
        } catch (err) {
            console.error("Failed to load subs");
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

    if (submissions.length === 0) return <p className="text-xs text-white/30 italic">No submissions yet.</p>;

    return (
        <div className="space-y-3">
            {submissions.map(sub => (
                <div key={sub.id} className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-neon-cyan font-bold">{sub.username}</span>
                        <div className="flex space-x-2">
                            <span className="text-white/40">{new Date(sub.uploaded_at).toLocaleDateString()}</span>
                            <button onClick={() => handleDelete(sub.id)} className="text-red-400 hover:text-red-300 font-bold px-1">&times;</button>
                        </div>
                    </div>
                    <div className="text-xs text-white/50 mb-3 truncate">
                        <a href={sub.upload_link} target="_blank" className="underline hover:text-white transition-colors">View Submission File</a>
                    </div>

                    {grading.id === sub.id ? (
                        <form onSubmit={submitGrade} className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10 animate-in fade-in">
                            <div className="mb-2">
                                <StarRating rating={grading.rating} setRating={r => setGrading({ ...grading, rating: r })} />
                            </div>
                            <input
                                className="w-full input-field py-1 text-xs mb-2 bg-black/40"
                                value={grading.admin_notes}
                                onChange={e => setGrading({ ...grading, admin_notes: e.target.value })}
                                placeholder="Feedback..."
                            />
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setGrading({ id: null })} className="px-2 py-1 bg-white/10 text-[10px] rounded hover:bg-white/20 text-white">Cancel</button>
                                <button type="submit" className="px-2 py-1 bg-green-600 text-[10px] rounded hover:bg-green-500 text-white font-bold">Save</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                            <div>
                                {sub.rating ? (
                                    <div className="flex items-center space-x-2">
                                        <StarRating rating={sub.rating} readonly size={12} />
                                    </div>
                                ) : <span className="text-[10px] text-yellow-500">Unrated</span>}
                            </div>
                            <button onClick={() => setGrading({ id: sub.id, rating: sub.rating || 0, admin_notes: sub.admin_notes || '' })} className="text-[10px] text-neon-cyan hover:text-white uppercase font-bold tracking-wide">Rate/Edit</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const Tasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', drive_link: '', notes: '' });
    const [uploadData, setUploadData] = useState({ task_id: null, file: null, notes: '' });
    const [message, setMessage] = useState('');

    const [mySubmissions, setMySubmissions] = useState([]);

    useEffect(() => {
        fetchTasks();
        if (user.role === 'student') fetchMySubmissions();
    }, []);

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
            await axios.post('/api/tasks', newTask);
            setMessage('Task created!');
            setNewTask({ title: '', drive_link: '', notes: '' });
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
            setUploadData({ task_id: null, file: null, notes: '' });
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

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold mb-8 flex items-center space-x-3 text-white"
            >
                <CheckSquare className="text-neon-cyan drop-shadow-neon" />
                <span>Mission Center</span>
            </motion.h1>

            {message && (
                <div className="mb-6 p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-neon-cyan shadow-neon flex items-center">
                    <span className="w-2 h-2 rounded-full bg-neon-cyan mr-3 animate-pulse"></span>
                    {message}
                </div>
            )}

            {/* ADMIN CREATE TASK */}
            {user.role === 'admin' && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-l-neon-purple relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 rounded-full blur-[80px] pointer-events-none" />

                    <h3 className="text-lg font-bold text-white mb-6 flex items-center relative z-10">
                        <Plus className="mr-2 text-neon-purple" /> Assign New Mission
                    </h3>
                    <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
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
                            placeholder="Google Drive Resources Link"
                            value={newTask.drive_link}
                            onChange={(e) => setNewTask({ ...newTask, drive_link: e.target.value })}
                            className="input-field"
                        />
                        <textarea
                            placeholder="Mission Brief / Notes"
                            value={newTask.notes}
                            onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                            className="input-field md:col-span-2 h-24 pt-3"
                        />
                        <button type="submit" className="btn-primary md:col-span-2 shadow-neon bg-gradient-to-r from-neon-purple to-neon-blue">
                            Publish Mission
                        </button>
                    </form>
                </div>
            )}

            {/* TASK LIST */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tasks.map((task, idx) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-panel p-6 flex flex-col justify-between group hover:border-white/20 transition-all duration-300"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors">{task.title}</h3>
                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-white/30 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-lg"
                                        title="Delete Mission"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                            <p className="text-glass-muted text-sm mb-6 whitespace-pre-wrap leading-relaxed">{task.notes}</p>

                            {task.drive_link && (
                                <a
                                    href={task.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-neon-cyan hover:text-white mb-6 text-sm font-bold bg-neon-cyan/10 px-4 py-2 rounded-lg border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-all"
                                >
                                    <ExternalLink size={14} className="mr-2" />
                                    Access Resources (GDrive)
                                </a>
                            )}
                        </div>

                        {/* ADMIN REVIEW SECTION IN TASKS */}
                        {user.role === 'admin' && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Student Submissions</h4>
                                <AdminTaskReviews taskId={task.id} />
                            </div>
                        )}

                        {user.role === 'student' && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                {getSubForTask(task.id) ? (
                                    <div className="bg-black/20 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-neon-green text-sm font-bold flex items-center shadow-neon-green">
                                                <CheckSquare size={16} className="mr-2" /> Mission Submitted
                                            </span>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs text-white/40 font-mono">{new Date(getSubForTask(task.id).uploaded_at).toLocaleDateString()}</span>
                                                <button
                                                    onClick={() => handleDelete(getSubForTask(task.id).id)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                    title="Retract Submission"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-white/30 mb-2 italic text-right">Delete to upload a new file</div>
                                        <p className="text-xs text-white/60 mb-3 truncate flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue"></span>
                                            Link: <span className="text-white/80">{getSubForTask(task.id).upload_link}</span>
                                        </p>

                                        {getSubForTask(task.id).rating ? (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <div className="flex items-center space-x-2 text-neon-green text-sm font-bold mb-1">
                                                    <span>Performance Rating:</span>
                                                    <StarRating rating={getSubForTask(task.id).rating} readonly />
                                                </div>
                                                <p className="text-sm text-white/70 italic border-l-2 border-white/10 pl-3">"{getSubForTask(task.id).admin_notes}"</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-yellow-500/80 italic mt-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                                                Pending Commander Review...
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    uploadData.task_id === task.id ? (
                                        <form onSubmit={handleUpload} className="space-y-4 animate-in fade-in">
                                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-neon-cyan hover:bg-neon-cyan/5 transition-all cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                    required
                                                />
                                                <div className="text-white/50 group-hover:text-white transition-colors">
                                                    {uploadData.file ? (
                                                        <span className="text-neon-cyan font-bold flex flex-col items-center">
                                                            <FileText size={32} className="mb-2" />
                                                            {uploadData.file.name}
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <Upload className="mb-3 text-neon-cyan/50 group-hover:text-neon-cyan transition-colors" size={32} />
                                                            <span className="text-sm font-bold">Drop Mission File</span>
                                                            <span className="text-xs text-white/30 mt-1">or Click to Upload</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <textarea
                                                placeholder="Notes for instructor..."
                                                value={uploadData.notes}
                                                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                                className="input-field py-3 text-sm h-20"
                                            />
                                            <div className="flex space-x-2">
                                                <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:from-green-500 hover:to-green-400 transition-all">
                                                    Submit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setUploadData({ task_id: null, file: null, notes: '' })}
                                                    className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => setUploadData({ ...uploadData, task_id: task.id })}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-neon-cyan/50 rounded-xl flex items-center justify-center text-white/60 hover:text-neon-cyan transition-all group"
                                        >
                                            <Upload size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                                            Upload Solution
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}

                {tasks.length === 0 && (
                    <div className="col-span-full text-center py-16 text-white/30 italic glass-panel border-dashed border-2 border-white/10">
                        No active missions assigned yet. Standby for directives.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
