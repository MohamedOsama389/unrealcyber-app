import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import io from 'socket.io-client';
import { format } from 'date-fns';

const Chat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef();
    const scrollRef = useRef();

    useEffect(() => {
        socketRef.current = io(); // Connect to same origin

        socketRef.current.on('init_messages', (msgs) => {
            setMessages(msgs);
            scrollToBottom();
        });

        socketRef.current.on('new_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        socketRef.current.emit('send_message', {
            username: user.username,
            content: input
        });
        setInput('');
    };

    return (
        <div className="h-[calc(100vh-64px)] p-6 max-w-5xl mx-auto flex flex-col">
            <div className="glass-panel flex-1 flex flex-col overflow-hidden border border-white/10 shadow-glass">
                <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-black/10">
                    <h2 className="flex items-center text-xl font-bold text-white drop-shadow-md">
                        <MessageSquare className="mr-2 text-neon-cyan" />
                        Academy Public Comms
                    </h2>
                    <span className="text-xs text-neon-green px-3 py-1 bg-neon-green/10 rounded-full border border-neon-green/20 shadow-neon-green animate-pulse">● Online</span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    {messages.map((msg, idx) => {
                        const isMe = msg.username === user.username;
                        return (
                            <div
                                key={idx}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className={`text-xs font-bold ${isMe ? 'text-neon-cyan' : 'text-neon-purple'}`}>
                                        {msg.username}
                                    </span>
                                    <span className="text-[10px] text-white/40">
                                        {format(new Date(msg.timestamp), 'h:mm a')}
                                    </span>
                                </div>
                                <div
                                    className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-md backdrop-blur-sm ${isMe
                                        ? 'bg-gradient-to-br from-neon-blue to-neon-cyan text-white rounded-br-none border border-white/10'
                                        : 'bg-glass-surface border border-white/10 text-white rounded-bl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={sendMessage} className="p-4 bg-black/20 border-t border-white/5 flex gap-3 backdrop-blur-md">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="input-field flex-1 h-12"
                    />
                    <button type="submit" className="p-3 bg-gradient-to-r from-neon-cyan to-neon-blue hover:from-neon-blue hover:to-neon-cyan rounded-xl text-white transition-all shadow-neon hover:scale-105 active:scale-95">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
