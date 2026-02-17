/**
 * Types pour le module NOTI Par Lots
 * Gestion de la vérification et de l'export des notis par lots
 */

export interface NotiVerification {
  noti1: boolean;
  noti3: boolean;
  noti5: boolean;
}

export interface LotNotiStatus {
  numeroLot: string;
  intituleLot: string;
  verification: NotiVerification;
  candidatsAttributaires: string[]; // Noms des candidats gagnants sur ce lot
  candidatsPerdants: string[]; // Noms des candidats perdants sur ce lot
}

export interface ExportZipOption {
  type: 'par-lot' | 'par-fournisseur' | 'par-type-noti';
  label: string;
  description: string;
}

export const EXPORT_ZIP_OPTIONS: ExportZipOption[] = [
  {
    type: 'par-lot',
    label: 'Export par lot',
    description: '1 ZIP par lot contenant tous les NOTI de ce lot',
  },
  {
    type: 'par-fournisseur',
    label: 'Export par fournisseur',
    description: '1 ZIP par fournisseur contenant tous ses NOTI (tous lots confondus)',
  },
  {
    type: 'par-type-noti',
    label: 'Export par type de NOTI',
    description: '3 ZIP (NOTI1, NOTI3, NOTI5) contenant tous les documents de chaque type',
  },
];

/**
 * Génère le nom de fichier selon la nomenclature demandée
 * Format: {numeroCourt}_Lot{numeroLot}_{nomCandidat}_{typeNoti}.pdf
 * Exemple: 25006_Lot1_Tartempion_NOTI1.pdf
 */
export function generateNotiFileName(
  numeroCourt: string,
  numeroLot: string,
  nomCandidat: string,
  typeNoti: 'NOTI1' | 'NOTI3' | 'NOTI5',
  extension: 'pdf' | 'html' = 'pdf'
): string {
  // Nettoyer le nom du candidat pour le système de fichiers
  const nomClean = nomCandidat
    .replace(/[^a-zA-Z0-9\-_À-ÿ ]/g, '') // Supprimer caractères spéciaux sauf tirets, underscores et accents
    .replace(/\s+/g, '_') // Remplacer espaces par underscores
    .substring(0, 50); // Limiter la longueur
  
  return `${numeroCourt}_Lot${numeroLot}_${nomClean}_${typeNoti}.${extension}`;
}

/**
 * Génère le nom du fichier ZIP selon le type d'export
 */
export function generateZipFileName(
  type: ExportZipOption['type'],
  numeroCourt: string,
  identifier?: string // Numéro de lot, nom candidat, ou type NOTI selon le type d'export
): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  switch (type) {
    case 'par-lot':
      return `${numeroCourt}_Lot${identifier}_NOTI_${timestamp}.zip`;
    case 'par-fournisseur':
      const nomClean = identifier?.replace(/[^a-zA-Z0-9\-_À-ÿ ]/g, '').replace(/\s+/g, '_').substring(0, 30);
      return `${numeroCourt}_${nomClean}_NOTI_${timestamp}.zip`;
    case 'par-type-noti':
      return `${numeroCourt}_${identifier}_${timestamp}.zip`;
    default:
      return `${numeroCourt}_NOTI_${timestamp}.zip`;
  }
}
