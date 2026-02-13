import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Lock, Play, Award, Github, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Progress() {
    const { user } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socials, setSocials] = useState(null);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                // Fetch all tracks + user progress + social links
                const [tracksRes, progressRes, publicRes] = await Promise.all([
                    axios.get('/api/tracks'),
                    user ? axios.get('/api/tracks/progress/user') : Promise.resolve({ data: [] }),
                    axios.get('/api/public')
                ]);

                const userProgress = progressRes.data; // array of { step_id, status }

                // Merge
                // For now, let's just show the tracks themselves as the "Path"
                // Detailed steps would be inside the track page, but user asked for "Progress" page
                setTracks(tracksRes.data);

                // Set social links if they exist
                if (publicRes.data?.socials) {
                    setSocials(publicRes.data.socials);
                }
            } catch (err) {
                console.error("Failed to load progress:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTracks();
    }, [user]);

    return (
        <div className="min-h-screen bg-[#0d1526] text-white p-6 pt-24">
            <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase hover:text-cyan-400">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                <div className="absolute left-1/2 -translate-x-1/2 text-xl font-black uppercase tracking-tighter text-cyan-500">My Progress</div>
                <div className="flex items-center gap-4">
                    {socials?.github && (
                        <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 transition-colors">
                            <Github size={18} />
                        </a>
                    )}
                    {socials?.linkedin && (
                        <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 transition-colors">
                            <Linkedin size={18} />
                        </a>
                    )}
                    {socials?.twitter && (
                        <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 transition-colors">
                            <Twitter size={18} />
                        </a>
                    )}
                </div>
            </header>

            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Your Journey</h1>
                    <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                        Track your path through the Cyber Academy. Complete missions, unlock badges, and master the grid.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-cyan-500 font-mono">LOADING LINK...</div>
                ) : (
                    <div className="relative border-l-2 border-white/10 ml-6 md:ml-10 space-y-12 pb-20">
                        {tracks.map((track, idx) => (
                            <div key={track.id} className="relative pl-8 md:pl-12 group">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'bg-[#0d1526] border-white/20'}`} />

                                <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group-hover:-translate-y-1 duration-500">
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-2xl font-black uppercase tracking-tight">{track.title}</h3>
                                                {/* Mock Badge */}
                                                <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-secondary border border-white/10">
                                                    Level 1
                                                </div>
                                            </div>
                                            <p className="text-secondary/60 text-sm leading-relaxed max-w-xl">{track.description || "Begin your training."}</p>
                                        </div>

                                        <Link to={`/tracks/${track.id}`} className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                                            <Play size={14} fill="currentColor" /> Resume
                                        </Link>
                                    </div>

                                    {/* Mini Step Progress Bar */}
                                    <div className="mt-6 flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 w-[10%]" /> {/* Mock Progress */}
                                        <div className="h-full bg-transparent w-full" />
                                    </div>
                                    <div className="mt-2 text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest text-right">
                                        10% Complete
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
