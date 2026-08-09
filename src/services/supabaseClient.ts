import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials for Annamalai University CMS
const DEFAULT_SUPABASE_URL = "https://tysutoqyagpawuklpaxj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3V0b3F5YWdwYXd1a2xwYXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTU3MTIsImV4cCI6MjEwMTEzMTcxMn0.CZYjC7wiUaM9CBHrp9qKxw4ZQ8SYe8n1tISlS7XxbJI";

const STORAGE_KEY = 'au_cms_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey, isConfigured: true };
      }
    }
  } catch (e) {
    console.error('Error reading saved Supabase config:', e);
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isConfigured: Boolean(DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY)
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  // Reset instance to trigger reconnect
  supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return supabaseInstance;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
}
