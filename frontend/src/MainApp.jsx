import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Loader from './components/Loader';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AlumniDirectoryPage = lazy(() => import('./pages/AlumniDirectoryPage'));
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

const MainApp = () => {
  const { loading } = useAuth();

  // We only show the loader during the initial load, 
  // but we don't return null if it fails.
  return (
    <Suspense fallback={<Loader />}>
      {loading && <Loader />}
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
  );
};

export default MainApp;
