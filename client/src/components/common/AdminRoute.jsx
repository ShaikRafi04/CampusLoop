import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('Access restricted to platform administrators.');
    }
  }, [loading, user, isAdmin, toast]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
