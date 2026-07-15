import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { FileStack, AlertCircle } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PreviewWorkbench({ config, layoutData, layoutError, pdfFile, exportedCalibration, setExportedCalibration, isMobile }) {
    const [side, setSide] = useState('front');
    const [sheetIdx, setSheetIdx] = useState(0);
    const [hoverCardIdx, setHoverCardIdx] = useState(null);

    if (layoutError) {
        return (
            <div className="preview-panel" style={{ justifyContent: 'center' }}>
                <div className="warning" style={{ maxWidth: '400px', margin: '0 auto', background: 'white', border: '1px solid var(--border-light)', borderLeft: '4px solid var(--warning-amber)' }}>
                    <AlertCircle size={20} color="var(--warning-amber)" style={{ flexShrink: 0 }} />
                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--ink-primary)' }}>Connection Error</strong>
                        <span style={{ color: 'var(--ink-secondary)', lineHeight: 1.5 }}>{layoutError}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!layoutData || (!pdfFile && !config.test_pattern)) {
        return (
            <div className="preview-panel" style={{ justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--ink-secondary)', textAlign: 'center', opacity: 0.6, border: '1px dashed var(--border-light)', padding: '48px', borderRadius: '12px' }}>
                    <FileStack size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: 500, color: 'var(--ink-primary)' }}>No File Selected</h3>
                    <p style={{ margin: 0, fontSize: '14px', maxWidth: '240px' }}>Upload a PDF or use the test pattern to see a live preview of the imposition grid.</p>
                </div>
            </div>
        );
    }

    const currentSheet = layoutData.sheets[sheetIdx];
    if (!currentSheet) return null;

    const cells = side === 'front' ? currentSheet.front : currentSheet.back;
    const displayScale = 600 / config.page_height; 

    return (
        <div className="preview-panel">
            <div className={isMobile ? "preview-scroll-wrapper" : ""} style={isMobile ? { position: 'relative', width: '100%', overflow: 'auto' } : {}}>
                <div 
                    className="preview-sheet-container"
                    style={{
                        width: config.page_width * displayScale,
                        height: config.page_height * displayScale,
                        margin: isMobile ? '0 auto' : undefined
                    }}
                >
                    <div className="front-back-toggle">
                        <div className="toggle-switch" style={{ width: '100%', maxWidth: '280px', margin: '0 auto', position: isMobile ? 'sticky' : 'relative', top: isMobile ? '0' : 'auto', zIndex: 50, background: 'var(--bg-panel)' }}>
                            <div className={`toggle-option ${side === 'front' ? 'active' : ''}`} onClick={() => setSide('front')}>Front Side</div>
                            <div className={`toggle-option ${side === 'back' ? 'active' : ''}`} onClick={() => setSide('back')}>Back Side</div>
                        </div>
                    </div>

                    <div className={`preview-sheet ${side === 'back' ? 'back-view' : 'front-view'}`}>
                        <div className="reg-mark cyan"></div>
                        <div className="reg-mark magenta"></div>
                        
                        {cells.map((cell, i) => {
                            const isHoveredPair = hoverCardIdx === cell.card_idx;
                            const style = {
                                left: cell.x * displayScale,
                                top: (config.page_height - cell.y - cell.h) * displayScale,
                                width: cell.w * displayScale,
                                height: cell.h * displayScale,
                                borderColor: isHoveredPair ? 'var(--accent-primary)' : 'var(--border-light)',
                                borderWidth: isHoveredPair ? '2px' : '1px',
                                zIndex: isHoveredPair ? 10 : 1
                            };
                            
                            return (
                                <div 
                                    key={i} 
                                    className="preview-cell" 
                                    style={style}
                                    onMouseEnter={() => setHoverCardIdx(cell.card_idx)}
                                    onMouseLeave={() => setHoverCardIdx(null)}
                                >
                                    {pdfFile && !config.test_pattern && (
                                        <Document file={pdfFile} loading={<div style={{ padding: '8px', fontSize: '11px', color: 'var(--ink-secondary)' }}>Loading...</div>}>
                                            <Page 
                                                pageNumber={cell.source_page + 1} 
                                                width={cell.w * displayScale} 
                                                renderTextLayer={false} 
                                                renderAnnotationLayer={false} 
                                            />
                                        </Document>
                                    )}
                                    {config.test_pattern && (
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--ink-primary)' }}>
                                            {cell.source_page + 1}
                                        </div>
                                    )}
                                    <div className="cell-info" style={{ background: isHoveredPair ? 'var(--accent-primary)' : 'rgba(17, 24, 39, 0.7)' }}>#{cell.card_idx + 1}</div>
                                </div>
                            );
                        })}

                        {/* Calibration Checklist Overlay Mock */}
                        {config.test_pattern && exportedCalibration && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', padding: 'var(--sp-8)', zIndex: 100, backdropFilter: 'blur(2px)' }}>
                                <h3 style={{ marginTop: 0, color: 'var(--ink-primary)', fontSize: '18px' }}>Calibration Checklist</h3>
                                <ol style={{ paddingLeft: '20px', flex: 1, color: 'var(--ink-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                                    <li style={{ marginBottom: '8px' }}>Print this PDF sheet.</li>
                                    <li style={{ marginBottom: '8px' }}>Flip it exactly as instructed in the Output panel.</li>
                                    <li style={{ marginBottom: '8px' }}>Print the back sheet.</li>
                                    <li style={{ marginBottom: '8px' }}>Hold it up to the light — do the numbers line up perfectly?</li>
                                </ol>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button style={{ flex: 1 }} onClick={() => setExportedCalibration(false)}>Perfect, it aligns!</button>
                                    <button style={{ flex: 1 }} className="secondary" onClick={() => setExportedCalibration(false)}>No, let me try a different flip mode</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {layoutData.total_sheets > 1 && (
                <div style={{ marginTop: '24px', display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', padding: '4px' }}>
                    {layoutData.sheets.map((_, i) => (
                        <button 
                            key={i} 
                            className={i === sheetIdx ? '' : 'secondary'} 
                            style={{ width: 'auto', flexShrink: 0, padding: '8px 16px', borderRadius: '20px', minHeight: '44px' }}
                            onClick={() => setSheetIdx(i)}
                        >
                            Sheet {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
