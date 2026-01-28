import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';
import { Noti5PDF } from '../components/Noti5PDF';
import type { Noti5Data } from '../types/noti5';

// Chemins des logos
const LOGO_AFPA_PATH = '/logo-afpa.png';
const LOGO_REPUBLIQUE_PATH = '/logo-republique.png';

/**
 * Charge une image en base64 à partir de son URL
 */
async function loadImageAsBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Impossible de charger l'image: ${url}`);
      return undefined;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Erreur lors du chargement de l'image ${url}:`, error);
    return undefined;
  }
}

/**
 * Charge les deux logos en parallèle
 */
async function loadLogos(): Promise<{ logoAfpa?: string; logoRepublique?: string }> {
  const [logoAfpa, logoRepublique] = await Promise.all([
    loadImageAsBase64(LOGO_AFPA_PATH),
    loadImageAsBase64(LOGO_REPUBLIQUE_PATH)
  ]);
  return { logoAfpa, logoRepublique };
}

/**
 * Génère un Blob PDF à partir des données NOTI5 en utilisant @react-pdf/renderer
 */
export async function generateNoti5PdfBlobReact(data: Noti5Data): Promise<Blob> {
  // Charger les logos
  const { logoAfpa, logoRepublique } = await loadLogos();
  
  const pdfDocument = React.createElement(Noti5PDF, { 
    data,
    logoAfpa,
    logoRepublique
  });
  const blob = await pdf(pdfDocument).toBlob();
  return blob;
}

/**
 * Exporte le NOTI5 en PDF avec @react-pdf/renderer (téléchargement direct)
 */
export async function exportNoti5PdfReact(data: Noti5Data): Promise<void> {
  const blob = await generateNoti5PdfBlobReact(data);
  const fileName = `NOTI5_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.attributaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  saveAs(blob, fileName);
}

/**
 * Génère un Blob PDF pour usage dans les ZIP multi-lots
 */
export async function generateNoti5PdfAsBlobReact(data: Noti5Data): Promise<Blob> {
  return generateNoti5PdfBlobReact(data);
}
