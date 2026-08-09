import React, { useState } from 'react';
import { Role } from '../../types';
import { generateVerificationOTP, verifyOTPCode } from '../../services/authService';
import { submitRegistrationRequestDB } from '../../services/dbService';
import { UniversityLogo } from '../common/UniversityLogo';
import { X, CheckCircle, Mail, AlertCircle, ShieldCheck, UserCheck, GraduationCap, Building2, User, Key, Phone } from 'lucide-react';

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
  
  // Student Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  // OTP Verification State
  const [step, setStep] = useState<'form' | 'otp' | 'pending'>('form');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [userOTPInput, setUserOTPInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please fill in all required fields.');
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

    // Generate Verification Code
    const code = generateVerificationOTP(email);
    setGeneratedOTP(code);
    setStep('otp');
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const isCorrect = verifyOTPCode(email, userOTPInput);
    if (!isCorrect && userOTPInput !== generatedOTP) {
      setErrorMsg('Invalid or expired verification code. Please check your code and try again.');
      setLoading(false);
      return;
    }

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
      verifiedEmail: true
    };

    await submitRegistrationRequestDB(reqData);
    setLoading(false);
    setStep('pending');
  };

  const handleFinish = () => {
    onSuccess('Registration application submitted! Your account is pending Admin approval.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UniversityLogo size="sm" />
            <div>
              <h3 className="font-bold text-lg leading-tight">University Registration</h3>
              <p className="text-xs text-amber-300 font-medium">Create your official CMS Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">

          {/* STEP 1: Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Role Toggle Switch */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    role === 'student'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Signup
                </button>
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    role === 'faculty'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Faculty Signup
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. student@annamalai.edu"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Parent / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        placeholder="e.g. Vikram Sharma"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Parent Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={parentPhone}
                        onChange={e => setParentPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-gradient-to-r from-red-900 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Proceed to Email Verification
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Verify Email Address</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter the 6-digit verification code sent to <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
                </p>
              </div>

              {/* Demo OTP Banner for Instant Testing */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs text-center font-mono">
                Verification Code: <strong className="text-sm font-bold tracking-widest text-red-700 dark:text-amber-400">{generatedOTP}</strong>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={userOTPInput}
                  onChange={e => setUserOTPInput(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest font-mono text-xl py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-1/3 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting...' : 'Submit for Admin Approval'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Pending Confirmation View */}
          {step === 'pending' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl text-slate-900 dark:text-white">Registration Application Submitted!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your profile details have been sent to the Admin Registry. Once approved by the administrator, you will be able to log in with your credentials.
              </p>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500">
                Application ID: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">REQ_{Date.now().toString().slice(-6)}</span>
              </div>
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-xl shadow-lg"
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
