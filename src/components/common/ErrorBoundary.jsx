import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LevelUp ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#f8fafc',
          background: 'rgba(17, 19, 27, 0.9)',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          margin: '2rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            color: '#ef4444'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#f8fafc' }}>
            Arena Connection Interrupted
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '420px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            A temporary component error occurred. Click below to reconnect to your athlete dashboard.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
            }}
          >
            <RefreshCw size={16} />
            Reconnect to Arena
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
