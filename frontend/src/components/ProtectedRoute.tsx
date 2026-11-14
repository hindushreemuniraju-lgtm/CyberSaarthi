import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserMode } from '../types';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserMode[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, token, loading, logout } = useAuth();
  const location = useLocation();
  const [denied, setDenied] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120726] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-amber-300">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  const currentRole = (user.role || user.user_mode || '').toLowerCase() as UserMode;
  const userRoles = (user.roles || []).map(r => r.toLowerCase());
  const isAuthorized = allowedRoles.some(
    role => role.toLowerCase() === currentRole || userRoles.includes(role.toLowerCase())
  );

  if (!isAuthorized) {
    const userAuthorizedPath = `/${currentRole}`;
    return (
      <div className="min-h-screen bg-[#14082c] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1e0a3d] border border-rose-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-rose-950/50">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Access Denied (403 Forbidden)</h2>
            <p className="text-xs text-rose-300 leading-relaxed font-medium">
              You are signed in as <strong className="text-white capitalize">{user.full_name} ({currentRole.toUpperCase()})</strong>.
              Your account does not have permission to access the <strong className="text-amber-300 capitalize">{allowedRoles.join(', ')}</strong> dashboard.
            </p>
          </div>

          <div className="p-3 bg-purple-950/60 rounded-xl border border-purple-800 text-[11px] text-purple-300 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>RDBMS Role-Based Access Control</span>
            </div>
            <p>Direct URL tampering between different persona dashboards is prevented by the CyberSaarthi security engine.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => logout()}
              className="flex-1 py-2.5 px-3 rounded-xl border border-purple-700 hover:bg-purple-900/40 text-purple-200 text-xs font-bold transition-all"
            >
              Sign Out
            </button>
            <a
              href={userAuthorizedPath}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1 shadow"
            >
              <span>My Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
