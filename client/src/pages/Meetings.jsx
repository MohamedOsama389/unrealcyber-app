import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Video, Wifi, WifiOff, Link as LinkIcon, Save } from 'lucide-react';
import io from 'socket.io-client';

const Meetings = () => {
    const { user } = useAuth();
    const [meeting, setMeeting] = useState({ link: '', is_active: false });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchMeeting();
        fetchMeeting();

        const socket = io();
        socket.on('meeting_update', (data) => {
            console.log("Meeting real-time update", data);
            // Directly update state if possible, or refetch
            // Since format matches, we can set data or just refetch
            fetchMeeting();
        });

        return () => socket.disconnect();
    }, []);

    const fetchMeeting = async () => {
        try {
            const res = await axios.get('/api/meetings');
            setMeeting(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/meetings', meeting);
            setMessage('Meeting status updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update status');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold mb-8 flex items-center space-x-3"
            >
                <Video className="text-cyan-400" />
                <span>Live Sessions</span>
            </motion.h1>

            {/* STATUS INDICATOR */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-panel flex items-center justify-center p-12 transition-all duration-500 relative overflow-hidden group ${meeting.is_active
                    ? 'border-neon-accent/50 shadow-[0_0_60px_rgba(66,255,213,0.15)]'
                    : 'border-red-500/20'
                    }`}
            >
                {/* Background Decor */}
                <div className={`absolute inset-0 opacity-20 transition-opacity duration-1000 ${meeting.is_active ? 'bg-neon-accent/10' : 'bg-transparent'}`} />

                <div className="text-center relative z-10">
                    <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 ${meeting.is_active ? 'bg-neon-accent text-black animate-pulse shadow-neon' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {meeting.is_active ? <Wifi size={48} /> : <WifiOff size={48} />}
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 tracking-wide ${meeting.is_active ? 'text-white drop-shadow-neon' : 'text-white/50'}`}>
                        {meeting.is_active ? 'MEETING IN PROGRESS' : 'NO ACTIVE SESSION'}
                    </h2>

                    {meeting.is_active && (
                        <a
                            href={meeting.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-8 inline-flex items-center px-10 py-4 bg-neon-accent hover:bg-white text-black rounded-full font-bold shadow-[0_0_30px_rgba(66,255,213,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(66,255,213,0.6)]"
                        >
                            JOIN NOW
                        </a>
                    )}
                </div>
            </motion.div>

            {/* ADMIN CONTROLS */}
            {user.role === 'admin' && (
                <div className="glass-panel p-8 mt-8 border-t border-white/10">
                    <h3 className="text-xl font-bold text-neon-cyan mb-6 border-b border-white/10 pb-4">Admin Controls</h3>
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Meeting Link</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    type="text"
                                    value={meeting.link || ''}
                                    onChange={(e) => setMeeting({ ...meeting, link: e.target.value })}
                                    className="input-field pl-12"
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/5">
                            <input
                                type="checkbox"
                                id="status"
                                checked={meeting.is_active}
                                onChange={(e) => setMeeting({ ...meeting, is_active: e.target.checked })}
                                className="w-5 h-5 rounded border-white/20 bg-black/20 text-neon-cyan focus:ring-neon-cyan"
                            />
                            <label htmlFor="status" className="text-white font-medium cursor-pointer">Set Status to Active</label>
                        </div>

                        <button type="submit" className="flex items-center space-x-2 btn-primary px-8">
                            <Save size={18} />
                            <span>Update Status</span>
                        </button>

                        {message && <p className="text-neon-cyan text-sm mt-2">{message}</p>}
                    </form>
                </div>
            )}
        </div>
    );
};

export default Meetings;
