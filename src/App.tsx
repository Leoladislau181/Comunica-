import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Admin from './components/Admin';

const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center text-2xl font-bold">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center text-2xl font-bold">Carregando...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
