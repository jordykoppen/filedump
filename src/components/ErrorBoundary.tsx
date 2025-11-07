import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-red-950 border border-red-500 rounded-lg p-6 mb-4">
              <h1 className="text-2xl font-bold text-red-500 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-400 mb-4">
                The application encountered an error and crashed.
              </p>
              {this.state.error && (
                <details className="text-left bg-black/30 p-4 rounded text-xs">
                  <summary className="cursor-pointer text-gray-500 mb-2">
                    Error details
                  </summary>
                  <pre className="text-red-400 overflow-auto">
                    {this.state.error.toString()}
                    {"\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
