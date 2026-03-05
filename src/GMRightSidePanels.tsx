import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { assetPath } from './assetPath';
import { PdfPagesAsImages } from './PdfPagesAsImages';

type OpenPanel = 'guide' | 'cheatsheet' | null;

interface GMRightSidePanelsProps {
  openPanel: OpenPanel;
  onSetOpenPanel: (panel: OpenPanel) => void;
}

const PDF_URL = assetPath('cheatsheets/IPA_CheatSheet.pdf');

export function GMRightSidePanels({ openPanel, onSetOpenPanel }: GMRightSidePanelsProps) {
  const [markdown, setMarkdown] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isOpen = openPanel !== null;

  React.useEffect(() => {
    if (openPanel !== 'guide' || markdown !== null) return;
    setLoading(true);
    setError(null);
    fetch(assetPath('reviewer_3_guides/README.md'))
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error('Failed to load'))))
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load guide');
        setLoading(false);
      });
  }, [openPanel, markdown]);

  const handleToggle = (panel: 'guide' | 'cheatsheet') => {
    onSetOpenPanel(openPanel === panel ? null : panel);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => onSetOpenPanel(null)}
          aria-hidden
        />
      )}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex overflow-hidden transition-[transform,width] duration-300 ease-out"
        style={{
          width: openPanel === 'cheatsheet' ? 'min(calc(64rem + 4rem), 100vw)' : 'min(calc(36rem + 4rem), 100vw)',
          transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% - 4rem))'
        }}
      >
        <div className="flex-shrink-0 w-16 flex flex-col border-r border-slate-700" style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.3)' }}>
          <button
            type="button"
            onClick={() => handleToggle('guide')}
            className={`flex-1 flex items-center justify-center border-b border-slate-700 text-2xl font-medium transition-colors min-h-[4rem] ${openPanel === 'guide' ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title={openPanel === 'guide' ? 'Hide Reviewer 3 Guide' : 'Show Reviewer 3 Guide'}
            aria-label={openPanel === 'guide' ? 'Hide Reviewer 3 Guide' : 'Show Reviewer 3 Guide'}
            aria-expanded={openPanel === 'guide'}
          >
            <span className="origin-center -rotate-90 whitespace-nowrap">Reviewer 3 Guide</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggle('cheatsheet')}
            className={`flex-1 flex items-center justify-center text-2xl font-medium transition-colors min-h-[4rem] ${openPanel === 'cheatsheet' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            title={openPanel === 'cheatsheet' ? 'Hide Metrics Cheat-sheet' : 'Show Metrics Cheat-sheet'}
            aria-label={openPanel === 'cheatsheet' ? 'Hide Metrics Cheat-sheet' : 'Show Metrics Cheat-sheet'}
            aria-expanded={openPanel === 'cheatsheet'}
          >
            <span className="origin-center -rotate-90 whitespace-nowrap">Metrics Cheat-sheet</span>
          </button>
        </div>
        <div
          className="flex-1 min-w-0 flex flex-col bg-slate-900 border-l border-slate-700 shadow-2xl overflow-hidden h-full"
          role="dialog"
          aria-label={openPanel === 'guide' ? 'Reviewer 3 Guide' : 'Metrics Cheat-sheet'}
        >
          {openPanel === 'guide' && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
                <h2 className="text-lg font-semibold text-slate-100">Reviewer 3 Guide</h2>
                <button
                  type="button"
                  onClick={() => onSetOpenPanel(null)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition"
                  title="Close"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                {loading && <p className="text-slate-400 text-sm">Loading guide…</p>}
                {error && (
                  <p className="text-red-400 text-sm">
                    {error}. You can view the guide at{' '}
                    <a href="https://github.com/BIOP/coLoc/tree/main/resources/reviewer_3_guides" target="_blank" rel="noopener noreferrer" className="underline text-sky-400 hover:text-sky-300">
                      GitHub
                    </a>.
                  </p>
                )}
                {markdown && !error && (
                  <div className="reviewer-guide-content text-sm text-slate-300 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-slate-200 [&_em]:italic [&_img]:max-h-20 [&_img]:object-contain [&_img]:rounded">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        img: ({ src, alt, title, ...rest }) => (
                          <img src={assetPath(src)} alt={alt ?? ''} title={title ?? undefined} className="inline-block align-baseline" {...rest} />
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-slate-600">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-slate-600 bg-slate-800 px-2 py-1.5 text-left text-xs font-semibold text-slate-200">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-slate-600 px-2 py-1.5 text-xs text-slate-300">{children}</td>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline">{children}</a>
                        )
                      }}
                    >
                      {markdown}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          )}
          {openPanel === 'cheatsheet' && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
                <h2 className="text-lg font-semibold text-slate-100">Metrics Cheat-sheet</h2>
                <button
                  type="button"
                  onClick={() => onSetOpenPanel(null)}
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
