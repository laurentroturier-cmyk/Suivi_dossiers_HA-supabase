import React, { useState } from 'react';
import { FileText, Download, Users, Award, XCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';
import type { MultiLotsAnalysis, CandidatAnalyse } from './types/multiLots';
import Noti1Modal from '../analyse/Noti1Modal';
import Noti5Modal from '../analyse/Noti5Modal';
import Noti3Modal from '../analyse/Noti3Modal';
import type { Noti1Data } from './types/noti1';
import type { Noti5Data } from './types/noti5';
import type { Noti3Data } from './types/noti3';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateNoti1WordAsBlob } from './services/noti1Generator';
import { generateNoti5WordAsBlob } from './services/noti5Generator';
import { generateNoti3WordAsBlob } from './services/noti3Generator';

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
        const blob = await generateNoti1WordAsBlob(noti1Data);
        const fileName = `NOTI1_${sanitizeFileName(candidat.nom)}.docx`;
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

  // Génération massive NOTI5
  const generateAllNoti5 = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const candidatsAvecLots = [...analysis.candidatsGagnants, ...analysis.candidatsMixtes];

      for (const candidat of candidatsAvecLots) {
        const noti5Data = buildNoti5Data(candidat);
        const blob = await generateNoti5WordAsBlob(noti5Data);
        const fileName = `NOTI5_${sanitizeFileName(candidat.nom)}.docx`;
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
          const blob = await generateNoti3WordAsBlob(noti3Data);
          const fileName = `NOTI3_Lot${lotPerdu.numero}_${sanitizeFileName(candidat.nom)}.docx`;
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Procédure multi-lots
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {procedureInfo.numeroAfpa} - {procedureInfo.objet}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Total lots</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analysis.totalLots}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Gagnants</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {analysis.candidatsGagnants.length}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Mixtes</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {analysis.candidatsMixtes.length}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Perdants</span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {analysis.candidatsPerdants.length}
          </p>
        </div>
      </div>

      {/* Actions de génération massive */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Génération massive (ZIP)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={generateAllNoti1}
            disabled={isGenerating || (analysis.candidatsGagnants.length + analysis.candidatsMixtes.length === 0)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
            NOTI1 ({analysis.candidatsGagnants.length + analysis.candidatsMixtes.length})
          </button>

          <button
            onClick={generateAllNoti5}
            disabled={isGenerating || (analysis.candidatsGagnants.length + analysis.candidatsMixtes.length === 0)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
            NOTI5 ({analysis.candidatsGagnants.length + analysis.candidatsMixtes.length})
          </button>

          <button
            onClick={generateAllNoti3}
            disabled={isGenerating || (analysis.candidatsPerdants.length + analysis.candidatsMixtes.length === 0)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
            NOTI3 ({analysis.candidatsPerdants.reduce((sum, c) => sum + c.lotsPerdus.length, 0) + analysis.candidatsMixtes.reduce((sum, c) => sum + c.lotsPerdus.length, 0)} docs)
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
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
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentNoti1(buildNoti1Data(candidat));
                          setShowNoti1Modal(true);
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                      >
                        Générer NOTI1
                      </button>
                      <button
                        onClick={() => {
                          setCurrentNoti5(buildNoti5Data(candidat));
                          setShowNoti5Modal(true);
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                      >
                        Générer NOTI5
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
                        <button
                          key={lot.numero}
                          onClick={() => {
                            const noti3 = buildNoti3DataForLot(candidat, lot);
                            setCurrentNoti3([noti3]);
                            setShowNoti3Modal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded mr-2 mb-2"
                        >
                          NOTI3 Lot {lot.numero}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
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
