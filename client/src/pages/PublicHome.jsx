import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Canvas } from '@react-three/fiber';
import ParticleMorph from '../ParticleMorph';
import ScrollSections from '../ScrollSections';

/**
 * PublicHome
 * Premium landing page featuring a scroll-driven 3D particle assembly effect.
 * The background is a fixed WebGL canvas with particles that morph into
 * thematic shapes (Router, Shield, Laptop) as the user scrolls.
 */
const PublicHome = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const { user, loginWithGoogle, logout } = useAuth();
    const googleBtnRef = useRef(null);
    const [googleReady, setGoogleReady] = useState(false);

    // Google Auth Initialization
    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || user) return;

        const initGoogle = () => {
            if (!window.google || !googleBtnRef.current) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    await loginWithGoogle(response.credential, { requireAdmin: false });
                }
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: '220'
            });
            setGoogleReady(true);
        };

        if (window.google) {
            initGoogle();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.body.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [loginWithGoogle, user]);

    return (
        <div className="min-h-screen bg-[#02040a] text-primary selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Fixed 3D Particle Background */}
            <div className="fixed inset-0 z-0 bg-[#02040a]">
                <Canvas camera={{ position: [0, 0, 15], fov: 35 }} dpr={[1, 2]}>
                    <color attach="background" args={['#02040a']} />
                    <fog attach="fog" args={['#02040a', 20, 40]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
                    <ParticleMorph scrollProgress={scrollProgress} />
                </Canvas>
                <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/40 via-transparent to-[#02040a]/60 pointer-events-none" />
            </div>

            {/* Header / Navbar */}
            <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <ShieldCheck size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-tight">UNREAL CYBER</p>
                            <p className="text-[10px] text-secondary uppercase tracking-[0.2em] opacity-60 font-semibold">Vision 2026</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="hidden lg:flex items-center gap-10 text-[10px] uppercase tracking-[0.4em] text-secondary font-bold">
                            <a href="#networking" className="hover:text-cyan-400 transition-colors">01. Networking</a>
                            <a href="#hacking" className="hover:text-purple-400 transition-colors">02. Hacking</a>
                            <a href="#programming" className="hover:text-blue-400 transition-colors">03. Code</a>
                        </nav>

                        <div className="h-6 w-[1px] bg-white/10 hidden lg:block" />

                        <div className="flex items-center gap-4">
                            {!user ? (
                                <div className="flex flex-col items-end">
                                    <div ref={googleBtnRef} />
                                    {!googleReady && (
                                        <span className="text-[8px] text-secondary/40 mt-1 uppercase tracking-widest font-bold">Initializing...</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600">
                                                {user.display_name?.[0] || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={logout} className="text-[9px] font-black text-red-400/80 hover:text-red-400 uppercase tracking-[0.2em] transition-colors">Sign Out</button>
                                </div>
                            )}

                            {user && (user.role === 'admin' || user.private_access) && (
                                <Link
                                    to="/private/dashboard"
                                    className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/5"
                                >
                                    Login to Lab <ArrowUpRight size={12} strokeWidth={3} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Scrollable Content Layers */}
            <main className="relative z-10">
                <ScrollSections onProgress={setScrollProgress} />
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 bg-[#02040a]/90 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <ShieldCheck size={24} className="text-cyan-400" />
                            <span className="text-sm font-black uppercase tracking-[0.5em]">Unreal Cyber Academy</span>
                        </div>
                        <p className="text-secondary text-[10px] max-w-sm leading-relaxed opacity-50 font-medium">
                            The elite training ground for the next generation of cybersecurity experts. Join the collective and master the digital frontier.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-12 text-[9px] uppercase tracking-[0.3em] font-black text-secondary/60">
                        <div className="flex flex-col gap-4">
                            <span className="text-primary/70 mb-2 underline decoration-cyan-500/50 underline-offset-8">Academy</span>
                            <a href="#" className="hover:text-cyan-400 transition-colors">Curriculum</a>
                            <a href="#" className="hover:text-cyan-400 transition-colors">Missions</a>
                            <a href="#" className="hover:text-cyan-400 transition-colors">Lab Access</a>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-primary/70 mb-2 underline decoration-purple-500/50 underline-offset-8">Resources</span>
                            <a href="#" className="hover:text-purple-400 transition-colors">Documentation</a>
                            <a href="#" className="hover:text-purple-400 transition-colors">Community</a>
                            <a href="#" className="hover:text-purple-400 transition-colors">Support</a>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[8px] uppercase tracking-[0.4em] text-secondary/30 font-bold">
                    <span>&copy; 2026 Unreal Cyber Collective. All Rights Reserved.</span>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>

            {/* Global Scroll Indicator */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-1000" style={{ opacity: scrollProgress > 0.95 ? 0 : 0.6 }}>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
                    <span className="text-[8px] uppercase tracking-[0.6em] text-cyan-400/80 animate-pulse font-black">Scroll to Assemble</span>
                </div>
            </div>
        </div>
    );
};

export default PublicHome;
