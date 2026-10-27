import React from 'react';
import { Shield } from 'lucide-react';

export default function LoadingSpinner({ message = 'Authenticating security context...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[240px] p-6 text-center">
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping opacity-75" />
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-blue-600 border-l-transparent animate-spin" />
        <Shield className="w-6 h-6 text-cyan-400 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-slate-400 tracking-wide font-mono">
        {message}
      </p>
    </div>
  );
}
