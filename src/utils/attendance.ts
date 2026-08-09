import { AttendanceRecord, AttendanceSummary, Subject, AttendanceStatus } from '../types';

export function calculateWeightedAttendance(
  records: AttendanceRecord[],
  studentId: string,
  subjectId?: string
): AttendanceSummary {
  // Filter for specific student and optional subject
  const studentRecords = records.filter(r => {
    const matchStudent = r.studentId === studentId;
    const matchSubject = subjectId ? r.subjectId === subjectId : true;
    return matchStudent && matchSubject;
  });

  let totalConductedUnits = 0;
  let totalAttendedUnits = 0;
  let presentsCount = 0;
  let absentsCount = 0;
  let latesCount = 0;
  let excusedCount = 0;

  studentRecords.forEach(r => {
    // Practical/Lab = 3 units weight, Lecture = 1 unit weight
    const weight = r.subjectType === 'Practical' ? 3 : 1;
    
    // Count as conducted
    if (r.status !== 'holiday') {
      totalConductedUnits += weight;
    }

    if (r.status === 'present') {
      totalAttendedUnits += weight;
      presentsCount++;
    } else if (r.status === 'late') {
      // Late counts as 0.75 weight attended or full depending on college rule (let's use 0.75 weight)
      totalAttendedUnits += weight * 0.75;
      latesCount++;
    } else if (r.status === 'excused') {
      // Excused counts as attended
      totalAttendedUnits += weight;
      excusedCount++;
    } else if (r.status === 'absent') {
      absentsCount++;
    }
  });

  const percentage = totalConductedUnits > 0
    ? Math.round((totalAttendedUnits / totalConductedUnits) * 1000) / 10
    : 100;

  let status: 'Safe' | 'Borderline' | 'Shortage' = 'Safe';
  if (percentage < 65) {
    status = 'Shortage';
  } else if (percentage < 75) {
    status = 'Borderline';
  }

  // Calculate Streak Days (consecutive days with at least one 'present' and zero 'absent')
  const datesMap = new Map<string, AttendanceStatus[]>();
  studentRecords.forEach(r => {
    if (!datesMap.has(r.date)) datesMap.set(r.date, []);
    datesMap.get(r.date)!.push(r.status);
  });

  const sortedDates = Array.from(datesMap.keys()).sort().reverse();
  let streakDays = 0;
  for (const date of sortedDates) {
    const statuses = datesMap.get(date)!;
    const hasAbsent = statuses.includes('absent');
    const hasPresent = statuses.includes('present') || statuses.includes('late') || statuses.includes('excused');
    
    if (hasPresent && !hasAbsent) {
      streakDays++;
    } else if (hasAbsent) {
      break;
    }
  }

  return {
    totalConductedUnits,
    totalAttendedUnits,
    percentage,
    status,
    totalClassesConducted: studentRecords.length,
    totalClassesAttended: presentsCount + latesCount + excusedCount,
    presentsCount,
    absentsCount,
    latesCount,
    excusedCount,
    streakDays
  };
}

export function predictClassesToTarget(
  summary: AttendanceSummary,
  targetPercentage = 75
): {
  type: 'need_classes' | 'can_skip' | 'on_target';
  count: number;
  message: string;
} {
  const { totalConductedUnits, totalAttendedUnits, percentage } = summary;

  if (totalConductedUnits === 0) {
    return {
      type: 'on_target',
      count: 0,
      message: 'No classes conducted yet.'
    };
  }

  const targetDecimal = targetPercentage / 100;

  if (percentage < targetPercentage) {
    // Need to attend 'x' future 1-unit classes consecutively
    // (Attended + x) / (Conducted + x) >= target
    // Attended + x >= target * Conducted + target * x
    // x * (1 - target) >= target * Conducted - Attended
    // x >= (target * Conducted - Attended) / (1 - target)
    const needed = Math.ceil((targetDecimal * totalConductedUnits - totalAttendedUnits) / (1 - targetDecimal));
    return {
      type: 'need_classes',
      count: needed > 0 ? needed : 1,
      message: `Attend next ${needed > 0 ? needed : 1} lecture(s) consecutively to reach ${targetPercentage}%.`
    };
  } else {
    // Can skip 'x' future 1-unit classes without dropping below target
    // Attended / (Conducted + x) >= target
    // Attended / target >= Conducted + x
    // x <= (Attended / target) - Conducted
    const canSkip = Math.floor((totalAttendedUnits / targetDecimal) - totalConductedUnits);
    if (canSkip <= 0) {
      return {
        type: 'on_target',
        count: 0,
        message: `Currently at ${percentage}%. You cannot miss the next class without dropping below ${targetPercentage}%.`
      };
    }
    return {
      type: 'can_skip',
      count: canSkip,
      message: `You can safely miss up to ${canSkip} lecture(s) and remain above ${targetPercentage}%.`
    };
  }
}

// Convert JSON data to CSV and trigger file download
export function exportToCSV(filename: string, rows: object[]): void {
  if (!rows || !rows.length) return;

  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            const val = (row as Record<string, unknown>)[k];
            let cellStr = val === null || val === undefined ? '' : val instanceof Date ? val.toLocaleString() : String(val);
            cellStr = cellStr.replace(/"/g, '""');
            if (cellStr.search(/("|,|\n)/g) >= 0) {
              cellStr = `"${cellStr}"`;
            }
            return cellStr;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function calculateOverallAttendance(
  records: AttendanceRecord[],
  subjects?: Subject[]
): AttendanceSummary {
  let totalConductedUnits = 0;
  let totalAttendedUnits = 0;
  let presentsCount = 0;
  let absentsCount = 0;
  let latesCount = 0;
  let excusedCount = 0;

  records.forEach(r => {
    const weight = r.subjectType === 'Practical' ? 3 : 1;
    if (r.status !== 'holiday') totalConductedUnits += weight;
    if (r.status === 'present') {
      totalAttendedUnits += weight;
      presentsCount++;
    } else if (r.status === 'late') {
      totalAttendedUnits += weight * 0.75;
      latesCount++;
    } else if (r.status === 'excused') {
      totalAttendedUnits += weight;
      excusedCount++;
    } else if (r.status === 'absent') {
      absentsCount++;
    }
  });

  const percentage = totalConductedUnits > 0
    ? Math.round((totalAttendedUnits / totalConductedUnits) * 100)
    : 100;

  let status: 'Safe' | 'Borderline' | 'Shortage' = 'Safe';
  if (percentage < 75) status = 'Shortage';
  else if (percentage < 85) status = 'Borderline';

  return {
    totalConductedUnits,
    totalAttendedUnits,
    percentage,
    status,
    totalClassesConducted: records.length,
    totalClassesAttended: presentsCount + latesCount + excusedCount,
    presentsCount,
    absentsCount,
    latesCount,
    excusedCount,
    streakDays: 0
  };
}

