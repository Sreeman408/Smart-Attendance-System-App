import React, { useState } from 'react';
import { Role } from '../../types';
import { loginUser } from '../../services/authService';
import { UniversityLogo } from '../common/UniversityLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { RegisterModal } from './RegisterModal';
import {
  GraduationCap, Users, UserCheck, ShieldCheck,
  Lock, Mail, AlertTriangle, CheckCircle, Info, Sparkles, LogIn
} from 'lucide-react';

interface LoginGatewayProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingWarning, setPendingWarning] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerRole, setRegisterRole] = useState<'student' | 'faculty'>('student');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setErrorMsg('');
    setPendingWarning('');
    setLoginInput('');
    setPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPendingWarning('');

    if (!loginInput.trim()) {
      setErrorMsg('Please enter your Identifier or Email.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser(loginInput, password, selectedRole);
      setIsSubmitting(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else if (result.pendingApproval) {
        setPendingWarning(result.message);
      } else {
        setErrorMsg(result.message || 'Login failed. Please verify credentials.');
      }
    } catch (e) {
      setIsSubmitting(false);
      setErrorMsg('Network error connecting to auth server.');
    }
  };

  const openRegister = (role: 'student' | 'faculty') => {
    setRegisterRole(role);
    setIsRegisterOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-red-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      
      {/* Top Banner Header with Theme Toggle */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md bg-white/80 dark:bg-slate-950/40 sticky top-0 z-30">
        <UniversityLogo size="md" showText={true} />
        
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:flex text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-3 py-1.5 rounded-full items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Capacitor Native Edition
          </span>
          
          {/* Theme Toggle Button for Login Portal */}
          <div className="p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        
        {/* Title Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Smart Attendance CMS Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            Secure, multi-device college attendance management system for students, faculty, administrators, and parents.
          </p>
        </div>

        {/* Portal Role Cards Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          
          {/* Card 1: Student */}
          <button
            type="button"
            onClick={() => handleRoleSelect('student')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:border-amber-400 dark:hover:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'student' ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
            }`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Student Portal</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'student' ? 'text-slate-950/80 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              Classes & Attendance
            </p>
          </button>

          {/* Card 2: Faculty */}
          <button
            type="button"
            onClick={() => handleRoleSelect('faculty')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              selectedRole === 'faculty'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:border-amber-400 dark:hover:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'faculty' ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
            }`}>
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Faculty Portal</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'faculty' ? 'text-slate-950/80 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              Rosters & Session QR
            </p>
          </button>

          {/* Card 3: Admin */}
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:border-amber-400 dark:hover:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'admin' ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Admin Registry</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'admin' ? 'text-slate-950/80 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              System & Approvals
            </p>
          </button>

          {/* Card 4: Parent */}
          <button
            type="button"
            onClick={() => handleRoleSelect('parent')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              selectedRole === 'parent'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:border-amber-400 dark:hover:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'parent' ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Parent Gateway</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'parent' ? 'text-slate-950/80 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              Ward Performance
            </p>
          </button>

        </div>

        {/* Login Form Card with High Contrast */}
        <div className="max-w-md mx-auto w-full bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-colors">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{selectedRole} Login</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter your credentials to access portal</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-lg uppercase tracking-wider">
              {selectedRole}
            </span>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Pending Warning Banner */}
          {pendingWarning && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/80 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="block font-bold">Registration Pending Approval</strong>
                <span>{pendingWarning}</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Input Identifier */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {selectedRole === 'student' && 'Roll No / Email'}
                {selectedRole === 'faculty' && 'Staff Code / Email'}
                {selectedRole === 'admin' && 'Admin Email / ID'}
                {selectedRole === 'parent' && 'Registered Email / Phone'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder={
                    selectedRole === 'student' ? 'e.g. 24CS01 or rahul.sharma@student.edu' :
                    selectedRole === 'faculty' ? 'e.g. FAC101 or robert.langdon@college.edu' :
                    selectedRole === 'admin' ? 'admin@college.edu' : 'parent@gmail.com'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-red-800 via-red-700 to-amber-600 hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : `Enter ${selectedRole.toUpperCase()} Portal`}
            </button>
          </form>

          {/* Registration Options Footer */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Don't have an account?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openRegister('student')}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  Student Signup
                </button>
                <span className="text-slate-400 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => openRegister('faculty')}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  Faculty Signup
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Self-registrations require Admin approval before first login.</span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
        Smart Attendance CMS Portal &copy; 2026. All rights reserved.
      </footer>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        initialRole={registerRole}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          setPendingWarning(msg);
        }}
      />
    </div>
  );
};
