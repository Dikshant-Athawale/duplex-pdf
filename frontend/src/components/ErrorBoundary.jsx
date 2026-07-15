import React from 'react';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                    <div className="warning" style={{ maxWidth: '400px', margin: '0 auto', background: 'var(--bg-panel)', border: '1px solid var(--warning-border)', borderLeft: '4px solid var(--warning-amber)' }}>
                        <AlertCircle size={20} color="var(--warning-amber)" style={{ flexShrink: 0 }} />
                        <div>
                            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--ink-primary)' }}>Something went wrong.</strong>
                            <span style={{ color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                                {this.state.error && this.state.error.toString()}
                            </span>
                            <div style={{ marginTop: '12px' }}>
                                <button className="secondary" onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}
