import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './utils/ProtectedRoute';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AlumniDirectoryPage = lazy(() => import('./pages/AlumniDirectoryPage'));
const AlumniProfilePage = lazy(() => import('./pages/AlumniProfilePage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MentorshipPage = lazy(() => import('./pages/MentorshipPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const ConnectionRequestsPage = lazy(() => import('./pages/ConnectionRequestsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

import Loader from './components/Loader';

const MainContent = () => {
  const { loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/directory" element={<AlumniDirectoryPage />} />
        <Route path="/profile/:id" element={<PublicProfilePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/mentorship" element={
          <ProtectedRoute><MentorshipPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['alumni', 'student']}><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>
        } />
        <Route path="/messages/:userId?" element={
          <ProtectedRoute><MessagesPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute><EditProfilePage /></ProtectedRoute>
        } />
        <Route path="/connections/requests" element={
          <ProtectedRoute><ConnectionRequestsPage /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: '500' },
                success: { iconTheme: { primary: '#003366', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
              }}
            />
            <MainContent />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
