import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await axios.get('/api/auth/me');
                    const userData = res.data;
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (err) {
                    console.error("Auth refresh failed:", err);
                    logout(); // Token might be invalid/expired
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('/api/auth/login', { username, password });
            const { token, role, username: dbUsername, avatar_id, avatar_version, display_name, avatar_url, private_access } = res.data;

            if (role?.toLowerCase() !== 'admin' && !private_access) {
                return { success: false, error: 'Private access is restricted.' };
            }

            const userData = { username: dbUsername, role, avatar_id, avatar_version, display_name, avatar_url, private_access };
            setUser(userData);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    };

    const loginWithGoogle = async (credential, options = {}) => {
        try {
            const res = await axios.post('/api/auth/google', { credential, requireAdmin: options.requireAdmin });
            const { token, role, username: dbUsername, avatar_id, avatar_version, display_name, avatar_url, private_access } = res.data;

            if (options.requireAdmin && role?.toLowerCase() !== 'admin' && !private_access) {
                return { success: false, error: 'Not authorized for private access.' };
            }

            const userData = { username: dbUsername, role, avatar_id, avatar_version, display_name, avatar_url, private_access };
            setUser(userData);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Google login failed' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateUser = (data) => {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
