import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Video, Play, Plus, Star } from 'lucide-react';

const Videos = () => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [newVideo, setNewVideo] = useState({ title: '', drive_link: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const res = await axios.get('/api/videos');
            setVideos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddVideo = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/videos', newVideo);
            setMessage('Video added!');
            setNewVideo({ title: '', drive_link: '' });
            fetchVideos();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to add video');
        }
    };

    const handleFeature = async (id) => {
        try {
            await axios.put(`/api/videos/${id}/feature`);
            fetchVideos(); // Refresh to show starred status (optional visual feedback)
            setMessage('Video featured on Dashboard!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error("Failed to feature video");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold mb-8 flex items-center space-x-3"
            >
                <Video className="text-cyan-400" />
                <span>Recorded Sessions</span>
            </motion.h1>

            {/* ADMIN ADD VIDEO */}
            {user.role === 'admin' && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-l-purple-500">
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
                            placeholder="Google Drive/YouTube Link"
                            value={newVideo.drive_link}
                            onChange={(e) => setNewVideo({ ...newVideo, drive_link: e.target.value })}
                            className="input-field flex-1"
                            required
                        />
                        <button type="submit" className="btn-primary whitespace-nowrap">
                            Add Video
                        </button>
                    </form>
                    {message && <p className="text-green-400 mt-2 text-sm">{message}</p>}
                </div>
            )}

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
                            <h3 className="font-bold text-white text-lg mb-2">{vid.title}</h3>
                            <a
                                href={vid.drive_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center py-2 bg-slate-700 hover:bg-cyan-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Open in Drive
                                Open in Drive
                            </a>
                            {user.role === 'admin' && (
                                <button
                                    onClick={() => handleFeature(vid.id)}
                                    className={`mt-2 w-full flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${vid.is_featured ? 'bg-yellow-500 text-black' : 'bg-slate-700 hover:bg-yellow-500/20 text-yellow-500'}`}
                                >
                                    <Star size={16} className={`mr-2 ${vid.is_featured ? 'fill-black' : ''}`} />
                                    {vid.is_featured ? 'Featured on Dashboard' : 'Feature on Dashboard'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Videos;
