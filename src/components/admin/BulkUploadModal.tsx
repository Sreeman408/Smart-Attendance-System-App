import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveStudentToDB, saveFacultyToDB, saveSubjectToDB, saveTimetableSlotToDB } from '../../services/dbService';
import { Student, Faculty, Subject, TimetableSlot } from '../../types';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, FileText } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [targetType, setTargetType] = useState<'students' | 'faculty' | 'subjects' | 'timetable'>('students');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setStatusMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setErrorMsg('Uploaded file contains no data rows.');
          return;
        }

        setParsedRows(data);
        setStatusMsg(`Parsed ${data.length} records successfully. Preview below before importing.`);
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg('Failed to parse Excel/CSV file. Please ensure correct format.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      let count = 0;
      if (targetType === 'students') {
        for (const row of parsedRows) {
          const stu: Student = {
            id: row.id || `STU_${Date.now()}_${count}`,
            rollNo: row.rollNo || row.roll_no || `24CS${10 + count}`,
            name: row.name || 'Student Name',
            email: row.email || `student_${count}@college.edu`,
            department: row.department || 'Computer Science',
            year: row.year || '2nd Year',
            semester: Number(row.semester) || 4,
            section: row.section || 'A',
            parentName: row.parentName || row.parent_name,
            parentPhone: row.parentPhone || row.parent_phone,
            approvalStatus: 'approved'
          };
          await saveStudentToDB(stu);
          count++;
        }
      } else if (targetType === 'faculty') {
        for (const row of parsedRows) {
          const fac: Faculty = {
            id: row.id || `FAC_${Date.now()}_${count}`,
            facultyCode: row.facultyCode || row.faculty_code || `FAC-${100 + count}`,
            name: row.name || 'Faculty Member',
            email: row.email || `faculty_${count}@college.edu`,
            department: row.department || 'Computer Science',
            designation: row.designation || 'Lecturer',
            phone: row.phone || '',
            subjectsHandled: [],
            approvalStatus: 'approved'
          };
          await saveFacultyToDB(fac);
          count++;
        }
      } else if (targetType === 'subjects') {
        for (const row of parsedRows) {
          const sub: Subject = {
            id: row.id || `SUB_${Date.now()}_${count}`,
            code: row.code || `CS40${count+1}`,
            name: row.name || 'Subject Name',
            department: row.department || 'Computer Science',
            semester: Number(row.semester) || 4,
            type: row.type === 'Practical' ? 'Practical' : 'Lecture',
            credits: Number(row.credits) || 3,
            facultyId: row.facultyId || row.faculty_id || 'FAC101'
          };
          await saveSubjectToDB(sub);
          count++;
        }
      } else if (targetType === 'timetable') {
        for (const row of parsedRows) {
          const slot: TimetableSlot = {
            id: row.id || `SLOT_${Date.now()}_${count}`,
            dayOfWeek: row.dayOfWeek || row.day_of_week || 'Monday',
            timeSlot: row.timeSlot || row.time_slot || '09:00 AM - 10:00 AM',
            subjectId: row.subjectId || row.subject_id || 'SUB101',
            subjectName: row.subjectName || row.subject_name || 'Subject',
            subjectCode: row.subjectCode || row.subject_code || 'CS401',
            subjectType: row.subjectType || row.subject_type || 'Lecture',
            facultyId: row.facultyId || row.faculty_id || 'FAC101',
            facultyName: row.facultyName || row.faculty_name || 'Faculty',
            roomNo: row.roomNo || row.room_no || 'LH-201',
            department: row.department || 'Computer Science',
            semester: Number(row.semester) || 4,
            section: row.section || 'A'
          };
          await saveTimetableSlotToDB(slot);
          count++;
        }
      }

      setIsProcessing(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setIsProcessing(false);
      setErrorMsg('Error inserting rows into database. Check data schema.');
    }
  };

  const downloadSampleCSV = () => {
    let sampleData: any[] = [];
    if (targetType === 'students') {
      sampleData = [{
        rollNo: '24CS05', name: 'Kavita Sundaram', email: 'kavita@student.edu',
        department: 'Computer Science', year: '2nd Year', semester: 4, section: 'A', parentName: 'Sundaram P', parentPhone: '+91 98401 11223'
      }];
    } else if (targetType === 'faculty') {
      sampleData = [{
        facultyCode: 'CS-FAC-05', name: 'Dr. Anand Kumar', email: 'anand.kumar@college.edu',
        department: 'Computer Science', designation: 'Professor', phone: '+91 98765 00112'
      }];
    } else if (targetType === 'subjects') {
      sampleData = [{
        code: 'CS405', name: 'Operating Systems', department: 'Computer Science', semester: 4, type: 'Lecture', credits: 4, facultyId: 'FAC101'
      }];
    } else {
      sampleData = [{
        dayOfWeek: 'Monday', timeSlot: '09:00 AM - 10:00 AM', subjectId: 'SUB101', subjectName: 'Data Structures', subjectCode: 'CS401', subjectType: 'Lecture', facultyId: 'FAC101', facultyName: 'Prof. Langdon', roomNo: 'LH-201', department: 'Computer Science', semester: 4, section: 'A'
      }];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, `Sample_${targetType}_Upload.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Bulk Data Batch Upload</h3>
              <p className="text-xs text-amber-300">Parse CSV / Excel spreadsheets into Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Target Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Select Registry Component
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['students', 'faculty', 'subjects', 'timetable'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTargetType(t); setParsedRows([]); setFileName(''); }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    targetType === t
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sample template download button */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Need sample format template?</span>
            <button
              onClick={downloadSampleCSV}
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold rounded-lg hover:bg-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample {targetType}.xlsx
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center transition-colors relative cursor-pointer bg-slate-50/50 dark:bg-slate-800/20">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {fileName ? fileName : `Drop your ${targetType} spreadsheet here`}
            </h4>
            <p className="text-xs text-slate-500 mt-1">Supports .csv, .xlsx, and .xls files</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    {Object.keys(parsedRows[0]).slice(0, 5).map(k => (
                      <th key={k} className="p-2 border-b border-slate-200 dark:border-slate-700">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {Object.values(row).slice(0, 5).map((val: any, j) => (
                        <td key={j} className="p-2 truncate max-w-[100px]">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={parsedRows.length === 0 || isProcessing}
              className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? 'Importing Batch...' : `Batch Import ${parsedRows.length} Rows`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
