import React, { useState, useEffect } from 'react';
import { SaturdayConfig } from '../../types';
import { fetchSaturdayConfigFromDB, saveSaturdayConfigToDB, fetchAttendanceRecordsFromDB } from '../../services/dbService';
import { Calendar, Save, CheckCircle2, AlertCircle, Download, Layers, Shield } from 'lucide-react';

export const SaturdayConfigManager: React.FC = () => {
  const [config, setConfig] = useState<SaturdayConfig>({ mappedDay: 'Monday', enabled: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [saturdayRecordsCount, setSaturdayRecordsCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [cfg, records] = await Promise.all([
          fetchSaturdayConfigFromDB().catch(() => ({ mappedDay: 'Monday' as const, enabled: true })),
          fetchAttendanceRecordsFromDB().catch(() => [])
        ]);
        setConfig(cfg || { mappedDay: 'Monday' as const, enabled: true });
        const satRecs = (records || []).filter(r => r && (r.isSaturday || new Date(r.date).getDay() === 6));
        setSaturdayRecordsCount(satRecs.length);
      } catch (e) {
        console.warn('Saturday load error:', e);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    await saveSaturdayConfigToDB(config, 'Dr. Arthur Vance (Admin)');
    setSaving(false);
    setMsg(`Saturday classes successfully configured to mirror ${config.mappedDay}'s timetable!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const weekdays: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  return (
    <div className="space-y-6">
      
      {/* Saturday Configuration Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full">
              Academic Schedule Control
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Saturday Classes Configuration</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Map Saturday lecture & practical sessions to copy any weekday's schedule automatically.
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-center">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Mapping</span>
          <span className="text-sm font-bold text-amber-400">{config.mappedDay} Timetable</span>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Config Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Copy Weekday Schedule</h3>
            <p className="text-xs text-slate-500">Choose which day's course & faculty timetable Saturday will follow.</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Saturday Sessions</span>
          </label>
        </div>

        {/* Day Selector Options */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {weekdays.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setConfig({ ...config, mappedDay: day })}
              className={`p-4 rounded-xl border text-center transition-all ${
                config.mappedDay === day
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg font-bold scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-5 h-5 mx-auto mb-2 opacity-80" />
              <span className="block text-sm">{day}</span>
              <span className="block text-[10px] opacity-75 mt-0.5">Schedule</span>
            </button>
          ))}
        </div>

        {/* Impact Info */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
          <div className="font-bold flex items-center gap-1.5 text-sm text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Impact on Attendance Engine:
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Students will see Saturday sessions in their schedule badge as <strong className="underline">Saturday Class (Copied from {config.mappedDay})</strong>.</li>
            <li>Faculty assigned to {config.mappedDay} classes can take Saturday attendance & generate Saturday QR codes.</li>
            <li>Saturday classes contribute directly to weighted attendance percentages (1 Lab = 3 Lectures).</li>
            <li>All Saturday records are tagged for dedicated Saturday CSV/Excel reports.</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-red-900 to-amber-600 hover:brightness-110 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-sm transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Schedule...' : 'Save Saturday Mapping'}
          </button>
        </div>

      </div>

    </div>
  );
};
