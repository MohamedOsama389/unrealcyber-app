import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

const PublicLogin = () => {
    const [error, setError] = useState('');
    const { loginWithGoogle, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const googleBtnRef = useRef(null);
    const [googleReady, setGoogleReady] = useState(false);

    // Where to go after login — default to the page that redirected here
    const from = location.state?.from || '/progress';

    // If already logged in, redirect immediately
    useEffect(() => {
        if (user) navigate(from, { replace: true });
    }, [user, navigate, from]);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const initGoogle = () => {
            if (!window.google || !googleBtnRef.current) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    const result = await loginWithGoogle(response.credential, { requireAdmin: false });
                    if (result.success) {
                        navigate(from, { replace: true });
                    } else {
                        setError(result.error || 'Login failed. Please try again.');
                    }
                }
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: '320'
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

        return () => { script.onload = null; };
    }, [loginWithGoogle, navigate, from]);

    return (
        <div className="min-h-screen bg-[#0d1526] text-white">
            <PublicNavbar />

            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/[0.06] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-500/[0.06] rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="glass-card p-10">
                        {/* Header */}
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <LogIn size={20} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-center mt-3">
                            Sign In to Continue
                        </h2>
                        <p className="text-center text-white/40 text-sm mt-2 mb-8">
                            Access your progress, tracking, and profile by signing in with Google.
                        </p>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Google Sign-In Button */}
                        <div className="flex justify-center">
                            <div ref={googleBtnRef} />
                        </div>

                        {!googleReady && (
                            <p className="text-[11px] text-white/30 text-center mt-4">
                                Loading Google sign-in...
                            </p>
                        )}

                        {/* Divider */}
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors font-medium uppercase tracking-wider"
                            >
                                <ArrowLeft size={12} />
                                Back to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicLogin;
