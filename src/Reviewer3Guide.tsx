import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { assetPath } from './assetPath';

interface Reviewer3GuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function Reviewer3GuidePanel({ isOpen, onClose, onToggle }: Reviewer3GuidePanelProps) {
  const [markdown, setMarkdown] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || markdown !== null) return;
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
  }, [isOpen, markdown]);

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
        className="fixed right-0 top-0 bottom-0 z-50 flex overflow-hidden transition-transform duration-300 ease-out"
        style={{
          width: 'min(calc(36rem + 4rem), 100vw)',
          transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% - 4rem))'
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          className={`flex-shrink-0 w-16 flex items-center justify-center border-r text-2xl font-medium transition-colors rounded-l-lg ${isOpen ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
          style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.3)' }}
          title={isOpen ? 'Hide Reviewer 3 Guide' : 'Show Reviewer 3 Guide'}
          aria-label={isOpen ? 'Hide Reviewer 3 Guide' : 'Show Reviewer 3 Guide'}
          aria-expanded={isOpen}
        >
          <span className="origin-center -rotate-90 whitespace-nowrap">Reviewer 3 Guide</span>
        </button>
        <div
          className="flex-1 min-w-0 flex flex-col bg-slate-900 border-l border-slate-700 shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Reviewer 3 Guide"
        >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80 shrink-0">
          <h2 className="text-lg font-semibold text-slate-100">Reviewer 3 Guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition"
            title="Close guide"
            aria-label="Close guide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <p className="text-slate-400 text-sm">Loading guide…</p>
          )}
          {error && (
            <p className="text-red-400 text-sm">
              {error}. You can view the guide at{' '}
              <a
                href="https://github.com/BIOP/coLoc/tree/main/resources/reviewer_3_guides"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-sky-400 hover:text-sky-300"
              >
                GitHub
              </a>
              .
            </p>
          )}
          {markdown && !error && (
            <div className="reviewer-guide-content text-sm text-slate-300 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-slate-200 [&_em]:italic [&_img]:max-h-20 [&_img]:object-contain [&_img]:rounded">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({ src, alt, title, ...rest }) => (
                    <img
                      src={assetPath(src)}
                      alt={alt ?? ''}
                      title={title ?? undefined}
                      className="inline-block align-baseline"
                      {...rest}
                    />
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-slate-600">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-slate-600 bg-slate-800 px-2 py-1.5 text-left text-xs font-semibold text-slate-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-slate-600 px-2 py-1.5 text-xs text-slate-300">
                      {children}
                    </td>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline">
                      {children}
                    </a>
                  )
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
