import React from 'react';
import { assetPath } from './assetPath';
import { PdfPagesAsImages } from './PdfPagesAsImages';

interface MetricsCheatsheetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const PDF_URL = assetPath('cheatsheets/IPA_CheatSheet.pdf');

export function MetricsCheatsheetPanel({ isOpen, onClose, onToggle }: MetricsCheatsheetPanelProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex overflow-hidden transition-[transform,width] duration-300 ease-out"
        style={{
          width: 'min(calc(64rem + 4rem), 100vw)',
          transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% - 4rem))'
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          className={`flex-shrink-0 w-16 flex items-center justify-center border-r text-2xl font-medium transition-colors rounded-l-lg ${isOpen ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
          style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.3)' }}
          title={isOpen ? 'Hide Metrics Cheat-sheet' : 'Show Metrics Cheat-sheet'}
          aria-label={isOpen ? 'Hide Metrics Cheat-sheet' : 'Show Metrics Cheat-sheet'}
          aria-expanded={isOpen}
        >
          <span className="origin-center -rotate-90 whitespace-nowrap">Metrics Cheat-sheet</span>
        </button>
        <div
          className="flex-1 min-w-0 flex flex-col bg-slate-900 border-l border-slate-700 shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Metrics Cheat-sheet"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
            <h2 className="text-lg font-semibold text-slate-100">Metrics Cheat-sheet</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition"
              title="Close"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950">
            <PdfPagesAsImages pdfUrl={PDF_URL} rotate90 className="max-w-2xl mx-auto" />
          </div>
        </div>
      </div>
    </>
  );
}
