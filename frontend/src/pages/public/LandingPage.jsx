import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  Fingerprint,
  Lock,
  FileCheck,
  AlertTriangle,
  Server,
  ArrowRight,
  Database,
  CheckCircle2,
  Terminal,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: 'ADMINISTRATOR',
      email: 'admin@identityx.io',
      name: 'Chief Security Officer',
      mfa: 'Enabled',
      desc: 'Full control over user lifecycle, RBAC roles, security logs, and verification reviews.',
      badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10'
    },
    {
      role: 'VERIFIED USER',
      email: 'alex.mercer@identityx.io',
      name: 'Alex Mercer',
      mfa: 'Enabled',
      desc: 'Identity verified with Tier-3 biometrics, active digital credentials, high security score.',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    },
    {
      role: 'STANDARD USER',
      email: 'sarah.connor@identityx.io',
      name: 'Sarah Connor',
      mfa: 'Disabled',
      desc: 'Pending identity verification submission, allows testing MFA setup and ID proof flow.',
      badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
    },
    {
      role: 'LOCKED USER',
      email: 'marcus.wright@identityx.io',
      name: 'Marcus Wright',
      mfa: 'Disabled',
      desc: 'Temporarily locked after failed login threshold. Demonstrates threat detection and admin unlock.',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    }
  ];

  const handleQuickLogin = (email) => {
    navigate(`/login?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xl font-black font-mono tracking-wider text-slate-100">
              IDENTITY<span className="text-cyan-400">X</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition-all flex items-center gap-2"
              >
                <span>OPEN DASHBOARD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
                >
                  GET STARTED
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-800/60">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold mb-6 shadow-sm">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>ENTERPRISE DIGITAL IDENTITY & ACCESS CONTROL PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-100 font-mono leading-tight mb-6">
            Defend Against <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Credential Attacks</span> With Zero-Trust Architecture.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
            IdentityX combines user authentication, time-based OTP Multi-Factor Authentication, verified digital credentials, rule-based suspicious login detection, and granular Role-Based Access Control into one centralized security dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>ACCESS IDENTITY PORTAL</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 font-mono font-semibold text-sm transition-all"
            >
              CREATE NEW IDENTITY
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl cyber-card border border-slate-800 text-left">
            <div>
              <div className="text-2xl font-bold font-mono text-cyan-400">100%</div>
              <div className="text-xs text-slate-400">Backend RBAC Enforcement</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-400">SHA-256</div>
              <div className="text-xs text-slate-400">One-Time Password Hashing</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-purple-400">Rule-Based</div>
              <div className="text-xs text-slate-400">Threat & Brute-Force Radar</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-blue-400">SQLite ORM</div>
              <div className="text-xs text-slate-400">Normalized Database Relations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Fast-Access Cards */}
      <section className="py-16 bg-slate-950/40 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
              Try Pre-Configured Personas
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Select any demo role to automatically fill credentials and test authentication workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoAccounts.map((account, idx) => (
              <div
                key={idx}
                className="cyber-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${account.badgeColor}`}>
                      {account.role}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      MFA: {account.mfa}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">
                    {account.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 truncate mb-3">
                    {account.email}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {account.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleQuickLogin(account.email)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Sign In As Persona</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl font-black font-mono text-slate-100 mt-2">
            Defense-In-Depth Security Suite
          </h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Every layer from password hashing to admin compliance review is backed by real SQLite database entities and server-side authorization guards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              MFA with Time-Based OTP
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cryptographically secure 6-digit OTP generation with automatic expiration, one-time consumption guards, and OTP hash storage to prevent replay attacks.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Threat & Suspicious Login Radar
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects high-velocity failures, brute-force trials, and attempts on locked accounts. Automatically assigns LOW to CRITICAL severity logs without false claims.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Verified Digital Credentials
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Store and manage digital identities, driver's licenses, and security badges with custom JSON metadata and administrative verification statuses.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Account Lockout & Protection
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configurable threshold (default: 5 consecutive failures) automatically locks compromised accounts for a defined window, with administrator override capabilities.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Enforced Backend RBAC
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real role-to-permission mapping enforced through Python decorators on every REST endpoint. Extensible to Analyst, Auditor, and Verifier roles.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Identity Proof Review Flow
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Users submit passport / national ID details. Compliance officers inspect proof documents, record reviewer notes, and approve or reject submissions in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">IDENTITYX PLATFORM</span>
            <span>— Defense-Grade Identity, MFA & Access Control</span>
          </div>
          <div className="text-slate-400">
            Flask REST API • React Vite • SQLite ORM • Zero-Trust RBAC
          </div>
        </div>
      </footer>
    </div>
  );
}
