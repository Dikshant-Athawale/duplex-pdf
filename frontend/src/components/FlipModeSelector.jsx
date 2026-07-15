import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function FlipModeSelector({ mode, onChange }) {
    return (
        <div className="flip-mode-selector" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-primary)' }}>Flip Mode</label>
            <div style={{ display: 'flex', gap: '12px' }}>
                <div 
                    className={`flip-card ${mode === 'long_edge' ? 'active' : ''}`}
                    onClick={() => onChange('long_edge')}
                >
                    {mode === 'long_edge' && (
                        <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'white', borderRadius: '50%' }}>
                            <CheckCircle2 size={18} color="var(--accent-primary)" fill="white" />
                        </div>
                    )}
                    <div style={{ marginBottom: '8px', fontSize: '24px' }}>
                        📖
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink-primary)' }}>Long Edge</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginTop: '4px', lineHeight: 1.4 }}>Book-style, flips along the long side.</div>
                </div>

                <div 
                    className={`flip-card ${mode === 'short_edge' ? 'active' : ''}`}
                    onClick={() => onChange('short_edge')}
                >
                    {mode === 'short_edge' && (
                        <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'white', borderRadius: '50%' }}>
                            <CheckCircle2 size={18} color="var(--accent-primary)" fill="white" />
                        </div>
                    )}
                    <div style={{ marginBottom: '8px', fontSize: '24px', transform: 'rotate(-90deg)' }}>
                        📖
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink-primary)' }}>Short Edge</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginTop: '4px', lineHeight: 1.4 }}>Calendar-style, flips along short side.</div>
                </div>
            </div>
        </div>
    );
}
