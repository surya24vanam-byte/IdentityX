import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Lock,
  MonitorSmartphone,
  FileCheck2,
  Activity,
  ArrowRight,
  ShieldAlert,
  Server
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load administrator dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Aggregating security metrics from database..." />;
  }

  const metrics = data?.metrics || {};
  const trends = data?.activity_trends || [];
  const severityDist = data?.severity_distribution || {};
  const roleDist = data?.role_distribution || [];
  const recentEvents = data?.recent_security_events || [];

  // Find max value in trends for SVG scaling
  const maxVal = Math.max(...trends.map(t => Math.max(t.success, t.failed, t.suspicious, 1)), 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 text-rose-300 bg-rose-500/10 font-bold">
              SOC DASHBOARD
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live SQLite Database Node
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>Security Operations & Access Center</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>USER DIRECTORY</span>
          </Link>
          <Link
            to="/admin/verifications"
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>REVIEW PROOFS ({metrics.pending_verifications || 0})</span>
          </Link>
        </div>
      </div>

      {/* Real Database Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Total Users"
          value={metrics.total_users}
          subtitle={`${metrics.active_users} active status`}
          icon={Users}
          variant="cyan"
        />
        <StatCard
          title="Verified Identities"
          value={metrics.verified_users}
          subtitle="Passed compliance review"
          icon={ShieldCheck}
          variant="emerald"
        />
        <StatCard
          title="MFA Enabled"
          value={metrics.mfa_enabled_users}
          subtitle="Protected by OTP"
          icon={KeyRound}
          variant="blue"
        />
        <StatCard
          title="Failed Attempts"
          value={metrics.failed_login_attempts}
          subtitle="Total failed attempts"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Threat Signals"
          value={metrics.suspicious_events}
          subtitle="High/Critical events"
          icon={Activity}
          variant="rose"
        />
        <StatCard
          title="Locked Accounts"
          value={metrics.locked_accounts}
          subtitle="Thwarted brute-forces"
          icon={Lock}
          variant="purple"
        />
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Trend Visualizer */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                7-Day Authentication Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Real-time authentication throughput (Successful vs Failed vs Suspicious)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Success
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Failed
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Suspicious
              </span>
            </div>
          </div>

          {/* Interactive CSS / SVG Bar Visualizer */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {trends.map((t, idx) => {
              const successHeight = Math.max(8, (t.success / maxVal) * 160);
              const failedHeight = Math.max(8, (t.failed / maxVal) * 160);
              const suspHeight = Math.max(8, (t.suspicious / maxVal) * 160);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Success Bar */}
                    <div
                      style={{ height: `${successHeight}px` }}
                      className="w-3 rounded-t bg-emerald-500/80 group-hover:bg-emerald-400 transition-all relative"
                      title={`Success: ${t.success}`}
                    />
                    {/* Failed Bar */}
                    <div
                      style={{ height: `${failedHeight}px` }}
                      className="w-3 rounded-t bg-amber-500/80 group-hover:bg-amber-400 transition-all relative"
                      title={`Failed: ${t.failed}`}
                    />
                    {/* Suspicious Bar */}
                    <div
                      style={{ height: `${suspHeight}px` }}
                      className="w-3 rounded-t bg-rose-500/80 group-hover:bg-rose-400 transition-all relative"
                      title={`Suspicious: ${t.suspicious}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[45px]">
                    {t.date ? t.date.slice(5) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution & Roles */}
        <div className="space-y-6">
          {/* Security Log Severity Meter */}
          <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider border-b border-slate-800 pb-3">
              Event Severity Breakdown
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-blue-400">LOW SEVERITY</span>
                  <span className="text-slate-300 font-bold">{severityDist.LOW || 0}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (severityDist.LOW || 0) * 10)}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-amber-400">MEDIUM SEVERITY</span>
                  <span className="text-slate-300 font-bold">{severityDist.MEDIUM || 0}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (severityDist.MEDIUM || 0) * 15)}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-orange-400">HIGH SEVERITY</span>
                  <span className="text-slate-300 font-bold">{severityDist.HIGH || 0}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (severityDist.HIGH || 0) * 20)}%` }}
                    className="h-full bg-orange-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-rose-400">CRITICAL ALERTS</span>
                  <span className="text-slate-300 font-bold">{severityDist.CRITICAL || 0}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (severityDist.CRITICAL || 0) * 25)}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role Distribution Card */}
          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider border-b border-slate-800 pb-3 mb-3">
              Role Distribution
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {roleDist.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <span className="text-slate-300 font-semibold">{r.role}</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Audit Events */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Live Security Audit Stream
            </h2>
            <p className="text-xs text-slate-400">
              Immutable security event logs captured from API gateways
            </p>
          </div>
          <Link
            to="/admin/security-logs"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Event Type</th>
                <th className="pb-3 font-semibold">User Context</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">IP Address</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3">
                    <Badge status={ev.severity} size="xs" />
                  </td>
                  <td className="py-3 text-cyan-400 font-bold">
                    {ev.event_type}
                  </td>
                  <td className="py-3 text-slate-300 truncate max-w-[160px]">
                    {ev.user_email}
                  </td>
                  <td className="py-3 text-slate-300 font-sans max-w-sm truncate">
                    {ev.description}
                  </td>
                  <td className="py-3 text-slate-400">
                    {ev.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-3 text-right text-slate-400">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
