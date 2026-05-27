import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, LogOut, User, Shield, Lock, 
  Loader2, ChevronRight, LayoutDashboard, 
  Users, Briefcase, Settings, ShieldAlert, CheckCircle2
} from 'lucide-react';

/**
 * REUSABLE COMPONENTS
 */

const Toast = ({ toast }: { toast: { message: string; type: 'error' | 'warning' | 'success' } | null }) => (
  <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-500 transform ${toast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'} ${
    toast?.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 
    toast?.type === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
    'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
  }`}>
    {toast?.type === 'success' ? <CheckCircle2 size={20} className="animate-bounce" /> : <ShieldAlert size={20} className="animate-pulse" />}
    <span className="font-black uppercase tracking-widest text-[11px]">{toast?.message}</span>
  </div>
);

const InputField = ({ label, type, placeholder, icon: Icon, id, value, onChange, error, showPassword, setShowPassword }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <label htmlFor={id} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
        {label}
      </label>
    </div>
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-slate-600 group-focus-within:text-blue-500'}`}>
        <Icon size={18} />
      </div>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type === 'password' && showPassword ? 'text' : type}
        autoComplete="off"
        className={`w-full pl-12 pr-12 py-4 bg-slate-950/40 border-2 rounded-2xl focus:outline-none transition-all text-sm font-bold tracking-wide text-white placeholder:text-slate-800 ${
          error ? 'border-red-500/20 focus:border-red-500' : 'border-slate-900 focus:border-blue-600/50'
        }`}
        placeholder={placeholder}
      />
      {type === 'password' && (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

const HRMPrototype = () => {
  const [view, setView] = useState('login'); 
  const [status, setStatus] = useState('normal'); 
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShake, setIsShake] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' } | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerShake = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    if (!email || !password) {
      setErrors({ email: !email, password: !password });
      setToast({ message: 'Error: Identity and Access Key are required.', type: 'error' });
      triggerShake();
      return;
    }

    setStatus('loading');
    
    // Simulation Logic
    setTimeout(() => {
      if (email === 'error@corp.com') {
        setToast({ message: 'Access Denied: Invalid credentials.', type: 'error' });
        triggerShake();
        setStatus('normal');
      } else if (email === 'lock@corp.com') {
        setToast({ message: 'Terminal Locked: Too many attempts.', type: 'warning' });
        triggerShake();
        setStatus('normal');
      } else {
        setToast({ message: 'Success: Authentication verified. Welcome.', type: 'success' });
        setTimeout(() => {
          setView('dashboard');
          setStatus('normal');
        }, 1000);
      }
    }, 1500);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setView('login');
    setToast({ message: 'System: Session terminated successfully.', type: 'success' });
    setEmail('');
    setPassword('');
    setErrors({});
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans selection:bg-blue-600/30 overflow-hidden">
        <Toast toast={toast} />
        
        {/* Background FX */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" />
        </div>

        <div 
          className={`w-full max-w-[420px] transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} 
          style={isShake ? { animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' } : {}}
        >
          <style>{`
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0); }
              20%, 80% { transform: translate3d(2px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
              40%, 60% { transform: translate3d(4px, 0, 0); }
            }
          `}</style>
          
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex w-20 h-20 bg-gradient-to-tr from-blue-700 to-blue-400 rounded-[2.5rem] items-center justify-center shadow-2xl shadow-blue-600/30 rotate-3">
              <Shield size={40} className="text-white" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">SECURE.</h1>
            <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px]">Authorization Terminal</p>
          </div>

          <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
              <InputField 
                id="email" 
                label="Identity" 
                type="email" 
                placeholder="EMAIL@CORP.COM" 
                icon={User} 
                value={email} 
                onChange={setEmail} 
                error={errors.email} 
              />
              <InputField 
                id="password" 
                label="Access Key" 
                type="password" 
                placeholder="••••••••" 
                icon={Lock} 
                value={password} 
                onChange={setPassword} 
                error={errors.password} 
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />

              <button 
                disabled={status === 'loading'} 
                type="submit" 
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ChevronRight size={18} /></>}
              </button>
            </form>
          </div>
          
          <p className="mt-10 text-center text-slate-700 font-black text-[9px] uppercase tracking-[0.3em]">
            Strict Monitoring Enabled &copy; 2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans">
      <Toast toast={toast} />
      <aside className="w-72 border-r border-white/5 flex flex-col p-8">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter">HRM.PRO</span>
        </div>
        <nav className="flex-1 space-y-4">
          {['Dashboard', 'Employees', 'Projects', 'Settings'].map((l, i) => (
            <div key={l} className={`p-4 rounded-xl font-black uppercase tracking-widest text-[10px] ${i === 0 ? 'bg-blue-600/10 text-blue-500' : 'text-slate-600'}`}>{l}</div>
          ))}
        </nav>
        <button onClick={() => setShowLogoutConfirm(true)} className="p-4 bg-red-500/10 text-red-500 rounded-xl font-black uppercase tracking-widest text-[10px]">Logout</button>
      </aside>
      <main className="flex-1 p-20">
        <h2 className="text-6xl font-black tracking-tighter mb-4">Dashboard.</h2>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Active User: Rivera, Alex</p>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-white/10 p-12 rounded-[3rem] max-w-sm w-full text-center space-y-8">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl mx-auto flex items-center justify-center"><LogOut size={40} /></div>
            <h3 className="text-3xl font-black tracking-tighter uppercase">Exit?</h3>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px]">No</button>
              <button onClick={confirmLogout} className="flex-1 py-4 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMPrototype;
