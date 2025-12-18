import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, Plus, Star, Folder, ChevronLeft, Trash2 } from 'lucide-react';

const Videos = () => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [newVideo, setNewVideo] = useState({ title: '', drive_link: '' });

    useEffect(() => {
        fetchContent(currentFolderId);
    }, [currentFolderId]);

    const fetchContent = async (folderId) => {
        setLoading(true);
        try {
            const [videosRes, foldersRes] = await Promise.all([
                axios.get(`/api/videos${folderId ? `?folderId=${folderId}` : ''}`),
                axios.get(`/api/drive/folders/${folderId || '17a65IWgfvipnjSfKu6YYssCJwwUOOgvL'}`)
            ]);
            setVideos(videosRes.data);
            setFolders(foldersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder) => {
        setHistory([...history, currentFolderId]);
        setCurrentFolderId(folder.id);
    };

    const handleBack = () => {
        const prev = history.pop();
        setHistory([...history]);
        setCurrentFolderId(prev);
    };

    const handleFeature = async (id) => {
        try {
            await axios.put(`/api/videos/${id}/feature`);
            fetchContent(currentFolderId);
            setMessage('Video featured on Dashboard!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error("Failed to feature video");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this video record?")) return;
        try {
            await axios.delete(`/api/videos/${id}`);
            fetchContent(currentFolderId);
        } catch (err) {
            console.error("Failed to delete video");
        }
    };

    const handleAddVideo = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/videos', { ...newVideo, folder_id: currentFolderId });
            setMessage('Video added successfully!');
            setNewVideo({ title: '', drive_link: '' });
            fetchContent(currentFolderId);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to add video');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-bold flex items-center space-x-3"
                >
                    <Video className="text-cyan-400" />
                    <span>Recorded Sessions</span>
                </motion.h1>
                {currentFolderId && (
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                        <ChevronLeft size={16} />
                        <span>Back</span>
                    </button>
                )}
            </div>

            {/* ADMIN ADD VIDEO (RESTORED FALLBACK) */}
            {user.role === 'admin' && (
                <div className="bg-slate-900/50 border border-slate-800 p-6 mb-8 rounded-2xl border-l-4 border-l-cyan-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Plus className="mr-2" /> Upload Recording Link
                    </h3>
                    <form onSubmit={handleAddVideo} className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Video Title"
                            value={newVideo.title}
                            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                            className="input-field md:w-1/3"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Drive Link"
                            value={newVideo.drive_link}
                            onChange={(e) => setNewVideo({ ...newVideo, drive_link: e.target.value })}
                            className="input-field flex-1"
                            required
                        />
                        <button type="submit" className="btn-primary whitespace-nowrap">
                            Add Session
                        </button>
                    </form>
                    {message && <p className="text-cyan-400 mt-2 text-sm">{message}</p>}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            ) : (
                <>
                    {/* FOLDERS GRID */}
                    {folders.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Categories</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {folders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleFolderClick(folder)}
                                        className="flex flex-col items-center p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all group"
                                    >
                                        <Folder size={40} className="text-cyan-500 group-hover:scale-110 transition-transform mb-2" />
                                        <span className="text-xs font-medium text-slate-300 text-center truncate w-full">{folder.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIDEOS GRID */}
                    {videos.length === 0 && folders.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                            <p className="text-slate-500 italic">No recordings found in this section</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((vid) => (
                                <motion.div
                                    key={vid.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-panel overflow-hidden group hover:border-cyan-500/50 transition-colors"
                                >
                                    <div className="aspect-video bg-slate-900 relative">
                                        <iframe
                                            src={vid.drive_link.replace('/view', '/preview')}
                                            className="w-full h-full border-0"
                                            allow="autoplay; fullscreen"
                                            allowFullScreen
                                            title={vid.title}
                                        ></iframe>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-white text-lg mb-2 truncate" title={vid.title}>{vid.title}</h3>
                                        <div className="flex space-x-2">
                                            <a
                                                href={vid.drive_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-center py-2 bg-slate-700 hover:bg-cyan-600 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Open in Drive
                                            </a>
                                            {user.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(vid.id)}
                                                    className="px-3 bg-slate-800 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={() => handleFeature(vid.id)}
                                                className={`mt-2 w-full flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${vid.is_featured ? 'bg-yellow-500 text-black' : 'bg-slate-700 hover:bg-yellow-500/20 text-yellow-500'}`}
                                            >
                                                <Star size={16} className={`mr-2 ${vid.is_featured ? 'fill-black' : ''}`} />
                                                {vid.is_featured ? 'Featured' : 'Feature on Dashboard'}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Videos;

