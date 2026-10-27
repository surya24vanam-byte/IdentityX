import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, User as UserIcon, ShieldAlert, Cpu } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Sidebar Toggle */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800"
              aria-label="Toggle navigation"
            >
              <Cpu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-slate-100 font-mono flex items-center gap-1">
                IDENTITY<span className="text-cyan-400">X</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono -mt-1 tracking-widest uppercase">
                Zero-Trust Auth
              </span>
            </div>
          </Link>

          {/* System status pill */}
          <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENCRYPTED PROTOCOL ACTIVE</span>
          </div>
        </div>

        {/* User Status and Navigation */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  ADMIN PANEL
                </Link>
              )}

              <Link
                to="/profile"
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center font-bold text-xs font-mono">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 -mt-0.5">
                    {user.roles && user.roles[0] ? user.roles[0] : 'USER'}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors flex items-center gap-1.5"
                title="Sign out of active session"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono shadow-md shadow-cyan-500/20 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
