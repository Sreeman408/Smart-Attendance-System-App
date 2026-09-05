import React, { useState } from 'react';
import { Role } from '../../types';
import { sendEmailVerificationOTP, verifyOTPCodeAsync, checkEmailVerifiedStatus } from '../../services/authService';
import { submitRegistrationRequestDB } from '../../services/dbService';
import { UniversityLogo } from '../common/UniversityLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { hashPassword } from '../../utils/cryptoUtils';
import { X, CheckCircle, Mail, AlertCircle, ShieldCheck, UserCheck, GraduationCap, Building2, User, Key, Phone, Lock, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'student' | 'faculty';
  onSuccess: (msg: string) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  onSuccess
}) => {
  const [role, setRole] = useState<'student' | 'faculty'>(initialRole);
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Student Form Fields
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('2nd Year');
  const [semester, setSemester] = useState<number>(4);
  const [section, setSection] = useState('A');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Faculty Form Fields
  const [facultyCode, setFacultyCode] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('');

  // OTP & Verification State
  const [step, setStep] = useState<'form' | 'otp' | 'pending'>('form');
  const [otpInfoMsg, setOtpInfoMsg] = useState('');
  const [userOTPInput, setUserOTPInput] = useState('');
  const [verificationMode, setVerificationMode] = useState<'code' | 'link'>('code');
  const [checkingLinkStatus, setCheckingLinkStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check your password input.');
      return;
    }

    if (role === 'student' && !rollNo.trim()) {
      setErrorMsg('Student Roll Number is required.');
      return;
    }

    if (role === 'faculty' && !facultyCode.trim()) {
      setErrorMsg('Faculty Staff Code is required.');
      return;
    }

    setLoading(true);
    const res = await sendEmailVerificationOTP(email);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Failed to send verification email. Please try again.');
      return;
    }

    setOtpInfoMsg(res.message);
    setStep('otp');
  };

  const handleOTPInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.startsWith('http://') || val.startsWith('https://') || val.includes('verify?') || val.includes('token=')) {
      setVerificationMode('link');
      setUserOTPInput(val);
    } else {
      setUserOTPInput(val);
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    const hashedPwd = await hashPassword(password);

    // Prepare Registration Request for Admin Queue
    const requestId = `REQ_${Date.now()}`;
    const reqData = {
      id: requestId,
      role,
      name,
      email,
      rollNo: role === 'student' ? rollNo : undefined,
      facultyCode: role === 'faculty' ? facultyCode : undefined,
      department,
      year: role === 'student' ? year : undefined,
      semester: role === 'student' ? Number(semester) : undefined,
      section: role === 'student' ? section : undefined,
      designation: role === 'faculty' ? designation : undefined,
      phone,
      parentName: role === 'student' ? parentName : undefined,
      parentPhone: role === 'student' ? parentPhone : undefined,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
      verifiedEmail: true,
      passwordHash: hashedPwd
    };

    const savedOk = await submitRegistrationRequestDB(reqData);
    setLoading(false);
    if (!savedOk) {
      setErrorMsg('Failed to save registration application to Cloud Database. Please check your internet connection.');
      return;
    }
    setStep('pending');
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const isCorrect = await verifyOTPCodeAsync(email, userOTPInput);
    if (!isCorrect) {
      const isAlreadyVerified = await checkEmailVerifiedStatus(email);
      if (!isAlreadyVerified) {
        setErrorMsg('Invalid or expired verification code or link. If you received a link in your email, paste it in the "Paste Link" tab or click it in your email.');
        setLoading(false);
        return;
      }
    }

    await completeRegistration();
  };

  const handleCheckLinkStatus = async () => {
    setErrorMsg('');
    setCheckingLinkStatus(true);
    try {
      const isVerified = await checkEmailVerifiedStatus(email);
      if (isVerified) {
        await completeRegistration();
        return;
      } else {
        setErrorMsg('Verification link not confirmed yet. If you clicked the link, please wait a moment and try again, or paste the link directly.');
      }
    } catch {
      setErrorMsg('Failed to check link verification status.');
    } finally {
      setCheckingLinkStatus(false);
    }
  };

  const handleFinish = () => {
    onSuccess('Registration application submitted! Your account is pending Admin approval.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UniversityLogo size="sm" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Portal Registration</h3>
              <p className="text-xs text-amber-300 font-medium">Create your official CMS Profile & Credentials</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* STEP 1: Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Role Toggle Switch */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'student'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Signup
                </button>
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'faculty'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Faculty Signup
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. student@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Create Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* STUDENT SPECIFIC FIELDS */}
              {role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={rollNo}
                        onChange={e => setRollNo(e.target.value)}
                        placeholder="24CS01"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Tech">Information Tech</option>
                        <option value="Electronics & Comm">Electronics & Comm</option>
                        <option value="Mechanical Engg">Mechanical Engg</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Year *
                      </label>
                      <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Semester *
                      </label>
                      <select
                        value={semester}
                        onChange={e => setSemester(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      >
                        {[1,2,3,4,5,6,7,8].map(s => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        placeholder="A"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Parent / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        placeholder="e.g. Vikram Sharma"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Parent Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={parentPhone}
                        onChange={e => setParentPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* FACULTY SPECIFIC FIELDS */}
              {role === 'faculty' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Faculty Staff Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={facultyCode}
                        onChange={e => setFacultyCode(e.target.value)}
                        placeholder="CS-FAC-03"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Tech">Information Tech</option>
                        <option value="Electronics & Comm">Electronics & Comm</option>
                        <option value="Mechanical Engg">Mechanical Engg</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={e => setDesignation(e.target.value)}
                        placeholder="Assistant Professor"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98401 98765"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-red-900 to-amber-600 hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {loading ? 'Sending Verification Code...' : 'Proceed to Real Email Verification'}
              </button>
            </form>
          )}

          {/* STEP 2: Real OTP / Link Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Verify Email Address</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  We sent a verification to <strong className="text-slate-900 dark:text-slate-100 font-bold">{email}</strong>
                </p>
              </div>

              {/* Real OTP Banner info */}
              {otpInfoMsg && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 text-xs text-center font-mono">
                  {otpInfoMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Verification Mode Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setVerificationMode('code')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    verificationMode === 'code'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  6-Digit OTP Code
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationMode('link')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    verificationMode === 'link'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Paste Sign-up Link
                </button>
              </div>

              {verificationMode === 'code' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required={verificationMode === 'code'}
                    value={userOTPInput}
                    onChange={handleOTPInputChange}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-2xl font-bold py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Paste Sign-up / Verification Link
                  </label>
                  <input
                    type="text"
                    required={verificationMode === 'link'}
                    value={userOTPInput}
                    onChange={handleOTPInputChange}
                    placeholder="https://...supabase.co/auth/v1/verify?token=..."
                    className="w-full text-xs font-mono py-3 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-amber-500 dark:caret-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
              )}

              {/* Informative Guidance Card */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Received a sign-up link instead of a 6-digit code?</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>Option A:</strong> Click the link in your email, then tap <em>"I Clicked the Link in Email"</em> below.
                </p>
                <p className="leading-relaxed">
                  • <strong>Option B:</strong> Switch to the <em>"Paste Sign-up Link"</em> tab above and paste the email link directly.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="w-1/3 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    {loading ? 'Submitting...' : 'Submit for Admin Approval'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCheckLinkStatus}
                  disabled={checkingLinkStatus || loading}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${checkingLinkStatus ? 'animate-spin' : ''}`} />
                  {checkingLinkStatus ? 'Checking Email Link Status...' : 'I Clicked the Link in Email (Verify Link Status)'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Pending Confirmation View */}
          {step === 'pending' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl text-slate-900 dark:text-white">Registration Application Submitted!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your profile & credentials have been sent to the Admin Registry. Once approved by the administrator, you will be able to log in with your chosen password.
              </p>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Return to Login Screen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
