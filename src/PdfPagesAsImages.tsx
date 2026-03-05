import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { assetPath } from './assetPath';

// Configure worker for PDF.js (must be set before getDocument is called)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = assetPath('pdf.worker.min.mjs');
}

interface PdfPagesAsImagesProps {
  pdfUrl: string;
  scale?: number;
  rotate90?: boolean;
  className?: string;
}

export function PdfPagesAsImages({ pdfUrl, scale = 2, rotate90 = false, className = '' }: PdfPagesAsImagesProps) {
  const [pageImages, setPageImages] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const numPages = pdf.numPages;
        const images: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport
            }).promise;
            images.push(canvas.toDataURL('image/png'));
          }
        }

        if (!cancelled) {
          setPageImages(images);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, scale]);

  if (loading) {
    return (
      <p className="text-slate-400 text-sm py-8">Loading PDF…</p>
    );
  }

  if (error) {
    return (
      <p className="text-red-400 text-sm py-8">{error}</p>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {pageImages.map((dataUrl, i) => (
        <div
          key={i}
          className={rotate90 ? 'flex justify-center [&>img]:rounded' : ''}
          style={rotate90 ? { transform: 'rotate(90deg)', transformOrigin: 'center center' } : undefined}
        >
          <img
            src={dataUrl}
            alt={`Page ${i + 1}`}
            className="max-w-full h-auto block rounded"
          />
        </div>
      ))}
    </div>
  );
}
