import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Download,
  Package,
  Users,
  
  FileText,
  Loader2,
  Eye,
} from 'lucide-react';
import type { MultiLotsAnalysis, CandidatAnalyse } from '../types/multiLots';
import type { LotNotiStatus, ExportZipOption, EXPORT_ZIP_OPTIONS } from '../types/notiParLots';
import { generateNotiFileName, generateZipFileName } from '../types/notiParLots';
import { Noti1Modal, Noti3Modal, Noti5Modal } from '../../analyse';
import type { Noti1Data } from '../types/noti1';
import type { Noti5Data } from '../types/noti5';
import type { Noti3Data } from '../types/noti3';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateNoti1PdfBlobReact } from '../utils/noti1PdfReactExport';
import { generateNoti5PdfBlobReact } from '../utils/noti5PdfReactExport';
import { generateNoti3PdfBlobReact } from '../utils/noti3PdfReactExport';

interface NotiParLotsProps {
  analysis: MultiLotsAnalysis;
  procedureInfo: {
    numeroAfpa: string;
    numProc: string;
    objet: string;
    numeroCourt: string;
  };
  onClose: () => void;
  onBackToModeSelection: () => void;
}

/**
 * Formate une note avec ses décimales
 */
function formatNote(value: number | undefined | null): string {
  const num = Number(value) || 0;
  if (Number.isInteger(num)) return String(num);
  return num.toLocaleString('fr-FR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export default function NotiParLots({
  analysis,
  procedureInfo,
  onClose,
  onBackToModeSelection,
}: NotiParLotsProps) {
  // État de navigation et vérification
  const [lotsStatus, setLotsStatus] = useState<LotNotiStatus[]>([]);
  const [currentLotIndex, setCurrentLotIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Modals NOTI
  const [showNoti1Modal, setShowNoti1Modal] = useState(false);
  const [showNoti3Modal, setShowNoti3Modal] = useState(false);
  const [showNoti5Modal, setShowNoti5Modal] = useState(false);
  const [currentNoti1Data, setCurrentNoti1Data] = useState<Noti1Data | null>(null);
  const [currentNoti5Data, setCurrentNoti5Data] = useState<Noti5Data | null>(null);
  const [currentNoti3Data, setCurrentNoti3Data] = useState<Noti3Data[]>([]);

  // Initialiser les lots à partir de l'analyse multi-lots
  useEffect(() => {
    const lots = extractLotsFromAnalysis(analysis);
    setLotsStatus(lots);
  }, [analysis]);

  const extractLotsFromAnalysis = (analysis: MultiLotsAnalysis): LotNotiStatus[] => {
    const lotsMap = new Map<string, LotNotiStatus>();

    // Parcourir tous les candidats pour identifier tous les lots
    analysis.candidats.forEach((candidat) => {
      // Lots gagnés
      candidat.lotsGagnes.forEach((lot) => {
        if (!lotsMap.has(lot.numero)) {
          lotsMap.set(lot.numero, {
            numeroLot: lot.numero,
            intituleLot: lot.intitule,
            verification: { noti1: false, noti3: false, noti5: false },
            candidatsAttributaires: [],
            candidatsPerdants: [],
          });
        }
        const lotStatus = lotsMap.get(lot.numero)!;
        if (!lotStatus.candidatsAttributaires.includes(candidat.nom)) {
          lotStatus.candidatsAttributaires.push(candidat.nom);
        }
      });

      // Lots perdus
      candidat.lotsPerdus.forEach((lot) => {
        if (!lotsMap.has(lot.numero)) {
          lotsMap.set(lot.numero, {
            numeroLot: lot.numero,
            intituleLot: lot.intitule,
            verification: { noti1: false, noti3: false, noti5: false },
            candidatsAttributaires: [],
            candidatsPerdants: [],
          });
        }
        const lotStatus = lotsMap.get(lot.numero)!;
        if (!lotStatus.candidatsPerdants.includes(candidat.nom)) {
          lotStatus.candidatsPerdants.push(candidat.nom);
        }
      });
    });

    // Convertir en array et trier par numéro de lot
    return Array.from(lotsMap.values()).sort((a, b) => {
      const numA = parseInt(a.numeroLot, 10);
      const numB = parseInt(b.numeroLot, 10);
      return numA - numB;
    });
  };

  const currentLot = lotsStatus[currentLotIndex];
  const isFirstLot = currentLotIndex === 0;
  const isLastLot = currentLotIndex === lotsStatus.length - 1;

  const goToNextLot = () => {
    if (!isLastLot) {
      setCurrentLotIndex(currentLotIndex + 1);
    }
  };

  const goToPreviousLot = () => {
    if (!isFirstLot) {
      setCurrentLotIndex(currentLotIndex - 1);
    }
  };

  const toggleVerification = (notiType: 'noti1' | 'noti3' | 'noti5') => {
    const updatedLots = [...lotsStatus];
    updatedLots[currentLotIndex].verification[notiType] = !updatedLots[currentLotIndex].verification[notiType];
    setLotsStatus(updatedLots);
  };

  const openNoti1Preview = () => {
    if (!currentLot) return;
    
    // Trouver les candidats attributaires pour ce lot
    const candidatsAttributaires = analysis.candidats.filter((c) =>
      c.lotsGagnes.some((l) => l.numero === currentLot.numeroLot)
    );

    if (candidatsAttributaires.length === 0) {
      alert('Aucun attributaire trouvé pour ce lot');
      return;
    }

    // Pour l'instant, on prend le premier attributaire
    const candidat = candidatsAttributaires[0];
    const noti1Data = buildNoti1DataForLot(candidat, currentLot.numeroLot);
    setCurrentNoti1Data(noti1Data);
    setShowNoti1Modal(true);
  };

  const openNoti5Preview = () => {
    if (!currentLot) return;
    
    // Trouver les candidats attributaires pour ce lot
    const candidatsAttributaires = analysis.candidats.filter((c) =>
      c.lotsGagnes.some((l) => l.numero === currentLot.numeroLot)
    );

    if (candidatsAttributaires.length === 0) {
      alert('Aucun attributaire trouvé pour ce lot');
      return;
    }

    // Pour l'instant, on prend le premier attributaire
    const candidat = candidatsAttributaires[0];
    const noti5Data = buildNoti5DataForLot(candidat, currentLot.numeroLot);
    setCurrentNoti5Data(noti5Data);
    setShowNoti5Modal(true);
  };

  const openNoti3Preview = () => {
    if (!currentLot) return;
    
    // Trouver tous les candidats perdants pour ce lot
    const candidatsPerdants = analysis.candidats.filter((c) =>
      c.lotsPerdus.some((l) => l.numero === currentLot.numeroLot)
    );

    if (candidatsPerdants.length === 0) {
      alert('Aucun candidat perdant trouvé pour ce lot');
      return;
    }

    // Construire un NOTI3 pour chaque perdant
    const noti3List = candidatsPerdants.map((candidat) => {
      const lotPerdu = candidat.lotsPerdus.find((l) => l.numero === currentLot.numeroLot)!;
      return buildNoti3DataForLot(candidat, lotPerdu);
    });

    setCurrentNoti3Data(noti3List);
    setShowNoti3Modal(true);
  };

  // Construction des données NOTI
  const buildNoti1DataForLot = (candidat: CandidatAnalyse, numeroLot: string): Noti1Data => {
    const lot = candidat.lotsGagnes.find((l) => l.numero === numeroLot);
    if (!lot) {
      throw new Error(`Lot ${numeroLot} non trouvé pour ${candidat.nom}`);
    }

    return {
      numeroProcedure: procedureInfo.numeroAfpa,
      pouvoirAdjudicateur: {
        nom: 'Agence nationale pour la formation professionnelle des adultes',
        adresseVoie: '3, rue Franklin',
        codePostal: '93100',
        ville: 'MONTREUIL',
      },
      objetConsultation: procedureInfo.objet,
      titulaire: {
        denomination: candidat.nom,
        siret: candidat.coordonnees?.siret || '',
        adresse1: candidat.coordonnees?.adresse || '',
        adresse2: '',
        codePostal: candidat.coordonnees?.codePostal || '',
        ville: candidat.coordonnees?.ville || '',
        email: candidat.coordonnees?.email || '',
        telephone: candidat.coordonnees?.telephone || '',
        fax: '',
        estMandataire: false,
      },
      attribution: {
        type: 'lots',
        lots: [{ numero: lot.numero, intitule: lot.intitule }],
      },
      documents: {
        dateSignature: '',
        candidatFrance: true,
        candidatEtranger: false,
        documentsPreuve: '',
        delaiReponse: '',
        decompteA: 'réception',
      },
      signature: {
        lieu: 'Montreuil',
        date: '',
        signataireTitre: '',
        signataireNom: '',
      },
    };
  };

  const buildNoti5DataForLot = (candidat: CandidatAnalyse, numeroLot: string): Noti5Data => {
    const lot = candidat.lotsGagnes.find((l) => l.numero === numeroLot);
    if (!lot) {
      throw new Error(`Lot ${numeroLot} non trouvé pour ${candidat.nom}`);
    }

    return {
      numeroProcedure: procedureInfo.numeroAfpa,
      pouvoirAdjudicateur: {
        nom: 'AFPA',
        adresseVoie: '3, rue Franklin',
        codePostal: '93100',
        ville: 'MONTREUIL',
      },
      objetConsultation: procedureInfo.objet,
      notification: {
        type: 'lots',
        lots: [{ numero: lot.numero, intitule: lot.intitule }],
        executionImmediateChecked: true,
        executionOrdreServiceChecked: false,
      },
      attributaire: {
        denomination: candidat.nom,
        siret: candidat.coordonnees?.siret || '',
        adresse1: candidat.coordonnees?.adresse || '',
        adresse2: '',
        codePostal: candidat.coordonnees?.codePostal || '',
        ville: candidat.coordonnees?.ville || '',
        email: candidat.coordonnees?.email || '',
        telephone: candidat.coordonnees?.telephone || '',
        fax: '',
        estMandataire: false,
      },
      garantie: {
        pasPrevue: true,
        prevueSansAllotissement: false,
        retenueGarantieSansAllotissement: false,
        garantiePremiereDemandeOuCautionSansAllotissement: false,
        prevueAvecAllotissement: false,
        montantInferieur90k: false,
        montantSuperieur90kRetenue: false,
        montantSuperieur90kGarantie: false,
        modalites: '',
      },
      executionPrestations: { type: 'immediate' },
      garanties: {
        aucuneGarantie: true,
        retenue: {
          active: false,
          pourcentage: 0,
          remplacablePar: { garantiePremieredemande: false, cautionPersonnelle: false },
        },
        garantieAvanceSuperieure30: false,
        garantieAvanceInferieure30: { active: false, remplacableParCaution: false },
      },
      piecesJointes: { actEngagementPapier: true, actEngagementPDF: true },
      signature: {
        lieu: 'Montreuil',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        signataireTitre: 'Le Directeur National des Achats',
        signataireNom: '',
      },
    };
  };

  const buildNoti3DataForLot = (candidat: CandidatAnalyse, lotPerdu: any): Noti3Data => {
    const maxEco = String(lotPerdu.maxEco || 60);
    const maxTech = String(lotPerdu.maxTech || 40);
    
    return {
      numeroProcedure: procedureInfo.numeroAfpa,
      pouvoirAdjudicateur: {
        nom: 'AFPA - Association nationale pour la formation professionnelle des adultes',
        adresseVoie: '13, place du Général de Gaulle',
        codePostal: '93100',
        ville: 'Montreuil',
      },
      objetConsultation: procedureInfo.objet,
      notification: {
        type: 'lots',
        lots: [{ numero: lotPerdu.numero, intitule: lotPerdu.intitule }],
      },
      candidat: {
        denomination: candidat.nom,
        adresse1: candidat.coordonnees?.adresse || '',
        codePostal: candidat.coordonnees?.codePostal || '',
        ville: candidat.coordonnees?.ville || '',
        siret: candidat.coordonnees?.siret || '',
        email: candidat.coordonnees?.email || '',
        telephone: candidat.coordonnees?.telephone || '',
      },
      rejet: {
        type: 'offre',
        motifs: lotPerdu.motifRejet || "Votre offre n'a pas obtenu la meilleure note.",
        noteEco: formatNote(lotPerdu.noteFinanciere),
        noteTech: formatNote(lotPerdu.noteTechnique),
        total: formatNote(lotPerdu.noteCandidat),
        classement: String(lotPerdu.rang || '-'),
        maxEco,
        maxTech,
      },
      attributaire: {
        denomination: lotPerdu.gagnant || '',
        noteEco: formatNote(lotPerdu.noteFinGagnant),
        noteTech: formatNote(lotPerdu.noteTechGagnant),
        total: formatNote(lotPerdu.noteGagnant) || '100',
        motifs: 'Offre la mieux-disante',
        maxEco,
        maxTech,
      },
      delaiStandstill: '11 jours',
      signature: {
        lieu: 'Montreuil',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        signataireTitre: 'Le Directeur National des Achats',
        signataireNom: '',
      },
    };
  };

  // Export ZIP
  const handleExportZip = async (exportType: ExportZipOption['type']) => {
    setIsExporting(true);
    try {
      switch (exportType) {
        case 'par-lot':
          await exportParLot();
          break;
        case 'par-fournisseur':
          await exportParFournisseur();
          break;
        case 'par-type-noti':
          await exportParTypeNoti();
          break;
      }
    } catch (error) {
      console.error('Erreur export ZIP:', error);
      alert(`Erreur lors de l'export: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportParLot = async () => {
    // 1 ZIP par lot
    for (const lot of lotsStatus) {
      const zip = new JSZip();
      let fileCount = 0;

      // NOTI1 et NOTI5 pour les attributaires
      const candidatsAttributaires = analysis.candidats.filter((c) =>
        c.lotsGagnes.some((l) => l.numero === lot.numeroLot)
      );

      for (const candidat of candidatsAttributaires) {
        // NOTI1
        try {
          const noti1Data = buildNoti1DataForLot(candidat, lot.numeroLot);
          const noti1Blob = await generateNoti1PdfBlobReact(noti1Data);
          const noti1FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lot.numeroLot,
            candidat.nom,
            'NOTI1'
          );
          zip.file(noti1FileName, noti1Blob);
          fileCount++;
        } catch (error) {
          console.error(`Erreur NOTI1 pour ${candidat.nom} - Lot ${lot.numeroLot}:`, error);
        }

        // NOTI5
        try {
          const noti5Data = buildNoti5DataForLot(candidat, lot.numeroLot);
          const noti5Blob = await generateNoti5PdfBlobReact(noti5Data);
          const noti5FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lot.numeroLot,
            candidat.nom,
            'NOTI5'
          );
          zip.file(noti5FileName, noti5Blob);
          fileCount++;
        } catch (error) {
          console.error(`Erreur NOTI5 pour ${candidat.nom} - Lot ${lot.numeroLot}:`, error);
        }
      }

      // NOTI3 pour les perdants
      const candidatsPerdants = analysis.candidats.filter((c) =>
        c.lotsPerdus.some((l) => l.numero === lot.numeroLot)
      );

      for (const candidat of candidatsPerdants) {
        try {
          const lotPerdu = candidat.lotsPerdus.find((l) => l.numero === lot.numeroLot)!;
          const noti3Data = buildNoti3DataForLot(candidat, lotPerdu);
          const noti3Blob = await generateNoti3PdfBlobReact(noti3Data);
          const noti3FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lot.numeroLot,
            candidat.nom,
            'NOTI3'
          );
          zip.file(noti3FileName, noti3Blob);
          fileCount++;
        } catch (error) {
          console.error(`Erreur NOTI3 pour ${candidat.nom} - Lot ${lot.numeroLot}:`, error);
        }
      }

      if (fileCount > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const zipFileName = generateZipFileName('par-lot', procedureInfo.numeroCourt, lot.numeroLot);
        saveAs(zipBlob, zipFileName);
      }
    }

    alert(`Export par lot terminé ! ${lotsStatus.length} fichiers ZIP générés.`);
  };

  const exportParFournisseur = async () => {
    // 1 ZIP par fournisseur (tous lots confondus)
    for (const candidat of analysis.candidats) {
      const zip = new JSZip();
      let fileCount = 0;

      // NOTI1 et NOTI5 pour chaque lot gagné
      for (const lotGagne of candidat.lotsGagnes) {
        try {
          const noti1Data = buildNoti1DataForLot(candidat, lotGagne.numero);
          const noti1Blob = await generateNoti1PdfBlobReact(noti1Data);
          const noti1FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lotGagne.numero,
            candidat.nom,
            'NOTI1'
          );
          zip.file(noti1FileName, noti1Blob);
          fileCount++;
        } catch (error) {
          console.error(`Erreur NOTI1 pour ${candidat.nom} - Lot ${lotGagne.numero}:`, error);
        }

        try {
          const noti5Data = buildNoti5DataForLot(candidat, lotGagne.numero);
          const noti5Blob = await generateNoti5PdfBlobReact(noti5Data);
          const noti5FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lotGagne.numero,
            candidat.nom,
            'NOTI5'
          );
          zip.file(noti5FileName, noti5Blob);
          fileCount++;
        } catch (error) {
          console.error(`Erreur NOTI5 pour ${candidat.nom} - Lot ${lotGagne.numero}:`, error);
        }
      }

      // NOTI3 pour chaque lot perdu
      for (const lotPerdu of candidat.lotsPerdus) {
        try {
          const noti3Data = buildNoti3DataForLot(candidat, lotPerdu);
          const noti3Blob = await generateNoti3PdfBlobReact(noti3Data);
          const noti3FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lotPerdu.numero,
            candidat.nom,
            'NOTI3'
          );
          zip.file(noti3FileName, noti3Blob);
          fileCount++;
        } catch (error) {
          console.error(`Erreur NOTI3 pour ${candidat.nom} - Lot ${lotPerdu.numero}:`, error);
        }
      }

      if (fileCount > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const zipFileName = generateZipFileName('par-fournisseur', procedureInfo.numeroCourt, candidat.nom);
        saveAs(zipBlob, zipFileName);
      }
    }

    alert(`Export par fournisseur terminé ! ${analysis.candidats.length} fichiers ZIP générés.`);
  };

  const exportParTypeNoti = async () => {
    // 3 ZIP : NOTI1, NOTI3, NOTI5
    const zipNoti1 = new JSZip();
    const zipNoti3 = new JSZip();
    const zipNoti5 = new JSZip();
    let countNoti1 = 0;
    let countNoti3 = 0;
    let countNoti5 = 0;

    // NOTI1 et NOTI5 pour tous les candidats avec lots gagnés
    for (const candidat of analysis.candidats) {
      for (const lotGagne of candidat.lotsGagnes) {
        try {
          const noti1Data = buildNoti1DataForLot(candidat, lotGagne.numero);
          const noti1Blob = await generateNoti1PdfBlobReact(noti1Data);
          const noti1FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lotGagne.numero,
            candidat.nom,
            'NOTI1'
          );
          zipNoti1.file(noti1FileName, noti1Blob);
          countNoti1++;
        } catch (error) {
          console.error(`Erreur NOTI1 pour ${candidat.nom} - Lot ${lotGagne.numero}:`, error);
        }

        try {
          const noti5Data = buildNoti5DataForLot(candidat, lotGagne.numero);
          const noti5Blob = await generateNoti5PdfBlobReact(noti5Data);
          const noti5FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lotGagne.numero,
            candidat.nom,
            'NOTI5'
          );
          zipNoti5.file(noti5FileName, noti5Blob);
          countNoti5++;
        } catch (error) {
          console.error(`Erreur NOTI5 pour ${candidat.nom} - Lot ${lotGagne.numero}:`, error);
        }
      }

      // NOTI3 pour tous les lots perdus
      for (const lotPerdu of candidat.lotsPerdus) {
        try {
          const noti3Data = buildNoti3DataForLot(candidat, lotPerdu);
          const noti3Blob = await generateNoti3PdfBlobReact(noti3Data);
          const noti3FileName = generateNotiFileName(
            procedureInfo.numeroCourt,
            lotPerdu.numero,
            candidat.nom,
            'NOTI3'
          );
          zipNoti3.file(noti3FileName, noti3Blob);
          countNoti3++;
        } catch (error) {
          console.error(`Erreur NOTI3 pour ${candidat.nom} - Lot ${lotPerdu.numero}:`, error);
        }
      }
    }

    // Générer les 3 ZIP
    if (countNoti1 > 0) {
      const blob = await zipNoti1.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const fileName = generateZipFileName('par-type-noti', procedureInfo.numeroCourt, 'NOTI1');
      saveAs(blob, fileName);
    }

    if (countNoti3 > 0) {
      const blob = await zipNoti3.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const fileName = generateZipFileName('par-type-noti', procedureInfo.numeroCourt, 'NOTI3');
      saveAs(blob, fileName);
    }

    if (countNoti5 > 0) {
      const blob = await zipNoti5.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const fileName = generateZipFileName('par-type-noti', procedureInfo.numeroCourt, 'NOTI5');
      saveAs(blob, fileName);
    }

    alert(`Export par type terminé !\nNOTI1: ${countNoti1} documents\nNOTI3: ${countNoti3} documents\nNOTI5: ${countNoti5} documents`);
  };

  if (!currentLot) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-[98vw] p-6">
          <div className="text-center">
            <p className="text-gray-700 dark:text-slate-300">Aucun lot trouvé dans l'analyse.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a] text-gray-800 dark:text-white rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-[98vw] max-h-[90vh] overflow-y-auto my-4">
          {/* En-tête */}
          <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">NOTI Par Lots</h2>
                  <p className="text-teal-100 text-sm mt-1">
                    Procédure {procedureInfo.numeroCourt} - {analysis.totalLots} lot(s)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation et sélection du lot */}
          <div className="p-6 border-b border-slate-300/70 dark:border-slate-600">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={goToPreviousLot}
                disabled={isFirstLot}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-[#252525] dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-white"
                title="Lot précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Sélectionner un lot
                </label>
                <select
                  value={currentLotIndex}
                  onChange={(e) => setCurrentLotIndex(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  {lotsStatus.map((lot, index) => (
                    <option key={lot.numeroLot} value={index}>
                      Lot {lot.numeroLot} - {lot.intituleLot}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  Lot {currentLotIndex + 1} sur {lotsStatus.length}
                </p>
              </div>

              <button
                onClick={goToNextLot}
                disabled={isLastLot}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-[#252525] dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-white"
                title="Lot suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bouton retour à la sélection de mode */}
            <button
              onClick={onBackToModeSelection}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm"
            >
              ← Retour au choix de mode
            </button>
          </div>

          {/* Informations du lot courant */}
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Lot {currentLot.numeroLot}
              </h3>
              <p className="text-gray-600 dark:text-slate-300 mb-4">{currentLot.intituleLot}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Attributaires :</p>
                  <ul className="text-sm text-gray-700 dark:text-slate-300 list-disc list-inside">
                    {currentLot.candidatsAttributaires.map((nom) => (
                      <li key={nom}>{nom}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Perdants :</p>
                  <ul className="text-sm text-gray-700 dark:text-slate-300 list-disc list-inside">
                    {currentLot.candidatsPerdants.map((nom) => (
                      <li key={nom}>{nom}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Vérification des NOTI */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vérification des notifications
              </h4>

              {/* NOTI1 */}
              {currentLot.candidatsAttributaires.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">NOTI1 - Notification d'attribution</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {currentLot.candidatsAttributaires.length} candidat(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openNoti1Preview}
                      className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-lg"
                      title="Prévisualiser NOTI1"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleVerification('noti1')}
                      className={`p-2 rounded-lg transition-colors ${
                        currentLot.verification.noti1
                          ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300'
                      }`}
                      title={currentLot.verification.noti1 ? 'Vérifié' : 'Marquer comme vérifié'}
                    >
                      {currentLot.verification.noti1 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* NOTI3 */}
              {currentLot.candidatsPerdants.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">NOTI3 - Notification de rejet</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {currentLot.candidatsPerdants.length} candidat(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openNoti3Preview}
                      className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-lg"
                      title="Prévisualiser NOTI3"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleVerification('noti3')}
                      className={`p-2 rounded-lg transition-colors ${
                        currentLot.verification.noti3
                          ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300'
                      }`}
                      title={currentLot.verification.noti3 ? 'Vérifié' : 'Marquer comme vérifié'}
                    >
                      {currentLot.verification.noti3 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* NOTI5 */}
              {currentLot.candidatsAttributaires.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">NOTI5 - Notification du marché public</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {currentLot.candidatsAttributaires.length} candidat(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openNoti5Preview}
                      className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200 rounded-lg"
                      title="Prévisualiser NOTI5"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleVerification('noti5')}
                      className={`p-2 rounded-lg transition-colors ${
                        currentLot.verification.noti5
                          ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300'
                      }`}
                      title={currentLot.verification.noti5 ? 'Vérifié' : 'Marquer comme vérifié'}
                    >
                      {currentLot.verification.noti5 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export ZIP */}
            <div className="border-t border-slate-300/70 dark:border-slate-600 pt-6 space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Exporter les NOTI en PDF
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleExportZip('par-lot')}
                  disabled={isExporting}
                  className="p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Par lot</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        1 ZIP par lot avec tous ses NOTI
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExportZip('par-fournisseur')}
                  disabled={isExporting}
                  className="p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">Par fournisseur</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        1 ZIP par fournisseur (tous lots)
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExportZip('par-type-noti')}
                  disabled={isExporting}
                  className="p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Par type de NOTI</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        3 ZIP (NOTI1, NOTI3, NOTI5)
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {isExporting && (
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Génération des fichiers ZIP en cours...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals NOTI */}
      {showNoti1Modal && currentNoti1Data && (
        <Noti1Modal
          isOpen={showNoti1Modal}
          onClose={() => setShowNoti1Modal(false)}
          initialData={currentNoti1Data}
          procedureInfo={procedureInfo}
        />
      )}

      {showNoti5Modal && currentNoti5Data && (
        <Noti5Modal
          isOpen={showNoti5Modal}
          onClose={() => setShowNoti5Modal(false)}
          initialData={currentNoti5Data}
          procedureInfo={procedureInfo}
        />
      )}

      {showNoti3Modal && currentNoti3Data.length > 0 && (
        <Noti3Modal
          isOpen={showNoti3Modal}
          onClose={() => setShowNoti3Modal(false)}
          perdants={currentNoti3Data}
          procedureInfo={procedureInfo}
        />
      )}
    </>
  );
}
