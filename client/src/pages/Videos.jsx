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
                                    <h3 className="font-bold text-white text-lg mb-2 truncate">{vid.title}</h3>
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
                </>
            )}
        </div>
    );
};

export default Videos;

