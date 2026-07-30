import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Clock, MapPin, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { Faculty, Subject, QRSession, TimetableSlot } from '../../types';
import { setQRSession, getQRSession, logAuditAction, getCurrentUser } from '../../services/storage';

interface Props {
  faculty: Faculty;
  subjects: Subject[];
  timetable: TimetableSlot[];
}

export const QRGenerator: React.FC<Props> = ({ faculty, subjects, timetable }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );
  const [roomNo, setRoomNo] = useState('LH-201');
  const [validityMinutes, setValidityMinutes] = useState<number>(5);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeSession, setActiveSessionState] = useState<QRSession | null>(getQRSession());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);

  // Filter subjects taught by this faculty
  const facultySubjects = subjects.filter(s => s.facultyId === faculty.id || faculty.subjectsHandled.includes(s.id));

  // Timer countdown effect for active QR session
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);

      if (remaining === 0) {
        setQRSession(null);
        setActiveSessionState(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Generate QR Code image
  const generateQRCode = async () => {
    const sub = subjects.find(s => s.id === selectedSubjectId);
    if (!sub) return;

    const token = `ACADEMIA_ATT_${sub.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000).toISOString();

    const session: QRSession = {
      id: `qr_${Date.now()}`,
      token,
      subjectId: sub.id,
      subjectName: sub.name,
      subjectType: sub.type,
      facultyId: faculty.id,
      facultyName: faculty.name,
      createdAt: new Date().toISOString(),
      expiresAt,
      roomNo,
      active: true
    };

    try {
      const url = await QRCode.toDataURL(token, {
        width: 320,
        margin: 2,
        color: {
          dark: '#312e81',
          light: '#ffffff'
        }
      });

      setQrCodeDataUrl(url);
      setQRSession(session);
      setActiveSessionState(session);

      logAuditAction(
        getCurrentUser(),
        'QR Session Created',
        `Generated ${validityMinutes}-min attendance QR for ${sub.name} (${sub.type}) in ${roomNo}`
      );
    } catch (e) {
      console.error('QR code generation error:', e);
    }
  };

  const endSession = () => {
    setQRSession(null);
    setActiveSessionState(null);
    setQrCodeDataUrl('');
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Generate Dynamic Attendance QR Code
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students scan this on their mobile devices to mark present.
            </p>
          </div>
        </div>

        {!activeSession ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Class Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {facultySubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Room / Hall No.
                </label>
                <input
                  type="text"
                  value={roomNo}
                  onChange={e => setRoomNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  QR Session Validity
                </label>
                <select
                  value={validityMinutes}
                  onChange={e => setValidityMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={3}>3 Minutes</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                </select>
              </div>
            </div>

            {currentSubject && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                <span className="font-bold">Subject Weight: </span>
                <span>
                  {currentSubject.type === 'Practical'
                    ? 'Lab Practical (3x Weight in attendance calculation)'
                    : 'Lecture (1x Weight)'}
                </span>
              </div>
            )}

            <button
              onClick={generateQRCode}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Generate & Launch Live QR
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            
            {/* Live QR session badge */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Live Class QR Active
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* QR Code graphic container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-indigo-500 shadow-xl inline-block max-w-[280px] mx-auto">
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="Attendance QR Code" className="w-full h-auto mx-auto" />
              )}
              <div className="mt-2 text-[11px] font-bold text-indigo-950 font-mono tracking-wide truncate">
                Token: {activeSession.token}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 text-left">
              <p className="font-bold text-slate-900 dark:text-white">{activeSession.subjectName}</p>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>Room: {activeSession.roomNo}</span>
                <span>•</span>
                <span>Faculty: {activeSession.facultyName}</span>
              </p>
            </div>

            <button
              onClick={endSession}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Close QR Session
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
