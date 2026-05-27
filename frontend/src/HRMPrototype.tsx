import React, { useState } from 'react';
import { Eye, EyeOff, LogOut, User, Shield, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * CORE DESIGN SYSTEM (Minimalist Enterprise)
 * Colors: 
 * - Primary: #0F172A (Slate 900) - Deep, professional
 * - Accent: #2563EB (Blue 600) - Action oriented
 * - Error: #DC2626 (Red 600)
 * - Warning: #D97706 (Amber 600)
 * Typography:
 * - Sans-serif (Geist or Inter preferred)
 */

const HRMPrototype = () => {
  const [view, setView] = useState('login'); // 'login' | 'dashboard'
  const [status, setStatus] = useState('normal'); // 'normal' | 'loading' | 'error' | 'locked'
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userRole, setUserRole] = useState('Admin'); // Simulated role

  // Simulation Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      // Logic simulation
      // setStatus('error'); // Toggle these to see different states
      // setStatus('locked');
      setView('dashboard');
      setStatus('normal');
    }, 1500);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setView('login');
  };

  // --- COMPONENTS ---

  const InputField = ({ label, type, placeholder, icon: Icon }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <Icon size={18} />
        </div>
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          placeholder={placeholder}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  // --- VIEWS ---

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        {/* State Selection for Demo Review */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setStatus('normal')} className="px-3 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300">Normal</button>
          <button onClick={() => setStatus('error')} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Error</button>
          <button onClick={() => setStatus('locked')} className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200">Locked</button>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2">
                <Shield size={28} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise HRM</h1>
              <p className="text-slate-500 text-sm">Sign in to manage your workspace</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <InputField label="Email Address" type="email" placeholder="name@company.com" icon={User} />
              <InputField label="Password" type="password" placeholder="••••••••" icon={Lock} />

              {/* Status Messages */}
              {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">Invalid email or password. Please try again.</p>
                </div>
              )}

              {status === 'locked' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3 text-amber-700 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Account Locked</p>
                    <p className="text-xs">Too many failed attempts. Locked for 15 minutes.</p>
                  </div>
                </div>
              )}

              <button
                disabled={status === 'loading'}
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Authenticating...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Admin-assigned accounts only. Contact IT for access issues.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
              <Shield size={18} />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">HRM Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">Alex Rivera</p>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">{userRole}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold overflow-hidden">
               AR
            </div>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Placeholder */}
      <main className="max-w-7xl mx-auto p-12 text-center">
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome back, Alex.</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            You are currently signed in as an {userRole}. Use the navigation to manage employees and projects.
          </p>
        </div>
      </main>

      {/* Logout Confirmation Dialog (Modal Overlay) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 text-slate-900">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <LogOut size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Sign Out</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Are you sure you want to end your session?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMPrototype;
