import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showConfirmReset: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showConfirmReset: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showConfirmReset: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in POS Application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] text-[#f4efe8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#141417] border border-[#2a2418] rounded-2xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#f5d77f]">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#f4efe8]">Rahel POS Workstation Recovery</h1>
              <p className="text-xs text-[#998b7a] mt-1.5 leading-relaxed">
                The application encountered an unexpected runtime exception. Your data remains safely stored.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/40 border border-[#26221c] text-left">
                <p className="text-[11px] font-mono text-[#f87171] break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            {this.state.showConfirmReset ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-3 text-left">
                <p className="text-xs text-rose-200">
                  Are you sure you want to reset cache? This action will permanently delete local application cache. This cannot be undone. Continue?
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => this.setState({ showConfirmReset: false })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1a20] border border-[#2a261f] text-[#c4bbb0] hover:text-[#f4efe8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={this.handleResetStorage}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-500"
                  >
                    Yes, Reset Cache
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-black text-xs font-bold flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Workstation
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ showConfirmReset: true })}
                  className="py-2.5 px-4 rounded-xl border border-[#3a3224] text-xs font-medium text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Cache
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
