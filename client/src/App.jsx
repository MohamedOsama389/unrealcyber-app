import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import TutorialTour from './components/TutorialTour';
import PartyOverlay from './components/PartyOverlay';
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
import Games from './pages/Games';
import GameViewPage from './pages/GameViewPage';
import AtomGame from './pages/AtomGame';
import HandsOn from './pages/HandsOn';
import AdminPanel from './pages/AdminPanel';
import clsx from 'clsx';

function AppContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);

  return (
    <div className={clsx(
      "flex min-h-screen bg-app text-primary font-sans selection:bg-cyan-500/30",
      language === 'ar' && "flex-row-reverse"
    )}>
      {!isAuthPage && <Navbar />}
      <div className={clsx(
        "flex-1 pt-16 md:pt-0 transition-all duration-300",
        !isAuthPage && (language === 'ar' ? "md:mr-72" : "md:ml-72"),
        language === 'ar' && "text-right"
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
            <Route path="/games" element={<Games />} />
            <Route path="/games/:gameId" element={<GameViewPage />} />
            <Route path="/games/atom-builder" element={<AtomGame />} />
            <Route path="/hands-on" element={<HandsOn />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </div>
      <TutorialTour />
      <PartyOverlay />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
