import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, RefreshCw, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  getSupabaseClient,
  SUPABASE_SQL_SCHEMA
} from '../../services/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const current = getSupabaseCredentials();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveAndTest = async () => {
    if (!url || !anonKey) {
      setStatusMsg('Please enter both Supabase URL and Anon Key.');
      return;
    }

    setIsTesting(true);
    setStatusMsg(null);
    saveSupabaseCredentials(url, anonKey);

    const client = getSupabaseClient();
    if (!client) {
      setStatusMsg('Invalid Supabase configuration.');
      setIsTesting(false);
      return;
    }

    try {
      // Test basic ping query
      const { error } = await client.from('students').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('relation "public.students" does not exist')) {
          setStatusMsg('Connected to Supabase! Note: Please run the SQL Schema Script below in Supabase SQL Editor to create tables.');
        } else {
          setStatusMsg(`Supabase Connected (Notice: ${error.message})`);
        }
      } else {
        setStatusMsg('✅ Successfully connected to Supabase Database!');
      }
    } catch (e: unknown) {
      const err = e as Error;
      setStatusMsg(`Connection Error: ${err.message || 'Check credentials'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supabase Database Connection" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2.5">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Free Supabase Integration</p>
            <p className="mt-0.5">
              Connect your free PostgreSQL database to enable multi-device real-time sync. LocalStorage is currently active as fall-back storage.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveAndTest}
              disabled={isTesting}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Save & Test Connection'
              )}
            </button>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              statusMsg.includes('✅')
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              {statusMsg}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Supabase PostgreSQL SQL Schema
            </h4>
            <button
              onClick={copySql}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy SQL Script
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono h-40 overflow-y-auto leading-relaxed border border-slate-800">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Paste this script in your Supabase project&apos;s <span className="font-semibold text-indigo-500">SQL Editor</span> to automatically provision all required college management tables and relationships.
          </p>
        </div>
      </div>
    </Modal>
  );
};
