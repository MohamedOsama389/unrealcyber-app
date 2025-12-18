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
    X,
    Folder,
    FileText
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
        { path: '/files', label: 'Academy Files', icon: FileText },
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
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-40 ${isOpen ? 'block pt-20' : 'hidden md:block'}`}
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
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <div className="flex items-center space-x-3 px-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-white font-bold truncate">{user.username}</p>
                                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
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
