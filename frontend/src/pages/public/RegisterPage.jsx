import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shield, User, Mail, Phone, Lock, ArrowRight, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Password Strength Checklist
  const pwd = formData.password;
  const checks = [
    { label: 'At least 8 characters', met: pwd.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(pwd) },
    { label: 'One digit (0-9)', met: /[0-9]/.test(pwd) },
    { label: 'One special symbol (!@#$%...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];
  const allChecksMet = checks.every((c) => c.met);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allChecksMet) {
      showToast('Please ensure your password meets all complexity standards.', 'warning');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirm_password
      });

      showToast('Identity registered successfully! You can now log in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black font-mono tracking-wider text-slate-100">
            IDENTITY<span className="text-cyan-400">X</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100">
          Enroll New Digital Identity
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Create an enterprise-grade authenticated profile
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="cyber-card p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Alex Mercer"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex.mercer@identityx.io"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2831"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Password strength checklist */}
            {pwd.length > 0 && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Password Complexity Status
                </span>
                {checks.map((chk, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px]">
                    {chk.met ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className={chk.met ? 'text-emerald-300' : 'text-slate-400'}>
                      {chk.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="cyber-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !allChecksMet}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>CREATING IDENTITY...</span>
              ) : (
                <>
                  <span>CREATE SECURE ACCOUNT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an identity registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold font-mono">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
