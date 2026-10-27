import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileCheck2, ShieldCheck, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function IdentityVerificationPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [docType, setDocType] = useState('PASSPORT');
  const [docNumber, setDocNumber] = useState('');
  const [country, setCountry] = useState('United States');
  const [expiry, setExpiry] = useState('2030-12-31');
  const [notes, setNotes] = useState('');

  const fetchVerifications = async () => {
    try {
      const res = await api.get('/verification');
      if (res.success) {
        setVerifications(res.data.verifications || []);
      }
    } catch (err) {
      showToast('Failed to load verification history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const latest = verifications.length > 0 ? verifications[0] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/verification', {
        document_type: docType,
        document_number: docNumber.trim(),
        details: {
          country,
          expiry_date: expiry,
          applicant_notes: notes
        }
      });

      showToast('Verification proof submitted to compliance officers.', 'success');
      setDocNumber('');
      setNotes('');
      await refreshUser();
      fetchVerifications();
    } catch (err) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking identity compliance status..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-cyan-400" />
              <span>Identity Verification Workflow</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Submit authoritative identity proofs for manual and automated compliance evaluation
            </p>
          </div>
          <Badge status={user?.verification_status || 'UNVERIFIED'} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Submission Form */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 mb-6">
            Submit New Identity Proof Document
          </h2>

          {latest && latest.status === 'PENDING' ? (
            <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-center space-y-3">
              <Clock className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold font-mono uppercase text-amber-300">
                VERIFICATION REQUEST IN REVIEW
              </h3>
              <p className="text-slate-300 max-w-md mx-auto leading-relaxed">
                Your submitted <span className="font-mono font-semibold text-white">{latest.document_type}</span> ({latest.document_number}) is currently undergoing manual review by a Compliance Officer.
              </p>
              <div className="text-[11px] font-mono text-amber-400/80">
                Submitted on {new Date(latest.submitted_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="PASSPORT">Biometric Passport</option>
                    <option value="NATIONAL_ID">National Identity Card</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="BIOMETRIC_PASS">Biometric Security Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                    Document Identifier / Number
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. P-8492019"
                    className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm font-mono placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                    Issuing Country / Jurisdiction
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                  Supporting Notes / Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or issuing authority reference numbers"
                  className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'TRANSMITTING VERIFICATION PROOF...' : 'SUBMIT PROOF FOR COMPLIANCE REVIEW'}
              </button>
            </form>
          )}
        </div>

        {/* Verification Status Card */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
            Why Verify Identity?
          </h2>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Boost Security Score:</strong> Grants +25 points towards an EXCELLENT rating.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Elevated Privileges:</strong> Access sensitive digital credential issuing capabilities.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Audit Compliance:</strong> Meets Zero-Trust KYC and identity assurance benchmarks.</span>
            </div>
          </div>

          {latest && latest.review_notes && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="font-mono text-[10px] uppercase text-cyan-400 font-semibold block mb-1">
                Last Reviewer Notes
              </span>
              <p className="text-slate-300 italic">
                "{latest.review_notes}"
              </p>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                Reviewed by: {latest.reviewer_name || 'Compliance Team'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification History Table */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider mb-4">
          Submission History
        </h2>

        {verifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No verification requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Document</th>
                  <th className="pb-3 font-semibold">Identifier</th>
                  <th className="pb-3 font-semibold">Submitted</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Review Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-cyan-400 font-semibold">{v.document_type}</td>
                    <td className="py-3 text-slate-300">{v.document_number}</td>
                    <td className="py-3 text-slate-400">{new Date(v.submitted_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Badge status={v.status} size="xs" />
                    </td>
                    <td className="py-3 text-slate-400 font-sans truncate max-w-xs">
                      {v.review_notes || <span className="text-slate-600 italic">Pending evaluation</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
