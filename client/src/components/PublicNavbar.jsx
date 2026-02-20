import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Sun, Moon, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
    { to: '/tracking', label: 'Tracks' },
    { to: '/progress', label: 'Progress' },
    { to: '/profile', label: 'Profile' },
];

export default function PublicNavbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const hasPrivate = user && (user.role === 'admin' || user.private_access);
    const normalizeString = (value) => {
        const normalized = String(value ?? '').trim();
        if (!normalized) return '';
        if (normalized === '0' || normalized.toLowerCase() === 'null' || normalized.toLowerCase() === 'undefined') return '';
        return normalized;
    };

    const displayName = normalizeString(user?.display_name) || normalizeString(user?.username) || 'Member';
    const avatarUrl = normalizeString(user?.avatar_url);
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-[#061125]/88 backdrop-blur-xl'
                    : 'bg-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 md:h-[74px] flex items-center justify-between gap-4">
                    <Link to="/" className="group flex items-center">
                        <span className="text-sm md:text-base uppercase tracking-[0.26em] font-bold text-white/95 group-hover:text-cyan-300 transition-colors">
                            UnrealCyber
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-4 lg:gap-8">
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
                            {NAV_LINKS.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `px-3 lg:px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${isActive
                                            ? 'text-cyan-300 bg-cyan-500/12'
                                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="relative w-[86px] h-11 rounded-full border border-white/15 bg-white/[0.03] p-1 transition-colors hover:border-cyan-400/35"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            aria-label="Toggle theme"
                        >
                            <span className="absolute inset-1 rounded-full border border-cyan-500/35 bg-gradient-to-r from-blue-500/20 to-cyan-400/20" />
                            <span
                                className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full shadow-lg transition-transform duration-300 ${theme === 'dark'
                                        ? 'translate-x-0 bg-gradient-to-br from-cyan-300 to-blue-500 text-[#071226]'
                                        : 'translate-x-[42px] bg-gradient-to-br from-orange-300 via-pink-400 to-violet-500 text-[#1d0f2c]'
                                    }`}
                            >
                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                            </span>
                        </button>

                        {!user ? (
                            <Link
                                to="/login"
                                state={{ from: location.pathname }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200 hover:bg-cyan-500/20 transition-all"
                            >
                                Sign In
                                <LogIn size={12} />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 px-2.5 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                    ) : (
                                        <span className="w-7 h-7 rounded-full bg-cyan-500/25 text-cyan-200 text-xs font-bold flex items-center justify-center">
                                            {avatarLetter}
                                        </span>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-200 max-w-[110px] truncate">
                                            {displayName}
                                        </span>
                                        <button
                                            onClick={async () => {
                                                await logout();
                                                if (window.google?.accounts?.id) window.google.accounts.id.cancel();
                                                window.location.assign('/');
                                            }}
                                            className="text-[9px] uppercase tracking-[0.16em] text-red-300/80 hover:text-red-200 transition-colors text-left"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hasPrivate && (
                            <Link
                                to="/private/dashboard"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200 hover:bg-cyan-500/20 transition-all glitch-hover"
                            >
                                Private
                                <ArrowUpRight size={12} />
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="md:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
                            onClick={() => setOpen(false)}
                            aria-label="Close mobile menu"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[88vw] bg-[#081327] border-l border-cyan-500/20 p-6 pt-20 md:hidden"
                        >
                            <div className="flex flex-col gap-2">
                                {NAV_LINKS.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        className={({ isActive }) =>
                                            `px-4 py-3 rounded-xl text-sm uppercase tracking-[0.16em] font-semibold transition-all ${isActive
                                                ? 'text-cyan-200 bg-cyan-500/12 border border-cyan-500/22'
                                                : 'text-slate-200 hover:bg-white/5'
                                            }`
                                        }
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}

                                <button
                                    onClick={toggleTheme}
                                    className="mt-2 px-4 py-3 rounded-xl text-sm uppercase tracking-[0.16em] font-semibold text-slate-200 border border-white/10 bg-white/[0.03] hover:border-cyan-400/35 transition-colors flex items-center justify-center gap-2"
                                >
                                    {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </button>

                                <div className="mt-4 border-t border-white/10 pt-5">
                                    {!user ? (
                                        <Link
                                            to="/login"
                                            state={{ from: location.pathname }}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm uppercase tracking-[0.16em] font-semibold text-cyan-200 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                                        >
                                            Sign In
                                            <LogIn size={14} />
                                        </Link>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                ) : (
                                                    <span className="w-7 h-7 rounded-full bg-cyan-500/25 text-cyan-200 text-xs font-bold flex items-center justify-center">
                                                        {avatarLetter}
                                                    </span>
                                                )}
                                                <div className="text-xs uppercase tracking-[0.16em] text-slate-300 truncate">
                                                    {displayName}
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    await logout();
                                                    if (window.google?.accounts?.id) window.google.accounts.id.cancel();
                                                    window.location.assign('/');
                                                }}
                                                className="text-xs uppercase tracking-[0.16em] text-red-300"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {hasPrivate && (
                                    <Link
                                        to="/private/dashboard"
                                        className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-sm uppercase tracking-[0.12em] text-cyan-200"
                                    >
                                        Private Dashboard
                                        <ArrowUpRight size={14} />
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
