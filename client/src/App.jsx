import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PageTitle from './components/PageTitle';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Tasks from './pages/Tasks';
import Videos from './pages/Videos';
import VMRental from './pages/VMRental';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <AuthProvider>
        <div className="flex min-h-screen text-white font-sans selection:bg-neon-cyan/30 bg-deep gap-0 md:gap-4 relative">
          <Navbar />
          <div className="flex-1 min-w-0 pt-16 md:pt-4 pr-4 pl-4 md:pl-0 transition-all duration-300">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/vm-rental" element={<VMRental />} />
                <Route path="/chat" element={<Chat />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
