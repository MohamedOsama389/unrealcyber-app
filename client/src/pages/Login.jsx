import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/20 rounded-full blur-[120px] animate-blob-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-pink/20 rounded-full blur-[120px] animate-blob-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="glass-panel p-10 w-full max-w-md relative z-10 mx-4 border-t border-white/20">
                <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-neon-cyan via-white to-neon-blue bg-clip-text text-transparent drop-shadow-neon">
                    Unreal Cyber
                </h2>
                <p className="text-center text-slate-400 mb-8">Welcome to login page</p>

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
                                placeholder="Enter ID"
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
                                placeholder="Enter Passcode"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary">
                        Log In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account? <Link to="/signup" className="text-cyan-400 hover:text-cyan-300">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
