import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import React from 'react';
import { RapportPresentationPDF } from '../components/RapportPresentationPDF';

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
 * Charge les logos AFPA
 */
async function loadLogos(): Promise<{ logoAfpa?: string }> {
  const logoAfpa = await loadImageAsBase64('/Image1.png');
  return { logoAfpa };
}

/**
 * Génère un Blob PDF à partir des données du Rapport de Présentation
 */
export async function generateRapportPresentationPdfBlob(data: any): Promise<Blob> {
  const { logoAfpa } = await loadLogos();
  const pdfDocument = React.createElement(RapportPresentationPDF, { 
    data, 
    logoAfpa
  });
  const blob = await pdf(pdfDocument).toBlob();
  return blob;
}

/**
 * Exporte le Rapport de Présentation en PDF (téléchargement direct)
 */
export async function exportRapportPresentationPdf(
  data: any,
  filename?: string
): Promise<void> {
  try {
    const blob = await generateRapportPresentationPdfBlob(data);
    const defaultFilename = filename || `Rapport_Presentation_${data?.numeroProcedure || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`;
    saveAs(blob, defaultFilename);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
}
