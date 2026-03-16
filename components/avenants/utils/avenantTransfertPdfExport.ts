// ============================================
// Export Avenant de Transfert — React PDF
// Pattern identique à avenantPdfExport.ts
// ============================================

import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';
import { AvenantTransfertPDF } from '../components/AvenantTransfertPDF';
import type { AvenantTransfertData } from '../types';

const LOGO_AFPA_PATH       = '/logo-afpa.png';
const LOGO_REPUBLIQUE_PATH = '/logo-republique.png';

async function loadImageAsBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function loadLogos(): Promise<{ logoAfpa?: string; logoRepublique?: string }> {
  const [logoAfpa, logoRepublique] = await Promise.all([
    loadImageAsBase64(LOGO_AFPA_PATH),
    loadImageAsBase64(LOGO_REPUBLIQUE_PATH),
  ]);
  return { logoAfpa, logoRepublique };
}

export async function generateAvenantTransfertPdfBlob(data: AvenantTransfertData): Promise<Blob> {
  const { logoAfpa, logoRepublique } = await loadLogos();
  const element = React.createElement(AvenantTransfertPDF, { data, logoAfpa, logoRepublique });
  return pdf(element as any).toBlob();
}

export async function exportAvenantTransfertPdf(data: AvenantTransfertData): Promise<void> {
  const blob = await generateAvenantTransfertPdfBlob(data);
  const num  = data.numero_avenant ?? 'X';
  const ref  = (data.contrat_reference || 'transfert').replace(/[^a-zA-Z0-9-_]/g, '_');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  saveAs(blob, `AvenantTransfert_${num}_${ref}_${date}.pdf`);
}
