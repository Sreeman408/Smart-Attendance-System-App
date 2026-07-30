import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { Student, AttendanceRecord, QRSession, Subject } from '../../types';
import { getQRSession, addAttendanceRecord, logAuditAction, getCurrentUser } from '../../services/storage';

interface Props {
  student: Student;
  subjects: Subject[];
  onAttendanceSuccess?: () => void;
}

export const QRScanner: React.FC<Props> = ({ student, subjects, onAttendanceSuccess }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const activeQRSession = getQRSession();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, []);

  const startCamera = () => {
    setIsCameraActive(true);
    setStatusMsg(null);

    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            handleProcessScannedToken(decodedText);
            scanner.clear().catch(e => console.error(e));
            setIsCameraActive(false);
          },
          (error) => {
            // quiet ignore camera frame errors
          }
        );
      } catch (err) {
        console.error('Camera init error:', err);
        setStatusMsg({
          type: 'error',
          text: 'Camera access denied or unavailable. You can use Quick Test Scan below.'
        });
      }
    }, 200);
  };

  const handleProcessScannedToken = (token: string) => {
    const activeSession = getQRSession();

    if (!activeSession) {
      setStatusMsg({
        type: 'error',
        text: 'Invalid or Expired QR Code! Please ask your professor to regenerate a live session.'
      });
      return;
    }

    if (token !== activeSession.token && !token.includes(activeSession.subjectId)) {
      setStatusMsg({
        type: 'error',
        text: 'QR Token mismatch for this class session.'
      });
      return;
    }

    const sub = subjects.find(s => s.id === activeSession.subjectId);
    const todayStr = new Date().toISOString().split('T')[0];

    const record: AttendanceRecord = {
      id: `att_${todayStr}_${activeSession.subjectId}_${student.id}`,
      date: todayStr,
      studentId: student.id,
      studentName: student.name,
      subjectId: activeSession.subjectId,
      subjectName: activeSession.subjectName,
      subjectType: activeSession.subjectType,
      status: 'present',
      slotId: activeSession.id,
      markedByFacultyId: activeSession.facultyId,
      markedAt: new Date().toISOString(),
      method: 'qr_code',
      notes: `Scanned via mobile QR scanner in ${activeSession.roomNo}`
    };

    addAttendanceRecord(record);

    logAuditAction(
      getCurrentUser(),
      'QR Attendance Logged',
      `${student.name} (${student.rollNo}) logged Present for ${activeSession.subjectName} via QR Code`
    );

    setStatusMsg({
      type: 'success',
      text: `🎉 Attendance Marked Present for ${activeSession.subjectName}! (${activeSession.subjectType === 'Practical' ? '3x Weight' : '1x Weight'})`
    });

    if (onAttendanceSuccess) onAttendanceSuccess();
  };

  const simulateQuickScan = () => {
    if (activeQRSession) {
      handleProcessScannedToken(activeQRSession.token);
    } else {
      // Simulate demo attendance for first subject
      const sub = subjects[0];
      if (!sub) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const record: AttendanceRecord = {
        id: `att_${todayStr}_${sub.id}_${student.id}`,
        date: todayStr,
        studentId: student.id,
        studentName: student.name,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectType: sub.type,
        status: 'present',
        markedByFacultyId: sub.facultyId,
        markedAt: new Date().toISOString(),
        method: 'qr_code'
      };

      addAttendanceRecord(record);
      setStatusMsg({
        type: 'success',
        text: `🎉 Demo Attendance Marked Present for ${sub.name}!`
      });
      if (onAttendanceSuccess) onAttendanceSuccess();
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Scan Class Attendance QR Code
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Point your camera at the screen projected by your professor.
            </p>
          </div>
        </div>

        {/* Status Message Alert */}
        {statusMsg && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <div>
              <p>{statusMsg.text}</p>
            </div>
          </div>
        )}

        {/* Active Session Notice */}
        {activeQRSession && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <div>
              <span className="font-bold block">Live Class Session Detected:</span>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                {activeQRSession.subjectName} ({activeQRSession.roomNo})
              </span>
            </div>
            <button
              onClick={simulateQuickScan}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto Scan Now
            </button>
          </div>
        )}

        {/* Camera Scanner Viewport */}
        <div className="space-y-3">
          {!isCameraActive ? (
            <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <Camera className="w-10 h-10 mx-auto text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Ready to Scan
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click below to open your camera or use instant test scan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Launch Camera Scanner
                </button>

                <button
                  onClick={simulateQuickScan}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Test Auto Scan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div id="qr-reader-container" className="w-full rounded-2xl overflow-hidden border-2 border-indigo-500" />
              <button
                onClick={() => {
                  if (scannerRef.current) scannerRef.current.clear().catch(e => console.error(e));
                  setIsCameraActive(false);
                }}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel Camera
              </button>
            </div>
          )}
        </div>

        {/* Manual Code Input fallback */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Manual Token Key Entry
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ACADEMIA_ATT_SUB101_172000"
              value={manualTokenInput}
              onChange={e => setManualTokenInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleProcessScannedToken(manualTokenInput)}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
