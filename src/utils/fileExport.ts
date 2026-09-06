import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export interface ExportResult {
  success: boolean;
  filename: string;
  filePath?: string;
  message: string;
  error?: string;
}

export interface ExportOptions {
  filename: string;
  rows: Record<string, any>[];
  format: 'csv' | 'xlsx';
  sheetName?: string;
}

/**
 * Safely converts a UTF-8 string to base64 for Capacitor Filesystem write
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf-8').toString('base64');
    }
    throw e;
  }
}

/**
 * Converts array of row objects into a standardized CSV string
 */
export function convertRowsToCSV(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return '';

  const keys = Object.keys(rows[0]);
  const headerLine = keys.map(k => '"' + k.replace(/"/g, '""') + '"').join(',');

  const bodyLines = rows.map(row => {
    return keys
      .map(k => {
        const val = row[k];
        let cellStr =
          val === null || val === undefined
            ? ''
            : val instanceof Date
            ? val.toLocaleString()
            : String(val);
        cellStr = cellStr.replace(/"/g, '""');
        return '"' + cellStr + '"';
      })
      .join(',');
  });

  return [headerLine, ...bodyLines].join('\r\n');
}

/**
 * Universal cross-platform exporter for CSV and XLSX.
 * - On Native Android (Capacitor): writes to device storage and opens native Share / Save sheet.
 * - On Web: generates Blob and triggers browser file download.
 */
export async function exportDataToFile(options: ExportOptions): Promise<ExportResult> {
  const { filename: rawFilename, rows, format, sheetName = 'Report' } = options;
  if (!rows || rows.length === 0) {
    return {
      success: false,
      filename: rawFilename,
      message: 'No records available to export.',
      error: 'Empty data'
    };
  }

  const extension = format === 'csv' ? '.csv' : '.xlsx';
  const finalFilename = rawFilename.endsWith(extension) ? rawFilename : rawFilename + extension;
  const isNative = Capacitor.isNativePlatform();

  try {
    if (format === 'csv') {
      const csvString = convertRowsToCSV(rows);

      if (isNative) {
        // Native Android APK export via Filesystem + Share
        const base64Data = utf8ToBase64(csvString);
        let writeRes;
        try {
          writeRes = await Filesystem.writeFile({
            path: finalFilename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (docErr) {
          writeRes = await Filesystem.writeFile({
            path: finalFilename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
        }

        try {
          const canShare = await Share.canShare().then(r => r.value).catch(() => false);
          if (canShare && writeRes.uri) {
            await Share.share({
              title: finalFilename,
              text: 'Attendance System Export: ' + finalFilename,
              url: writeRes.uri,
              dialogTitle: 'Save or Share ' + finalFilename
            });
          }
        } catch (shareErr) {
          console.warn('Native share dialog error:', shareErr);
        }

        return {
          success: true,
          filename: finalFilename,
          filePath: writeRes.uri,
          message: 'Saved ' + finalFilename + ' to device Documents.'
        };
      } else {
        // Web browser download
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        return {
          success: true,
          filename: finalFilename,
          message: 'Downloaded ' + finalFilename + ' successfully.'
        };
      }
    } else {
      // Excel (.xlsx) Export
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      if (isNative) {
        // Native Android export
        const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        let writeRes;
        try {
          writeRes = await Filesystem.writeFile({
            path: finalFilename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (docErr) {
          writeRes = await Filesystem.writeFile({
            path: finalFilename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
        }

        try {
          const canShare = await Share.canShare().then(r => r.value).catch(() => false);
          if (canShare && writeRes.uri) {
            await Share.share({
              title: finalFilename,
              text: 'Attendance System Export: ' + finalFilename,
              url: writeRes.uri,
              dialogTitle: 'Save or Share ' + finalFilename
            });
          }
        } catch (shareErr) {
          console.warn('Native share dialog error:', shareErr);
        }

        return {
          success: true,
          filename: finalFilename,
          filePath: writeRes.uri,
          message: 'Saved ' + finalFilename + ' to device Documents.'
        };
      } else {
        // Web browser download
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        return {
          success: true,
          filename: finalFilename,
          message: 'Downloaded ' + finalFilename + ' successfully.'
        };
      }
    }
  } catch (err: any) {
    console.error('Export failed for ' + finalFilename + ':', err);
    return {
      success: false,
      filename: finalFilename,
      message: 'Failed to export ' + finalFilename + ': ' + (err?.message || 'Unknown error'),
      error: err?.message
    };
  }
}
