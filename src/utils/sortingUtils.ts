/**
 * Natural numeric comparison for roll numbers.
 * Ensures numbers like '2436010062' sort before '2436010109',
 * and '2536090001' sorts before '2536090014', regardless of string formatting.
 */
export function compareRollNumbers(a: string | undefined | null, b: string | undefined | null): number {
  const rollA = (a || '').trim();
  const rollB = (b || '').trim();
  if (!rollA && !rollB) return 0;
  if (!rollA) return 1;
  if (!rollB) return -1;

  return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortStudentsByRollNumber<T extends { rollNo?: string; roll_no?: string }>(students: T[]): T[] {
  return [...students].sort((a, b) => {
    const rA = a.rollNo || a.roll_no || '';
    const rB = b.rollNo || b.roll_no || '';
    return compareRollNumbers(rA, rB);
  });
}
