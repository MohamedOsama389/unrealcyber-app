import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PublicHome from './pages/PublicHome';
import PublicSection from './pages/PublicSection';
import PublicVideo from './pages/PublicVideo';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import clsx from 'clsx';
import ParticleIconsPage from './ParticleIconsPage';
import BuilderPage from './pages/BuilderPage';

function AppContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const path = location.pathname;
  const isPrivateRoute = path.startsWith('/private');
  const isAuthPage = ['/private/login', '/private/signup'].includes(path);
  const showPrivateShell = isPrivateRoute && !isAuthPage;

  return (
    <div className={clsx(
      "flex min-h-screen bg-app text-primary font-sans selection:bg-cyan-500/30",
      language === 'ar' && "flex-row-reverse"
    )}>
      {showPrivateShell && <Navbar />}
      <div className={clsx(
        "flex-1 pt-16 md:pt-0 transition-all duration-300",
        showPrivateShell && (language === 'ar' ? "md:mr-72" : "md:ml-72"),
        language === 'ar' && "text-right"
      )}>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/vision/:sectionKey" element={<PublicSection />} />
          <Route path="/vision/:sectionKey/:videoSlug" element={<PublicVideo />} />
          <Route path="/private/login" element={<Login />} />
          <Route path="/private/signup" element={<Signup />} />
          <Route path="/particle-icons" element={<ParticleIconsPage />} />

          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<ProtectedRoute allowedRoles={['admin', 'student']} />}>
            <Route path="/private" element={<Navigate to="/private/dashboard" replace />} />
            <Route path="/private/dashboard" element={<Dashboard />} />
            <Route path="/private/b/*" element={<BuilderPage />} />
            <Route path="/private/admin" element={<AdminPanel />} />
            <Route path="/private/tasks" element={<Tasks />} />
            <Route path="/private/videos" element={<Videos />} />
            <Route path="/private/files" element={<Files />} />
            <Route path="/private/vm-rental" element={<VMRental />} />
            <Route path="/private/chat" element={<Chat />} />
            <Route path="/private/games" element={<Games />} />
            <Route path="/private/games/:gameId" element={<GameViewPage />} />
            <Route path="/private/games/atom-builder" element={<AtomGame />} />
            <Route path="/private/hands-on" element={<HandsOn />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showPrivateShell && <TutorialTour />}
      {showPrivateShell && <PartyOverlay />}
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
