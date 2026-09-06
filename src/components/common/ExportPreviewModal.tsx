import React, { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { exportDataToFile, ExportResult } from '../../utils/fileExport';

export interface ColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (val: any, row: any) => React.ReactNode;
}

export interface MetricBadge {
  label: string;
  value: string | number;
  color?: 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filenameBase: string;
  columns: ColumnDef[];
  data: Record<string, any>[];
  metrics?: MetricBadge[];
  sheetName?: string;
}

export const ExportPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  filenameBase,
  columns,
  data,
  metrics,
  sheetName = 'Attendance_Export'
}) => {
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(val =>
        String(val ?? '').toLowerCase().includes(query)
      );
    });
  }, [data, search]);

  if (!isOpen) return null;

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    setExportResult(null);

    // Prepare rows with clean keys matching the column labels for human-friendly output
    const exportRows = filteredData.map(row => {
      const cleanRow: Record<string, any> = {};
      columns.forEach(col => {
        cleanRow[col.label] = row[col.key] ?? '';
      });
      return cleanRow;
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filenameBase}_${timestamp}`;

    try {
      const result = await exportDataToFile({
        filename: fullFilename,
        rows: exportRows.length > 0 ? exportRows : data,
        format,
        sheetName
      });
      setExportResult(result);
    } catch (err: any) {
      setExportResult({
        success: false,
        filename: fullFilename,
        message: err?.message || 'Export failed',
        error: err?.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getMetricBadgeStyle = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400';
      case 'red':
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400';
      case 'purple':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400';
      case 'blue':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight text-white">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {data.length} records
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {subtitle || 'Inspect records before downloading CSV or Excel (.xlsx)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Metrics Bar */}
          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center ${getMetricBadgeStyle(m.color)}`}
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{m.label}</p>
                  <p className="text-sm sm:text-base font-extrabold mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search / Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter in preview..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium self-end sm:self-center">
              Showing {filteredData.length} of {data.length} records
            </div>
          </div>

          {/* Feedback Banner */}
          {exportResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2 ${
                exportResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-800 dark:text-red-300'
              }`}
            >
              {exportResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-bold">{exportResult.message}</span>
                {exportResult.filePath && (
                  <p className="text-[11px] opacity-80 mt-0.5 truncate">Location: {exportResult.filePath}</p>
                )}
              </div>
            </div>
          )}

          {/* Live Preview Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                    {columns.map(col => (
                      <th
                        key={col.key}
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400 italic">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        {columns.map(col => {
                          const val = row[col.key];
                          return (
                            <td
                              key={col.key}
                              className={`py-2 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 ${
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                              }`}
                            >
                              {col.format ? (
                                col.format(val, row)
                              ) : col.key.toLowerCase().includes('status') ? (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    String(val).toLowerCase().includes('shortage') || String(val).toLowerCase() === 'absent'
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                      : String(val).toLowerCase().includes('borderline') || String(val).toLowerCase() === 'late'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {String(val ?? '')}
                                </span>
                              ) : (
                                String(val ?? '')
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close / Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isExporting || filteredData.length === 0}
              onClick={() => handleExport('csv')}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600" />
              )}
              Download CSV
            </button>

            <button
              type="button"
              disabled={isExporting || filteredData.length === 0}
              onClick={() => handleExport('xlsx')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download Excel (.xlsx)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
