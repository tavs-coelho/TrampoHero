import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-12 shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Algo deu errado</h2>
            <p className="text-slate-500 text-sm mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 bg-slate-50 rounded-xl p-4">
                <summary className="text-xs font-bold text-slate-400 cursor-pointer uppercase tracking-widest">
                  Detalhes do erro
                </summary>
                <pre className="text-xs text-red-600 mt-2 overflow-auto whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
