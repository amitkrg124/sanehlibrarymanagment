import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useAppStore } from './store';
import { isSupabaseConfigured } from './lib/supabase';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SeatsPage from './pages/SeatsPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import AttendancePage from './pages/AttendancePage';
import FeesPage from './pages/FeesPage';
import EnquiriesPage from './pages/EnquiriesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initCloudSync = useAppStore((s) => s.initCloudSync);

  // Trigger Supabase Cloud Sync if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      initCloudSync();
    }
  }, [initCloudSync]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
          },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/seats" element={<ProtectedRoute><SeatsPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute><FeesPage /></ProtectedRoute>} />
        <Route path="/enquiries" element={<ProtectedRoute><EnquiriesPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
