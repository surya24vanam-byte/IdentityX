import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ShieldCheck, Plus, Edit2, Key, CheckCircle2, Layers } from 'lucide-react';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [byCategory, setByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);

      if (rRes.success) setRoles(rRes.data.roles || []);
      if (pRes.success) {
        setPermissions(pRes.data.permissions || []);
        setByCategory(pRes.data.by_category || {});
      }
    } catch (err) {
      showToast('Failed to load RBAC metadata.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms(['VIEW_PROFILE']);
    setIsCreateOpen(true);
  };

  const openEditModal = (r) => {
    setSelectedRole(r);
    setRoleDesc(r.description || '');
    setSelectedPerms(r.permissions || []);
    setIsEditOpen(true);
  };

  const togglePermission = (pName) => {
    setSelectedPerms((prev) =>
      prev.includes(pName)
        ? prev.filter((p) => p !== pName)
        : [...prev, pName]
    );
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/roles', {
        name: roleName.trim().toUpperCase(),
        description: roleDesc.trim(),
        permissions: selectedPerms
      });
      showToast(res.message, 'success');
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to create role.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/roles/${selectedRole.id}`, {
        description: roleDesc.trim(),
        permissions: selectedPerms
      });
      showToast(res.message, 'success');
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update role.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Auditing Role-Based Access Control matrix..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define system roles and bind granular permission privileges enforced on backend endpoints
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW ROLE</span>
        </button>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((r) => (
          <div
            key={r.id}
            className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {r.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {r.permissions?.length || 0} PERMS
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {r.description || 'No description provided.'}
              </p>

              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                  Included Permissions
                </span>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                  {r.permissions?.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800/80 text-cyan-300/90"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
              <button
                onClick={() => openEditModal(r)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Configure Privileges</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Breakdown by Category */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider mb-4">
          Master Permission Registry ({permissions.length} total)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(byCategory).map(([category, perms]) => (
            <div key={category} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{category} CATEGORY</span>
              </h3>
              <div className="space-y-2">
                {perms.map((p) => (
                  <div key={p.id} className="text-xs">
                    <div className="font-mono font-semibold text-slate-200 text-[11px]">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New RBAC Role"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Role Identifier (e.g. AUDITOR, SECURITY_ANALYST)
            </label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value.toUpperCase())}
              placeholder="e.g. COMPLIANCE_OFFICER"
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm font-mono placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Description
            </label>
            <input
              type="text"
              required
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="Role responsibility summary"
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Select Permissions ({selectedPerms.length} chosen)
            </label>
            <div className="max-h-60 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
              {permissions.map((p) => {
                const checked = selectedPerms.includes(p.name);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-mono transition-colors ${
                      checked ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(p.name)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-sans truncate ml-auto">
                      {p.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !roleName}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {saving ? 'CREATING...' : 'ENACT ROLE'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Configure Role // ${selectedRole?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-2">
              Modify Permissions ({selectedPerms.length} assigned)
            </label>
            <div className="max-h-60 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
              {permissions.map((p) => {
                const checked = selectedPerms.includes(p.name);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-mono transition-colors ${
                      checked ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(p.name)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-sans truncate ml-auto">
                      {p.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE ROLE PRIVILEGES'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
