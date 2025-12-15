import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', { username, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/20 rounded-full blur-[120px] animate-blob-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-pink/20 rounded-full blur-[120px] animate-blob-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="glass-panel p-10 w-full max-w-md relative z-10 mx-4 border-t border-white/20">
                <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-neon-pink via-white to-neon-purple bg-clip-text text-transparent drop-shadow-neon-pink">
                    New Recruit
                </h2>
                <p className="text-center text-slate-400 mb-8">Sign Up</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 z-10" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field pl-10 pt-3 pb-3 relative"
                                placeholder="Choose ID"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 z-10" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10 pt-3 pb-3 relative"
                                placeholder="Set Passcode"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary bg-gradient-to-r from-purple-500 to-pink-600">
                        Sign Up
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Log In</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
