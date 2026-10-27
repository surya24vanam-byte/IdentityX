import React from 'react';

const statusConfig = {
  // Positive states
  ACTIVE: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  VERIFIED: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  APPROVED: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  SUCCESS: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  EXCELLENT: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },

  // Pending states
  PENDING: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  PENDING_VERIFICATION: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  MODERATE: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  GOOD: { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-400' },

  // Negative / Warning states
  FAILED: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
  REJECTED: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
  LOCKED: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
  REVOKED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
  UNVERIFIED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
  VULNERABLE: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },

  // Severity levels
  LOW: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  MEDIUM: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  HIGH: { bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
  CRITICAL: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400 animate-pulse' },
  SUSPICIOUS: { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
};

export default function Badge({ status, label, showDot = true, size = 'sm' }) {
  const normalized = (status || '').toUpperCase();
  const config = statusConfig[normalized] || {
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400'
  };

  const displayText = label || (status ? status.replace(/_/g, ' ') : 'N/A');
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} tracking-wide uppercase font-mono`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {displayText}
    </span>
  );
}
