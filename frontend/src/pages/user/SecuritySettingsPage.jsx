import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SecuritySettingsPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

  const [demoOtp, setDemoOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleStartEnableMfa = async () => {
    setLoading(true);
    try {
      const res = await api.post('/users/mfa/enable-request');
      if (res.data?.demo_otp) {
        setDemoOtp(res.data.demo_otp);
        setOtpInput(res.data.demo_otp);
      }
      setIsEnableModalOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to initiate MFA activation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnableMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/users/mfa/confirm-enable', { otp_code: otpInput.trim() });
      showToast(res.message || 'MFA successfully enabled!', 'success');
      setIsEnableModalOpen(false);
      setOtpInput('');
      await refreshUser();
    } catch (err) {
      showToast(err.message || 'OTP verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/users/mfa/disable', { password: disablePassword });
      showToast(res.message || 'MFA disabled.', 'success');
      setIsDisableModalOpen(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err) {
      showToast(err.message || 'Failed to disable MFA. Check password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
          <Lock className="w-6 h-6 text-cyan-400" />
          <span>Multi-Factor Authentication & Security Policies</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage identity factors, time-based OTP protection, and active defense parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MFA Management Card */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold font-mono text-slate-100">
                Multi-Factor Authentication (OTP)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Requires entering a temporary 6-digit code on every login attempt
              </p>
            </div>
            <Badge
              status={user?.mfa_enabled ? 'ACTIVE' : 'REVOKED'}
              label={user?.mfa_enabled ? 'ENABLED' : 'DISABLED'}
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-100 block mb-1">
                  How MFA Works in IdentityX
                </span>
                When enabled, after entering your password, our server generates a single-use 6-digit cryptographic token that expires in 5 minutes. The plain code is never stored in the database—only its SHA-256 hash is evaluated upon verification.
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {user?.mfa_enabled ? (
                <button
                  onClick={() => setIsDisableModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                >
                  DEACTIVATE MFA
                </button>
              ) : (
                <button
                  onClick={handleStartEnableMfa}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
                >
                  ACTIVATE MFA (+30 PTS SCORE)
                </button>
              )}
            </div>
          </div>

          {/* Active Security Rules */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Active Security Defense Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="font-bold text-slate-200 block font-mono text-[11px] mb-1">
                  Brute-Force Account Lockout
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Accounts are temporarily locked after <strong>5 consecutive failed passwords</strong> to thwart dictionary and brute-force attacks.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="font-bold text-slate-200 block font-mono text-[11px] mb-1">
                  Lockout Duration Window
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Temporary lockouts automatically expire after <strong>15 minutes</strong>, or immediately upon manual unlock by an Administrator.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="font-bold text-slate-200 block font-mono text-[11px] mb-1">
                  Token Expiration Policy
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  OTP codes expire strictly within <strong>5 minutes</strong>. Password recovery tokens expire in <strong>15 minutes</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="font-bold text-slate-200 block font-mono text-[11px] mb-1">
                  Zero-Knowledge Password Storage
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  All passwords are cryptographically hashed using <strong>scrypt with individual salt</strong>. Plaintext is never persisted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Summary Card */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
            Posture Analysis
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Security Grade</span>
              <Badge status={user?.security_posture?.grade || 'MODERATE'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Score Rating</span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {user?.security_posture?.score || 0} / 100
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              Optimization Steps
            </span>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user?.mfa_enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span>Multi-Factor OTP Active</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user?.verification_status === 'APPROVED' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span>Identity Verification Approved</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user?.failed_login_attempts === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span>Zero Failed Attempts Pending</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enable MFA Confirmation Modal */}
      <Modal
        isOpen={isEnableModalOpen}
        onClose={() => setIsEnableModalOpen(false)}
        title="Activate Multi-Factor Authentication"
      >
        <form onSubmit={handleConfirmEnableMfa} className="space-y-4">
          {demoOtp && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs">
              <div className="flex items-center justify-between font-mono font-bold mb-1">
                <span>SIMULATED VERIFICATION OTP</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">5 MIN EXPIRY</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 font-mono text-cyan-400 text-lg font-bold">
                <span>{demoOtp}</span>
                <button
                  type="button"
                  onClick={() => setOtpInput(demoOtp)}
                  className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                >
                  Fill Code
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5 text-center">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="cyber-input w-full py-2.5 text-center font-mono font-bold text-xl tracking-[0.3em] rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEnableModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otpInput.length !== 6}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {loading ? 'VERIFYING...' : 'CONFIRM & ENABLE MFA'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Disable MFA Modal */}
      <Modal
        isOpen={isDisableModalOpen}
        onClose={() => setIsDisableModalOpen(false)}
        title="Deactivate Multi-Factor Authentication"
      >
        <form onSubmit={handleDisableMfa} className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Disabling MFA lowers your security score by 30 points and makes your account more vulnerable to credential reuse attacks. Confirm your password to proceed.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Confirm Current Password
            </label>
            <input
              type="password"
              required
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Enter password"
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDisableModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !disablePassword}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-50"
            >
              {loading ? 'VERIFYING...' : 'DEACTIVATE MFA'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
