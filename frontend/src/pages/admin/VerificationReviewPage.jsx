import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileCheck2, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';

export default function VerificationReviewPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedVer, setSelectedVer] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState('APPROVED'); // APPROVED or REJECTED
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchVerifications = async () => {
    try {
      const params = { all: 'true' };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/verification', { params });
      if (res.success) {
        setVerifications(res.data.verifications || []);
      }
    } catch (err) {
      showToast('Failed to load verification proofs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const openReviewModal = (v, defaultAction = 'APPROVED') => {
    setSelectedVer(v);
    setReviewAction(defaultAction);
    setReviewNotes(v.review_notes || '');
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVer) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/verification/${selectedVer.id}/review`, {
        status: reviewAction,
        review_notes: reviewNotes.trim()
      });
      showToast(res.message || `Verification request marked as ${reviewAction}.`, 'success');
      setIsReviewOpen(false);
      fetchVerifications();
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Querying pending identity proofs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-cyan-400" />
            <span>Identity Proof Compliance Reviews</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate submitted government-issued biometric documents and approve KYC credentials
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cyber-input px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
          >
            <option value="">All Verification Proofs</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved Identities</option>
            <option value="REJECTED">Rejected Proofs</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        {verifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No verification requests found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Applicant</th>
                  <th className="pb-3 font-semibold">Document Type</th>
                  <th className="pb-3 font-semibold">Identifier</th>
                  <th className="pb-3 font-semibold">Submitted</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-sans">
                      <div className="font-semibold text-slate-200">{v.applicant_name}</div>
                      <div className="text-[11px] font-mono text-cyan-400 truncate">{v.applicant_email}</div>
                    </td>
                    <td className="py-3 text-slate-300 font-semibold">{v.document_type}</td>
                    <td className="py-3 text-slate-400">{v.document_number}</td>
                    <td className="py-3 text-slate-400">{new Date(v.submitted_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Badge status={v.status} size="xs" />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {v.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => openReviewModal(v, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openReviewModal(v, 'REJECTED')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openReviewModal(v, v.status)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
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

      {/* Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Evaluate Proof // ${selectedVer?.applicant_name || ''}`}
        maxWidth="max-w-xl"
      >
        {selectedVer && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Applicant:</span>
                <span className="text-slate-200 font-bold">{selectedVer.applicant_name} ({selectedVer.applicant_email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Document Type:</span>
                <span className="text-cyan-400 font-bold">{selectedVer.document_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Document Number:</span>
                <span className="text-slate-200 font-bold">{selectedVer.document_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UUID Tracking:</span>
                <span className="text-slate-500 text-[10px]">{selectedVer.verification_uuid}</span>
              </div>
              {selectedVer.details && Object.keys(selectedVer.details).length > 0 && (
                <div className="pt-2 border-t border-slate-900 mt-2">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Extended Submission Details:</span>
                  {Object.entries(selectedVer.details).map(([k, v], idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-slate-300">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Compliance Decision
              </label>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVED')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    reviewAction === 'APPROVED'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>APPROVE PROOF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECTED')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    reviewAction === 'REJECTED'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>REJECT PROOF</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Review Notes / Auditor Comments
              </label>
              <textarea
                rows={3}
                required
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="State basis for decision (e.g. Passport cryptographic signature verified against ICAO PKD registry)..."
                className="cyber-input w-full px-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reviewNotes}
                className={`px-5 py-2 text-xs font-mono font-bold rounded-xl text-white transition-all disabled:opacity-50 ${
                  reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submitting ? 'RECORDING AUDIT...' : `SUBMIT ${reviewAction} VERDICT`}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
