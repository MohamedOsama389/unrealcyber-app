import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
    Gamepad2,
    BookOpen,
    Network,
    Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const navItems = [
        { path: '/', labelKey: 'nav.dashboard', fallback: 'Dashboard', icon: LayoutDashboard },
        { path: '/meetings', labelKey: 'nav.meetings', fallback: 'Meetings', icon: Monitor },
        { path: '/tasks', labelKey: 'nav.tasks', fallback: 'Mission Center', icon: CheckSquare },
        { path: '/videos', labelKey: 'nav.videos', fallback: 'Recorded Sessions', icon: Video },
        { path: '/files', labelKey: 'nav.files', fallback: 'Academy Files', icon: FileText },
        { path: '/vm-rental', labelKey: 'nav.vm', fallback: 'VM Rental', icon: Monitor },
        { path: '/hands-on', labelKey: 'nav.handsOn', fallback: 'Hands-On Space', icon: Network },
        { path: '/chat', labelKey: 'nav.chat', fallback: 'Comms Channel', icon: MessageSquare },
    ];

    if (user.role === 'admin') {
        navItems.push({ path: '/admin', labelKey: 'nav.admin', fallback: 'Admin Grid', icon: Shield });
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
                        className={`fixed top-0 ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} h-full w-72 bg-app border-border flex flex-col z-40 ${isOpen ? 'block pt-20' : 'hidden md:block'}`}
                    >
                        <div className="mt-4 mb-10 px-4 hidden md:block shrink-0">
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
                                    Unreal Cyber
                                </h1>
                                <span className="text-[10px] text-cyan-500/50 font-bold uppercase tracking-widest bg-cyan-500/5 px-2 py-0.5 rounded-full border border-cyan-500/10 mb-1">
                                    v2.0
                                </span>
                            </div>
                            <p className="text-[9px] text-slate-500 tracking-[0.2em] mt-1 uppercase font-bold opacity-60">
                                Academy OS • Digital Frontier
                            </p>
                        </div>

                        <div className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    id={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 px-4 py-3 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? `${language === 'ar' ? 'border-r-4' : 'border-l-4'} bg-cyan-500/10 text-cyan-400 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.1)]`
                                            : 'text-secondary hover:bg-panel hover:text-primary'
                                        }
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className={`font-medium text-sm ${language === 'ar' ? 'text-right w-full' : ''}`}>{t(item.labelKey, item.fallback)}</span>
                                </NavLink>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 border-t border-border shrink-0 pb-6 md:pb-8">
                            <div className="flex items-center space-x-3 px-4 mb-4" id="nav-user-profile">
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
                            <div className="px-4 space-y-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
                                >
                                    <LogOut size={18} />
                                    <span className="ml-3">{t('action.signout', 'Sign Out')}</span>
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

            {/* Floating Toggles */}
            <div className={`fixed z-50 flex items-center gap-3 ${language === 'ar' ? 'left-4 right-auto' : 'right-4'} bottom-6`}>
                <button
                    id="nav-theme-toggle"
                    onClick={toggleTheme}
                    className="w-12 h-12 rounded-full bg-panel border border-border shadow-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-white/5 transition-all"
                    title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                    onClick={toggleLanguage}
                    className="w-12 h-12 rounded-full bg-panel border border-border shadow-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-white/5 transition-all"
                    title={language === 'en' ? 'العربية' : 'English'}
                >
                    <Languages size={20} />
                </button>
            </div>
        </>
    );
};

export default Navbar;
