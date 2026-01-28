import { saveAs } from 'file-saver';

declare global {
  interface Window {
    html2pdf?: any;
  }
}

interface PdfOptionsParams {
  filename?: string;
}

function getPdfOptions({ filename }: PdfOptionsParams = {}) {
  return {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      windowWidth: document.body.scrollWidth,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all', 'css'], avoid: '.section-group, .section-header, .section-content' },
  };
}

/**
 * Convertit du HTML (chaîne complète) en Blob PDF via html2pdf.js
 */
export async function htmlToPdfBlob(html: string, filename?: string): Promise<Blob> {
  if (typeof window === 'undefined' || !window.html2pdf) {
    throw new Error("La librairie html2pdf.js n'est pas disponible dans le contexte courant.");
  }

  const worker = window.html2pdf().set(getPdfOptions({ filename })).from(html);
  const blob: Blob = await worker.output('blob');
  return blob;
}

/**
 * Exporte directement un HTML en fichier PDF téléchargé par le navigateur
 */
export async function exportHtmlToPdf(html: string, filename: string): Promise<void> {
  if (typeof window === 'undefined' || !window.html2pdf) {
    alert("L'export PDF n'est pas disponible (html2pdf.js manquant).");
    return;
  }

  const blob = await htmlToPdfBlob(html, filename);
  saveAs(blob, filename);
}

