import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import io from 'socket.io-client';
import clsx from 'clsx';

const PartyOverlay = () => {
    const { user } = useAuth();
    const [partyState, setPartyState] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const socketRef = useRef();
    const videoRef = useRef();
    const chatEndRef = useRef();

    useEffect(() => {
        socketRef.current = io();

        socketRef.current.on('party_update', (state) => {
            setPartyState(state);
        });

        socketRef.current.on('party_chat_update', (msgs) => {
            setPartyState(prev => prev ? { ...prev, messages: msgs } : null);
        });

        return () => socketRef.current.disconnect();
    }, []);

    useEffect(() => {
        if (chatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [partyState?.messages, chatOpen]);

    const handleAction = (action, time) => {
        if (user?.role === 'admin') {
            socketRef.current.emit('party_action', { action, time });
        }
    };

    const sendPartyMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;
        socketRef.current.emit('party_chat', {
            username: user.username,
            avatar_id: user.avatar_id,
            avatar_version: user.avatar_version,
            content: input
        });
        setInput('');
    };

    if (!partyState?.active) return null;

    const videoUrl = partyState.type === 'drive'
        ? `https://lh3.googleusercontent.com/d/${partyState.videoSource}`
        : partyState.videoSource;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[999] bg-black/90 flex flex-col md:flex-row items-stretch"
        >
            {/* Main Player Area */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group">
                    {partyState.type === 'youtube' ? (
                        <iframe
                            src={`${partyState.videoSource.replace('watch?v=', 'embed/')}?autoplay=1&controls=1`}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            autoPlay
                            muted={isMuted}
                            className="w-full h-full"
                            onPlay={() => handleAction('play')}
                            onPause={() => handleAction('pause')}
                            onTimeUpdate={(e) => {
                                if (user?.role === 'admin') {
                                    // Periodic sync could be here
                                }
                            }}
                        />
                    )}

                    {/* Admin Controls Overlay */}
                    {user?.role === 'admin' && partyState.type === 'drive' && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                            <button onClick={() => {
                                if (videoRef.current.paused) videoRef.current.play();
                                else videoRef.current.pause();
                            }} className="p-3 bg-cyan-500 rounded-full text-white">
                                {partyState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <div className="flex-1 h-1 bg-white/20 rounded-full relative">
                                <div
                                    className="absolute inset-y-0 left-0 bg-cyan-500 rounded-full"
                                    style={{ width: `${(partyState.currentTime / (videoRef.current?.duration || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="mt-6 flex items-center gap-6 text-white/60 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-bold text-red-500 uppercase tracking-widest">Live Broadcast</span>
                    </div>
                    <span>Streaming from: <span className="text-white">{partyState.type.toUpperCase()}</span></span>
                    <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors">
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Side Chat Toggle (Mobile) */}
            <button
                onClick={() => setChatOpen(!chatOpen)}
                className="md:hidden fixed bottom-6 right-6 p-4 bg-pink-600 rounded-full shadow-lg z-50"
            >
                <MessageSquare className="text-white" />
            </button>

            {/* Sidebar Chat */}
            <motion.div
                initial={false}
                animate={{ width: chatOpen ? '100%' : '0%' }}
                className={clsx(
                    "bg-panel border-l border-border flex flex-col transition-all overflow-hidden",
                    "md:relative md:w-80 md:block",
                    !chatOpen && "hidden md:flex"
                )}
            >
                <div className="p-4 border-b border-border bg-panel flex items-center justify-between">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                        <MessageSquare size={18} className="text-pink-500" /> Party Chat
                    </h3>
                    <button onClick={() => setChatOpen(false)} className="md:hidden text-secondary">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {partyState.messages.map((m, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500 overflow-hidden shrink-0">
                                {m.avatar_id ? (
                                    <img src={`https://lh3.googleusercontent.com/d/${m.avatar_id}`} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white uppercase bg-gradient-to-tr from-pink-500 to-purple-600">
                                        {m.username[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-pink-400 mb-0.5">{m.username}</p>
                                <p className="text-sm text-primary bg-panel/50 p-2 rounded-lg border border-border">{m.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendPartyMessage} className="p-4 border-t border-border bg-panel">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type to the party..."
                            className="input-field text-sm"
                        />
                        <button type="submit" className="p-2 bg-pink-600 rounded-lg text-white">
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default PartyOverlay;
