import { useEffect, useRef, useState, Component, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight, Play, Activity, LogOut, Network, Shield, Code2, Send, Twitter, Linkedin, Youtube, MessageSquare, Instagram, Music, Facebook, ChevronDown, Map, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Canvas } from '@react-three/fiber';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ParticleMorph from '../ParticleMorph';
import ScrollSections from '../ScrollSections';
import { getVideoThumbnailUrl, DEFAULT_PUBLIC_CONTENT } from '../data/publicSite';

gsap.registerPlugin(ScrollTrigger);

class CanvasErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

class GlobalErrorBoundary extends Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'white', color: 'red', padding: '20px', overflow: 'auto', fontFamily: 'monospace' }}>
                    <h1>Application Error</h1>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * PublicHome
 * Premium landing page featuring a scroll-driven 3D particle assembly effect.
 * The background is a fixed WebGL canvas with particles that morph into
 * thematic shapes (Router, Shield, Laptop) as the user scrolls.
 */
const PublicHome = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [sectionsProgress, setSectionsProgress] = useState(-1); // -1 means not in sections area
    const { user, loginWithGoogle, logout } = useAuth();
    const googleBtnRef = useRef(null);
    const footerRef = useRef(null);
    const sectionsContainerRef = useRef(null);
    const [googleReady, setGoogleReady] = useState(false);

    // Initialize with default content to render immediately (prevents blank screen)
    const [publicContent, setPublicContent] = useState(DEFAULT_PUBLIC_CONTENT);
    const [featured, setFeatured] = useState(null);

    const extractDriveId = (raw) => {
        if (!raw) return null;
        if (!raw.startsWith('http')) return raw;
        try {
            const url = new URL(raw);
            return url.searchParams.get('id') || url.pathname.match(/\/(?:file\/d|folders|d)\/([^/]+)/)?.[1] || raw;
        } catch {
            return raw;
        }
    };

    // Dynamic Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pubRes, featRes] = await Promise.all([
                    axios.get('/api/public'),
                    axios.get('/api/public/featured')
                ]);
                if (pubRes.data) setPublicContent(pubRes.data);
                if (featRes.data) setFeatured(featRes.data);
            } catch (err) {
                console.error('[PublicHome] Failed to fetch layout data:', err);
                // Keep default content on error
            }
        };
        fetchData();
    }, []);

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
        script.src = 'https://accounts.google.com/gsi/client?hl=en';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.body.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [loginWithGoogle, user]);

    const scrollToAbout = (event) => {
        event.preventDefault();
        if (!footerRef.current) return;
        const top = footerRef.current.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };

    useEffect(() => {
        // Global Scroll Tracking for Ambient Waves
        const globalTrigger = ScrollTrigger.create({
            trigger: document.documentElement,
            start: 0,
            end: "bottom bottom",
            onUpdate: (self) => {
                // setScrollProgress(self.progress);
                // Wait, the previous code triggered re-renders every frame? 
                // That might be intentional for the morph. 
                setScrollProgress(self.progress);
            }
        });

        // Specific Sections Tracking for Assembly
        let sectionsTrigger;
        if (sectionsContainerRef.current) {
            sectionsTrigger = ScrollTrigger.create({
                trigger: sectionsContainerRef.current,
                start: "top bottom", // Start when sections container enters bottom of screen
                end: "bottom top",    // End when sections container leaves top of screen
                onUpdate: (self) => {
                    setSectionsProgress(self.progress);
                },
                onToggle: (self) => {
                    if (!self.isActive) setSectionsProgress(-1);
                }
            });
        }

        ScrollTrigger.refresh();

        return () => {
            globalTrigger.kill();
            if (sectionsTrigger) sectionsTrigger.kill();
        };
    }, [publicContent]);

    const heroTiles = [
        {
            id: 'networking',
            label: 'Network',
            subtitle: 'Routing / Switching',
            Icon: Network,
            cardClass: 'border-cyan-400/20 hover:border-cyan-300/45 hover:shadow-[0_14px_30px_rgba(34,211,238,0.14)]',
            iconClass: 'text-cyan-300 bg-cyan-400/12 border-cyan-300/30',
            dotClass: 'bg-cyan-300/70'
        },
        {
            id: 'ethical-hacking',
            label: 'Ethical Hacking',
            subtitle: 'Security / Defense',
            Icon: Shield,
            cardClass: 'border-fuchsia-400/20 hover:border-fuchsia-300/45 hover:shadow-[0_14px_30px_rgba(217,70,239,0.14)]',
            iconClass: 'text-fuchsia-300 bg-fuchsia-400/12 border-fuchsia-300/30',
            dotClass: 'bg-fuchsia-300/70'
        },
        {
            id: 'programming',
            label: 'Programming',
            subtitle: 'Python / JS / TS',
            Icon: Code2,
            cardClass: 'border-blue-400/20 hover:border-blue-300/45 hover:shadow-[0_14px_30px_rgba(96,165,250,0.14)]',
            iconClass: 'text-blue-300 bg-blue-400/12 border-blue-300/30',
            dotClass: 'bg-blue-300/70'
        }
    ];

    return (
        <GlobalErrorBoundary>
            <div className="min-h-screen bg-[#0d1526] text-primary selection:bg-cyan-500/30 overflow-x-hidden">
                {/* Fixed 3D Particle Background */}
                <CanvasErrorBoundary>
                    <div className="fixed inset-0 z-0 bg-[#0d1526]">
                        <Canvas camera={{ position: [0, 0, 15], fov: 35 }} dpr={[1, 2]}>
                            <color attach="background" args={['#0d1526']} />
                            <fog attach="fog" args={['#0d1526', 20, 45]} />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
                            <Suspense fallback={null}>
                                <ParticleMorph
                                    scrollProgress={scrollProgress}
                                    sectionsProgress={sectionsProgress}
                                    sectionCount={publicContent?.sections?.length || 3}
                                />
                            </Suspense>
                        </Canvas>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1526]/30 via-transparent to-[#0d1526]/70 pointer-events-none" />
                    </div>
                </CanvasErrorBoundary>

                {/* Warm ambient glow blobs to break monotone blue */}
                <div className="fixed inset-0 z-[1] pointer-events-none">
                    <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
                    <div className="absolute bottom-[15%] left-[5%] w-[400px] h-[400px] rounded-full bg-amber-500/[0.03] blur-[100px]" />
                    <div className="absolute top-[60%] right-[30%] w-[300px] h-[300px] rounded-full bg-cyan-400/[0.03] blur-[80px]" />
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
                            <nav className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">
                                {/* Tracks Dropdown */}
                                <div className="relative group">
                                    <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-2">
                                        TRACKS <ChevronDown size={12} />
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a101f] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                                        <a href="#networking" className="block px-4 py-3 hover:bg-white/5 hover:text-cyan-400 transition-colors">Network</a>
                                        <a href="#ethical-hacking" className="block px-4 py-3 hover:bg-white/5 hover:text-purple-400 transition-colors">Ethical Hacking</a>
                                        <a href="#programming" className="block px-4 py-3 hover:bg-white/5 hover:text-blue-400 transition-colors">Programming</a>
                                    </div>
                                </div>

                                <Link to="/progress" className="hover:text-cyan-400 transition-colors">Progress</Link>
                                <Link to="/profile" className="hover:text-cyan-400 transition-colors">Profile</Link>
                                <button type="button" onClick={scrollToAbout} className="hover:text-cyan-400 transition-colors">ABOUT</button>
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
                                        <button onClick={logout} className="inline-flex items-center gap-2 text-[9px] font-black text-red-400/80 hover:text-red-400 uppercase tracking-[0.2em] transition-colors">
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-red-400/40 bg-red-400/10">
                                                <LogOut size={10} />
                                            </span>
                                            <span>Sign Out</span>
                                        </button>
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

                {/* HERO SECTION - REDESIGNED */}
                <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 pt-32 lg:pt-36 pb-20">
                    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.14fr_0.86fr] gap-10 lg:gap-14 xl:gap-16 items-start">
                        {/* Left Column: Academy Branding */}
                        <div className="space-y-10 relative z-20 lg:pr-4">
                            <div className="space-y-6">
                                <h1 className="text-[clamp(2.75rem,8.5vw,6.8rem)] font-black tracking-tighter uppercase leading-[0.85] text-white max-w-[15ch]">
                                    Unreal<span className="text-cyan-500 underline decoration-cyan-500/20 underline-offset-8">Cyber</span><br />
                                    Academy
                                </h1>
                                <p className="text-lg md:text-xl text-slate-300 max-w-xl font-medium leading-relaxed">
                                    {publicContent?.hero?.subtitle || 'Master the digital frontier. Professional training in networking, hacking, and modern engineering.'}
                                </p>
                            </div>

                            {/* Navigation Blocks */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 max-w-3xl">
                                {heroTiles.map((tile) => (
                                    <a
                                        key={tile.id}
                                        href={`#${tile.id}`}
                                        className={`group relative overflow-hidden rounded-[1.75rem] border ${tile.cardClass} bg-[radial-gradient(circle_at_18%_-10%,rgba(255,255,255,0.08),transparent_45%),linear-gradient(165deg,rgba(12,21,45,0.92),rgba(5,10,25,0.92))] px-5 py-5 min-h-[138px] transition-all duration-500 hover:-translate-y-1`}
                                    >
                                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(130deg,transparent_10%,rgba(255,255,255,0.08)_45%,transparent_80%)]" />
                                        <span className={`absolute right-4 top-4 w-1.5 h-1.5 rounded-full ${tile.dotClass}`} />
                                        <div className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${tile.iconClass}`}>
                                            <tile.Icon size={17} />
                                        </div>
                                        <div className="relative mt-8 space-y-1">
                                            <p className="text-[12px] font-black uppercase tracking-[0.28em] text-white/90">{tile.label}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-secondary/55">{tile.subtitle}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Featured Video (Redesigned - Prominent) */}
                        <div className="relative w-full lg:pt-4 xl:pt-6">
                            {(publicContent?.hero?.heroVideoLink || featured?.featuredVideo) ? (
                                <div className="space-y-6 lg:ml-auto max-w-[56rem]">
                                    <div className="group relative glass-panel p-2 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-cyan-500/10 transform hover:scale-[1.02] transition-all duration-700 hover:shadow-cyan-500/30">
                                        <a
                                            href={publicContent?.hero?.heroVideoLink || (featured?.featuredVideo?.drive_link ? featured.featuredVideo.drive_link : '#')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block aspect-video rounded-[2.2rem] overflow-hidden bg-slate-900 border border-white/10 relative"
                                        >
                                            <img
                                                src={(publicContent?.hero?.heroVideoLink && getVideoThumbnailUrl(publicContent.hero.heroVideoLink))
                                                    ? getVideoThumbnailUrl(publicContent.hero.heroVideoLink)
                                                    : (featured?.featuredVideo ? `/api/public/thumbnail/${featured.featuredVideo.drive_link ? extractDriveId(featured.featuredVideo.drive_link) : featured.featuredVideo.id}` : '')
                                                }
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                                alt=""
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                <div className="w-24 h-24 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500 group-hover:shadow-cyan-500/60 backdrop-blur-sm">
                                                    <Play size={32} fill="currentColor" />
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    {/* Minimal Video Title underneath if needed, or keeping it clean as per 'removing extraneous text' */}
                                    {/* Leaving completely clean to match 'ensuring the thumbnail fills its container' focus */}
                                </div>
                            ) : (
                                <div className="glass-panel p-16 rounded-[2.5rem] text-center border-dashed border-2 border-white/5 space-y-6 max-w-[40rem] lg:ml-auto">
                                    <Activity className="mx-auto text-cyan-500/20 animate-pulse" size={64} />
                                    <p className="text-secondary/40 uppercase tracking-widest text-[10px] font-black">Syncing Unreal Collective Data...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Scrollable Content Layers */}
                <main ref={sectionsContainerRef} className="relative z-10">
                    <ScrollSections sections={publicContent?.sections} />
                </main>

                {/* Footer */}
                <footer id="about-section" ref={footerRef} className="relative z-10 border-t border-white/5 bg-[#02040a]/90 backdrop-blur-2xl">
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

                        <div className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tight">Connect</h3>
                            <div className="flex flex-wrap justify-end gap-3">
                                {publicContent?.socials?.youtube && (
                                    <a href={publicContent.socials.youtube} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all" title="YouTube">
                                        <Youtube size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.telegram && (
                                    <a href={publicContent.socials.telegram} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all" title="Telegram">
                                        <Send size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.discord && (
                                    <a href={publicContent.socials.discord} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all" title="Discord">
                                        <MessageSquare size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.instagram && (
                                    <a href={publicContent.socials.instagram} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-all" title="Instagram">
                                        <Instagram size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.tiktok && (
                                    <a href={publicContent.socials.tiktok} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all" title="TikTok">
                                        <Music size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.facebook && (
                                    <a href={publicContent.socials.facebook} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 hover:bg-blue-600/20 transition-all" title="Facebook">
                                        <Facebook size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.twitter && (
                                    <a href={publicContent.socials.twitter} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 hover:bg-blue-400/20 transition-all" title="X (Twitter)">
                                        <Twitter size={16} />
                                    </a>
                                )}
                                {publicContent?.socials?.linkedin && (
                                    <a href={publicContent.socials.linkedin} target="_blank" rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-blue-700/10 border border-blue-700/20 text-blue-700 hover:bg-blue-700/20 transition-all" title="LinkedIn">
                                        <Linkedin size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                        {publicContent?.socialLinks?.filter((link) => link.url).map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                                title={link.platform}
                            >
                                <span className="text-secondary group-hover:text-white uppercase text-[10px] font-black tracking-widest">{link.platform}</span>
                            </a>
                        ))}
                    </div>

                    <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[8px] uppercase tracking-[0.4em] text-secondary/30 font-bold">
                        <span>&copy; 2026 Unreal Cyber Collective. All Rights Reserved.</span>
                        <div className="flex gap-8">
                            {/* Policy links removed as per request */}
                        </div>
                    </div>
                </footer>
            </div >
        </GlobalErrorBoundary >
    );
};

export default PublicHome;
