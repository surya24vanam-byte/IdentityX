import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutAlert, setLockoutAlert] = useState(null);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Read email from query params if passed from persona card
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
      if (emailParam.includes('admin')) {
        setPassword('Admin@123456');
      } else {
        setPassword('User@123456');
      }
    }

    if (params.get('session_expired')) {
      showToast('Your session has expired or was revoked. Please log in again.', 'warning');
    }
  }, [location, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLockoutAlert(null);
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.mfa_required) {
        showToast('Multi-Factor Authentication required. Enter the verification code.', 'info');
        navigate('/otp-verify', {
          state: {
            userId: result.user_id,
            email: result.email,
            demoOtp: result.demo_otp
          }
        });
        return;
      }

      showToast(`Welcome back, ${result.user.full_name}!`, 'success');
      if (result.user.roles && result.user.roles.includes('ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.details && err.details.locked) {
        setLockoutAlert(err.message);
      } else {
        showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (em, pw) => {
    setEmail(em);
    setPassword(pw);
    setLockoutAlert(null);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black font-mono tracking-wider text-slate-100">
            IDENTITY<span className="text-cyan-400">X</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100">
          Zero-Trust Authentication Portal
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter authorized credentials to request an access token
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="cyber-card p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-2xl">
          {/* Lockout Warning Banner */}
          {lockoutAlert && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-mono block uppercase">ACCOUNT LOCKOUT TRIGGERED</span>
                <p className="mt-1 leading-relaxed text-slate-300">{lockoutAlert}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Tip: Use the Admin account (<code className="text-rose-300 font-mono">admin@identityx.io</code>) to unlock this user.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="identity@identityx.io"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>VERIFYING CREDENTIALS...</span>
              ) : (
                <>
                  <span>AUTHENTICATE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill demo personas */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2.5 text-center font-semibold">
              PRE-CONFIGURED DEMO CREDENTIALS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => fillCredentials('admin@identityx.io', 'Admin@123456')}
                className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Admin (MFA)
                </div>
                <div className="text-[10px] text-slate-400 truncate">admin@identityx.io</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('alex.mercer@identityx.io', 'User@123456')}
                className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified (MFA)
                </div>
                <div className="text-[10px] text-slate-400 truncate">alex.mercer@identityx.io</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('sarah.connor@identityx.io', 'User@123456')}
                className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-left transition-all"
              >
                <div className="font-bold">Standard User</div>
                <div className="text-[10px] text-slate-400 truncate">sarah.connor@identityx.io</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('marcus.wright@identityx.io', 'User@123456')}
                className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-left transition-all"
              >
                <div className="font-bold text-amber-400">Locked Account</div>
                <div className="text-[10px] text-slate-400 truncate">marcus.wright@identityx.io</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an identity account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold font-mono">
              Register New Identity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
