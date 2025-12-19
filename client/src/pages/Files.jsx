import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, Star, ChevronLeft, Download, Eye, Trash2, Plus, CheckCircle } from 'lucide-react';

const Files = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [newFile, setNewFile] = useState({ title: '', drive_link: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolderForm, setShowFolderForm] = useState(false);

    useEffect(() => {
        fetchContent(currentFolderId);
    }, [currentFolderId]);

    const fetchContent = async (folderId) => {
        setLoading(true);
        try {
            const [filesRes, foldersRes] = await Promise.all([
                axios.get(`/api/files${folderId ? `?folderId=${folderId}` : ''}`),
                axios.get(`/api/drive/folders/${folderId || '14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_'}`)
            ]);
            setFiles(filesRes.data);
            setFolders(foldersRes.data);
        } catch (err) {
            console.error("Failed to fetch content:", err);
            setMessage("Error connecting to Google Drive");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/drive/folders', { name: newFolderName, parentId: currentFolderId || '14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_' });
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
            console.log(`Toggling feature for folder ${id}`);
            await axios.put(`/api/folders/${id}/feature`, { parentId: '14nYLGu1H9eqQNCHxk2JXot2G42WY2xN_' });
            fetchContent(currentFolderId);
        } catch (err) {
            console.error("Failed to feature folder", err);
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
            await axios.put(`/api/files/${id}/feature`);
            fetchContent(currentFolderId);
            setMessage('File featured on Dashboard!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error("Failed to feature file");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this file record? (Drive file remains safe)")) return;
        try {
            await axios.delete(`/api/files/${id}`);
            fetchContent(currentFolderId);
        } catch (err) {
            console.error("Failed to delete record");
        }
    };

    const handleAddFile = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            if (uploadFile) {
                formData.append('file', uploadFile);
                formData.append('title', newFile.title);
                formData.append('folder_id', currentFolderId || '');
                await axios.post('/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/files', { ...newFile, folder_id: currentFolderId });
            }
            setMessage('Success!');
            setNewFile({ title: '', drive_link: '' });
            setUploadFile(null);
            fetchContent(currentFolderId);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Operation failed');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <h1 className="text-3xl font-bold flex items-center space-x-3">
                    <FileText className="text-purple-400" />
                    <span>Academy Files</span>
                </h1>
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
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors text-white"
                        >
                            <Folder size={16} />
                            <span>New Folder</span>
                        </button>
                    )}
                </div>
            </motion.div>

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
                                placeholder="New folder name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="input-field flex-1"
                                required
                            />
                            <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-colors">Create</button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADMIN ADD FILE (WITH UPLOAD) */}
            {user.role === 'admin' && (
                <div className="bg-slate-900/50 border border-slate-800 p-6 mb-8 rounded-2xl border-l-4 border-l-purple-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Plus className="mr-2" /> Add Document
                    </h3>
                    <form onSubmit={handleAddFile} className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Document Title"
                                value={newFile.title}
                                onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                                className="input-field md:w-1/2"
                                required
                            />
                            {!uploadFile ? (
                                <input
                                    type="text"
                                    placeholder="Drive Link (optional if uploading)"
                                    value={newFile.drive_link}
                                    onChange={(e) => setNewFile({ ...newFile, drive_link: e.target.value })}
                                    className="input-field flex-1"
                                />
                            ) : (
                                <div className="flex-1 bg-slate-800 py-2 px-4 rounded-xl flex items-center text-purple-400 font-mono text-sm">
                                    <Eye size={14} className="mr-2" /> {uploadFile.name}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                />
                                <Plus size={18} />
                                <span>{uploadFile ? 'Change File' : 'Upload PDF File Instead'}</span>
                            </label>
                            <button type="submit" className="bg-purple-600 hover:bg-purple-500 py-2 px-8 rounded-xl font-bold transition-all transform hover:scale-105">
                                {uploadFile ? 'Upload & Save' : 'Save Link'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {message && <p className="mb-4 text-cyan-400 bg-cyan-400/10 p-3 rounded-lg border border-cyan-400/20">{message}</p>}

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            ) : (
                <>
                    {/* FOLDERS GRID */}
                    {folders.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Folders</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {folders.map(folder => (
                                    <div key={folder.id} className="relative group">
                                        <button
                                            onClick={() => handleFolderClick(folder)}
                                            className="w-full flex flex-col items-center p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all"
                                        >
                                            <Folder size={40} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-medium text-slate-300 text-center truncate w-full">{folder.name}</span>
                                        </button>
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFolderFeature(folder.id);
                                                }}
                                                className={`absolute -top-2 -right-2 p-1.5 rounded-full border border-slate-700 transition-all z-10 ${folder.is_featured ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-slate-800 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-500'}`}
                                            >
                                                <Star size={12} fill={folder.is_featured ? 'currentColor' : 'none'} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FILES GRID */}
                    <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Documents</h2>
                    {files.length === 0 && folders.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                            <p className="text-slate-500">This folder is empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all shadow-lg"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                                <FileText className="text-purple-400" />
                                            </div>
                                            {user.role === 'admin' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleFeature(file.id)}
                                                        className={`p-2 rounded-lg transition-colors ${file.is_featured ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-yellow-500 hover:bg-yellow-500/20'}`}
                                                        title="Feature on Dashboard"
                                                    >
                                                        <Star size={16} fill={file.is_featured ? 'currentColor' : 'none'} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file.id)}
                                                        className="p-2 bg-slate-800 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-white mb-1 truncate" title={file.title}>{file.title}</h3>
                                        <p className="text-xs text-slate-500 mb-6 flex items-center">
                                            PDF Document • {new Date(file.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="flex space-x-3">
                                            <a
                                                href={file.drive_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                                            >
                                                <Eye size={16} />
                                                <span>View</span>
                                            </a>
                                            <a
                                                href={file.drive_link.replace('/view', '/download')}
                                                className="px-4 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
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

export default Files;
