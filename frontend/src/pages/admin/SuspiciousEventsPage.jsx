import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AlertTriangle, ShieldAlert, Lock, Activity, RefreshCw, Eye } from 'lucide-react';

export default function SuspiciousEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserToLock, setSelectedUserToLock] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  const fetchSuspiciousEvents = async () => {
    try {
      const res = await api.get('/admin/suspicious-events');
      if (res.success) {
        setEvents(res.data.suspicious_events || []);
      }
    } catch (err) {
      showToast('Failed to load suspicious threat events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspiciousEvents();
  }, []);

  const handleLockAccount = async () => {
    if (!selectedUserToLock) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${selectedUserToLock.user_id}/lock`);
      showToast(res.message, 'success');
      setSelectedUserToLock(null);
      fetchSuspiciousEvents();
    } catch (err) {
      showToast(err.message || 'Failed to lock user.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Scanning authentication streams for anomaly signals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 text-rose-300 bg-rose-500/10 font-bold animate-pulse">
              THREAT RADAR ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <span>Suspicious Login & Attack Signal Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based detection analyzing high-velocity failures, brute-force trials, and locked account breaches
          </p>
        </div>

        <button
          onClick={fetchSuspiciousEvents}
          className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>SCAN NOW</span>
        </button>
      </div>

      {/* Anomaly Detection Rules Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-mono text-rose-400 font-bold block mb-1">Rule 1: Locked Breach</span>
          <p className="text-slate-400 text-[11px]">Triggers <strong>CRITICAL</strong> severity when logins are attempted against already-locked accounts.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-mono text-orange-400 font-bold block mb-1">Rule 2: High Velocity</span>
          <p className="text-slate-400 text-[11px]">Triggers <strong>HIGH</strong> severity when &gt;= 3 failures occur in under 2 minutes.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-mono text-amber-400 font-bold block mb-1">Rule 3: Repeated Trials</span>
          <p className="text-slate-400 text-[11px]">Triggers <strong>HIGH</strong> severity when &gt;= 4 failures occur within a 10-minute window.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-mono text-cyan-400 font-bold block mb-1">Rule 4: Anomalous IP</span>
          <p className="text-slate-400 text-[11px]">Triggers <strong>MEDIUM</strong> severity when logins emerge from unrecognized origin IP addresses.</p>
        </div>
      </div>

      {/* Events Table */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        {events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            Zero suspicious events detected in recent authentication window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Target Account</th>
                  <th className="pb-3 font-semibold font-sans">Threat Reason / Description</th>
                  <th className="pb-3 font-semibold">Origin IP</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3">
                      <Badge status={ev.severity} size="xs" />
                    </td>
                    <td className="py-3 text-cyan-400 font-bold truncate max-w-[180px]">
                      {ev.user_email}
                    </td>
                    <td className="py-3 text-slate-200 font-sans max-w-md leading-relaxed">
                      {ev.description}
                    </td>
                    <td className="py-3 text-slate-400">
                      {ev.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {ev.user_id ? (
                        <button
                          onClick={() => setSelectedUserToLock(ev)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock User</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600">External Origin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedUserToLock}
        onClose={() => setSelectedUserToLock(null)}
        onConfirm={handleLockAccount}
        title="Immediate Account Lockout"
        message={`Terminate all sessions and lock account ${selectedUserToLock?.user_email} due to detected threat signals?`}
        confirmText="Execute Lockout"
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
