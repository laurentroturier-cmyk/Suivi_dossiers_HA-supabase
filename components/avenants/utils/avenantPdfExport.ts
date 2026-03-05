// ============================================
// Export Avenant (EXE10) — React PDF Renderer
// Pattern identique aux exports NOTI
// ============================================

import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';
import { AvenantPDF } from '../components/AvenantPDF';
import type { AvenantData } from '../types';

// ─── Logos (dossier public) ───────────────────────────────────────────────────
const LOGO_AFPA_PATH       = '/logo-afpa.png';
const LOGO_REPUBLIQUE_PATH = '/logo-republique.png';

async function loadImageAsBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[AvenantPDF] Impossible de charger : ${url}`);
      return undefined;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[AvenantPDF] Erreur chargement image ${url}:`, err);
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

// ─── Génération du Blob PDF ───────────────────────────────────────────────────

export async function generateAvenantPdfBlob(data: AvenantData): Promise<Blob> {
  const { logoAfpa, logoRepublique } = await loadLogos();
  const element = React.createElement(AvenantPDF, { data, logoAfpa, logoRepublique });
  return pdf(element as any).toBlob();
}

// ─── Export direct (téléchargement) ──────────────────────────────────────────

export async function exportAvenantPdf(data: AvenantData): Promise<void> {
  const blob = await generateAvenantPdfBlob(data);
  const num  = data.numero_avenant ?? 'X';
  const ref  = (data.contrat_reference || 'avenant').replace(/[^a-zA-Z0-9-_]/g, '_');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  saveAs(blob, `Avenant_${num}_${ref}_${date}.pdf`);
}
