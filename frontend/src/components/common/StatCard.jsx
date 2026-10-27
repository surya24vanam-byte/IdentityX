import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan', // cyan, blue, emerald, amber, rose, purple
  trend
}) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', glow: 'hover:border-cyan-500/40' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', glow: 'hover:border-blue-500/40' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', glow: 'hover:border-emerald-500/40' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', glow: 'hover:border-amber-500/40' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', glow: 'hover:border-rose-500/40' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', glow: 'hover:border-purple-500/40' },
  };

  const style = colorMap[variant] || colorMap.cyan;

  return (
    <div className={`cyber-card p-5 rounded-2xl border transition-all duration-300 ${style.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${style.bg} ${style.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
          {value !== undefined && value !== null ? value : '--'}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
