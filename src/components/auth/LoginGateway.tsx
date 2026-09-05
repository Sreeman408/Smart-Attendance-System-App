import React, { useState } from 'react';
import { Role } from '../../types';
import { loginUser } from '../../services/authService';
import { UniversityLogo } from '../common/UniversityLogo';
import { RegisterModal } from './RegisterModal';
import {
  GraduationCap, Users, UserCheck, ShieldCheck, ArrowRight,
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
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPendingWarning('');
    setIsSubmitting(true);

    if (!loginInput.trim()) {
      setErrorMsg('Please enter your Identifier or Email.');
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your account password.');
      setIsSubmitting(false);
      return;
    }

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
    // Aesthetic Dark Color Scheme for Login Gateway (Deep Navy / Charcoal / Crimson Gradient)
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Banner Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md bg-slate-950/40">
        <UniversityLogo size="md" showText={true} />
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Capacitor Native Edition
          </span>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        
        {/* Title Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Smart Attendance CMS Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl mx-auto">
            Secure, multi-device college attendance management system for students, faculty, administrators, and parents.
          </p>
        </div>

        {/* Portal Role Cards Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          
          {/* Card 1: Student */}
          <button
            type="button"
            onClick={() => handleRoleSelect('student')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              selectedRole === 'student'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'student' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'
            }`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Student Portal</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'student' ? 'text-slate-900/80' : 'text-slate-400'}`}>
              Classes & Attendance
            </p>
          </button>

          {/* Card 2: Faculty */}
          <button
            type="button"
            onClick={() => handleRoleSelect('faculty')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              selectedRole === 'faculty'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'faculty' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'
            }`}>
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Faculty Portal</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'faculty' ? 'text-slate-900/80' : 'text-slate-400'}`}>
              Rosters & Session QR
            </p>
          </button>

          {/* Card 3: Admin */}
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              selectedRole === 'admin'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'admin' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Admin Registry</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'admin' ? 'text-slate-900/80' : 'text-slate-400'}`}>
              System & Approvals
            </p>
          </button>

          {/* Card 4: Parent */}
          <button
            type="button"
            onClick={() => handleRoleSelect('parent')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              selectedRole === 'parent'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
            }`}
          >
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${
              selectedRole === 'parent' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Parent Gateway</h3>
            <p className={`text-xs mt-1 ${selectedRole === 'parent' ? 'text-slate-900/80' : 'text-slate-400'}`}>
              Ward Performance
            </p>
          </button>

        </div>

        {/* Login Form Card with High Contrast */}
        <div className="max-w-md mx-auto w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{selectedRole} Login</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your credentials to access portal</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-lg uppercase tracking-wider">
              {selectedRole}
            </span>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-700/80 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Pending Warning Banner */}
          {pendingWarning && (
            <div className="mb-4 p-3 bg-amber-950/60 border border-amber-700/80 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong className="block font-bold">Registration Pending Approval</strong>
                <span>{pendingWarning}</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Input Identifier */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-red-800 via-red-700 to-amber-600 hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : `Enter ${selectedRole.toUpperCase()} Portal`}
            </button>
          </form>

          {/* Registration Options Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Don't have an account?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openRegister('student')}
                  className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                >
                  Student Signup
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => openRegister('faculty')}
                  className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                >
                  Faculty Signup
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Self-registrations require Admin approval before first login.</span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
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
