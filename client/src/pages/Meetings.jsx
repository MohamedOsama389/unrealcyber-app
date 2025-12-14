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
                className={`flex items-center justify-center p-12 rounded-3xl mb-8 border transition-all duration-500 ${meeting.is_active
                    ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]'
                    : 'bg-red-500/10 border-red-500/30'
                    }`}
            >
                <div className="text-center">
                    <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${meeting.is_active ? 'bg-green-500 text-white animate-pulse' : 'bg-red-500 text-white'
                        }`}>
                        {meeting.is_active ? <Wifi size={48} /> : <WifiOff size={48} />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {meeting.is_active ? 'MEETING IN PROGRESS' : 'NO ACTIVE SESSION'}
                    </h2>

                    {meeting.is_active && (
                        <a
                            href={meeting.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex items-center px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-lg shadow-green-600/30 transition-all hover:scale-105"
                        >
                            JOIN NOW
                        </a>
                    )}
                </div>
            </motion.div>

            {/* ADMIN CONTROLS */}
            {user.role === 'admin' && (
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Admin Controls</h3>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Meeting Link (Google Meet/Zoom)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={meeting.link || ''}
                                    onChange={(e) => setMeeting({ ...meeting, link: e.target.value })}
                                    className="input-field pl-10"
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="status"
                                checked={meeting.is_active}
                                onChange={(e) => setMeeting({ ...meeting, is_active: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                            />
                            <label htmlFor="status" className="text-white font-medium">Set Status to Active</label>
                        </div>

                        <button type="submit" className="btn-primary flex items-center space-x-2">
                            <Save size={18} />
                            <span>Update Status</span>
                        </button>

                        {message && <p className="text-cyan-400 text-sm mt-2">{message}</p>}
                    </form>
                </div>
            )}
        </div>
    );
};

export default Meetings;
