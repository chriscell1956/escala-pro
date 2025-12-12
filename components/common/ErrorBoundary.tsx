import React from 'react';
import { Button, Icons } from '../ui';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) { 
        return { hasError: true, error }; 
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { 
        console.error("Uncaught error:", error, errorInfo); 
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                    <div className="text-6xl mb-4">😵</div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-slate-500 mb-6 max-w-md bg-white p-4 rounded border border-slate-200 font-mono text-xs text-left overflow-auto">
                        {this.state.error?.toString()}
                    </p>
                    <Button onClick={() => window.location.reload()} className="bg-brand-600 text-white">
                        <Icons.RefreshCw /> Recarregar Página
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}