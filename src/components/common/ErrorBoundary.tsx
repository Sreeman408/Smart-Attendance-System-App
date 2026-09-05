import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem('au_cms_active_session_v10');
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">
                {this.props.fallbackTitle || 'Something went wrong rendering this view'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                An unexpected interface error occurred. Don't worry, your database records and session remain safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-left overflow-x-auto max-h-32 border border-slate-200 dark:border-slate-700">
                <code className="text-[11px] font-mono text-rose-600 dark:text-rose-400 block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-800 to-amber-600 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload View
              </button>

              <button
                onClick={this.handleClearAndReload}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Reset Portal
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
