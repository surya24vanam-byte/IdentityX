import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  FileCheck2,
  Lock,
  History,
  MonitorSmartphone,
  ShieldAlert,
  Users,
  ShieldCheck,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, hasPermission } = useAuth();

  const userNavItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/profile', label: 'Identity Profile', icon: User },
    { to: '/credentials', label: 'Digital Credentials', icon: Award },
    { to: '/verification', label: 'Verification Workflow', icon: FileCheck2 },
    { to: '/security', label: 'MFA & Security', icon: Lock },
    { to: '/login-history', label: 'Login History', icon: History },
    { to: '/sessions', label: 'Active Sessions', icon: MonitorSmartphone },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Security Center', icon: ShieldAlert, perm: 'VIEW_SECURITY_LOGS' },
    { to: '/admin/users', label: 'User Directory', icon: Users, perm: 'MANAGE_USERS' },
    { to: '/admin/roles', label: 'RBAC Policy & Roles', icon: ShieldCheck, perm: 'MANAGE_ROLES' },
    { to: '/admin/verifications', label: 'Review Proofs', icon: FileCheck2, perm: 'REVIEW_VERIFICATIONS' },
    { to: '/admin/security-logs', label: 'Audit Logs', icon: FileText, perm: 'VIEW_SECURITY_LOGS' },
    { to: '/admin/suspicious-events', label: 'Suspicious Alerts', icon: AlertTriangle, perm: 'VIEW_SECURITY_LOGS' },
  ];

  const canAccessAdmin = isAdmin || adminNavItems.some(item => hasPermission(item.perm));

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
      isActive
        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-slate-950/95 lg:bg-slate-950/60 backdrop-blur-md flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-800">
          <span className="font-mono text-xs font-bold text-slate-300">NAVIGATION MENU</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* User Navigation */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Identity & Access
            </div>
            <nav className="space-y-1">
              {userNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => onClose && onClose()}
                    className={linkClass}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          {canAccessAdmin && (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                  Administration
                </span>
                <span className="text-[9px] font-mono bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/20">
                  SEC-OPS
                </span>
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  if (!isAdmin && !hasPermission(item.perm)) return null;
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose && onClose()}
                      className={linkClass}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card in Sidebar Footer */}
        {user && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
