import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, Chrome } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { loginWithGoogle, login } = useAuth();
    const navigate = useNavigate();
    const googleBtnRef = useRef(null);
    const [googleReady, setGoogleReady] = useState(false);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const initGoogle = () => {
            if (!window.google || !googleBtnRef.current) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    const result = await loginWithGoogle(response.credential, { requireAdmin: true });
                    if (result.success) {
                        navigate('/private/dashboard');
                    } else {
                        setError(result.error);
                    }
                }
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: '100%'
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
    }, [loginWithGoogle, navigate]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const result = await login(username, password, { requireAdmin: true });
        setSubmitting(false);

        if (result.success) {
            navigate('/private/dashboard');
            return;
        }

        setError(result.error || 'Login failed');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-app relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="glass-panel p-8 w-full max-w-md relative z-10 mx-4">
                <div className="flex items-center justify-center mb-2 text-cyan-400">
                    <ShieldCheck size={24} className="mr-2" />
                    <h2 className="text-2xl font-bold">Private Admin Access</h2>
                </div>
                <p className="text-center text-secondary mb-8 text-sm">
                    Private console access supports Google or email login for allowlisted users.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Username or Email</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary opacity-60 z-10" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field pl-10 pt-3 pb-3 relative"
                                placeholder="Enter username"
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary opacity-60 z-10" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10 pt-3 pb-3 relative"
                                placeholder="Enter password"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                        {submitting ? 'Signing In...' : 'Sign In with Email'}
                    </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                    <span className="h-px bg-white/10 flex-1" />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-secondary">or</span>
                    <span className="h-px bg-white/10 flex-1" />
                </div>

                <div className="space-y-4">
                    <div ref={googleBtnRef} className="w-full" />
                    <p className="text-center text-xs text-secondary flex items-center justify-center gap-1.5">
                        <Chrome size={12} />
                        Sign in with Google
                    </p>
                    {!googleReady && (
                        <p className="text-xs text-secondary">
                            Google sign-in requires `VITE_GOOGLE_CLIENT_ID`.
                        </p>
                    )}
                    <p className="text-center text-xs text-secondary">
                        Contact the admin to be added to the allowlist.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
