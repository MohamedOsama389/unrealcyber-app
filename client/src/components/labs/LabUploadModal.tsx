import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, File, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface LabUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

const LabUploadModal = ({ isOpen, onClose, onUploadSuccess }: LabUploadModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [appFile, setAppFile] = useState<File | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !appFile) {
            setError('Title and Application File are required.');
            return;
        }

        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('appFile', appFile);
        if (thumbnail) formData.append('thumbnail', thumbnail);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/labs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            onUploadSuccess();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setAppFile(null);
            setThumbnail(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload lab.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Upload New Lab</h2>
                            <p className="text-slate-400 text-sm">Add a new application to the Hands-On space.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-400 text-sm">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Lab Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Wireshark Portable, Nmap Toolset..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-800/50 border border-white/5 focus:border-cyan-500/50 rounded-2xl py-4 px-6 text-white outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                placeholder="What is this application used for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-800/50 border border-white/5 focus:border-cyan-500/50 rounded-2xl py-4 px-6 text-white outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* App File */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Application (.exe, .zip)</label>
                                <label className={`
                                    flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                                    ${appFile ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 hover:border-cyan-500/30 bg-slate-800/30'}
                                `}>
                                    <input type="file" className="hidden" onChange={(e) => setAppFile(e.target.files ? e.target.files[0] : null)} />
                                    {appFile ? (
                                        <div className="text-center">
                                            <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
                                            <p className="text-[10px] text-green-400 font-bold max-w-[120px] truncate">{appFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload size={24} className="text-slate-500 mb-2 mx-auto" />
                                            <p className="text-[10px] text-slate-400 font-bold">Upload App</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Thumbnail */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Thumbnail (Optional)</label>
                                <label className={`
                                    flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                                    ${thumbnail ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/5 hover:border-purple-500/30 bg-slate-800/30'}
                                `}>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files ? e.target.files[0] : null)} />
                                    {thumbnail ? (
                                        <div className="text-center">
                                            <ImageIcon size={24} className="text-purple-500 mx-auto mb-2" />
                                            <p className="text-[10px] text-purple-400 font-bold max-w-[120px] truncate">{thumbnail.name}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon size={24} className="text-slate-500 mb-2 mx-auto" />
                                            <p className="text-[10px] text-slate-400 font-bold">Upload Image</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button
                            disabled={isUploading}
                            className={`
                                w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all
                                ${isUploading ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20 active:scale-95'}
                            `}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Uploading to Workspace...</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    <span>Deploy to Hands-On Lab</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default LabUploadModal;
