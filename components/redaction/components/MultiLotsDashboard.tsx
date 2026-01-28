import React, { useState } from 'react';
import { FileText, Download, Users, Award, XCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';
import type { MultiLotsAnalysis, CandidatAnalyse } from '../types/multiLots';
import { Noti1Modal, Noti3Modal, Noti5Modal } from '../../analyse';
import type { Noti1Data } from '../types/noti1';
import type { Noti5Data } from '../types/noti5';
import type { Noti3Data } from '../types/noti3';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  generateNoti1Html,
  generateNoti1HtmlAsBlob,
  generateNoti1PdfAsBlob,
} from '../utils/noti1HtmlGenerator';
import {
  generateNoti5Html,
  generateNoti5HtmlAsBlob,
  generateNoti5PdfAsBlob,
} from '../utils/noti5HtmlGenerator';
import {
  generateNoti3Html,
  generateNoti3HtmlAsBlob,
  generateNoti3PdfAsBlob,
} from '../utils/noti3HtmlGenerator';

interface MultiLotsDashboardProps {
  analysis: MultiLotsAnalysis;
  procedureInfo: {
    numeroAfpa: string;
    numProc: string;
    objet: string;
  };
  procedureData: any;
  rapportData: any;
  onClose: () => void;
}

export default function MultiLotsDashboard({
  analysis,
  procedureInfo,
  procedureData,
  rapportData,
  onClose,
}: MultiLotsDashboardProps) {
  const [expandedCandidat, setExpandedCandidat] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'gagnants' | 'perdants' | 'mixtes'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showZipPanel, setShowZipPanel] = useState(false);

  // Prévisualisation latérale
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLabel, setPreviewLabel] = useState<string>('Aucun document sélectionné');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Modals
  const [showNoti1Modal, setShowNoti1Modal] = useState(false);
  const [showNoti5Modal, setShowNoti5Modal] = useState(false);
  const [showNoti3Modal, setShowNoti3Modal] = useState(false);
  const [currentNoti1, setCurrentNoti1] = useState<Noti1Data | null>(null);
  const [currentNoti5, setCurrentNoti5] = useState<Noti5Data | null>(null);
  const [currentNoti3, setCurrentNoti3] = useState<Noti3Data[]>([]);

  // Filtrer les candidats
  const filteredCandidats = analysis.candidats.filter((c) => {
    // Filtre par type
    if (filterType === 'gagnants' && c.lotsPerdus.length > 0) return false;
    if (filterType === 'perdants' && c.lotsGagnes.length > 0) return false;
    if (filterType === 'mixtes' && (c.lotsGagnes.length === 0 || c.lotsPerdus.length === 0)) return false;

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return c.nom.toLowerCase().includes(search);
    }

    return true;
  });

  const toggleCandidat = (nom: string) => {
    setExpandedCandidat(expandedCandidat === nom ? null : nom);
  };

  // Génération massive NOTI1
  const generateAllNoti1 = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecLots = [...analysis.candidatsGagnants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecLots) {
        const noti1Data = buildNoti1Data(candidat);
        const blob = await generateNoti1HtmlAsBlob(noti1Data);
        const fileName = `NOTI1_${sanitizeFileName(candidat.nom)}.html`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `NOTI1_${procedureInfo.numeroAfpa.replace(/\//g, '-')}.zip`);
      alert(`${candidatsAvecLots.length} documents NOTI1 générés avec succès !`);
    } catch (error) {
      console.error('Erreur génération NOTI1:', error);
      alert('Erreur lors de la génération des NOTI1');
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération massive NOTI1 en PDF
  const generateAllNoti1Pdf = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecLots = [...analysis.candidatsGagnants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecLots) {
        const noti1Data = buildNoti1Data(candidat);
        const blob = await generateNoti1PdfAsBlob(noti1Data);
        const fileName = `NOTI1_${sanitizeFileName(candidat.nom)}.pdf`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `NOTI1_PDF_${procedureInfo.numeroAfpa.replace(/\//g, '-')}.zip`);
      alert(`${candidatsAvecLots.length} PDF NOTI1 générés avec succès !`);
    } catch (error) {
      console.error('Erreur génération NOTI1 PDF:', error);
      alert('Erreur lors de la génération des NOTI1 PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération massive NOTI5
  const generateAllNoti5 = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecLots = [...analysis.candidatsGagnants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecLots) {
        const noti5Data = buildNoti5Data(candidat);
        const blob = await generateNoti5HtmlAsBlob(noti5Data);
        const fileName = `NOTI5_${sanitizeFileName(candidat.nom)}.html`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `NOTI5_${procedureInfo.numeroAfpa.replace(/\//g, '-')}.zip`);
      alert(`${candidatsAvecLots.length} documents NOTI5 générés avec succès !`);
    } catch (error) {
      console.error('Erreur génération NOTI5:', error);
      alert('Erreur lors de la génération des NOTI5');
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération massive NOTI5 en PDF
  const generateAllNoti5Pdf = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecLots = [...analysis.candidatsGagnants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecLots) {
        const noti5Data = buildNoti5Data(candidat);
        const blob = await generateNoti5PdfAsBlob(noti5Data);
        const fileName = `NOTI5_${sanitizeFileName(candidat.nom)}.pdf`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `NOTI5_PDF_${procedureInfo.numeroAfpa.replace(/\//g, '-')}.zip`);
      alert(`${candidatsAvecLots.length} PDF NOTI5 générés avec succès !`);
    } catch (error) {
      console.error('Erreur génération NOTI5 PDF:', error);
      alert('Erreur lors de la génération des NOTI5 PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération massive NOTI3
  const generateAllNoti3 = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecPerdus = [...analysis.candidatsPerdants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecPerdus) {
        // 1 document par lot perdu
        for (const lotPerdu of candidat.lotsPerdus) {
          const noti3Data = buildNoti3DataForLot(candidat, lotPerdu);
          const blob = await generateNoti3HtmlAsBlob(noti3Data);
          const fileName = `NOTI3_Lot${lotPerdu.numero}_${sanitizeFileName(candidat.nom)}.html`;
          zip.file(fileName, blob);
        }
      }

      const totalDocs = candidatsAvecPerdus.reduce((sum, c) => sum + c.lotsPerdus.length, 0);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `NOTI3_${procedureInfo.numeroAfpa.replace(/\//g, '-')}.zip`);
      alert(`${totalDocs} documents NOTI3 générés avec succès !`);
    } catch (error) {
      console.error('Erreur génération NOTI3:', error);
      alert('Erreur lors de la génération des NOTI3');
    } finally {
      setIsGenerating(false);
    }
  };

  // Génération massive NOTI3 en PDF
  const generateAllNoti3Pdf = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecPerdus = [...analysis.candidatsPerdants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecPerdus) {
        // 1 document par lot perdu
        for (const lotPerdu of candidat.lotsPerdus) {
          const noti3Data = buildNoti3DataForLot(candidat, lotPerdu);
          const blob = await generateNoti3PdfAsBlob(noti3Data);
          const fileName = `NOTI3_Lot${lotPerdu.numero}_${sanitizeFileName(candidat.nom)}.pdf`;
          zip.file(fileName, blob);
        }
      }

      const totalDocs = candidatsAvecPerdus.reduce((sum, c) => sum + c.lotsPerdus.length, 0);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `NOTI3_PDF_${procedureInfo.numeroAfpa.replace(/\//g, '-')}.zip`);
      alert(`${totalDocs} PDF NOTI3 générés avec succès !`);
    } catch (error) {
      console.error('Erreur génération NOTI3 PDF:', error);
      alert('Erreur lors de la génération des NOTI3 PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Prévisualisation NOTI1 / NOTI5 / NOTI3
  const previewNoti1 = async (candidat: CandidatAnalyse) => {
    setIsPreviewLoading(true);
    setPreviewLabel(`NOTI1 – ${candidat.nom}`);
    try {
      const data = buildNoti1Data(candidat);
      const html = await generateNoti1Html(data);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Erreur prévisualisation NOTI1:', error);
      alert('Erreur lors de la génération de la prévisualisation NOTI1');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const previewNoti5 = async (candidat: CandidatAnalyse) => {
    setIsPreviewLoading(true);
    setPreviewLabel(`NOTI5 – ${candidat.nom}`);
    try {
      const data = buildNoti5Data(candidat);
      const html = await generateNoti5Html(data);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Erreur prévisualisation NOTI5:', error);
      alert('Erreur lors de la génération de la prévisualisation NOTI5');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const previewNoti3ForLot = async (candidat: CandidatAnalyse, lotPerdu: any) => {
    setIsPreviewLoading(true);
    setPreviewLabel(`NOTI3 – ${candidat.nom} (Lot ${lotPerdu.numero})`);
    try {
      const data = buildNoti3DataForLot(candidat, lotPerdu);
      const html = await generateNoti3Html(data);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Erreur prévisualisation NOTI3:', error);
      alert('Erreur lors de la génération de la prévisualisation NOTI3');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Construction des données NOTI (helpers)
  const buildNoti1Data = (candidat: CandidatAnalyse): Noti1Data => {
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
        lots: candidat.lotsGagnes.map(l => ({
          numero: l.numero,
          intitule: l.intitule,
        })),
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

  const buildNoti5Data = (candidat: CandidatAnalyse): Noti5Data => {
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
        lots: candidat.lotsGagnes.map(l => ({
          numero: l.numero,
          intitule: l.intitule,
        })),
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

  const buildNoti3Data = (candidat: CandidatAnalyse): Noti3Data => {
    // DEPRECATED - utiliser buildNoti3DataForLot à la place
    // Garde pour compatibilité mais ne devrait plus être utilisé
    return buildNoti3DataForLot(candidat, candidat.lotsPerdus[0]);
  };

  const buildNoti3DataForLot = (candidat: CandidatAnalyse, lotPerdu: any): Noti3Data => {
    // 1 NOTI3 pour 1 lot perdu spécifique
    // Récupérer les pondérations spécifiques à ce lot
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
        lots: [{
          numero: lotPerdu.numero,
          intitule: lotPerdu.intitule,
        }],
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
        noteEco: String(Math.round(lotPerdu.noteFinanciere || 0)),
        noteTech: String(Math.round(lotPerdu.noteTechnique || 0)),
        total: String(Math.round(lotPerdu.noteCandidat || 0)),
        classement: String(lotPerdu.rang || '-'),
        maxEco,
        maxTech,
      },
      attributaire: {
        denomination: lotPerdu.gagnant || '',
        noteEco: String(Math.round(lotPerdu.noteFinGagnant || 0)),
        noteTech: String(Math.round(lotPerdu.noteTechGagnant || 0)),
        total: String(Math.round(lotPerdu.noteGagnant || 100)),
        motifs: 'Offre économiquement la plus avantageuse au regard des critères d\'analyse.',
        maxEco,
        maxTech,
      },
      delaiStandstill: '11',
      signature: {
        lieu: 'Montreuil',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        signataireTitre: 'Le Directeur National des Achats',
        signataireNom: '',
      },
    };
  };

  const sanitizeFileName = (name: string): string => {
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl px-4 pt-3 pb-4 max-h-[75vh] flex flex-col">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          📊 Procédure multi-lots
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {procedureInfo.numeroAfpa} - {procedureInfo.objet}
        </p>
      </div>

      {/* Stats en mode chips */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100 border border-blue-100 dark:border-blue-700">
          <Package className="w-3 h-3" />
          <span className="font-medium">{analysis.totalLots}</span>
          <span className="opacity-80">lots</span>
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-100 border border-green-100 dark:border-green-700">
          <Award className="w-3 h-3" />
          <span className="font-medium">{analysis.candidatsGagnants.length}</span>
          <span className="opacity-80">gagnants</span>
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-100 border border-orange-100 dark:border-orange-700">
          <Users className="w-3 h-3" />
          <span className="font-medium">{analysis.candidatsMixtes.length}</span>
          <span className="opacity-80">mixtes</span>
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-100 border border-red-100 dark:border-red-700">
          <XCircle className="w-3 h-3" />
          <span className="font-medium">{analysis.candidatsPerdants.length}</span>
          <span className="opacity-80">perdants</span>
        </span>
      </div>

      {/* Actions de génération massive (repliable) */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setShowZipPanel((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-[13px] text-indigo-900 dark:text-indigo-50 border border-indigo-100 dark:border-indigo-700"
        >
          <span className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Génération massive (ZIP NOTI1, NOTI5, NOTI3)
          </span>
          <span className="text-xs opacity-80">
            {showZipPanel ? 'Masquer' : 'Afficher'}
          </span>
        </button>

        {showZipPanel && (
          <div className="mt-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg px-3 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <button
                onClick={generateAllNoti1}
                disabled={isGenerating || (analysis.candidatsGagnants.length + analysis.candidatsMixtes.length === 0)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                NOTI1 ({analysis.candidatsGagnants.length + analysis.candidatsMixtes.length})
              </button>

              <button
                onClick={generateAllNoti5}
                disabled={isGenerating || (analysis.candidatsGagnants.length + analysis.candidatsMixtes.length === 0)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                NOTI5 ({analysis.candidatsGagnants.length + analysis.candidatsMixtes.length})
              </button>

              <button
                onClick={generateAllNoti3}
                disabled={isGenerating || (analysis.candidatsPerdants.length + analysis.candidatsMixtes.length === 0)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                NOTI3 ({analysis.candidatsPerdants.reduce((sum, c) => sum + c.lotsPerdus.length, 0) + analysis.candidatsMixtes.reduce((sum, c) => sum + c.lotsPerdus.length, 0)} docs)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={generateAllNoti1Pdf}
                disabled={isGenerating || (analysis.candidatsGagnants.length + analysis.candidatsMixtes.length === 0)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                NOTI1 PDF ({analysis.candidatsGagnants.length + analysis.candidatsMixtes.length})
              </button>

              <button
                onClick={generateAllNoti5Pdf}
                disabled={isGenerating || (analysis.candidatsGagnants.length + analysis.candidatsMixtes.length === 0)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                NOTI5 PDF ({analysis.candidatsGagnants.length + analysis.candidatsMixtes.length})
              </button>

              <button
                onClick={generateAllNoti3Pdf}
                disabled={isGenerating || (analysis.candidatsPerdants.length + analysis.candidatsMixtes.length === 0)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                NOTI3 PDF ({analysis.candidatsPerdants.reduce((sum, c) => sum + c.lotsPerdus.length, 0) + analysis.candidatsMixtes.reduce((sum, c) => sum + c.lotsPerdus.length, 0)} docs)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Corps principal : liste + prévisualisation */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Colonne gauche : filtres + candidats */}
        <div className="lg:w-7/12 flex flex-col min-h-0">
          {/* Filtres et recherche */}
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un candidat..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            
            <div className="flex gap-2">
              {(['all', 'gagnants', 'perdants', 'mixtes'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'all' ? 'Tous' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des candidats */}
          <div className="space-y-2 overflow-y-auto pr-1">
            {filteredCandidats.map((candidat) => (
              <div
                key={candidat.nom}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleCandidat(candidat.nom)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{candidat.nom}</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      {candidat.lotsGagnes.length} gagné{candidat.lotsGagnes.length > 1 ? 's' : ''}
                    </span>
                    {candidat.lotsPerdus.length > 0 && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                        {candidat.lotsPerdus.length} perdu{candidat.lotsPerdus.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {expandedCandidat === candidat.nom ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {expandedCandidat === candidat.nom && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                    {candidat.lotsGagnes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                          ✅ Lots gagnés ({candidat.lotsGagnes.length})
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {candidat.lotsGagnes.map((lot) => (
                            <div key={lot.numero}>
                              • Lot {lot.numero} - {lot.intitule} (Note: {lot.noteCandidat.toFixed(2)})
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setCurrentNoti1(buildNoti1Data(candidat));
                              setShowNoti1Modal(true);
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                          >
                            Éditer NOTI1
                          </button>
                          <button
                            onClick={() => previewNoti1(candidat)}
                            className="px-3 py-1 border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 text-sm rounded"
                          >
                            Aperçu NOTI1
                          </button>
                          <button
                            onClick={() => {
                              setCurrentNoti5(buildNoti5Data(candidat));
                              setShowNoti5Modal(true);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                          >
                            Éditer NOTI5
                          </button>
                          <button
                            onClick={() => previewNoti5(candidat)}
                            className="px-3 py-1 border border-green-200 text-green-700 bg-white hover:bg-green-50 text-sm rounded"
                          >
                            Aperçu NOTI5
                          </button>
                        </div>
                      </div>
                    )}

                    {candidat.lotsPerdus.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                          ❌ Lots perdus ({candidat.lotsPerdus.length})
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {candidat.lotsPerdus.map((lot) => (
                            <div key={lot.numero}>
                              • Lot {lot.numero} - Rang {lot.rang} (Note: {lot.noteCandidat.toFixed(2)} vs {lot.noteGagnant.toFixed(2)})
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Générer {candidat.lotsPerdus.length} document{candidat.lotsPerdus.length > 1 ? 's' : ''} NOTI3 (1 par lot)
                          </p>
                          {candidat.lotsPerdus.map((lot) => (
                            <div key={lot.numero} className="flex flex-wrap items-center gap-2 mb-2">
                              <button
                                onClick={() => {
                                  const noti3 = buildNoti3DataForLot(candidat, lot);
                                  setCurrentNoti3([noti3]);
                                  setShowNoti3Modal(true);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                              >
                                Éditer NOTI3 Lot {lot.numero}
                              </button>
                              <button
                                onClick={() => previewNoti3ForLot(candidat, lot)}
                                className="px-3 py-1 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 text-xs rounded"
                              >
                                Aperçu NOTI3 Lot {lot.numero}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite : prévisualisation */}
        <div className="lg:w-5/12 flex flex-col min-h-0">
          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl h-full flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Aperçu des notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sélectionnez un candidat puis cliquez sur « Aperçu » pour afficher le NOTI.
                </p>
              </div>
              {previewHtml && (
                <button
                  onClick={() => {
                    setPreviewHtml('');
                    setPreviewLabel('Aucun document sélectionné');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Effacer
                </button>
              )}
            </div>
            <div className="px-4 pt-2 text-xs text-gray-600 dark:text-gray-400">
              {previewLabel}
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Génération de la prévisualisation...
                    </p>
                  </div>
                </div>
              ) : previewHtml ? (
                <iframe
                  title="Aperçu NOTI"
                  srcDoc={previewHtml}
                  className="w-full h-full min-h-[260px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                    Aucune prévisualisation pour l’instant. Choisissez un candidat dans la liste à
                    gauche puis utilisez les boutons « Aperçu NOTI1 / NOTI5 / NOTI3 ».
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNoti1Modal && currentNoti1 && (
        <Noti1Modal
          isOpen={showNoti1Modal}
          onClose={() => setShowNoti1Modal(false)}
          initialData={currentNoti1}
          procedureInfo={procedureInfo}
        />
      )}

      {showNoti5Modal && currentNoti5 && (
        <Noti5Modal
          isOpen={showNoti5Modal}
          onClose={() => setShowNoti5Modal(false)}
          initialData={currentNoti5}
          procedureInfo={procedureInfo}
        />
      )}

      {showNoti3Modal && currentNoti3.length > 0 && (
        <Noti3Modal
          isOpen={showNoti3Modal}
          onClose={() => setShowNoti3Modal(false)}
          perdants={currentNoti3}
          procedureInfo={procedureInfo}
        />
      )}
    </div>
  );
}
