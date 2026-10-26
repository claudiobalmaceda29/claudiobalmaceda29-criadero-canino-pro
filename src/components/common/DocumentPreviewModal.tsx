import React from 'react';
import { X, Download, ExternalLink, Printer, FileText, Image as ImageIcon } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  docUrl: string;
  docNombre?: string;
  docTipo?: 'PDF' | 'IMAGEN';
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  docUrl,
  docNombre = 'documento',
  docTipo,
}) => {
  if (!isOpen || !docUrl) return null;

  const isPdf =
    docTipo === 'PDF' ||
    docUrl.startsWith('data:application/pdf') ||
    docUrl.toLowerCase().endsWith('.pdf') ||
    docUrl.includes('application/pdf');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = docUrl;
    a.download = docNombre || (isPdf ? 'pedigree-documento.pdf' : 'pedigree-documento.png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (isPdf) {
      const printWindow = window.open(docUrl);
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
              <p className="text-[11px] text-slate-500 truncate">
                {subtitle || docNombre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Descargar archivo en tu dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100/90 overflow-hidden relative flex items-center justify-center p-3 sm:p-5">
          {isPdf ? (
            <iframe
              src={docUrl}
              title={title}
              className="w-full h-full bg-white rounded-xl shadow-md border border-slate-200"
            />
          ) : (
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
              <img
                src={docUrl}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Formato: {isPdf ? 'Documento Portable PDF' : 'Imagen Gráfica de Pedigree'}</span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Guardar copia</span>
          </button>
        </div>
      </div>
    </div>
  );
};
