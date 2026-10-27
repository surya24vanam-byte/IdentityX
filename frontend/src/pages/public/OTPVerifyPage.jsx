import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { Shield, KeyRound, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OTPVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeMfaLogin } = useAuth();
  const { showToast } = useToast();

  const state = location.state || {};
  const userId = state.userId;
  const email = state.email || 'your registered account';
  const [demoOtp, setDemoOtp] = useState(state.demoOtp || null);

  const [otpCode, setOtpCode] = useState(state.demoOtp || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4">
        <div className="cyber-card p-6 rounded-2xl max-w-md text-center border border-slate-800">
          <p className="text-sm text-slate-300 mb-4">
            No active Multi-Factor verification session found.
          </p>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono text-xs font-bold inline-block"
          >
            RETURN TO SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const user = await completeMfaLogin(userId, otpCode.trim());
      showToast('Two-Factor Authentication verified successfully!', 'success');
      if (user.roles && user.roles.includes('ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'OTP verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await api.post('/auth/send-otp', { user_id: userId });
      if (res.data?.demo_otp) {
        setDemoOtp(res.data.demo_otp);
        setOtpCode(res.data.demo_otp);
      }
      showToast('A new OTP has been generated.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/20 mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100">
          Multi-Factor Verification
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          A one-time verification token was dispatched for <span className="text-cyan-400 font-mono">{email}</span>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="cyber-card p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-2xl">
          {/* Demo Simulated Token Display */}
          {demoOtp && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> DEMO DISPATCH SIMULATOR
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  EXPIRES IN 5 MIN
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-3">
                In production, this code is routed via SMS / SMTP. In demo mode, your OTP is:
              </p>
              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xl font-mono font-black tracking-widest text-cyan-400">
                  {demoOtp}
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtp)}
                  className="px-3 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-semibold transition-colors"
                >
                  Auto-Fill
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-2 text-center">
                6-Digit One-Time Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="cyber-input w-full py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] rounded-xl focus:outline-none"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>VALIDATING OTP...</span>
              ) : (
                <>
                  <span>CONFIRM & PROCEED</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>Resend Token</span>
            </button>

            <Link
              to="/login"
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
