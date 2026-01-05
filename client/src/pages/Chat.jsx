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
            <div className="glass-panel flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border bg-panel flex items-center justify-between">
                    <h2 className="flex items-center text-xl font-bold text-primary">
                        <MessageSquare className="mr-2 text-cyan-400" />
                        Academy Public Comms
                    </h2>
                    <span className="text-xs text-green-400 px-2 py-1 bg-green-900/20 rounded-full border border-green-900/50">● Online</span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg, idx) => {
                        const isMe = msg.username === user.username;
                        return (
                            <div
                                key={idx}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`flex items-center space-x-2 mb-1 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <div className="w-6 h-6 rounded-full bg-panel border border-border overflow-hidden shrink-0">
                                        {msg.avatar_id ? (
                                            <img
                                                src={`https://drive.google.com/uc?id=${msg.avatar_id}&v=${msg.avatar_version || 0}`}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${msg.username}&background=22d3ee&color=fff`; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600 uppercase">
                                                {msg.username[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold ${isMe ? 'text-cyan-400' : 'text-purple-400'}`}>
                                        {msg.username}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {format(new Date(msg.timestamp), 'h:mm a')}
                                    </span>
                                </div>
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe
                                        ? 'bg-cyan-600 text-white rounded-br-none'
                                        : 'bg-panel border border-border text-primary rounded-bl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={sendMessage} className="p-4 bg-panel border-t border-border flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="input-field flex-1"
                    />
                    <button type="submit" className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
