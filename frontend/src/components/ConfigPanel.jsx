import React, { useState } from 'react';
import { pdfjs } from 'react-pdf';
import GridSizePicker from './GridSizePicker';
import FlipModeSelector from './FlipModeSelector';
import { UploadCloud, FileText, X, ChevronDown, ChevronRight } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function ConfigPanel({ config, setConfig, setPdfFile, setPdfPageCount, layoutData, pdfFile, pdfPageCount, isMobile, onNext }) {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setPdfFile(file);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument(arrayBuffer).promise;
            setPdfPageCount(pdf.numPages);
            setConfig(c => ({...c, test_pattern: false}));
        }
    };

    let cardSizeDisplay = "Auto";
    if (layoutData && layoutData.sheets && layoutData.sheets.length > 0) {
        const cell = layoutData.sheets[0].front[0];
        if (cell) {
            const w = (cell.w / 72).toFixed(2);
            const h = (cell.h / 72).toFixed(2);
            cardSizeDisplay = `Auto: ${w} × ${h} in`;
        }
    }

    return (
        <div className="panel config-panel">
            <div className="panel-content">
                <h2>Source Document</h2>
                
                <div className="section-group">
                    {pdfFile && !config.test_pattern ? (
                        <div className="file-chip">
                            <div className="file-info" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                                <FileText size={24} color="var(--accent-primary)" />
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--ink-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {pdfFile.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
                                        {pdfPageCount} pages
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="secondary" 
                                style={{ padding: '6px', width: 'auto', border: 'none', background: 'transparent' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPdfFile(null);
                                    setPdfPageCount(0);
                                }}
                            >
                                <X size={16} color="var(--ink-secondary)" />
                            </button>
                        </div>
                    ) : (
                        <div className="upload-zone" onClick={() => document.getElementById('pdf-upload').click()}>
                            <input id="pdf-upload" type="file" accept="application/pdf" style={{display: 'none'}} onChange={handleFileChange} />
                            <UploadCloud size={24} className="upload-zone-icon" />
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent-primary)' }}>Click to upload PDF</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-secondary)' }}>or drag and drop</div>
                        </div>
                    )}
                    
                    <button className="secondary" style={{ marginTop: '12px' }} onClick={() => {
                        setPdfFile(null);
                        setPdfPageCount(0);
                        setConfig({...config, test_pattern: true});
                    }}>
                        Use Test Pattern Instead
                    </button>
                </div>

                <h2>Layout Settings</h2>
                <div className="section-group">
                    <GridSizePicker 
                        rows={config.rows} 
                        cols={config.cols} 
                        onChange={(r, c) => setConfig({...config, rows: r, cols: c})} 
                    />

                    <div style={{ marginTop: '16px' }}>
                        <FlipModeSelector 
                            mode={config.flip_mode} 
                            onChange={(mode) => setConfig({...config, flip_mode: mode})} 
                        />
                    </div>
                    
                    <div className="control-group" style={{ marginTop: '16px' }}>
                        <label>Card Size</label>
                        <div style={{ padding: '8px', background: 'var(--bg-canvas)', border: '1px solid var(--border-light)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                            {cardSizeDisplay}
                        </div>
                    </div>
                </div>

                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', marginBottom: advancedOpen ? '16px' : '0' }}
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                >
                    <h2 style={{ margin: 0 }}>Advanced Options</h2>
                    {advancedOpen ? <ChevronDown size={16} color="var(--ink-secondary)" /> : <ChevronRight size={16} color="var(--ink-secondary)" />}
                </div>

                {advancedOpen && (
                    <div className="section-group">
                        <div className="control-group">
                            <label>Margins (pts)</label>
                            <input type="number" value={config.margin_top} onChange={e => {
                                const v = parseFloat(e.target.value) || 0;
                                setConfig({...config, margin_top: v, margin_bottom: v, margin_left: v, margin_right: v});
                            }} />
                        </div>

                        <div className="control-group">
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Spacing X</label>
                                    <input type="number" value={config.spacing_x} onChange={e => setConfig({...config, spacing_x: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Spacing Y</label>
                                    <input type="number" value={config.spacing_y} onChange={e => setConfig({...config, spacing_y: parseFloat(e.target.value) || 0})} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="control-group">
                            <label className="checkbox-label">
                                <input type="checkbox" checked={config.crop_marks} onChange={e => setConfig({...config, crop_marks: e.target.checked})} /> 
                                Add Crop Marks
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" checked={config.manual_duplex} onChange={e => setConfig({...config, manual_duplex: e.target.checked})} /> 
                                Manual Duplex (Separate files)
                            </label>
                        </div>
                        
                        <div className="control-group">
                            <label>Bleed (pts)</label>
                            <input type="number" value={config.bleed} onChange={e => setConfig({...config, bleed: parseFloat(e.target.value) || 0})} />
                            {config.bleed > 0 && !config.crop_marks && (
                                <div className="warning" style={{ marginTop: '8px' }}>
                                    Bleed is set but crop marks are disabled. Cut lines may not be visible.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isMobile && onNext && (
                <div style={{ marginTop: '32px' }}>
                    <button onClick={onNext} style={{ width: '100%', minHeight: '44px' }}>
                        Continue to Preview
                    </button>
                </div>
            )}
        </div>
    );
}
