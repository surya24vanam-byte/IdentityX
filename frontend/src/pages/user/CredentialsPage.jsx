import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Award, Plus, CheckCircle, Shield, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    issuer: '',
    credential_type: 'SECURITY_CLEARANCE',
    metaKey1: 'clearance_level',
    metaVal1: 'Level 3 Secret',
    metaKey2: 'authority_code',
    metaVal2: 'AUTH-2026-X'
  });

  const { showToast } = useToast();

  const fetchCredentials = async () => {
    try {
      const res = await api.get('/credentials');
      if (res.success) {
        setCredentials(res.data.credentials || []);
      }
    } catch (err) {
      showToast('Failed to load digital credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleAddCredential = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const metadata = {};
      if (form.metaKey1 && form.metaVal1) metadata[form.metaKey1] = form.metaVal1;
      if (form.metaKey2 && form.metaVal2) metadata[form.metaKey2] = form.metaVal2;

      const res = await api.post('/credentials', {
        title: form.title,
        issuer: form.issuer,
        credential_type: form.credential_type,
        metadata
      });

      showToast('Digital credential issued successfully.', 'success');
      setIsAddOpen(false);
      setForm({
        title: '',
        issuer: '',
        credential_type: 'SECURITY_CLEARANCE',
        metaKey1: 'clearance_level',
        metaVal1: 'Level 3 Secret',
        metaKey2: 'authority_code',
        metaVal2: 'AUTH-2026-X'
      });
      fetchCredentials();
    } catch (err) {
      showToast(err.message || 'Failed to add credential.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestVerification = async (credId) => {
    try {
      const res = await api.post(`/credentials/${credId}/verify`);
      showToast(res.message || 'Verification requested.', 'success');
      fetchCredentials();
    } catch (err) {
      showToast(err.message || 'Failed to request verification.', 'error');
    }
  };

  const handleDelete = async (credId) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;
    try {
      await api.delete(`/credentials/${credId}`);
      showToast('Credential removed.', 'success');
      fetchCredentials();
    } catch (err) {
      showToast(err.message || 'Failed to delete credential.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading digital credential vault..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-cyan-400" />
            <span>Digital Credential Wallet</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographically anchored identity credentials, licenses, and verified proofs
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ISSUE NEW CREDENTIAL</span>
        </button>
      </div>

      {/* Credentials Grid */}
      {credentials.length === 0 ? (
        <div className="cyber-card p-12 text-center rounded-2xl border border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300 font-mono">No Credentials Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You haven't added any digital credentials to your identity wallet yet.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
          >
            Issue Your First Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((cred) => {
            const metadataEntries = Object.entries(cred.metadata || {});

            return (
              <div
                key={cred.id}
                className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                      {cred.credential_type}
                    </span>
                    <Badge status={cred.status} size="xs" />
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mb-1 leading-snug">
                    {cred.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    Issuer: <span className="text-slate-300">{cred.issuer}</span>
                  </p>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-900 text-xs font-mono space-y-1 mb-4">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      UUID: {cred.credential_uuid}
                    </div>
                    {metadataEntries.length > 0 ? (
                      metadataEntries.map(([k, v], idx) => (
                        <div key={idx} className="flex justify-between text-[11px] truncate">
                          <span className="text-slate-400">{k}:</span>
                          <span className="text-slate-200 font-semibold truncate ml-2">{String(v)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-600 italic">No custom attributes</div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-500">
                    Created {new Date(cred.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {cred.status !== 'VERIFIED' && cred.status !== 'PENDING_VERIFICATION' && (
                      <button
                        onClick={() => handleRequestVerification(cred.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-semibold transition-colors"
                      >
                        Request Proof
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete credential"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Credential Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Digital Credential"
      >
        <form onSubmit={handleAddCredential} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Credential Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Top Secret Security Clearance"
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Issuing Organization
            </label>
            <input
              type="text"
              required
              value={form.issuer}
              onChange={(e) => setForm({ ...form, issuer: e.target.value })}
              placeholder="e.g. Department of Homeland Security"
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Credential Type
            </label>
            <select
              value={form.credential_type}
              onChange={(e) => setForm({ ...form, credential_type: e.target.value })}
              className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            >
              <option value="SECURITY_CLEARANCE">Security Clearance</option>
              <option value="NATIONAL_ID">National ID Card</option>
              <option value="PASSPORT">Biometric Passport</option>
              <option value="EMPLOYEE_BADGE">Enterprise Digital Key</option>
              <option value="DIGITAL_CERTIFICATE">X.509 Digital Certificate</option>
              <option value="DRIVERS_LICENSE">Driver's License</option>
            </select>
          </div>

          <div className="pt-2">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Metadata Attributes (Optional Key-Value)
            </span>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Key 1 (e.g. clearance)"
                value={form.metaKey1}
                onChange={(e) => setForm({ ...form, metaKey1: e.target.value })}
                className="cyber-input px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
              />
              <input
                type="text"
                placeholder="Value 1"
                value={form.metaVal1}
                onChange={(e) => setForm({ ...form, metaVal1: e.target.value })}
                className="cyber-input px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Key 2"
                value={form.metaKey2}
                onChange={(e) => setForm({ ...form, metaKey2: e.target.value })}
                className="cyber-input px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
              />
              <input
                type="text"
                placeholder="Value 2"
                value={form.metaVal2}
                onChange={(e) => setForm({ ...form, metaVal2: e.target.value })}
                className="cyber-input px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {submitting ? 'ISSUING...' : 'ENROLL CREDENTIAL'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
