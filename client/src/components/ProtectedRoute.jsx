import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/private/login" replace />;
    }

    const allowed = allowedRoles
        ? allowedRoles.map(r => r.toLowerCase())
        : null;

    if (allowed && !allowed.includes(user.role?.toLowerCase()) && !(allowed.includes('admin') && user.private_access)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
