import React from 'react';
import AdminDashboard from '@/components/auth/AdminDashboard';
import { useAuth } from '@/hooks';
import { Navigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <AdminDashboard />;
};

export default AdminPage;
