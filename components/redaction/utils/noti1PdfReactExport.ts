import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';
import { Noti1PDF } from '../components/Noti1PDF';
import type { Noti1Data } from '../types/noti1';

/**
 * Charge une image et la convertit en base64 pour @react-pdf/renderer
 */
async function loadImageAsBase64(imagePath: string): Promise<string | undefined> {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) {
      console.warn(`Impossible de charger l'image: ${imagePath}`);
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
    console.error(`Erreur chargement image ${imagePath}:`, error);
    return undefined;
  }
}

/**
 * Charge les logos AFPA et République
 */
async function loadLogos(): Promise<{ logoAfpa?: string; logoRepublique?: string }> {
  const [logoAfpa, logoRepublique] = await Promise.all([
    loadImageAsBase64('/logo-afpa.png'),
    loadImageAsBase64('/logo-republique.png'),
  ]);
  return { logoAfpa, logoRepublique };
}

/**
 * Génère un Blob PDF à partir des données NOTI1 en utilisant @react-pdf/renderer
 */
export async function generateNoti1PdfBlobReact(data: Noti1Data): Promise<Blob> {
  const { logoAfpa, logoRepublique } = await loadLogos();
  const pdfDocument = React.createElement(Noti1PDF, { data, logoAfpa, logoRepublique });
  const blob = await pdf(pdfDocument).toBlob();
  return blob;
}

/**
 * Exporte le NOTI1 en PDF avec @react-pdf/renderer (téléchargement direct)
 */
export async function exportNoti1PdfReact(data: Noti1Data): Promise<void> {
  const blob = await generateNoti1PdfBlobReact(data);
  const fileName = `NOTI1_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.titulaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  saveAs(blob, fileName);
}

/**
 * Génère un Blob PDF pour usage dans les ZIP multi-lots
 */
export async function generateNoti1PdfAsBlobReact(data: Noti1Data): Promise<Blob> {
  return generateNoti1PdfBlobReact(data);
}
