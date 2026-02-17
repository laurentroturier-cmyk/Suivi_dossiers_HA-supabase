/**
 * Export Multiple NOTI3 to ZIP
 * Génère un fichier ZIP contenant un PDF séparé pour chaque candidat perdant
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Noti3Data } from '../types/noti3';
import { generateNoti3PdfBlobReact } from './noti3PdfReactExport';

/**
 * Exporte plusieurs NOTI3 en un seul fichier ZIP
 * Chaque NOTI3 est généré comme un PDF séparé dans le ZIP
 * 
 * @param perdants - Liste des candidats perdants avec leurs données NOTI3
 * @param numeroProcedure - Numéro de procédure pour nommer le fichier ZIP
 */
export async function exportAllNoti3ToZip(
  perdants: Noti3Data[],
  numeroProcedure: string
): Promise<void> {
  if (!perdants || perdants.length === 0) {
    throw new Error('Aucun perdant à exporter');
  }

  // Créer une instance de JSZip
  const zip = new JSZip();

  // Pour chaque candidat perdant, générer son PDF et l'ajouter au ZIP
  for (let i = 0; i < perdants.length; i++) {
    const perdant = perdants[i];
    
    try {
      // Générer le PDF pour ce candidat
      const pdfBlob = await generateNoti3PdfBlobReact(perdant);
      
      // Créer un nom de fichier unique et propre
      const candidatNom = perdant.candidat.denomination
        .replace(/[^a-zA-Z0-9\s]/g, '') // Supprimer les caractères spéciaux
        .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
        .substring(0, 50); // Limiter la longueur
      
      const lotInfo = perdant.notification.lots?.[0]?.numero 
        ? `_Lot${perdant.notification.lots[0].numero}`
        : '';
      
      const fileName = `NOTI3_${i + 1}_${candidatNom}${lotInfo}.pdf`;
      
      // Ajouter le PDF au ZIP
      zip.file(fileName, pdfBlob);
      
    } catch (error) {
      console.error(`Erreur lors de la génération du PDF pour ${perdant.candidat.denomination}:`, error);
      // Continuer avec les autres candidats même si un échoue
    }
  }

  // Générer le fichier ZIP
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Télécharger le fichier ZIP
  const zipFileName = `NOTI3_Multi_${numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${perdants.length}candidats.zip`;
  saveAs(zipBlob, zipFileName);
}

/**
 * Retourne des informations sur l'export avant de le lancer
 * Utile pour afficher un message de confirmation à l'utilisateur
 */
export function getZipExportInfo(perdants: Noti3Data[]): {
  count: number;
  candidats: string[];
  estimatedSize: string;
} {
  const count = perdants.length;
  const candidats = perdants.map(p => p.candidat.denomination);
  // Estimation: environ 100-150 KB par PDF
  const estimatedSizeKB = count * 125;
  const estimatedSize = estimatedSizeKB > 1024 
    ? `~${(estimatedSizeKB / 1024).toFixed(1)} Mo` 
    : `~${estimatedSizeKB} Ko`;
  
  return { count, candidats, estimatedSize };
}
