import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, Plus, Star, Folder, ChevronLeft, Trash2, CheckCircle } from 'lucide-react';

const Videos = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [videos, setVideos] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(searchParams.get('folderId') || null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [newVideo, setNewVideo] = useState({ title: '', drive_link: '' });
    const [resources, setResources] = useState([]);
    const [resInput, setResInput] = useState({ title: '', url: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolderForm, setShowFolderForm] = useState(false);

    useEffect(() => {
        fetchContent(currentFolderId);
    }, [currentFolderId]);

    const getVideoEmbedUrl = (link) => {
        if (!link) return '';

        // Handle YouTube
        const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
        if (ytMatch) {
            const id = ytMatch[1].split('&')[0];
            return `https://www.youtube.com/embed/${id}`;
        }

        // Handle Google Drive
        return link.replace('/view', '/preview');
    };

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

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/drive/folders', { name: newFolderName, parentId: currentFolderId || '17a65IWgfvipnjSfKu6YYssCJwwUOOgvL' });
            setNewFolderName('');
            setShowFolderForm(false);
            fetchContent(currentFolderId);
            setMessage('Folder created successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to create folder');
        }
    };

    const handleFolderFeature = async (id) => {
        try {
            const folder = folders.find(f => f.id === id);
            await axios.post(`/api/folders/${id}/feature`, {
                parentId: '17a65IWgfvipnjSfKu6YYssCJwwUOOgvL',
                name: folder ? folder.name : 'Unknown Folder'
            });
            fetchContent(currentFolderId);
        } catch (err) {
            console.error("Failed to feature folder");
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
            await axios.post(`/api/videos/${id}/feature`);
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
            const formData = new FormData();
            if (uploadFile) {
                formData.append('file', uploadFile);
                formData.append('title', newVideo.title);
                formData.append('folder_id', currentFolderId || '');
                formData.append('resources', JSON.stringify(resources));
                await axios.post('/api/videos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/videos', { ...newVideo, folder_id: currentFolderId, resources });
            }
            setMessage('Success!');
            setNewVideo({ title: '', drive_link: '' });
            setResources([]);
            setUploadFile(null);
            fetchContent(currentFolderId);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Operation failed');
        }
    };

    const addResource = (e) => {
        e.preventDefault();
        if (!resInput.title || !resInput.url) return;
        setResources([...resources, resInput]);
        setResInput({ title: '', url: '' });
    };

    const removeResource = (idx) => {
        setResources(resources.filter((_, i) => i !== idx));
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
                <div className="flex space-x-3">
                    {currentFolderId && (
                        <button
                            onClick={handleBack}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                        >
                            <ChevronLeft size={16} />
                            <span>Back</span>
                        </button>
                    )}
                    {user.role === 'admin' && (
                        <button
                            onClick={() => setShowFolderForm(!showFolderForm)}
                            className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm transition-colors text-white"
                        >
                            <Folder size={16} />
                            <span>New Category</span>
                        </button>
                    )}
                </div>
            </div>

            {/* FOLDER CREATION FORM */}
            <AnimatePresence>
                {showFolderForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-900/50 border border-slate-800 p-6 mb-8 rounded-2xl overflow-hidden"
                    >
                        <form onSubmit={handleCreateFolder} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="New category name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="input-field flex-1"
                                required
                            />
                            <button type="submit" className="btn-primary">Create</button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADMIN ADD VIDEO (WITH UPLOAD) */}
            {user.role === 'admin' && (
                <div className="bg-slate-900/50 border border-slate-800 p-6 mb-8 rounded-2xl border-l-4 border-l-cyan-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Plus className="mr-2" /> Add Session
                    </h3>
                    <form onSubmit={handleAddVideo} className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Video Title"
                                value={newVideo.title}
                                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                                className="input-field md:w-1/2"
                                required
                            />
                            {!uploadFile ? (
                                <input
                                    type="text"
                                    placeholder="Drive Link or YouTube URL"
                                    value={newVideo.drive_link}
                                    onChange={(e) => setNewVideo({ ...newVideo, drive_link: e.target.value })}
                                    className="input-field flex-1"
                                />
                            ) : (
                                <div className="flex-1 bg-slate-800 py-2 px-4 rounded-xl flex items-center text-cyan-400 font-mono text-sm">
                                    <CheckCircle size={14} className="mr-2" /> {uploadFile.name}
                                </div>
                            )}
                        </div>

                        {/* Resource Addition */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Attached Resources</h4>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Resource Title (e.g. GitHub)"
                                    className="input-field flex-1 text-sm"
                                    value={resInput.title}
                                    onChange={(e) => setResInput({ ...resInput, title: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="URL"
                                    className="input-field flex-1 text-sm"
                                    value={resInput.url}
                                    onChange={(e) => setResInput({ ...resInput, url: e.target.value })}
                                />
                                <button onClick={addResource} className="px-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold text-sm">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {resources.map((res, idx) => (
                                    <div key={idx} className="flex items-center bg-slate-700 px-3 py-1 rounded-full text-xs text-white">
                                        <span className="font-bold mr-2 text-cyan-400">{res.title}</span>
                                        <span className="opacity-50 truncate max-w-[100px]">{res.url}</span>
                                        <button onClick={(e) => { e.preventDefault(); removeResource(idx); }} className="ml-2 text-red-400 hover:text-white"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                />
                                <Plus size={18} />
                                <span>{uploadFile ? 'Change File' : 'Upload Video File Instead'}</span>
                            </label>
                            <button type="submit" className="btn-primary px-8">
                                {uploadFile ? 'Upload & Save' : 'Save Link'}
                            </button>
                        </div>
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
                                    <div key={folder.id} className="relative group min-h-[100px]">
                                        <div
                                            onClick={() => handleFolderClick(folder)}
                                            className="w-full h-full flex flex-col items-center p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                                        >
                                            <Folder size={40} className="text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-medium text-slate-300 text-center truncate w-full">{folder.name}</span>
                                        </div>
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleFolderFeature(folder.id);
                                                }}
                                                className={`absolute top-2 right-2 p-2.5 rounded-full border border-slate-700 shadow-2xl transition-all z-[999] cursor-pointer pointer-events-auto ${folder.is_featured ? 'bg-yellow-500 text-black border-yellow-600 scale-110' : 'bg-slate-800 text-slate-400 hover:text-yellow-500 hover:scale-125'}`}
                                                title="Feature on Dashboard"
                                            >
                                                <Star size={18} fill={folder.is_featured ? 'currentColor' : 'none'} />
                                            </button>
                                        )}
                                    </div>
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
                                            src={getVideoEmbedUrl(vid.drive_link)}
                                            className="w-full h-full border-0"
                                            allow="autoplay; fullscreen; picture-in-picture"
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
                                                < Star size={16} className={`mr-2 ${vid.is_featured ? 'fill-black' : ''}`} />
                                                {vid.is_featured ? 'Featured' : 'Feature on Dashboard'}
                                            </button>
                                        )}

                                        {vid.resources && vid.resources.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-slate-700">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center">
                                                    <Folder size={10} className="mr-1" /> Resources
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {vid.resources.map((res, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={res.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs px-2 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/20 transition-colors"
                                                        >
                                                            {res.title}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
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

