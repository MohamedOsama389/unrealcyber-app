import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Sun, Moon } from 'lucide-react';
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
    const { user, loginWithGoogle, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const desktopGoogleBtnRef = useRef(null);
    const mobileGoogleBtnRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || user) return;

        const renderGoogleButtons = () => {
            if (!window.google?.accounts?.id) return;

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    await loginWithGoogle(response.credential, { requireAdmin: false });
                }
            });

            if (desktopGoogleBtnRef.current) {
                desktopGoogleBtnRef.current.innerHTML = '';
                window.google.accounts.id.renderButton(desktopGoogleBtnRef.current, {
                    theme: 'outline',
                    size: 'medium',
                    text: 'continue_with',
                    width: '210'
                });
            }

            if (mobileGoogleBtnRef.current) {
                mobileGoogleBtnRef.current.innerHTML = '';
                window.google.accounts.id.renderButton(mobileGoogleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    width: '240'
                });
            }
        };

        if (window.google) {
            renderGoogleButtons();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client?hl=en';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButtons;
        document.body.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [loginWithGoogle, user]);

    const hasPrivate = user && (user.role === 'admin' || user.private_access);
    const displayName = (() => {
        const rawDisplay = String(user?.display_name ?? '').trim();
        const rawUser = String(user?.username ?? '').trim();
        if (rawDisplay && rawDisplay !== '0') return rawDisplay;
        if (rawUser && rawUser !== '0') return rawUser;
        return 'Member';
    })();

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
                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:text-cyan-200 hover:border-cyan-400/35 transition-colors"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {!user ? (
                            <div className="scale-[0.85] origin-right" ref={desktopGoogleBtnRef} />
                        ) : (
                            <button
                                onClick={async () => {
                                    await logout();
                                    if (window.google?.accounts?.id) window.google.accounts.id.cancel();
                                    window.location.assign('/');
                                }}
                                className="text-[10px] uppercase tracking-[0.18em] text-red-300/75 hover:text-red-200 transition-colors"
                            >
                                Sign Out
                            </button>
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
                                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </button>

                                <div className="mt-4 border-t border-white/10 pt-5">
                                    {!user ? (
                                        <div ref={mobileGoogleBtnRef} className="w-full" />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="text-xs uppercase tracking-[0.16em] text-slate-300">
                                                {displayName}
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
