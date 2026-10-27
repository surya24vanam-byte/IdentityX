import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { History, Shield, Globe, Monitor, AlertCircle } from 'lucide-react';

export default function LoginHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const { showToast } = useToast();

  const fetchHistory = async () => {
    try {
      const res = await api.get('/users/login-history');
      if (res.success) {
        setHistory(res.data.login_history || []);
      }
    } catch (err) {
      showToast('Failed to load authentication history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = filter === 'ALL'
    ? history
    : history.filter((h) => h.status === filter);

  if (loading) {
    return <LoadingSpinner message="Retrieving authentication logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Authentication & Login History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all successful and denied access attempts for your account
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          {['ALL', 'SUCCESS', 'FAILED', 'LOCKED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No login events match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Timestamp (UTC)</th>
                  <th className="pb-3 font-semibold">IP Address</th>
                  <th className="pb-3 font-semibold">Client / Platform</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Event Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-slate-300">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 text-cyan-400 font-bold">
                      {item.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 text-slate-400 truncate max-w-xs font-sans">
                      {item.user_agent || 'Desktop Web Client'}
                    </td>
                    <td className="py-3">
                      <Badge status={item.status} size="xs" />
                    </td>
                    <td className="py-3 text-slate-400 font-sans">
                      {item.failure_reason ? (
                        <span className="text-rose-400/90">{item.failure_reason}</span>
                      ) : (
                        <span className="text-emerald-400">Normal authenticated session</span>
                      )}
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
