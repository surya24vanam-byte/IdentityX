import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import StatCard from '../../components/common/StatCard';
import SecurityScoreGauge from '../../components/common/SecurityScoreGauge';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Shield,
  KeyRound,
  Award,
  FileCheck2,
  MonitorSmartphone,
  ArrowRight,
  AlertTriangle,
  History,
  CheckCircle2
} from 'lucide-react';

export default function UserDashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [securityData, setSecurityData] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, credRes, histRes, sessRes] = await Promise.all([
          api.get('/users/security'),
          api.get('/credentials'),
          api.get('/users/login-history'),
          api.get('/users/sessions')
        ]);

        if (secRes.success) setSecurityData(secRes.data);
        if (credRes.success) setCredentials(credRes.data.credentials || []);
        if (histRes.success) setRecentLogins((histRes.data.login_history || []).slice(0, 5));
        if (sessRes.success) setActiveSessions(sessRes.data.sessions || []);
      } catch (err) {
        showToast('Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  if (loading) {
    return <LoadingSpinner message="Calculating identity security posture..." />;
  }

  const verStatus = user?.verification_status || 'UNVERIFIED';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-bold font-mono text-slate-100">
              Identity Portal // {user?.full_name}
            </h1>
            <Badge status={verStatus} />
          </div>
          <p className="text-xs text-slate-400">
            Account Email: <span className="text-slate-300 font-mono">{user?.email}</span> • Assigned Roles: <span className="text-cyan-400 font-mono">{user?.roles?.join(', ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/credentials"
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>ADD CREDENTIAL</span>
          </Link>
          <Link
            to="/verification"
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>VERIFICATION WORKFLOW</span>
          </Link>
        </div>
      </div>

      {/* Security Score Gauge Component */}
      {securityData?.security_score && (
        <SecurityScoreGauge scoreData={securityData.security_score} />
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Digital Credentials"
          value={credentials.length}
          subtitle={`${credentials.filter(c => c.status === 'VERIFIED').length} verified by compliance`}
          icon={Award}
          variant="cyan"
        />
        <StatCard
          title="MFA Protection"
          value={user?.mfa_enabled ? 'ENABLED' : 'DISABLED'}
          subtitle={user?.mfa_enabled ? 'Protected via One-Time Passwords' : 'Enable MFA to boost score +30pts'}
          icon={KeyRound}
          variant={user?.mfa_enabled ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Active Sessions"
          value={activeSessions.length}
          subtitle="Signed in device sessions"
          icon={MonitorSmartphone}
          variant="blue"
        />
        <StatCard
          title="Identity Status"
          value={verStatus}
          subtitle={verStatus === 'APPROVED' ? 'Identity verified with proofs' : 'Submit ID proofs to verify'}
          icon={Shield}
          variant={verStatus === 'APPROVED' ? 'emerald' : 'purple'}
        />
      </div>

      {/* Quick Navigation & Recent Logins Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
            Security Controls
          </h3>

          <div className="space-y-2.5">
            <Link
              to="/security"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">MFA & Authentication</div>
                  <div className="text-[11px] text-slate-400">Configure OTP security token</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              to="/credentials"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Credentials Wallet</div>
                  <div className="text-[11px] text-slate-400">Manage issued proofs & badges</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              to="/sessions"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <MonitorSmartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Active Sessions</div>
                  <div className="text-[11px] text-slate-400">Audit devices & terminate sessions</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              to="/login-history"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Authentication History</div>
                  <div className="text-[11px] text-slate-400">Inspect login attempts & timestamps</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Recent Authentication Events Table */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
                Recent Authentication Activity
              </h3>
              <p className="text-xs text-slate-400">
                Latest login attempts recorded on this profile
              </p>
            </div>
            <Link
              to="/login-history"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentLogins.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No recent login events recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">IP Address</th>
                    <th className="pb-3 font-semibold">Device / Browser</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentLogins.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-mono text-slate-300">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono text-cyan-400">
                        {item.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 text-slate-400 truncate max-w-[200px]">
                        {item.user_agent || 'Web Browser'}
                      </td>
                      <td className="py-3 text-right">
                        <Badge status={item.status} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
