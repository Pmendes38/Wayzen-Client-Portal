import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card max-w-xl w-full p-6 md:p-8 text-center">
            <h1 className="text-2xl font-bold text-brand-black">Ops, algo deu errado</h1>
            <p className="text-sm text-gray-500 mt-2">
              O portal encontrou um erro inesperado. Tente recarregar a pagina.
            </p>
            {this.state.errorMessage && (
              <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 break-all">
                {this.state.errorMessage}
              </p>
            )}
            <button onClick={this.handleReload} className="btn-primary mt-5">
              Recarregar Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
