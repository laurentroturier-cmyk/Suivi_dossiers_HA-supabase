
import React from 'react';

interface DocumentViewerProps {
  fileName: string;
  publicUrl: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ fileName, publicUrl, onClose }) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf = ext === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

  // Pour Office, on utilise le viewer Google Docs qui est très performant pour le rendu web
  const officeViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(publicUrl)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute top-6 right-8 flex items-center gap-4 z-[70]">
        <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block">
          {fileName}
        </span>
        <a 
          href={publicUrl} 
          download 
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
          title="Télécharger"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
        <button 
          onClick={onClose}
          className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-2xl transition-all shadow-xl shadow-red-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="w-full h-full max-w-7xl max-h-[90vh] p-4 sm:p-12 flex items-center justify-center">
        {isImage ? (
          <img 
            src={publicUrl} 
            alt={fileName} 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-500"
          />
        ) : isPdf ? (
          <iframe 
            src={`${publicUrl}#toolbar=0`}
            className="w-full h-full rounded-2xl bg-white shadow-2xl overflow-hidden"
            title={fileName}
          />
        ) : isOffice ? (
          <iframe 
            src={officeViewerUrl}
            className="w-full h-full rounded-2xl bg-white shadow-2xl border-0 overflow-hidden"
            title={fileName}
          />
        ) : (
          <div className="bg-white/5 p-12 rounded-[3rem] text-center border border-white/10">
            <svg className="w-20 h-20 text-white/20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-white font-black uppercase tracking-widest text-sm mb-4">Aperçu non disponible</p>
            <a 
              href={publicUrl} 
              className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest inline-block hover:scale-105 transition-all"
            >
              Télécharger pour consulter
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
