import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Laptop, Sparkles, CheckCircle2 } from 'lucide-react';
import { sfx } from '../../utils/soundEngine';
import LevelUpLogo from '../common/LevelUpLogo';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sfx.playSuccess();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Direct instructions
      alert('To install LevelUp:\n\n• Chrome/Edge: Click the install icon in your address bar or press Menu (⋮) > "Install LevelUp"\n• iOS Safari: Tap Share > "Add to Home Screen"');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container download-app-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <LevelUpLogo size={40} />
            <div>
              <h3>LevelUp Everywhere</h3>
              <p className="modal-subtitle">Desktop, Mobile & Tablet Companion</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="download-app-body" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Install LevelUp as a standalone desktop or mobile application for instant offline access, keyboard shortcuts, and zero-distraction discipline tracking.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00f2cb', fontWeight: 700, fontSize: '0.85rem' }}>
                <Laptop size={18} />
                <span>Desktop App</span>
              </div>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Windows, macOS & Linux with dedicated window frame</span>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>
                <Smartphone size={18} />
                <span>Mobile App</span>
              </div>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>iOS Safari & Android Chrome home screen widget</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: 10, padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontSize: '0.82rem', fontWeight: 600 }}>
              <Sparkles size={15} />
              <span>Features in App Mode</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Full Cloud Firestore auto-syncing</li>
              <li>Faster boot time and native performance</li>
              <li>Fullscreen Zen focus routine view</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onClick={handleInstallClick}
          >
            <Download size={16} />
            <span>{isInstalled ? 'App Installed!' : 'Install / Download App'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
