import React, { useState, useEffect } from 'react';
import { Faculty, Subject, Student, AttendanceRecord, TimetableSlot, AttendanceStatus, SaturdayConfig } from '../../types';
import { QRGenerator } from '../qr/QRGenerator';
import { ReportsManager } from '../reports/ReportsManager';
import { LeaveManager } from '../leaves/LeaveManager';
import { CheckSquare, QrCode, Clock, Users, CheckCircle2, Save, Calendar, Download, AlertCircle, FileSpreadsheet, MapPin } from 'lucide-react';
import { addAttendanceRecordToDB, fetchAttendanceRecordsFromDB, fetchSaturdayConfigFromDB, addAuditLogDB } from '../../services/dbService';
import * as XLSX from 'xlsx';

interface Props {
  faculty: Faculty;
  subjects: Subject[];
  students: Student[];
  timetable: TimetableSlot[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const FacultyDashboard: React.FC<Props> = ({
  faculty,
  subjects,
  students,
  timetable,
  activeTab,
  onTabChange
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSaturdaySession, setIsSaturdaySession] = useState<boolean>(false);
  const [saturdayConfig, setSaturdayConfig] = useState<SaturdayConfig>({ mappedDay: 'Monday', enabled: true });
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);

  // Faculty subjects
  const facultySubjects = subjects.filter(s => s.facultyId === faculty.id || (faculty.subjectsHandled && faculty.subjectsHandled.includes(s.id)));
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0] || facultySubjects[0];

  useEffect(() => {
    async function initData() {
      const cfg = await fetchSaturdayConfigFromDB();
      setSaturdayConfig(cfg);
      const recs = await fetchAttendanceRecordsFromDB();
      setAllAttendance(recs);
    }
    initData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const day = new Date(selectedDate).getDay();
      setIsSaturdaySession(day === 6);
    }
  }, [selectedDate]);

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach(st => { initial[st.id] = 'present'; });
    return initial;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleStatusToggle = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(st => { updated[st.id] = status; });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!currentSubject) return;

    for (const st of students) {
      const status = attendanceMap[st.id] || 'present';
      const record: AttendanceRecord = {
        id: `att_${selectedDate}_${currentSubject.id}_${st.id}`,
        date: selectedDate,
        studentId: st.id,
        studentName: st.name,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        subjectType: currentSubject.type,
        status,
        markedByFacultyId: faculty.id,
        markedAt: new Date().toISOString(),
        method: 'manual',
        isSaturday: isSaturdaySession
      };
      await addAttendanceRecordToDB(record);
    }

    await addAuditLogDB(
      faculty.id,
      faculty.name,
      'faculty',
      'Faculty Marked Attendance',
      `Marked ${isSaturdaySession ? 'SATURDAY' : 'REGULAR'} attendance for ${students.length} students in ${currentSubject.name}`
    );

    const updatedRecs = await fetchAttendanceRecordsFromDB();
    setAllAttendance(updatedRecs);

    setSaveSuccessMsg(`✅ Saved ${isSaturdaySession ? 'Saturday' : ''} attendance for ${currentSubject.name} on ${selectedDate}!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const exportClassPercentageReport = () => {
    if (!currentSubject) return;

    const subjectRecords = allAttendance.filter(r => r.subjectId === currentSubject.id);

    const reportRows = students.map(st => {
      const studentRecs = subjectRecords.filter(r => r.studentId === st.id);
      const totalClasses = studentRecs.length;
      const attendedClasses = studentRecs.filter(r => r.status === 'present').length;
      const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;
      
      let statusTag = 'Safe';
      if (percentage < 65) statusTag = 'Shortage';
      else if (percentage < 75) statusTag = 'Borderline';

      return {
        'Student Roll No': st.rollNo,
        'Student Name': st.name,
        'Department': st.department,
        'Semester & Section': `Sem ${st.semester} (${st.section})`,
        'Subject Code': currentSubject.code,
        'Subject Name': currentSubject.name,
        'Total Classes Held': totalClasses,
        'Classes Attended': attendedClasses,
        'Attendance Percentage (%)': `${percentage}%`,
        'Status Tag': statusTag
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Class Attendance Percentage');
    XLSX.writeFile(wb, `Class_Attendance_Report_${currentSubject.code}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportSaturdayReport = () => {
    const saturdayRecords = allAttendance.filter(r => r.isSaturday || new Date(r.date).getDay() === 6);
    if (saturdayRecords.length === 0) {
      alert('No Saturday attendance records found to export.');
      return;
    }

    const reportRows = saturdayRecords.map(r => ({
      'Date': r.date,
      'Session Day': 'Saturday',
      'Student Roll No': students.find(s => s.id === r.studentId)?.rollNo || r.studentId,
      'Student Name': r.studentName || students.find(s => s.id === r.studentId)?.name || 'Student',
      'Subject Code': currentSubject?.code || 'CS401',
      'Subject Name': r.subjectName,
      'Type': r.subjectType,
      'Weight': r.subjectType === 'Practical' ? '3x (Lab)' : '1x (Lecture)',
      'Status': r.status.toUpperCase(),
      'Marked By': faculty.name
    }));

    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saturday Attendance');
    XLSX.writeFile(wb, `Saturday_Attendance_${faculty.name.replace(/\s+/g, '_')}.xlsx`);
  };

  // 1. QR Generator Tab
  if (activeTab === 'qr_gen') {
    return <QRGenerator faculty={faculty} subjects={subjects} timetable={timetable} />;
  }

  // 2. Reports Tab
  if (activeTab === 'reports') {
    return <ReportsManager students={students} subjects={subjects} />;
  }

  // 3. Leaves Tab
  if (activeTab === 'leaves') {
    return (
      <LeaveManager
        user={{
          id: faculty.id,
          name: faculty.name,
          role: 'faculty',
          email: faculty.email,
          facultyId: faculty.id
        }}
        onLeaveUpdated={() => {}}
      />
    );
  }

  // 4. Timetable Schedule Tab
  if (activeTab === 'timetable') {
    const facultySlots = timetable.filter(t => t.facultyId === faculty.id || t.facultyName.includes(faculty.name));
    
    // Add Saturday slots if mapping is enabled
    const saturdaySlots: TimetableSlot[] = saturdayConfig.enabled ? facultySlots
      .filter(t => t.dayOfWeek === saturdayConfig.mappedDay)
      .map((t, idx) => ({
        ...t,
        id: `fac_sat_slot_${idx}_${t.id}`,
        dayOfWeek: 'Saturday',
        isSaturdayMapped: true
      })) : [];

    const fullFacultyTimetable = [...facultySlots, ...saturdaySlots];

    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Faculty Teaching Schedule ({faculty.name})
              </h3>
              <p className="text-xs text-slate-500">
                {faculty.department} • {faculty.designation}
              </p>
            </div>
          </div>

          {saturdayConfig.enabled && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                Saturday Class copies <strong>{saturdayConfig.mappedDay}'s</strong> teaching schedule.
              </span>
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] rounded uppercase">Active Mapping</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fullFacultyTimetable.map(slot => (
              <div key={slot.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md">
                    {slot.dayOfWeek} • {slot.timeSlot}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Room: {slot.roomNo}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {slot.subjectName} ({slot.subjectCode})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {slot.department} • Sem {slot.semester} (Section {slot.section})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: Roster & Class Marking Grid (for 'dashboard' or 'mark' tabs)
  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-fade-in pb-12">
      
      {/* Class Selector Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Faculty Portal - Class Attendance Roster
              </h3>
              <p className="text-xs text-slate-500">
                {faculty.name} ({faculty.designation}) • {faculty.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportClassPercentageReport}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Class Percentage (CSV/Excel)
            </button>

            <button
              onClick={exportSaturdayReport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Saturday CSV/Excel
            </button>

            <button
              onClick={() => onTabChange('qr_gen')}
              className="px-3.5 py-2 bg-gradient-to-r from-red-900 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              Generate Class QR Code
            </button>
          </div>
        </div>

        {/* Date and Subject Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Select Course / Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {facultySubjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Attendance Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {isSaturdaySession && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Saturday Session Active (Following {saturdayConfig.mappedDay}'s Timetable)
            </span>
            <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold uppercase">
              Saturday Class
            </span>
          </div>
        )}

        {currentSubject && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="font-semibold">
              Subject Weight: <strong className="text-amber-600 dark:text-amber-400">{currentSubject.type}</strong> ({currentSubject.type === 'Practical' ? '3x Weight (Lab)' : '1x Weight (Lecture)'})
            </span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkMark('present')} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg">Mark All Present</button>
              <button onClick={() => handleBulkMark('absent')} className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-lg">Mark All Absent</button>
            </div>
          </div>
        )}

      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Student Roster List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            Class Student Roster ({students.length} Enrolled)
          </h4>

          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save Attendance
          </button>
        </div>

        <div className="space-y-2">
          {students.map(st => {
            const currentStatus = attendanceMap[st.id] || 'present';
            const studentSatRecs = allAttendance.filter(r => r.studentId === st.id && (r.isSaturday || new Date(r.date).getDay() === 6));
            const satPresentCount = studentSatRecs.filter(r => r.status === 'present' || r.status === 'late').length;
            const satPct = studentSatRecs.length > 0 ? Math.round((satPresentCount / studentSatRecs.length) * 100) : 100;

            return (
              <div
                key={st.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 font-bold flex items-center justify-center text-xs">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{st.name}</h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {st.rollNo} • Sem {st.semester} ({st.section}) • Sat Attendance: <strong className="text-amber-500">{satPct}%</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  {(['present', 'absent'] as AttendanceStatus[]).map(stt => (
                    <button
                      key={stt}
                      onClick={() => handleStatusToggle(st.id, stt)}
                      className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        currentStatus === stt
                          ? stt === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                            : 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {stt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveAttendance}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save Class Attendance
          </button>
        </div>
      </div>

    </div>
  );
};
