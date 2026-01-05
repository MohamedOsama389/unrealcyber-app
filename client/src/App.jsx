import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PageTitle from './components/PageTitle';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Tasks from './pages/Tasks';
import Videos from './pages/Videos';
import Files from './pages/Files';
import VMRental from './pages/VMRental';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';
import clsx from 'clsx';

function AppContent() {
  const { user } = useAuth();
  const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      {!isAuthPage && <Navbar />}
      <div className={clsx(
        "flex-1 pt-16 md:pt-0 transition-all duration-300",
        !isAuthPage && "md:ml-72"
      )}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/files" element={<Files />} />
            <Route path="/vm-rental" element={<VMRental />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
