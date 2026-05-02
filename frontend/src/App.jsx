import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './utils/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AlumniDirectoryPage = lazy(() => import('./pages/AlumniDirectoryPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MentorshipPage = lazy(() => import('./pages/MentorshipPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const ConnectionRequestsPage = lazy(() => import('./pages/ConnectionRequestsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Toaster position="top-right" />
              <Suspense fallback={<div className="p-10 text-center font-bold">GEC ALUMNI LOADING...</div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/directory" element={<AlumniDirectoryPage />} />
                  <Route path="/profile/:id" element={<PublicProfilePage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/mentorship" element={<ProtectedRoute><MentorshipPage /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute roles={['alumni', 'student']}><DashboardPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
                  <Route path="/messages/:userId?" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                  <Route path="/connections/requests" element={<ProtectedRoute><ConnectionRequestsPage /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
