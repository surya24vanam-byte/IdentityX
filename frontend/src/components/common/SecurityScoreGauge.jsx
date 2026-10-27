import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import Badge from './Badge';

export default function SecurityScoreGauge({ scoreData }) {
  if (!scoreData) return null;

  const { score = 0, grade = 'MODERATE', factors = [] } = scoreData;

  // Determine color theme based on score
  let strokeColor = '#06b6d4'; // Cyan
  let textColor = 'text-cyan-400';
  if (score >= 85) {
    strokeColor = '#10b981'; // Emerald
    textColor = 'text-emerald-400';
  } else if (score >= 65) {
    strokeColor = '#06b6d4'; // Cyan
    textColor = 'text-cyan-400';
  } else if (score >= 45) {
    strokeColor = '#f59e0b'; // Amber
    textColor = 'text-amber-400';
  } else {
    strokeColor = '#f43f5e'; // Rose
    textColor = 'text-rose-400';
  }

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="cyber-card p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row items-center gap-6">
      {/* Gauge Visual */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 128 128">
          {/* Background Ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="text-slate-800"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${textColor}`}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
            out of 100
          </span>
        </div>
      </div>

      {/* Details & Factor Breakdown */}
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {score >= 65 ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            )}
            <h4 className="text-base font-bold text-slate-100">
              Identity Security Score
            </h4>
          </div>
          <Badge status={grade} />
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Dynamic posture computed from MFA enablement, verified government proofs, and authentication cleanliness.
        </p>

        {/* Contributing Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {factors.map((f, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border ${
                f.met
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                  : 'bg-rose-500/5 border-rose-500/10 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {f.met ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="truncate">{f.factor}</span>
              </div>
              <span className={`font-mono text-[11px] font-semibold ${f.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                +{f.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
