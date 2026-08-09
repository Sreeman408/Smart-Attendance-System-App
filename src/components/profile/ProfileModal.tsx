import React, { useState } from 'react';
import { User } from '../../types';
import { generateVerificationOTP, verifyOTPCode, saveActiveSession } from '../../services/authService';
import { saveStudentToDB, saveFacultyToDB } from '../../services/dbService';
import { X, Mail, ShieldCheck, CheckCircle, AlertCircle, Edit3, User as UserIcon, Building2, Phone } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(currentUser.email || '');
  const [step, setStep] = useState<'view' | 'otp'>('view');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleStartEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newEmail.trim() || newEmail === currentUser.email) {
      setErrorMsg('Please enter a new valid email address.');
      return;
    }
    const code = generateVerificationOTP(newEmail);
    setGeneratedOTP(code);
    setStep('otp');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const valid = verifyOTPCode(newEmail, otpInput);
    if (!valid && otpInput !== generatedOTP) {
      setErrorMsg('Invalid verification code.');
      return;
    }

    // Update Email in User state & DB
    const updatedUser: User = { ...currentUser, email: newEmail };
    await saveActiveSession(updatedUser);

    if (currentUser.role === 'student' && currentUser.studentId) {
      await saveStudentToDB({
        id: currentUser.studentId,
        name: currentUser.name,
        email: newEmail,
        rollNo: '24CS01',
        department: currentUser.department || 'Computer Science',
        year: '2nd Year',
        semester: 4,
        section: 'A',
        approvalStatus: 'approved'
      });
    } else if (currentUser.role === 'faculty' && currentUser.facultyId) {
      await saveFacultyToDB({
        id: currentUser.facultyId,
        facultyCode: 'FAC101',
        name: currentUser.name,
        email: newEmail,
        department: currentUser.department || 'Computer Science',
        designation: 'Associate Professor',
        phone: currentUser.phone || '',
        subjectsHandled: [],
        approvalStatus: 'approved'
      });
    }

    onUserUpdated(updatedUser);
    setSuccessMsg('Email updated and verified successfully!');
    setStep('view');
    setIsEditingEmail(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{currentUser.name}</h3>
              <p className="text-xs text-amber-300 font-semibold uppercase">{currentUser.role} Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'view' && (
            <div className="space-y-4">
              
              {/* Profile Card Fields */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-semibold">User Role</span>
                  <span className="font-bold uppercase text-amber-600 dark:text-amber-400">{currentUser.role}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-semibold">Department</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.department || 'Computer Science'}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 font-semibold">Email Address</span>
                    {!isEditingEmail && (
                      <button
                        onClick={() => setIsEditingEmail(true)}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Email
                      </button>
                    )}
                  </div>
                  {!isEditingEmail ? (
                    <span className="font-mono text-slate-900 dark:text-white font-bold block">{currentUser.email}</span>
                  ) : (
                    <form onSubmit={handleStartEmailUpdate} className="space-y-2 mt-2">
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingEmail(false)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                        >
                          Verify & Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="pt-2 text-center text-slate-400 text-xs">
                Annamalai University CMS &bull; Logged in session active
              </div>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 text-center">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Verify New Email</h4>
                <p className="text-xs text-slate-500 mt-1">Code sent to <strong>{newEmail}</strong></p>
              </div>

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono text-amber-800 dark:text-amber-300">
                Verification Code: <strong className="text-red-700 dark:text-amber-400 text-sm">{generatedOTP}</strong>
              </div>

              <input
                type="text"
                maxLength={6}
                required
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-xl py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('view')}
                  className="w-1/3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Email Change
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
