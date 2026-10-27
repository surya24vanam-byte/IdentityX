import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, Search, ShieldAlert, Filter, RefreshCw } from 'lucide-react';

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      const params = { limit: 100 };
      if (severityFilter) params.severity = severityFilter;
      if (eventSearch) params.event_type = eventSearch;

      const res = await api.get('/admin/security-logs', { params });
      if (res.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      showToast('Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severityFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  if (loading) {
    return <LoadingSpinner message="Querying centralized security audit ledger..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Centralized Security Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident system logs capturing authentication events, role reassignments, and threat signals
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            placeholder="Search event type (e.g. LOGIN_SUCCESS, ACCOUNT_LOCKED, MFA_ENABLED)..."
            className="cyber-input w-full pl-10 pr-4 py-2 text-xs rounded-xl focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto font-mono text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="cyber-input px-3 py-2 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No security logs matching search parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Event Type</th>
                  <th className="pb-3 font-semibold">User Context</th>
                  <th className="pb-3 font-semibold font-sans">Description</th>
                  <th className="pb-3 font-semibold">Client IP</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3">
                      <Badge status={log.severity} size="xs" />
                    </td>
                    <td className="py-3 font-bold text-cyan-400">
                      {log.event_type}
                    </td>
                    <td className="py-3 text-slate-300 truncate max-w-[160px]">
                      {log.user_email}
                    </td>
                    <td className="py-3 text-slate-200 font-sans max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 text-right text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
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
