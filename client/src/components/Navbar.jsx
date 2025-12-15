import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Video,
    CheckSquare,
    Monitor,
    MessageSquare,
    Shield,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/meetings', label: 'Meetings', icon: Monitor },
        { path: '/tasks', label: 'Mission Center', icon: CheckSquare },
        { path: '/videos', label: 'Recorded Sessions', icon: Video },
        { path: '/vm-rental', label: 'VM Rental', icon: Monitor },
        { path: '/chat', label: 'Comms Channel', icon: MessageSquare },
    ];

    if (user.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Grid', icon: Shield });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center">
                <div className="text-cyan-400 font-bold tracking-widest text-lg">UNREAL CYBER</div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* SIDEBAR (Desktop & Mobile Overlay) */}
            <AnimatePresence>
                {(isOpen || window.innerWidth >= 768) && (
                    <motion.nav
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className={`fixed top-4 left-4 h-[calc(100vh-2rem)] w-72 glass-panel flex flex-col z-40 ${isOpen ? 'block pt-20' : 'hidden md:block'}`}
                    >
                        <div className="mb-8 px-6 pt-6 hidden md:block">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-white to-neon-pink bg-clip-text text-transparent drop-shadow-lg">
                                Unreal Cyber
                            </h1>
                            <div className="flex items-center mt-2 space-x-2">
                                <div className="h-1 w-1 rounded-full bg-neon-accent animate-pulse"></div>
                                <p className="text-[10px] text-glass-highlight tracking-[0.2em] uppercase font-semibold">Academy OS v2.0</p>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto px-4 scrollbar-hide">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                                        ${isActive
                                            ? 'bg-gradient-to-r from-neon-cyan/20 to-transparent text-white shadow-neon border border-neon-cyan/30'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-neon-cyan transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                                            <item.icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-neon-cyan' : 'group-hover:scale-110 group-hover:text-white'}`} />
                                            <span className="font-medium text-sm relative z-10 tracking-wide">{item.label}</span>
                                            {isActive && <motion.div layoutId="active-glow" className="absolute inset-0 bg-neon-cyan/5 blur-xl" />}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        <div className="mt-4 p-4 mx-4 mb-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue to-neon-cyan p-[1px] shadow-lg">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <span className="font-bold text-white">{user.username[0].toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-white font-bold truncate text-sm">{user.username}</p>
                                    <div className="px-2 py-0.5 rounded-full bg-neon-purple/20 border border-neon-purple/30 inline-block">
                                        <p className="text-[10px] text-neon-purple uppercase font-bold tracking-wider">{user.role}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center space-x-2 py-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-300 text-xs font-bold border border-transparent hover:border-red-500/30"
                            >
                                <LogOut size={16} />
                                <span>TERMINATE SESSION</span>
                            </button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* OVERLAY for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Navbar;
