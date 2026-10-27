import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { MonitorSmartphone, Shield, LogOut, CheckCircle2, Clock, Globe } from 'lucide-react';

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const { showToast } = useToast();

  const fetchSessions = async () => {
    try {
      const res = await api.get('/users/sessions');
      if (res.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      showToast('Failed to load active sessions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async (sessionToken) => {
    try {
      const res = await api.delete(`/users/sessions/${sessionToken}`);
      showToast(res.message || 'Session terminated successfully.', 'success');
      fetchSessions();
    } catch (err) {
      showToast(err.message || 'Failed to revoke session.', 'error');
    }
  };

  const handleRevokeAllOthers = async () => {
    setRevoking(true);
    try {
      const res = await api.post('/users/sessions/revoke-all-others');
      showToast(res.message || 'All other active sessions have been terminated.', 'success');
      setIsConfirmAllOpen(false);
      fetchSessions();
    } catch (err) {
      showToast(err.message || 'Failed to terminate sessions.', 'error');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Auditing active session tokens..." />;
  }

  const activeCount = sessions.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <MonitorSmartphone className="w-6 h-6 text-cyan-400" />
            <span>Active Device Sessions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and terminate authorized JWT device tokens tied to your digital identity
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={() => setIsConfirmAllOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>TERMINATE ALL OTHER SESSIONS</span>
          </button>
        )}
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className={`cyber-card p-5 rounded-2xl border transition-all ${
              sess.is_current
                ? 'border-cyan-500/40 bg-cyan-950/10'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-900 text-cyan-400 border border-slate-800">
                  <MonitorSmartphone className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {sess.device_info || 'Desktop Browser'}
                </span>
              </div>
              {sess.is_current ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  THIS DEVICE
                </span>
              ) : (
                <Badge status={sess.is_active ? 'ACTIVE' : 'REVOKED'} size="xs" />
              )}
            </div>

            <div className="space-y-2 text-xs font-mono mb-4 text-slate-400">
              <div className="flex items-center justify-between">
                <span>IP Address:</span>
                <span className="text-slate-200 font-semibold">{sess.ip_address || '127.0.0.1'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created At:</span>
                <span className="text-slate-300">{new Date(sess.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Activity:</span>
                <span className="text-slate-300">{new Date(sess.last_activity).toLocaleTimeString()}</span>
              </div>
              <div className="truncate text-[10px] text-slate-600 font-mono mt-1">
                Token: {sess.session_token.slice(0, 18)}...
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
              {sess.is_active && !sess.is_current && (
                <button
                  onClick={() => handleRevokeSingle(sess.session_token)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Revoke Session</span>
                </button>
              )}
              {sess.is_current && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Currently active authentication session
                </span>
              )}
              {!sess.is_active && (
                <span className="text-[11px] text-rose-400 font-mono">
                  Revoked
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmAllOpen}
        onClose={() => setIsConfirmAllOpen(false)}
        onConfirm={handleRevokeAllOthers}
        title="Terminate Remote Sessions"
        message="This action will instantly invalidate all active device tokens associated with this account, except for your current browser window. Any other logged-in clients will be forced to re-authenticate."
        confirmText="Revoke Remote Sessions"
        confirmVariant="danger"
        isLoading={revoking}
      />
    </div>
  );
}
