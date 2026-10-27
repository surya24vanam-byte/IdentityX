import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { User, Mail, Phone, Calendar, ShieldCheck, Edit3, Key, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/profile', {
        full_name: fullName.trim(),
        phone: phone.trim()
      });
      showToast('Identity profile updated successfully.', 'success');
      await refreshUser();
      setIsEditOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Digital Identity Profile</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative attributes and role-based policy assignment for your account
          </p>
        </div>

        <button
          onClick={() => {
            setFullName(user?.full_name || '');
            setPhone(user?.phone || '');
            setIsEditOpen(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>EDIT ATTRIBUTES</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Identity Attributes */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
            Identity Record Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Full Legal Name
              </span>
              <div className="text-sm font-semibold text-slate-100 font-mono">
                {user?.full_name || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Verified Email
              </span>
              <div className="text-sm font-semibold text-cyan-400 font-mono truncate">
                {user?.email || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Contact Phone
              </span>
              <div className="text-sm font-semibold text-slate-200 font-mono">
                {user?.phone || 'Not provided'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Enrolled On
              </span>
              <div className="text-sm font-semibold text-slate-200 font-mono">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Identity Verification State
                </span>
                <span className="text-[11px] text-slate-400">
                  Proof documents and biometric verification status
                </span>
              </div>
            </div>
            <Badge status={user?.verification_status || 'UNVERIFIED'} />
          </div>

          {/* Assigned RBAC Permissions */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Effective Authorization Permissions ({user?.permissions?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user?.permissions?.map((p, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Security Profile Sidebar */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
            Security Status
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Account Standing</span>
              <Badge status={user?.is_locked ? 'LOCKED' : user?.is_active ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Multi-Factor Auth</span>
              <Badge status={user?.mfa_enabled ? 'ACTIVE' : 'REVOKED'} label={user?.mfa_enabled ? 'ENABLED' : 'DISABLED'} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Failed Attempts Counter</span>
              <span className="font-mono text-slate-200 font-semibold">
                {user?.failed_login_attempts || 0} / 5
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Assigned Roles</span>
              <div className="flex gap-1">
                {user?.roles?.map((r, i) => (
                  <span key={i} className="text-cyan-400 font-mono font-bold">
                    [{r}]
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs">
            <span className="font-bold text-cyan-400 block mb-1 font-mono">
              Role-Based Access Notice
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Access to system APIs is dynamically evaluated based on role memberships assigned by a Security Administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Identity Attributes"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE ATTRIBUTES'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
