import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function GridSizePicker({ rows, cols, onChange }) {
    const [hover, setHover] = useState({ r: 0, c: 0 });
    const MAX_ROWS = 10;
    const MAX_COLS = 10;
    
    const grid = [];
    for (let r = 1; r <= MAX_ROWS; r++) {
        const row = [];
        for (let c = 1; c <= MAX_COLS; c++) {
            row.push(c);
        }
        grid.push({ r, cols: row });
    }

    const handleClick = (r, c) => {
        onChange(r, c);
    };

    const Stepper = ({ label, value, onChange, min, max }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 500 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-surface)', transition: 'border-color 0.2s, background-color 0.2s' }}>
                <button 
                    className="secondary" 
                    style={{ padding: '8px', width: '32px', height: '32px', border: 'none', borderRadius: 0, borderRight: '1px solid var(--border-light)' }}
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                >
                    <Minus size={14} />
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--ink-primary)' }}>{value}</div>
                <button 
                    className="secondary" 
                    style={{ padding: '8px', width: '32px', height: '32px', border: 'none', borderRadius: 0, borderLeft: '1px solid var(--border-light)' }}
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );

    const displayRows = hover.r > 0 ? hover.r : rows;
    const displayCols = hover.c > 0 ? hover.c : cols;

    return (
        <div className="grid-size-picker" onMouseLeave={() => setHover({ r: 0, c: 0 })}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <Stepper label="Rows" value={rows} onChange={v => onChange(v, cols)} min={1} max={MAX_ROWS} />
                <Stepper label="Cols" value={cols} onChange={v => onChange(rows, v)} min={1} max={MAX_COLS} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="grid-squares" style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: 'fit-content' }}>
                    {grid.map(row => (
                        <div key={row.r} style={{ display: 'flex', gap: '2px' }}>
                            {row.cols.map(c => {
                                const isSelected = row.r <= rows && c <= cols;
                                const isHovered = row.r <= hover.r && c <= hover.c;
                                
                                let bg = 'var(--bg-surface)';
                                let borderColor = 'var(--border-light)';
                                
                                if (isHovered) {
                                    bg = 'var(--bg-elevated)';
                                    borderColor = 'var(--accent-primary)';
                                } else if (isSelected) {
                                    bg = 'var(--accent-primary)';
                                    borderColor = 'var(--accent-hover)';
                                }

                                return (
                                    <div 
                                        key={c}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            border: `1px solid ${borderColor}`,
                                            backgroundColor: bg,
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            transition: 'all 0.1s'
                                        }}
                                        onMouseEnter={() => setHover({ r: row.r, c })}
                                        onClick={() => handleClick(row.r, c)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--ink-secondary)' }}>
                <strong>{displayRows * displayCols}</strong> pages per sheet
            </div>
        </div>
    );
}
