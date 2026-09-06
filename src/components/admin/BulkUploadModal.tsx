import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveStudentToDB, saveFacultyToDB, saveSubjectToDB, saveTimetableSlotToDB } from '../../services/dbService';
import { Student, Faculty, Subject, TimetableSlot } from '../../types';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2, Check, AlertTriangle } from 'lucide-react';
import { exportDataToFile } from '../../utils/fileExport';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRecord {
  rawData: any;
  isValid: boolean;
  errorReason?: string;
  mappedEntity: any;
}

// Flexible header normalizer
function getField(row: any, ...keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
    const cleanK = k.toLowerCase().replace(/[\s_-]/g, '');
    for (const existingKey of Object.keys(row)) {
      if (existingKey.toLowerCase().replace(/[\s_-]/g, '') === cleanK) {
        if (row[existingKey] !== undefined && row[existingKey] !== null && String(row[existingKey]).trim() !== '') {
          return row[existingKey];
        }
      }
    }
  }
  return undefined;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [targetType, setTargetType] = useState<'students' | 'faculty' | 'subjects' | 'timetable'>('students');
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const validateAndMapRow = (row: any, index: number): ParsedRecord => {
    if (targetType === 'students') {
      const rollNo = getField(row, 'rollNo', 'roll_no', 'Roll No', 'Roll Number', 'Registration No', 'Reg No');
      const name = getField(row, 'name', 'Student Name', 'Full Name', 'student_name');
      const email = getField(row, 'email', 'Email', 'Email ID', 'email_id');
      const department = getField(row, 'department', 'Department', 'Dept', 'branch') || 'Computer Science';
      const year = getField(row, 'year', 'Year', 'Class Year') || '2nd Year';
      const semester = Number(getField(row, 'semester', 'Semester', 'Sem')) || 4;
      const section = getField(row, 'section', 'Section', 'Sec') || 'A';
      const phone = getField(row, 'phone', 'Phone', 'Mobile', 'Contact');
      const parentName = getField(row, 'parentName', 'parent_name', 'Parent Name', 'Father Name', 'Guardian');
      const parentPhone = getField(row, 'parentPhone', 'parent_phone', 'Parent Phone', 'Parent Mobile');

      if (!rollNo || !name) {
        return {
          rawData: row,
          isValid: false,
          errorReason: !rollNo ? 'Missing Roll Number' : 'Missing Student Name',
          mappedEntity: null
        };
      }

      const stu: Student = {
        id: getField(row, 'id') || `STU_${Date.now()}_${index}`,
        rollNo: String(rollNo).trim(),
        name: String(name).trim(),
        email: email ? String(email).trim() : `${String(rollNo).toLowerCase()}@student.edu`,
        phone: phone ? String(phone).trim() : undefined,
        department: String(department).trim(),
        year: String(year).trim(),
        semester,
        section: String(section).trim().toUpperCase(),
        parentName: parentName ? String(parentName).trim() : undefined,
        parentPhone: parentPhone ? String(parentPhone).trim() : undefined,
        approvalStatus: 'approved'
      };

      return { rawData: row, isValid: true, mappedEntity: stu };
    }

    if (targetType === 'faculty') {
      const code = getField(row, 'facultyCode', 'faculty_code', 'Staff Code', 'Faculty Code', 'code', 'ID');
      const name = getField(row, 'name', 'Faculty Name', 'Staff Name', 'Full Name');
      const email = getField(row, 'email', 'Email', 'Email ID');
      const department = getField(row, 'department', 'Department', 'Dept') || 'Computer Science';
      const designation = getField(row, 'designation', 'Designation', 'Role') || 'Assistant Professor';
      const phone = getField(row, 'phone', 'Phone', 'Mobile');

      if (!code || !name) {
        return {
          rawData: row,
          isValid: false,
          errorReason: !code ? 'Missing Faculty/Staff Code' : 'Missing Faculty Name',
          mappedEntity: null
        };
      }

      const fac: Faculty = {
        id: getField(row, 'id') || `FAC_${Date.now()}_${index}`,
        facultyCode: String(code).trim(),
        name: String(name).trim(),
        email: email ? String(email).trim() : `${String(code).toLowerCase()}@college.edu`,
        department: String(department).trim(),
        designation: String(designation).trim(),
        phone: phone ? String(phone).trim() : '',
        subjectsHandled: [],
        approvalStatus: 'approved'
      };

      return { rawData: row, isValid: true, mappedEntity: fac };
    }

    if (targetType === 'subjects') {
      const code = getField(row, 'code', 'Subject Code', 'Course Code');
      const name = getField(row, 'name', 'Subject Name', 'Course Name');
      const department = getField(row, 'department', 'Department', 'Dept') || 'Computer Science';
      const semester = Number(getField(row, 'semester', 'Semester', 'Sem')) || 4;
      const type = getField(row, 'type', 'Type', 'Subject Type') === 'Practical' ? 'Practical' : 'Lecture';
      const credits = Number(getField(row, 'credits', 'Credits')) || 3;
      const facultyId = getField(row, 'facultyId', 'faculty_id', 'Faculty ID', 'facultyCode') || 'FAC101';

      if (!code || !name) {
        return {
          rawData: row,
          isValid: false,
          errorReason: !code ? 'Missing Subject Code' : 'Missing Subject Name',
          mappedEntity: null
        };
      }

      const sub: Subject = {
        id: getField(row, 'id') || `SUB_${Date.now()}_${index}`,
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        department: String(department).trim(),
        semester,
        type,
        credits,
        facultyId: String(facultyId).trim()
      };

      return { rawData: row, isValid: true, mappedEntity: sub };
    }

    // Timetable
    const dayOfWeek = getField(row, 'dayOfWeek', 'day_of_week', 'Day', 'Day of Week') || 'Monday';
    const timeSlot = getField(row, 'timeSlot', 'time_slot', 'Time Slot', 'Time', 'Slot') || '09:00 AM - 10:00 AM';
    const subjectCode = getField(row, 'subjectCode', 'subject_code', 'Subject Code', 'Course Code');
    const subjectName = getField(row, 'subjectName', 'subject_name', 'Subject Name') || 'Subject';
    const roomNo = getField(row, 'roomNo', 'room_no', 'Room', 'Room No', 'Hall') || 'LH-201';
    const facultyName = getField(row, 'facultyName', 'faculty_name', 'Faculty', 'Instructor') || 'Faculty';

    if (!subjectCode) {
      return {
        rawData: row,
        isValid: false,
        errorReason: 'Missing Subject Code',
        mappedEntity: null
      };
    }

    const slot: TimetableSlot = {
      id: getField(row, 'id') || `SLOT_${Date.now()}_${index}`,
      dayOfWeek: (String(dayOfWeek).trim() || 'Monday') as any,
      timeSlot: String(timeSlot).trim(),
      subjectId: `SUB_${String(subjectCode).trim()}`,
      subjectName: String(subjectName).trim(),
      subjectCode: String(subjectCode).trim().toUpperCase(),
      subjectType: 'Lecture',
      facultyId: 'FAC101',
      facultyName: String(facultyName).trim(),
      roomNo: String(roomNo).trim(),
      department: getField(row, 'department', 'Dept') || 'Computer Science',
      semester: Number(getField(row, 'semester')) || 4,
      section: getField(row, 'section') || 'A'
    };

    return { rawData: row, isValid: true, mappedEntity: slot };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setStatusMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const dataArr = new Uint8Array(buffer);
        const wb = XLSX.read(dataArr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        if (rawJson.length === 0) {
          setErrorMsg('Uploaded file contains no data rows.');
          return;
        }

        const parsed = rawJson.map((row, idx) => validateAndMapRow(row, idx));
        setParsedRecords(parsed);

        const validCount = parsed.filter(p => p.isValid).length;
        const invalidCount = parsed.length - validCount;

        if (invalidCount > 0) {
          setStatusMsg(`Parsed ${parsed.length} rows (${validCount} valid, ${invalidCount} skipped/invalid).`);
        } else {
          setStatusMsg(`Parsed ${validCount} rows successfully! Ready to import.`);
        }
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg('Failed to parse spreadsheet file. Please check format.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validRecords = parsedRecords.filter(p => p.isValid);

  const handleImport = async () => {
    if (validRecords.length === 0) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      let count = 0;
      for (const rec of validRecords) {
        if (targetType === 'students') {
          await saveStudentToDB(rec.mappedEntity);
        } else if (targetType === 'faculty') {
          await saveFacultyToDB(rec.mappedEntity);
        } else if (targetType === 'subjects') {
          await saveSubjectToDB(rec.mappedEntity);
        } else if (targetType === 'timetable') {
          await saveTimetableSlotToDB(rec.mappedEntity);
        }
        count++;
      }

      setIsProcessing(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setIsProcessing(false);
      setErrorMsg('Error inserting rows into database. Check schema.');
    }
  };

  const downloadSampleTemplate = async () => {
    let sampleData: Record<string, any>[] = [];
    if (targetType === 'students') {
      sampleData = [
        {
          'Roll Number': '24CS01',
          'Student Name': 'Aarthi S',
          'Department': 'Computer Science',
          'Year': '2nd Year',
          'Semester': 4,
          'Section': 'A',
          'Email': 'aarthi@student.edu',
          'Phone': '+91 98401 11221',
          'Parent Name': 'Sundaram S',
          'Parent Phone': '+91 98401 99001'
        },
        {
          'Roll Number': '24CS02',
          'Student Name': 'Balaji R',
          'Department': 'Computer Science',
          'Year': '2nd Year',
          'Semester': 4,
          'Section': 'A',
          'Email': 'balaji@student.edu',
          'Phone': '+91 98401 11222',
          'Parent Name': 'Ramasamy K',
          'Parent Phone': '+91 98401 99002'
        }
      ];
    } else if (targetType === 'faculty') {
      sampleData = [
        {
          'Staff Code': 'CS-FAC-05',
          'Faculty Name': 'Dr. Anand Kumar',
          'Department': 'Computer Science',
          'Designation': 'Associate Professor',
          'Email': 'anand.kumar@college.edu',
          'Phone': '+91 98765 00112'
        }
      ];
    } else if (targetType === 'subjects') {
      sampleData = [
        {
          'Course Code': 'CS405',
          'Subject Name': 'Operating Systems',
          'Department': 'Computer Science',
          'Semester': 4,
          'Type': 'Lecture',
          'Credits': 4,
          'Faculty Code': 'FAC101'
        }
      ];
    } else {
      sampleData = [
        {
          'Day': 'Monday',
          'Time Slot': '09:00 AM - 10:00 AM',
          'Subject Code': 'CS401',
          'Subject Name': 'Data Structures',
          'Room No': 'LH-201',
          'Faculty': 'Dr. M. Balasubramanian',
          'Department': 'Computer Science',
          'Semester': 4,
          'Section': 'A'
        }
      ];
    }

    await exportDataToFile({
      filename: `Sample_${targetType}_Upload_Template`,
      rows: sampleData,
      format: 'xlsx',
      sheetName: 'Sample_Template'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight text-white">Bulk Spreadsheet Batch Upload</h3>
              <p className="text-xs text-amber-300">Import validated CSV & Excel data into cloud database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Target Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Target Registry Component
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['students', 'faculty', 'subjects', 'timetable'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTargetType(t); setParsedRecords([]); setFileName(''); setStatusMsg(''); setErrorMsg(''); }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    targetType === t
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
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
            <span className="text-slate-600 dark:text-slate-400 font-medium">Need standard template format?</span>
            <button
              type="button"
              onClick={downloadSampleTemplate}
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
            <Upload className="w-9 h-9 text-amber-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {fileName ? fileName : `Choose or drop your ${targetType} file here`}
            </h4>
            <p className="text-xs text-slate-500 mt-1">Supports CSV and Excel (.xlsx, .xls)</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Table Preview */}
          {parsedRecords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>File Content Verification Preview:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {validRecords.length} of {parsedRecords.length} ready to import
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 w-8 text-center">Status</th>
                      <th className="p-2.5">Key ID / Code</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5 text-right">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRecords.map((rec, i) => {
                      const entity = rec.mappedEntity;
                      return (
                        <tr
                          key={i}
                          className={`transition-colors ${
                            rec.isValid
                              ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              : 'bg-red-50/50 dark:bg-red-950/20'
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            {rec.isValid ? (
                              <Check className="w-4 h-4 text-emerald-600 inline" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500 inline" />
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {entity?.rollNo || entity?.facultyCode || entity?.code || entity?.subjectCode || '—'}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                            {entity?.name || entity?.subjectName || '—'}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {entity?.department || '—'}
                          </td>
                          <td className="p-2.5 text-right">
                            {rec.isValid ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                Valid
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                                {rec.errorReason}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={validRecords.length === 0 || isProcessing}
              className="w-2/3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Batch...</span>
                </>
              ) : (
                `Import ${validRecords.length} Valid Records`
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
