import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { generateNoti1Html } from '../utils/noti1HtmlGenerator';
import type { Noti1Data } from '../types/noti1';

interface Noti1ViewerProps {
  data: Noti1Data;
  onClose: () => void;
}

export default function Noti1Viewer({ data, onClose }: Noti1ViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    generateNoti1Html(data).then(setHtmlContent);
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Aperçu NOTI1 - Information au titulaire pressenti
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-auto p-4">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg"
              title="Aperçu NOTI1"
              style={{ minHeight: '800px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement de l'aperçu...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
