import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Search, Lock, Unlock, ShieldCheck, Eye, ShieldAlert, KeyRound } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mfaFilter, setMfaFilter] = useState('');

  // Selected user for modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [confirmLockUser, setConfirmLockUser] = useState(null);
  const [confirmUnlockUser, setConfirmUnlockUser] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (mfaFilter) params.mfa = mfaFilter;

      const res = await api.get('/admin/users', { params });
      if (res.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      showToast('Failed to load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      if (res.success) {
        setRoles(res.data.roles || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [statusFilter, mfaFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleLock = async () => {
    if (!confirmLockUser) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${confirmLockUser.id}/lock`);
      showToast(res.message, 'success');
      setConfirmLockUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to lock account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!confirmUnlockUser) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${confirmUnlockUser.id}/unlock`);
      showToast(res.message, 'success');
      setConfirmUnlockUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to unlock account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleModal = (u) => {
    setSelectedUser(u);
    setSelectedRoles(u.roles || ['USER']);
    setIsRoleModalOpen(true);
  };

  const handleUpdateRoles = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/users/${selectedUser.id}/roles`, {
        roles: selectedRoles
      });
      showToast(res.message || 'Roles updated.', 'success');
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update roles.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRoleSelection = (rName) => {
    setSelectedRoles((prev) =>
      prev.includes(rName)
        ? prev.filter((r) => r !== rName)
        : [...prev, rName]
    );
  };

  const openDetailModal = async (u) => {
    try {
      const res = await api.get(`/admin/users/${u.id}`);
      if (res.success) {
        setSelectedUser(res.data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      showToast('Failed to fetch detailed profile.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>User Directory & Identity Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage user accounts, enforce account lockouts, and delegate Role-Based Access Control
          </p>
        </div>

        <div className="font-mono text-xs text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{users.length}</span> user accounts
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="cyber-input w-full pl-10 pr-4 py-2 text-xs rounded-xl focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto text-xs font-mono">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cyber-input px-3 py-2 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Status</option>
            <option value="locked">Locked Accounts</option>
            <option value="inactive">Disabled Accounts</option>
          </select>

          <select
            value={mfaFilter}
            onChange={(e) => setMfaFilter(e.target.value)}
            className="cyber-input px-3 py-2 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All MFA Configurations</option>
            <option value="true">MFA Enabled</option>
            <option value="false">MFA Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        {loading ? (
          <LoadingSpinner message="Querying user directory..." />
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No users found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Identity / Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Roles</th>
                  <th className="pb-3 font-semibold">MFA</th>
                  <th className="pb-3 font-semibold">Account State</th>
                  <th className="pb-3 font-semibold">Security Score</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-slate-200 font-semibold font-sans">
                      {u.full_name}
                    </td>
                    <td className="py-3 text-cyan-400">
                      {u.email}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge
                        status={u.mfa_enabled ? 'ACTIVE' : 'REVOKED'}
                        label={u.mfa_enabled ? 'YES' : 'NO'}
                        size="xs"
                      />
                    </td>
                    <td className="py-3">
                      <Badge
                        status={u.is_locked ? 'LOCKED' : u.is_active ? 'ACTIVE' : 'INACTIVE'}
                        size="xs"
                      />
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-slate-200">
                        {u.security_posture?.score || 0} pts
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailModal(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors"
                          title="View Full Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRoleModal(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-900 transition-colors"
                          title="Assign Roles"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        {u.is_locked ? (
                          <button
                            onClick={() => setConfirmUnlockUser(u)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Unlock account"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmLockUser(u)}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Lock account"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Lock</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={`Assign Roles // ${selectedUser?.full_name}`}
      >
        <form onSubmit={handleUpdateRoles} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select one or more system roles for <strong className="text-cyan-400">{selectedUser?.email}</strong>. Effective permissions will be dynamically recalculated.
          </p>

          <div className="space-y-2">
            {roles.map((r) => {
              const isChecked = selectedRoles.includes(r.name);
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRoleSelection(r.name)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-mono font-bold flex items-center gap-2">
                      <span>{r.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({r.permissions?.length || 0} permissions)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || selectedRoles.length === 0}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {actionLoading ? 'SAVING...' : 'APPLY ROLE POLICY'}
            </button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Identity Details // ${selectedUser?.user?.full_name || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedUser && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Email</span>
                <div className="font-mono text-cyan-400 font-semibold">{selectedUser.user.email}</div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Verification Status</span>
                <div><Badge status={selectedUser.user.verification_status} size="xs" /></div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Lockout Status</span>
                <div><Badge status={selectedUser.user.is_locked ? 'LOCKED' : 'ACTIVE'} size="xs" /></div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Failed Attempts</span>
                <div className="font-mono text-slate-200">{selectedUser.user.failed_login_attempts} / 5</div>
              </div>
            </div>

            {/* Recent Login Attempts */}
            <div>
              <h4 className="font-mono font-bold text-slate-200 uppercase tracking-wider mb-2">
                Recent Login Attempts ({selectedUser.login_history?.length || 0})
              </h4>
              <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/80 font-mono text-[10px] text-slate-400">
                    <tr>
                      <th className="p-2">Timestamp</th>
                      <th className="p-2">IP</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {selectedUser.login_history?.map((h) => (
                      <tr key={h.id}>
                        <td className="p-2 text-slate-300">{new Date(h.timestamp).toLocaleTimeString()}</td>
                        <td className="p-2 text-cyan-400">{h.ip_address}</td>
                        <td className="p-2"><Badge status={h.status} size="xs" /></td>
                        <td className="p-2 text-slate-400 font-sans">{h.failure_reason || 'Success'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Lock Dialog */}
      <ConfirmDialog
        isOpen={!!confirmLockUser}
        onClose={() => setConfirmLockUser(null)}
        onConfirm={handleLock}
        title="Lock User Account"
        message={`Are you sure you want to administratively lock account ${confirmLockUser?.email}? All active sessions will be terminated and authentication will be prohibited.`}
        confirmText="Lock Account"
        confirmVariant="danger"
        isLoading={actionLoading}
      />

      {/* Confirm Unlock Dialog */}
      <ConfirmDialog
        isOpen={!!confirmUnlockUser}
        onClose={() => setConfirmUnlockUser(null)}
        onConfirm={handleUnlock}
        title="Unlock User Account"
        message={`Restore access for ${confirmUnlockUser?.email}? The failed login counter will be reset and the user will be permitted to authenticate.`}
        confirmText="Unlock Account"
        confirmVariant="cyan"
        isLoading={actionLoading}
      />
    </div>
  );
}
