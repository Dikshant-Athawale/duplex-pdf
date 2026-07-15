import React, { useState } from 'react';
import { Download, AlertTriangle, LayoutTemplate } from 'lucide-react';

export default function ExportPanel({ config, pdfFile, layoutData, onExportSuccess, pdfPageCount, isMobile }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        try {
            const formData = new FormData();
            formData.append('config_json', JSON.stringify(config));
            if (pdfFile && !config.test_pattern) {
                formData.append('file', pdfFile);
            }

            const response = await fetch(`${API_BASE_URL}/api/export`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                alert(`Export failed: ${text}`);
                setExporting(false);
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = config.manual_duplex ? 'imposed_duplex.zip' : 'imposed.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            if (onExportSuccess) onExportSuccess();
        } catch (e) {
            alert(`Export failed: ${e.message}`);
        }
        setExporting(false);
    };

    return (
        <div className="panel output-panel">
            <div className="panel-content" style={{ paddingBottom: '0', display: 'flex', flexDirection: 'column' }}>
                <h2>Output Overview</h2>
                
                {layoutData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div className="stat-grid">
                            <div className="stat-card">
                                <span className="stat-label">Total Cards</span>
                                <span className="stat-value">{layoutData.total_cards}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Sheets Needed</span>
                                <span className="stat-value">{layoutData.total_sheets}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Grid Layout</span>
                                <span className="stat-value">{config.rows}×{config.cols}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Duplex Type</span>
                                <span className="stat-value" style={{ fontSize: '14px', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>
                                    {config.manual_duplex ? "Manual" : "Auto"}
                                </span>
                            </div>
                        </div>
                        
                        {!config.test_pattern && pdfPageCount && pdfPageCount % 2 !== 0 && (
                            <div className="warning">
                                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} color="#92400E" />
                                <div>Your source PDF has {pdfPageCount} pages — imposition needs pairs. The last card will be blank on back.</div>
                            </div>
                        )}
                        
                        <div style={{ fontSize: '12px', color: 'var(--ink-secondary)', background: 'var(--bg-canvas)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
                            <strong style={{ color: 'var(--ink-primary)', display: 'block', marginBottom: '8px' }}>Printer Settings to Use:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>• Scale: <strong>Actual Size (100%)</strong></div>
                                {!config.manual_duplex && (
                                    <>
                                        <div>• Duplex: <strong>Print on both sides</strong></div>
                                        <div>• Flip: <strong>{config.flip_mode === 'long_edge' ? 'Long Edge' : 'Short Edge'}</strong></div>
                                    </>
                                )}
                                {config.manual_duplex && (
                                    <div>• Print fronts, flip stack, print backs</div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', marginBottom: '24px' }}>
                            {isMobile ? (
                                <div className="mobile-sticky-bottom">
                                    <button 
                                        onClick={handleExport} 
                                        disabled={exporting || (!pdfFile && !config.test_pattern) || !layoutData}
                                        style={{ minHeight: '44px' }}
                                    >
                                        <Download size={18} />
                                        {exporting ? 'Generating...' : 'Download PDF'}
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleExport} 
                                    disabled={exporting || (!pdfFile && !config.test_pattern) || !layoutData}
                                    style={{ marginTop: 'auto' }}
                                >
                                    <Download size={18} />
                                    {exporting ? 'Generating...' : 'Download PDF'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--ink-secondary)', textAlign: 'center', opacity: 0.6, marginTop: '48px' }}>
                        <LayoutTemplate size={32} strokeWidth={1} style={{ marginBottom: '12px' }} />
                        <div style={{ fontSize: '13px', lineHeight: 1.5, maxWidth: '200px' }}>
                            Configure the job and upload a PDF to see the output details.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
