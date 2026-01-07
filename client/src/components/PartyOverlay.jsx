import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import io from 'socket.io-client';
import clsx from 'clsx';

const PartyOverlay = () => {
    const { user } = useAuth();
    const [partyState, setPartyState] = useState(null);
    const [chatOpen, setChatOpen] = useState(true);
    const [hasJoined, setHasJoined] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [input, setInput] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const socketRef = useRef();
    const videoRef = useRef();
    const chatEndRef = useRef();

    useEffect(() => {
        socketRef.current = io();

        socketRef.current.on('party_update', (state) => {
            setPartyState(prev => {
                // If it was inactive and now it's active, reset local hidden/minimized/joined state
                if (!prev?.active && state.active) {
                    setHidden(false);
                    setMinimized(false);
                    setHasJoined(false);
                }
                return state;
            });
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

    if (!partyState?.active || hidden) return null;

    const getYoutubeEmbed = (url) => {
        if (!url) return '';
        try {
            let videoId = '';
            if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
            else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
            else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
            else videoId = url; // assume its just id

            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&origin=${window.location.origin}`;
        } catch (e) {
            return url;
        }
    };

    const videoUrl = partyState.type === 'drive'
        ? `https://drive.google.com/file/d/${partyState.videoSource}/preview`
        : getYoutubeEmbed(partyState.videoSource);

    if (!hasJoined && !minimized) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-6"
            >
                <div className="max-w-md w-full bg-panel border border-border p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />
                    <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/20">
                        <Play size={40} className="text-pink-500 ml-1" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Live Broadcast Starting!</h2>
                    <p className="text-secondary mb-8">An administrator has started a global party. Would you like to join the broadcast and chat with others?</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setHasJoined(true)}
                            className="bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-500/20 transition-all active:scale-95"
                        >
                            JOIN BROADCAST NOW
                        </button>
                        <button
                            onClick={() => setHidden(true)}
                            className="text-secondary hover:text-primary transition-colors py-2 text-sm font-medium"
                        >
                            Maybe Later (Hide)
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={minimized ? {
                opacity: 1,
                height: 60,
                width: 300,
                bottom: 20,
                right: 20,
                x: 0,
                y: 0,
                borderRadius: 12
            } : {
                opacity: 1,
                height: '100vh',
                width: '100vw',
                bottom: 0,
                right: 0,
                x: 0,
                y: 0,
                borderRadius: 0
            }}
            style={{
                top: minimized ? 'auto' : 0,
                left: minimized ? 'auto' : 0
            }}
            className="fixed z-[999] bg-black/90 flex flex-col md:flex-row items-stretch overflow-hidden shadow-2xl border border-white/10"
        >
            {/* Control Bar (Minimized) */}
            {minimized && (
                <div className="flex-1 flex items-center justify-between px-4 text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Party Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setMinimized(false)} className="p-2 hover:bg-white/10 rounded-lg">
                            <Maximize2 size={16} />
                        </button>
                        <button onClick={() => setHidden(true)} className="p-2 hover:bg-white/10 rounded-lg text-red-400">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {!minimized && (
                <>
                    {/* Main Player Area */}
                    <div className="flex-1 relative flex flex-col items-center justify-center p-4">
                        {/* Header Controls */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500/20 px-3 py-1 rounded-full flex items-center gap-2 border border-red-500/30">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Broadcast</span>
                                </div>
                                <span className="text-xs text-white/40">From: <span className="text-white/80 font-mono uppercase">{partyState.type}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setChatOpen(!chatOpen)}
                                    className={clsx("p-2 rounded-lg transition-colors", chatOpen ? "bg-pink-600 text-white" : "bg-white/5 text-white/60 hover:bg-white/10")}
                                    title="Toggle Chat"
                                >
                                    <MessageSquare size={18} />
                                </button>
                                <button onClick={() => setMinimized(true)} className="p-2 bg-white/5 text-white/60 hover:bg-white/10 rounded-lg">
                                    <Minimize2 size={18} />
                                </button>
                                <button onClick={() => setHidden(true)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-white/5">
                            {partyState.type === 'youtube' ? (
                                <iframe
                                    src={videoUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            ) : (
                                <iframe
                                    src={videoUrl}
                                    className="w-full h-full"
                                    allow="autoplay"
                                    allowFullScreen
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

                        {/* Status Bar Mobile */}
                        <div className="mt-6 md:hidden flex items-center gap-6 text-white/60 text-sm">
                            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Chat */}
                    <AnimatePresence>
                        {chatOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 320, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="bg-panel border-l border-border flex flex-col overflow-hidden relative"
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
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
};

export default PartyOverlay;
