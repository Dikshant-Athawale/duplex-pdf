import React, { useState, useEffect } from 'react';
import ConfigPanel from './components/ConfigPanel';
import PreviewWorkbench from './components/PreviewWorkbench';
import ExportPanel from './components/ExportPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layers, Sun, Moon, Settings, Monitor, FileDown } from 'lucide-react';
import './styles.css';

/**
 * @typedef {Object} ImposeConfig
 * @property {number} rows - Number of rows in the grid
 * @property {number} cols - Number of columns in the grid
 * @property {number} page_width - Width of the output page in points
 * @property {number} page_height - Height of the output page in points
 * @property {string} flip_mode - The flip mode ('short_edge' or 'long_edge')
 * @property {boolean} manual_duplex - True if manual duplexing is needed
 * @property {boolean} test_pattern - True to use test pattern
 */

/**
 * @typedef {Object} LayoutData
 * @property {number} page_width
 * @property {number} page_height
 * @property {number} total_sheets
 * @property {number} total_cards
 * @property {Array<{sheet_idx: number, front: Array<any>, back: Array<any>}>} sheets
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [activeTab, setActiveTab] = useState('setup'); // 'setup', 'preview', 'output'

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  /** @type {[ImposeConfig, React.Dispatch<React.SetStateAction<ImposeConfig>>]} */
  const [config, setConfig] = useState({
    rows: 3,
    cols: 3,
    page_width: 612.0, // 8.5x11
    page_height: 792.0,
    margin_top: 36.0,
    margin_bottom: 36.0,
    margin_left: 36.0,
    margin_right: 36.0,
    spacing_x: 0.0,
    spacing_y: 0.0,
    flip_mode: 'long_edge',
    bleed: 0.0,
    crop_marks: false,
    manual_duplex: false,
    test_pattern: false
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  /** @type {[LayoutData | null, React.Dispatch<React.SetStateAction<LayoutData | null>>]} */
  const [layoutData, setLayoutData] = useState(null);
  const [layoutError, setLayoutError] = useState(null);
  const [exportedCalibration, setExportedCalibration] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        const count = config.test_pattern ? config.rows * config.cols * 2 : pdfPageCount;
        if (count > 0) {
        setLayoutError(null);
        fetch(`${API_BASE_URL}/api/layout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config, page_count: count })
        })
        .then(r => {
            if (!r.ok) throw new Error("Backend error: " + r.statusText);
            return r.json();
        })
        .then(data => setLayoutData(data))
        .catch(e => {
            console.error(e);
            setLayoutError(e.message || `Could not connect to FastAPI backend at ${API_BASE_URL}. Is it running?`);
        });
        } else {
        setLayoutData(null);
        setLayoutError(null);
        }
    }, 200);
    return () => clearTimeout(timer);
  }, [config, pdfPageCount]);

  return (
    <div className="app-container">
      <div className="app-bar">
        <div className="app-title">
          <Layers size={20} color="var(--accent-primary)" />
          <span>PDF Imposer</span>
        </div>
        <button 
            className="secondary" 
            style={{ width: 'auto', padding: '8px' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
        >
            {theme === 'dark' ? <Sun size={16} color="var(--ink-secondary)" /> : <Moon size={16} color="var(--ink-secondary)" />}
        </button>
      </div>

      {isMobile && (
        <div className="mobile-tab-bar">
          <div className={`mobile-tab ${activeTab === 'setup' ? 'active' : ''}`} onClick={() => setActiveTab('setup')}>
            <Settings size={18} /> Setup
          </div>
          <div className={`mobile-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
            <Monitor size={18} /> Preview
          </div>
          <div className={`mobile-tab ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>
            <FileDown size={18} /> Output
          </div>
        </div>
      )}

      <div className="workbench">
        {(!isMobile || activeTab === 'setup') && (
          <ConfigPanel config={config} setConfig={setConfig} setPdfFile={setPdfFile} setPdfPageCount={setPdfPageCount} layoutData={layoutData} pdfFile={pdfFile} pdfPageCount={pdfPageCount} isMobile={isMobile} onNext={() => setActiveTab('preview')} />
        )}
        {(!isMobile || activeTab === 'preview') && (
          <ErrorBoundary>
            <PreviewWorkbench config={config} layoutData={layoutData} layoutError={layoutError} pdfFile={pdfFile} exportedCalibration={exportedCalibration} setExportedCalibration={setExportedCalibration} isMobile={isMobile} />
          </ErrorBoundary>
        )}
        {(!isMobile || activeTab === 'output') && (
          <ExportPanel config={config} pdfFile={pdfFile} layoutData={layoutData} pdfPageCount={pdfPageCount} onExportSuccess={() => {
            if (config.test_pattern) setExportedCalibration(true);
          }} isMobile={isMobile} />
        )}
      </div>
    </div>
  );
}
