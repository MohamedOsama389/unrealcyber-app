import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Video,
    CheckSquare,
    Monitor,
    MessageSquare,
    Shield,
    LogOut,
    Menu,
    X,
    Folder,
    FileText,
    Sun,
    Moon,
    Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/meetings', label: 'Meetings', icon: Monitor },
        { path: '/tasks', label: 'Mission Center', icon: CheckSquare },
        { path: '/videos', label: 'Recorded Sessions', icon: Video },
        { path: '/files', label: 'Academy Files', icon: FileText },
        { path: '/vm-rental', label: 'VM Rental', icon: Monitor },
        { path: '/games', label: 'Education Games', icon: Gamepad2 },
        { path: '/tutorials', label: 'Tutorial Hub', icon: BookOpen },
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
            <div className="md:hidden fixed top-0 w-full z-50 bg-app/90 backdrop-blur border-b border-border p-4 flex justify-between items-center">
                <div className="text-cyan-400 font-bold tracking-widest text-lg">UNREAL CYBER</div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-primary">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* SIDEBAR (Desktop & Mobile Overlay) */}
            <AnimatePresence>
                {(isOpen || window.innerWidth >= 768) && (
                    <motion.nav
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`fixed top-0 left-0 h-full w-72 bg-app border-r border-border p-6 flex flex-col z-40 ${isOpen ? 'block pt-20' : 'hidden md:block'}`}
                    >
                        <div className="mb-10 px-2 hidden md:block">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                Unreal Cyber
                            </h1>
                            <p className="text-xs text-slate-500 tracking-widest mt-1">ACADEMY OS v2.0</p>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                                            : 'text-secondary hover:bg-panel hover:text-primary'
                                        }
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="flex items-center space-x-3 px-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-panel overflow-hidden shadow-lg border border-border">
                                    {user?.avatar_id ? (
                                        <img
                                            src={`https://lh3.googleusercontent.com/d/${user.avatar_id}?v=${user.avatar_version || 0}`}
                                            className="w-full h-full object-cover"
                                            alt="Nav Avatar"
                                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=22d3ee&color=fff`; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-primary font-bold truncate">{user.username}</p>
                                    <p className="text-xs text-secondary capitalize">{user.role}</p>
                                </div>
                            </div>
                            {/* LOGOUT & THEME */}
                            <div className="px-4"> {/* Adjusted to keep it within the existing structure */}
                                <button
                                    onClick={toggleTheme}
                                    className="w-full flex items-center mb-3 px-4 py-3 text-secondary hover:text-primary hover:bg-panel rounded-xl transition-all font-medium"
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                    <span className="ml-3">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                                <button
                                    onClick={handleLogout} // Changed to handleLogout
                                    className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold"
                                >
                                    <LogOut size={20} />
                                    <span className="ml-3">Sign Out</span>
                                </button>
                            </div>
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
