import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';
import { Noti3PDF } from '../components/Noti3PDF';
import type { Noti3Data } from '../types/noti3';

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
 * Génère un Blob PDF à partir des données NOTI3 en utilisant @react-pdf/renderer
 */
export async function generateNoti3PdfBlobReact(data: Noti3Data): Promise<Blob> {
  const { logoAfpa, logoRepublique } = await loadLogos();
  const pdfDocument = React.createElement(Noti3PDF, { data, logoAfpa, logoRepublique });
  const blob = await pdf(pdfDocument).toBlob();
  return blob;
}

/**
 * Exporte le NOTI3 en PDF avec @react-pdf/renderer (téléchargement direct)
 */
export async function exportNoti3PdfReact(data: Noti3Data): Promise<void> {
  const blob = await generateNoti3PdfBlobReact(data);
  const _p3r = data.numeroProcedure.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');
  const _l3r = (data.notification?.lots || []).filter((l: any) => l.numero).map((l: any) => `Lot ${l.numero}`);
  const _ls3r = _l3r.length > 0 ? _l3r.join('-') : 'Lot 1';
  const _t3r = (data.candidat.denomination || '').replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const fileName = `${_p3r}_${_ls3r}_${_t3r}_NOTI 3.pdf`;
  saveAs(blob, fileName);
}

/**
 * Génère un Blob PDF pour usage dans les ZIP multi-lots
 */
export async function generateNoti3PdfAsBlobReact(data: Noti3Data): Promise<Blob> {
  return generateNoti3PdfBlobReact(data);
}
