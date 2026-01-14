import React, { useState, useEffect } from 'react';
import { FileText, Upload, Check, X, FileSpreadsheet, FileCog, Download, Edit2, Eye, AlertCircle } from 'lucide-react';
import { RapportContent, RapportState } from './types';
import { generateRapportData } from './generateRapportData';
import { parseDepotsFile } from '../../utils/depotsParser';
import { parseRetraitsFile } from '../../utils/retraitsParser';
import { parseExcelFile } from '../../an01-utils/services/excelParser';
import { DepotsData } from '../../types/depots';
import { RetraitsData } from '../../types/retraits';
import { AnalysisData } from '../an01/types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, Footer, Header, PageNumber, NumberFormat, ImageRun } from "docx";

interface Props {
  procedures: any[]; // Liste des procédures disponibles
  dossiers: any[]; // Liste des dossiers disponibles
}

const RapportPresentation: React.FC<Props> = ({ procedures, dossiers }) => {
  const [state, setState] = useState<RapportState>({
    procedureSelectionnee: null,
    fichiersCharges: {
      depots: false,
      retraits: false,
      an01: false,
    },
    rapportGenere: null,
    modeEdition: false,
  });
  
  const [depotsData, setDepotsData] = useState<DepotsData | null>(null);
  const [retraitsData, setRetraitsData] = useState<RetraitsData | null>(null);
  const [an01Data, setAn01Data] = useState<AnalysisData | null>(null);
  const [an01GlobalData, setAn01GlobalData] = useState<any | null>(null); // GlobalAnalysisResult
  const [selectedLotIndex, setSelectedLotIndex] = useState<number>(0);
  const [numeroAfpa, setNumeroAfpa] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const procedureSelectionnee = procedures.find(p => p.NumProc === state.procedureSelectionnee);
  const dossierRattache = dossiers.find(d => d.IDProjet === procedureSelectionnee?.IDProjet);

  // Handler pour la remise à zéro
  const handleReset = () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser ? Toutes les données chargées seront perdues.')) {
      return;
    }
    
    setState({
      procedureSelectionnee: null,
      fichiersCharges: { depots: false, retraits: false, an01: false },
      rapportGenere: null,
      modeEdition: false,
    });
    setDepotsData(null);
    setRetraitsData(null);
    setAn01Data(null);
    setAn01GlobalData(null);
    setSelectedLotIndex(0);
    setNumeroAfpa('');
  };

  // Handler pour la saisie du numéro AFPA à 5 chiffres
  const handleNumeroAfpaChange = (value: string) => {
    setNumeroAfpa(value);
    
    // Si 5 chiffres saisis, chercher la procédure correspondante
    if (value.length === 5) {
      const procedure = procedures.find(p => {
        // Chercher dans NumeroAfpa5Chiffres
        if (p['NumeroAfpa5Chiffres'] === value) return true;
        
        // Extraire les 5 premiers chiffres du "Numéro de procédure (Afpa)"
        const numAfpaComplet = p['Numéro de procédure (Afpa)'];
        if (numAfpaComplet) {
          const match = numAfpaComplet.match(/^(\d{5})/);
          if (match && match[1] === value) return true;
        }
        
        return false;
      });
      
      if (procedure) {
        setState({
          procedureSelectionnee: procedure.NumProc,
          fichiersCharges: { depots: false, retraits: false, an01: false },
          rapportGenere: null,
          modeEdition: false,
        });
        setDepotsData(null);
        setRetraitsData(null);
        setAn01Data(null);
      }
    } else if (value.length === 0) {
      // Reset si le champ est vidé
      setState({
        procedureSelectionnee: null,
        fichiersCharges: { depots: false, retraits: false, an01: false },
        rapportGenere: null,
        modeEdition: false,
      });
    }
  };

  // Handler pour la sélection de procédure
  const handleProcedureSelect = (numProc: string) => {
    setState({
      procedureSelectionnee: numProc,
      fichiersCharges: { depots: false, retraits: false, an01: false },
      rapportGenere: null,
      modeEdition: false,
    });
    setDepotsData(null);
    setRetraitsData(null);
    setAn01Data(null);
  };

  // Handler pour l'upload du fichier Dépôts (Excel/PDF)
  const handleDepotsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseDepotsFile(file);
      setDepotsData(parsed);
      setState(prev => ({
        ...prev,
        fichiersCharges: { ...prev.fichiersCharges, depots: true },
      }));
    } catch (error) {
      console.error('Erreur lors du parsing du fichier Dépôts:', error);
      alert('Erreur lors du chargement du fichier Dépôts');
    }
  };

  // Handler pour l'upload du fichier Retraits (Excel/PDF)
  const handleRetraitsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseRetraitsFile(file);
      setRetraitsData(parsed);
      setState(prev => ({
        ...prev,
        fichiersCharges: { ...prev.fichiersCharges, retraits: true },
      }));
    } catch (error) {
      console.error('Erreur lors du parsing du fichier Retraits:', error);
      alert('Erreur lors du chargement du fichier Retraits');
    }
  };

  // Handler pour l'upload du fichier AN01 (Excel)
  const handleAn01Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      // parsed est un GlobalAnalysisResult avec { lots: AnalysisData[], globalMetadata: {...} }
      setAn01GlobalData(parsed);
      
      // Sélectionner automatiquement le premier lot
      if (parsed.lots && parsed.lots.length > 0) {
        setAn01Data(parsed.lots[0]);
        setSelectedLotIndex(0);
      }
      
      setState(prev => ({
        ...prev,
        fichiersCharges: { ...prev.fichiersCharges, an01: true },
      }));
    } catch (error) {
      console.error('Erreur lors du parsing du fichier AN01:', error);
      alert('Erreur lors du chargement du fichier AN01 Excel');
    }
  };

  // Génération du rapport
  const handleGenererRapport = () => {
    setIsGenerating(true);
    
    try {
      // Si "Ensemble des lots" est sélectionné, passer tous les lots
      const dataToUse = selectedLotIndex === -1 && an01GlobalData 
        ? { allLots: an01GlobalData.lots, globalMetadata: an01GlobalData.globalMetadata }
        : an01Data;
      
      const rapportContent = generateRapportData({
        procedure: procedureSelectionnee,
        dossier: dossierRattache,
        depots: depotsData,
        retraits: retraitsData,
        an01Data: dataToUse,
        questionsReponses: [], // TODO: À implémenter avec table Supabase
      });
      
      setState(prev => ({
        ...prev,
        rapportGenere: rapportContent,
      }));
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonctions helper pour les polices
  const createBodyText = (text: string, bold: boolean = false): TextRun => {
    return new TextRun({ 
      text, 
      font: "Aptos", 
      size: 22, // 11pt
      bold 
    });
  };

  const createHeadingText = (text: string): TextRun => {
    return new TextRun({ 
      text, 
      font: "Rockwell", 
      size: 32, // 16pt
      bold: true,
      color: "56BAA2"
    });
  };

  // Helper pour créer des cellules de tableau avec police
  const createTableCell = (text: string, bold: boolean = false): TableCell => {
    return new TableCell({ 
      children: [
        new Paragraph({ 
          children: [
            new TextRun({ 
              text, 
              font: "Aptos", 
              size: 22, 
              bold 
            })
          ] 
        })
      ] 
    });
  };

  // Export DOCX
  const handleExportDOCX = async () => {
    if (!state.rapportGenere) return;
    
    setIsExporting(true);
    
    try {
      // Charger l'image depuis public/
      const imageResponse = await fetch('/Image1.png');
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      
      const doc = new Document({
        sections: [{
          properties: {},
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Rapport de présentation",
                      font: "Aptos",
                      size: 18,
                      color: "666666",
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: imageBuffer,
                      transformation: {
                        width: 103, // 2.72 cm
                        height: 50, // 1.32 cm
                      },
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: procedureSelectionnee?.['Numéro de procédure (Afpa)'] || '',
                      size: 18,
                      color: "666666",
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                  tabStops: [
                    {
                      type: 'right',
                      position: 9026,
                    },
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Page ",
                      size: 18,
                      color: "666666",
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: "666666",
                    }),
                    new TextRun({
                      text: " / ",
                      size: 18,
                      color: "666666",
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 18,
                      color: "666666",
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          },
          children: [
            // En-tête
            new Paragraph({
              children: [
                new TextRun({
                  text: "RAPPORT DE PRÉSENTATION",
                  font: "Rockwell",
                  size: 32, // 16pt
                  bold: true,
                  color: "56BAA2",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: procedureSelectionnee?.['Nom de la procédure'] || '',
                  font: "Rockwell",
                  size: 32, // 16pt
                  bold: true,
                  color: "56BAA2",
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            
            // Section 1 : Contexte
            new Paragraph({
              children: [
                new TextRun({
                  text: "1. CONTEXTE",
                  font: "Rockwell",
                  size: 32, // 16pt
                  bold: true,
                  color: "56BAA2",
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Le présent marché a pour objet ${state.rapportGenere.section1_contexte.objetMarche} pour une durée totale de ${state.rapportGenere.section1_contexte.dureeMarche} mois.`,
                  font: "Aptos",
                  size: 22, // 11pt
                }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 2 : Déroulement
            new Paragraph({
              children: [
                new TextRun({
                  text: "2. DÉROULEMENT DE LA PROCÉDURE",
                  font: "Rockwell",
                  size: 32, // 16pt
                  bold: true,
                  color: "56BAA2",
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: "La procédure a été lancée sur la plateforme « ", font: "Aptos", size: 22 }),
                new TextRun({ text: state.rapportGenere.section2_deroulement.supportProcedure, bold: true, font: "Aptos", size: 22 }),
                new TextRun({ text: " » selon le calendrier suivant :", font: "Aptos", size: 22 }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `• Date de publication : ${state.rapportGenere.section2_deroulement.datePublication}`, font: "Aptos", size: 22 }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`• Nombre de dossiers retirés : ${state.rapportGenere.section2_deroulement.nombreRetraits}`),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`• Date de réception des offres : ${state.rapportGenere.section2_deroulement.dateReceptionOffres}`),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`• Nombre de plis reçus : ${state.rapportGenere.section2_deroulement.nombrePlisRecus}`),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`• Date d'ouverture des plis : ${state.rapportGenere.section2_deroulement.dateOuverturePlis}`),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 3 : Dossier de consultation
            new Paragraph({
              children: [createHeadingText("3. DOSSIER DE CONSULTATION")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: "[À compléter : Description du DCE et des documents fournis]", italics: true, color: "FF8800", font: "Aptos", size: 22 }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 4 : Questions-Réponses
            new Paragraph({
              children: [createHeadingText("4. QUESTIONS - RÉPONSES")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: "[À compléter : Questions posées et réponses apportées]", italics: true, color: "FF8800", font: "Aptos", size: 22 }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 5 : Analyse des candidatures
            new Paragraph({
              children: [createHeadingText("5. ANALYSE DES CANDIDATURES")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                createBodyText("L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la recevabilité des documents administratifs demandés dans chacune de nos procédures."),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                createBodyText("L'analyse des candidatures est disponible en annexe."),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 6 : Méthodologie d'analyse des offres
            new Paragraph({
              children: [createHeadingText("6. MÉTHODOLOGIE D'ANALYSE DES OFFRES")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                createBodyText("Les offres ont été analysées selon les critères suivants :"),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`• Critère technique : `),
                createBodyText(`${state.rapportGenere.section5_criteres?.ponderationTechnique || 40}%`, true),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`• Critère financier : `),
                createBodyText(`${state.rapportGenere.section5_criteres?.ponderationFinancier || 60}%`, true),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 7 : Analyse de la valeur des offres
            new Paragraph({
              children: [createHeadingText("7. ANALYSE DE LA VALEUR DES OFFRES")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            // Si multi-lots : afficher le tableau de synthèse
            ...(state.rapportGenere.section7_2_syntheseLots ? [
              new Paragraph({
                children: [
                  createBodyText(`Le marché comporte ${state.rapportGenere.section7_2_syntheseLots.nombreLots} lots distincts. Voici la synthèse des attributaires pressenti pour chaque lot :`),
                ],
                spacing: { after: 200 },
              }),
              
              createLotsTable(state.rapportGenere.section7_2_syntheseLots.lots),
              
              new Paragraph({
                children: [
                  createBodyText(`Montant total TTC tous lots confondus : `),
                  createBodyText(formatCurrency(state.rapportGenere.section7_2_syntheseLots.montantTotalTTC), true),
                ],
                spacing: { before: 200, after: 100 },
              }),
            ] : [
              // Sinon : afficher le tableau de classement classique
              createOffersTable(state.rapportGenere.section7_valeurOffres.tableau),
              
              new Paragraph({
                children: [
                  createBodyText(`Le montant de l'offre du prestataire pressenti s'élève à `),
                  createBodyText(formatCurrency(state.rapportGenere.section7_valeurOffres.montantAttributaire), true),
                  createBodyText(`.`),
                ],
                spacing: { before: 200, after: 100 },
              }),
            ]),
            
            // Comparaison avec Note d'Opportunité
            ...(state.rapportGenere.section7_valeurOffres.montantEstime > 0 ? [
              new Paragraph({
                children: [
                  createBodyText(`Pour rappel, le montant estimé dans la note d'opportunité était de `),
                  createBodyText(`${formatCurrency(state.rapportGenere.section7_valeurOffres.montantEstime)} TTC`, true),
                  createBodyText(`, soit un écart de `),
                  createBodyText(`${formatCurrency(state.rapportGenere.section7_valeurOffres.ecartAbsolu)} (${state.rapportGenere.section7_valeurOffres.ecartPourcent.toFixed(2)}%)`, true),
                  createBodyText(`.`),
                ],
                spacing: { after: 200 },
              })
            ] : []),
            
            // Section 8 : Performance
            new Paragraph({
              children: [createHeadingText("8. ANALYSE DE LA PERFORMANCE DU DOSSIER")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            // Si multi-lots : afficher la performance globale + tableau par lot
            ...(state.rapportGenere.section8_1_synthesePerformance ? [
              new Paragraph({
                children: [
                  createBodyText(`Au global, la performance achat tous lots confondus est de `),
                  createBodyText(`${state.rapportGenere.section8_1_synthesePerformance.performanceGlobalePourcent.toFixed(1)}%`, true),
                  createBodyText(`.`),
                ],
                spacing: { after: 100 },
              }),
              
              new Paragraph({
                children: [
                  createBodyText(`L'impact budgétaire total estimé est de `),
                  createBodyText(formatCurrency(state.rapportGenere.section8_1_synthesePerformance.impactBudgetaireTotalTTC), true),
                  createBodyText(` TTC (soit `),
                  createBodyText(formatCurrency(state.rapportGenere.section8_1_synthesePerformance.impactBudgetaireTotalHT)),
                  createBodyText(` HT).`),
                ],
                spacing: { after: 200 },
              }),
              
              new Paragraph({
                children: [
                  createBodyText(`Détail de la performance par lot :`, true),
                ],
                spacing: { before: 200, after: 100 },
              }),
              
              createPerformanceLotsTable(state.rapportGenere.section8_1_synthesePerformance.lotsDetails),
            ] : [
              // Sinon : afficher la performance du lot unique
              new Paragraph({
                children: [
                  createBodyText(`Au global, la performance achat est de `),
                  createBodyText(`${state.rapportGenere.section8_performance.performanceAchatPourcent.toFixed(1)}%`, true),
                  createBodyText(`.`),
                ],
                spacing: { after: 100 },
              }),
              
              new Paragraph({
                children: [
                  createBodyText(`L'impact budgétaire estimé est de `),
                  createBodyText(formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireTTC), true),
                  createBodyText(` TTC (soit `),
                  createBodyText(formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireHT)),
                  createBodyText(` HT).`),
                ],
                spacing: { after: 200 },
              }),
            ]),
            
            // Section 9 : Attribution
            new Paragraph({
              children: [createHeadingText("9. PROPOSITION D'ATTRIBUTION")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            // Si multi-lots : afficher le tableau des attributaires
            ...(state.rapportGenere.section7_2_syntheseLots ? [
              new Paragraph({
                children: [
                  createBodyText(`Au regard de ces éléments, la commission d'ouverture souhaite attribuer les lots comme suit :`),
                ],
                spacing: { after: 200 },
              }),
              
              createAttributairesTable(state.rapportGenere.section7_2_syntheseLots.lots),
              
              new Paragraph({
                children: [
                  createBodyText(`Montant total de l'attribution : `),
                  createBodyText(formatCurrency(state.rapportGenere.section7_2_syntheseLots.montantTotalTTC), true),
                ],
                spacing: { before: 200, after: 200 },
              }),
            ] : [
              // Sinon : afficher l'attributaire unique
              new Paragraph({
                children: [
                  createBodyText(`Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à `),
                  createBodyText(state.rapportGenere.section9_attribution.attributairePressenti, true),
                  createBodyText(`.`),
                ],
                spacing: { after: 200 },
              }),
            ]),
            
            // Section 10 : Calendrier de mise en œuvre
            new Paragraph({
              children: [createHeadingText("10. PROPOSITION DE CALENDRIER DE MISE EN ŒUVRE")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: "[À compléter : Date de notification, démarrage et planning prévisionnel]", italics: true, color: "FF8800", font: "Aptos", size: 22 }),
              ],
              spacing: { after: 200 },
            }),
          ],
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rapport_Presentation_${procedureSelectionnee?.['Numéro de procédure (Afpa)'] || 'export'}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export DOCX:', error);
      alert('Erreur lors de l\'export DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const tousLesFileursCharges = state.fichiersCharges.depots && state.fichiersCharges.retraits && state.fichiersCharges.an01;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rapport de Présentation</h1>
                <p className="text-gray-600">Génération automatique à partir des données de la procédure</p>
              </div>
            </div>
            {state.procedureSelectionnee && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                title="Réinitialiser et charger une nouvelle procédure"
              >
                <X className="w-4 h-4" />
                Nouvelle procédure
              </button>
            )}
          </div>
        </div>

        {/* Sélection de procédure */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Sélectionner une procédure</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro AFPA (5 chiffres)
            </label>
            <input
              type="text"
              value={numeroAfpa}
              onChange={(e) => handleNumeroAfpaChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Ex: 25006"
              maxLength={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
            />
            {numeroAfpa.length === 5 && !procedureSelectionnee && (
              <p className="mt-2 text-sm text-red-600">Aucune procédure trouvée avec ce numéro</p>
            )}
          </div>
          
          {procedureSelectionnee && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700"><strong>Procédure sélectionnée :</strong> {procedureSelectionnee['Numéro de procédure (Afpa)']}</p>
              <p className="text-sm text-gray-700"><strong>Nom :</strong> {procedureSelectionnee['Nom de la procédure']}</p>
              <p className="text-sm text-gray-700"><strong>Acheteur :</strong> {procedureSelectionnee.Acheteur}</p>
              <p className="text-sm text-gray-700"><strong>Statut :</strong> {procedureSelectionnee['Statut de la consultation']}</p>
              {dossierRattache && (
                <p className="text-sm text-gray-700"><strong>Dossier rattaché :</strong> {dossierRattache.Titre_du_dossier}</p>
              )}
            </div>
          )}
        </div>

        {/* Upload des fichiers */}
        {state.procedureSelectionnee && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Charger les fichiers nécessaires</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Registre Dépôts */}
              <div className={`border-2 border-dashed rounded-lg p-4 ${state.fichiersCharges.depots ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Registre Dépôts</span>
                  </div>
                  {state.fichiersCharges.depots && <Check className="w-5 h-5 text-green-600" />}
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.pdf"
                    onChange={handleDepotsUpload}
                    className="hidden"
                  />
                  <div className="cursor-pointer text-center py-2 px-4 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-700 font-medium">
                    {state.fichiersCharges.depots ? 'Remplacer' : 'Charger Excel/PDF'}
                  </div>
                </label>
              </div>

              {/* Registre Retraits */}
              <div className={`border-2 border-dashed rounded-lg p-4 ${state.fichiersCharges.retraits ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Registre Retraits</span>
                  </div>
                  {state.fichiersCharges.retraits && <Check className="w-5 h-5 text-green-600" />}
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.pdf"
                    onChange={handleRetraitsUpload}
                    className="hidden"
                  />
                  <div className="cursor-pointer text-center py-2 px-4 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-700 font-medium">
                    {state.fichiersCharges.retraits ? 'Remplacer' : 'Charger Excel/PDF'}
                  </div>
                </label>
              </div>

              {/* AN01 */}
              <div className={`border-2 border-dashed rounded-lg p-4 ${state.fichiersCharges.an01 ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCog className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Analyse AN01</span>
                  </div>
                  {state.fichiersCharges.an01 && <Check className="w-5 h-5 text-green-600" />}
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleAn01Upload}
                    className="hidden"
                  />
                  <div className="cursor-pointer text-center py-2 px-4 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-700 font-medium">
                    {state.fichiersCharges.an01 ? 'Remplacer' : 'Charger Excel'}
                  </div>
                </label>
                
                {/* Sélection du lot si plusieurs lots */}
                {an01GlobalData && an01GlobalData.lots && an01GlobalData.lots.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner le lot à analyser :
                    </label>
                    <select
                      value={selectedLotIndex}
                      onChange={(e) => {
                        const index = parseInt(e.target.value);
                        setSelectedLotIndex(index);
                        if (index === -1) {
                          // Option "Ensemble des lots" : on pourrait créer une synthèse
                          setAn01Data(an01GlobalData.lots[0]); // Temporairement on garde le premier lot
                        } else {
                          setAn01Data(an01GlobalData.lots[index]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={-1}>📊 Ensemble des lots (synthèse globale)</option>
                      {an01GlobalData.lots.map((lot: any, index: number) => (
                        <option key={index} value={index}>
                          {lot.lotName || `Lot ${index + 1}`} {lot.metadata?.description ? `- ${lot.metadata.description}` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedLotIndex === -1 && (
                      <p className="mt-2 text-xs text-blue-600">
                        ℹ️ Le rapport inclura les sections 7.2 et 8.1 avec la synthèse de tous les lots
                      </p>
                    )}
                  </div>
                )}
                
                {/* Information si un seul lot */}
                {an01GlobalData && an01GlobalData.lots && an01GlobalData.lots.length === 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      📊 1 lot détecté : {an01GlobalData.lots[0].lotName || 'Lot unique'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {tousLesFileursCharges && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">Tous les fichiers sont chargés !</span>
              </div>
            )}
          </div>
        )}

        {/* Bouton de génération */}
        {tousLesFileursCharges && !state.rapportGenere && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <button
              onClick={handleGenererRapport}
              disabled={isGenerating}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Générer le Rapport de Présentation
                </>
              )}
            </button>
          </div>
        )}

        {/* Structure du Rapport - Toujours visible */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Structure du Rapport de Présentation</h2>
              <p className="text-sm text-gray-600 mt-1">
                {state.rapportGenere 
                  ? "Rapport généré - Cliquez sur Exporter pour télécharger" 
                  : "Aperçu de la structure - Les données seront remplies après génération"}
              </p>
            </div>
            {state.rapportGenere && (
              <button
                onClick={handleExportDOCX}
                disabled={isExporting}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exporter en DOCX
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Chapitres du rapport */}
          <div className="space-y-4 border-t pt-6">
            {/* Chapitre 1 : Contexte */}
            <ChapterPreview 
              number={1} 
              title="CONTEXTE" 
              hasData={!!state.rapportGenere}
              icon="📋"
            >
              {state.rapportGenere ? (
                <>
                  <p><strong>Objet du marché :</strong> {state.rapportGenere.section1_contexte.objetMarche}</p>
                  <p><strong>Durée du marché :</strong> {state.rapportGenere.section1_contexte.dureeMarche} mois</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic">• Objet du marché (extrait du dossier)</p>
                  <p className="text-gray-500 italic">• Durée du marché en mois</p>
                  <p className="text-gray-500 italic">• Contexte général de la consultation</p>
                  <p className="text-gray-500 italic">• Enjeux et objectifs du marché</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 2 : Déroulement */}
            <ChapterPreview 
              number={2} 
              title="DÉROULEMENT DE LA PROCÉDURE" 
              hasData={!!state.rapportGenere}
              icon="📅"
            >
              {state.rapportGenere ? (
                <>
                  <p><strong>Support :</strong> {state.rapportGenere.section2_deroulement.supportProcedure}</p>
                  <p><strong>Date de publication :</strong> {state.rapportGenere.section2_deroulement.datePublication}</p>
                  <p><strong>Nombre de retraits :</strong> {state.rapportGenere.section2_deroulement.nombreRetraits}</p>
                  <p><strong>Date de réception :</strong> {state.rapportGenere.section2_deroulement.dateReceptionOffres}</p>
                  <p><strong>Nombre de plis reçus :</strong> {state.rapportGenere.section2_deroulement.nombrePlisRecus}</p>
                  <p><strong>Date d'ouverture :</strong> {state.rapportGenere.section2_deroulement.dateOuverturePlis}</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic">• Plateforme de publication (ex: AWS, BOAMP...)</p>
                  <p className="text-gray-500 italic">• Date de publication de l'avis</p>
                  <p className="text-gray-500 italic">• Nombre de dossiers retirés (depuis registre Retraits)</p>
                  <p className="text-gray-500 italic">• Date limite de réception des offres</p>
                  <p className="text-gray-500 italic">• Nombre de plis reçus (depuis registre Dépôts)</p>
                  <p className="text-gray-500 italic">• Date d'ouverture des plis</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 3 : Dossier de consultation */}
            <ChapterPreview 
              number={3} 
              title="DOSSIER DE CONSULTATION" 
              hasData={false}
              icon="📁"
            >
              <p className="text-gray-500 italic">• Composition du DCE (Dossier de Consultation des Entreprises)</p>
              <p className="text-gray-500 italic">• Documents fournis aux candidats</p>
              <p className="text-gray-500 italic">• Pièces constitutives du marché</p>
              <p className="text-sm text-orange-600 mt-2">⚠️ Section à renseigner manuellement</p>
            </ChapterPreview>

            {/* Chapitre 4 : Questions-Réponses */}
            <ChapterPreview 
              number={4} 
              title="QUESTIONS - RÉPONSES" 
              hasData={false}
              icon="💬"
            >
              <p className="text-gray-500 italic">• Questions posées par les candidats</p>
              <p className="text-gray-500 italic">• Réponses apportées par l'acheteur</p>
              <p className="text-gray-500 italic">• Modifications éventuelles du DCE</p>
              <p className="text-sm text-orange-600 mt-2">⚠️ À compléter depuis la plateforme de dématérialisation</p>
            </ChapterPreview>

            {/* Chapitre 5 : Analyse des candidatures */}
            <ChapterPreview 
              number={5} 
              title="ANALYSE DES CANDIDATURES" 
              hasData={true}
              icon="👥"
            >
              <p className="text-gray-800">
                L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la 
                recevabilité des documents administratifs demandés dans chacune de nos procédures.
              </p>
              <p className="text-gray-800 mt-2">
                L'analyse des candidatures est disponible en annexe.
              </p>
            </ChapterPreview>

            {/* Chapitre 6 : Méthodologie d'analyse */}
            <ChapterPreview 
              number={6} 
              title="MÉTHODOLOGIE D'ANALYSE DES OFFRES" 
              hasData={!!state.rapportGenere}
              icon="⚖️"
            >
              {state.rapportGenere ? (
                <>
                  <p><strong>Critères d'attribution :</strong></p>
                  <p className="ml-4">• Critère technique : {state.rapportGenere.section5_criteres?.ponderationTechnique || 40}%</p>
                  <p className="ml-4">• Critère financier : {state.rapportGenere.section5_criteres?.ponderationFinancier || 60}%</p>
                  <p className="mt-2"><strong>Méthode de notation :</strong></p>
                  <p className="ml-4 text-sm">• Note technique sur 40 points</p>
                  <p className="ml-4 text-sm">• Note financière sur 60 points</p>
                  <p className="ml-4 text-sm">• Note finale sur 100 points</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic">• Critères d'attribution et pondérations</p>
                  <p className="text-gray-500 italic">• Grille de notation technique</p>
                  <p className="text-gray-500 italic">• Méthode de calcul de la note financière</p>
                  <p className="text-gray-500 italic">• Formule de calcul de la note finale</p>
                  <p className="text-sm text-blue-600 mt-2">📊 Méthodologie définie dans le DCE</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 7 : Analyse de la valeur */}
            <ChapterPreview 
              number={7} 
              title="ANALYSE DE LA VALEUR DES OFFRES" 
              hasData={!!state.rapportGenere}
              icon="💰"
            >
              {state.rapportGenere ? (
                <>
                  {selectedLotIndex === -1 && state.rapportGenere.section7_2_syntheseLots ? (
                    // Mode multi-lots : afficher le tableau de synthèse de TOUS les lots
                    <>
                      <p className="font-semibold mb-2 text-blue-700">📊 Synthèse de tous les lots</p>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full text-xs border border-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left border-b">Lot</th>
                              <th className="px-2 py-1 text-left border-b">Nom du lot</th>
                              <th className="px-2 py-1 text-right border-b">Montant TTC</th>
                              <th className="px-2 py-1 text-left border-b">Attributaire pressenti</th>
                              <th className="px-2 py-1 text-right border-b">Nb offres</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.rapportGenere.section7_2_syntheseLots.lots.map((lot: any, idx: number) => (
                              <tr key={idx} className={idx === 0 ? 'bg-green-50' : ''}>
                                <td className="px-2 py-1 border-b font-semibold">{lot.numero}</td>
                                <td className="px-2 py-1 border-b">{lot.nom}</td>
                                <td className="px-2 py-1 border-b text-right font-semibold">{formatCurrency(lot.montantAttributaire)}</td>
                                <td className="px-2 py-1 border-b">{lot.attributaire}</td>
                                <td className="px-2 py-1 border-b text-right">{lot.nombreOffres}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-bold">
                            <tr>
                              <td colSpan={2} className="px-2 py-1 border-t">TOTAL TOUS LOTS</td>
                              <td className="px-2 py-1 border-t text-right">{formatCurrency(state.rapportGenere.section7_2_syntheseLots.montantTotalTTC)}</td>
                              <td colSpan={2} className="px-2 py-1 border-t"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  ) : (
                    // Mode lot unique
                    <>
                      <p className="font-semibold mb-2">Classement des offres {selectedLotIndex >= 0 ? `(${an01Data?.lotName || `Lot ${selectedLotIndex + 1}`})` : ''}:</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left border-b">Rang</th>
                              <th className="px-3 py-2 text-left border-b">Entreprise</th>
                              <th className="px-3 py-2 text-right border-b">Note Tech. /40</th>
                              <th className="px-3 py-2 text-right border-b">Note Fin. /60</th>
                              <th className="px-3 py-2 text-right border-b">Note Totale /100</th>
                              <th className="px-3 py-2 text-right border-b">Montant TTC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.rapportGenere.section7_valeurOffres.tableau.map((offre, idx) => (
                              <tr key={idx} className={idx === 0 ? 'bg-green-50 font-semibold' : ''}>
                                <td className="px-3 py-2 border-b">#{offre.rangFinal}</td>
                                <td className="px-3 py-2 border-b">{offre.raisonSociale}</td>
                                <td className="px-3 py-2 border-b text-right">{offre.noteTechniqueSur40.toFixed(2)}</td>
                                <td className="px-3 py-2 border-b text-right">{offre.noteFinanciereSur60.toFixed(2)}</td>
                                <td className="px-3 py-2 border-b text-right">{offre.noteFinaleSur100.toFixed(2)}</td>
                                <td className="px-3 py-2 border-b text-right">{formatCurrency(offre.montantTTC)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-3"><strong>Montant de l'offre retenue :</strong> {formatCurrency(state.rapportGenere.section7_valeurOffres.montantAttributaire)}</p>
                      {state.rapportGenere.section7_valeurOffres.montantEstime > 0 && (
                        <p className="mt-1">
                          <strong>Écart avec estimation :</strong> {formatCurrency(state.rapportGenere.section7_valeurOffres.ecartAbsolu)} 
                          ({state.rapportGenere.section7_valeurOffres.ecartPourcent > 0 ? '+' : ''}{state.rapportGenere.section7_valeurOffres.ecartPourcent.toFixed(2)}%)
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic">• Analyse détaillée des offres techniques</p>
                  <p className="text-gray-500 italic">• Notation de chaque critère technique</p>
                  <p className="text-gray-500 italic">• Analyse des prix proposés</p>
                  <p className="text-gray-500 italic">• Classement final des candidats</p>
                  <p className="text-sm text-blue-600 mt-2">📊 Données extraites du fichier AN01</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 8 : Performance */}
            <ChapterPreview 
              number={8} 
              title="ANALYSE DE LA PERFORMANCE DU DOSSIER" 
              hasData={!!state.rapportGenere}
              icon="📈"
            >
              {state.rapportGenere ? (
                <>
                  {selectedLotIndex === -1 && state.rapportGenere.section8_1_synthesePerformance ? (
                    // Mode multi-lots : afficher la performance de TOUS les lots
                    <>
                      <p className="font-semibold mb-2 text-blue-700">📊 Performance tous lots confondus</p>
                      <p className="text-sm mb-2"><strong>Performance globale :</strong> {state.rapportGenere.section8_1_synthesePerformance.performanceGlobalePourcent.toFixed(1)}%</p>
                      <p className="text-sm mb-3"><strong>Impact budgétaire total :</strong> {formatCurrency(state.rapportGenere.section8_1_synthesePerformance.impactBudgetaireTotalTTC)} TTC 
                        (soit {formatCurrency(state.rapportGenere.section8_1_synthesePerformance.impactBudgetaireTotalHT)} HT)</p>
                      
                      <p className="font-semibold mb-2 text-sm">Détail par lot :</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border border-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left border-b">Lot</th>
                              <th className="px-2 py-1 text-left border-b">Nom</th>
                              <th className="px-2 py-1 text-right border-b">Performance %</th>
                              <th className="px-2 py-1 text-right border-b">Impact TTC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.rapportGenere.section8_1_synthesePerformance.lotsDetails.map((lot: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-2 py-1 border-b">{lot.numero}</td>
                                <td className="px-2 py-1 border-b">{lot.nom}</td>
                                <td className="px-2 py-1 border-b text-right font-semibold">{lot.performancePourcent.toFixed(1)}%</td>
                                <td className="px-2 py-1 border-b text-right">{formatCurrency(lot.impactTTC)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    // Mode lot unique
                    <>
                      <p><strong>Performance achat :</strong> {state.rapportGenere.section8_performance.performanceAchatPourcent.toFixed(1)}%</p>
                      <p><strong>Impact budgétaire :</strong> {formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireTTC)} TTC 
                        (soit {formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireHT)} HT)</p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic">• Calcul de la performance achat (% d'économie/surcoût)</p>
                  <p className="text-gray-500 italic">• Impact budgétaire en € HT et TTC</p>
                  <p className="text-gray-500 italic">• Analyse de la compétitivité de l'offre</p>
                  <p className="text-sm text-blue-600 mt-2">📊 Calculé automatiquement depuis AN01</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 9 : Proposition d'attribution */}
            <ChapterPreview 
              number={9} 
              title="PROPOSITION D'ATTRIBUTION" 
              hasData={!!state.rapportGenere}
              icon="🎯"
            >
              {state.rapportGenere ? (
                <>
                  {selectedLotIndex === -1 && state.rapportGenere.section7_2_syntheseLots ? (
                    // Mode multi-lots : tableau de tous les attributaires
                    <>
                      <p className="font-semibold mb-2 text-blue-700">📊 Proposition d'attribution pour tous les lots</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border border-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left border-b">Lot</th>
                              <th className="px-2 py-1 text-left border-b">Nom du lot</th>
                              <th className="px-2 py-1 text-left border-b">Attributaire pressenti</th>
                              <th className="px-2 py-1 text-right border-b">Montant TTC</th>
                              <th className="px-2 py-1 text-center border-b">Nb offres</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.rapportGenere.section7_2_syntheseLots.lots.map((lot: any, idx: number) => (
                              <tr key={idx} className="bg-green-50">
                                <td className="px-2 py-1 border-b font-semibold">{lot.numero}</td>
                                <td className="px-2 py-1 border-b">{lot.nom}</td>
                                <td className="px-2 py-1 border-b font-semibold text-green-800">✅ {lot.attributaire}</td>
                                <td className="px-2 py-1 border-b text-right font-semibold">{formatCurrency(lot.montantAttributaire)}</td>
                                <td className="px-2 py-1 border-b text-center">{lot.nombreOffres}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-bold">
                            <tr>
                              <td colSpan={3} className="px-2 py-1 border-t">MONTANT TOTAL TOUS LOTS</td>
                              <td className="px-2 py-1 border-t text-right">{formatCurrency(state.rapportGenere.section7_2_syntheseLots.montantTotalTTC)}</td>
                              <td className="px-2 py-1 border-t"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 italic">
                        Les attributaires pressenti ont été déterminés sur la base des critères d'analyse (60% prix, 40% technique)
                      </p>
                    </>
                  ) : (
                    // Mode lot unique
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-semibold text-green-900 text-lg">
                        ✅ Attributaire pressenti : {state.rapportGenere.section9_attribution.attributairePressenti}
                      </p>
                      <p className="text-sm text-green-700 mt-2">
                        Candidat ayant obtenu la meilleure note finale
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic">• Proposition d'attribution au candidat le mieux-disant</p>
                  <p className="text-gray-500 italic">• Justification du choix selon les critères</p>
                  <p className="text-gray-500 italic">• Recommandations éventuelles</p>
                  <p className="text-sm text-blue-600 mt-2">🏆 Déterminé automatiquement selon le classement AN01</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 10 : Calendrier de mise en œuvre */}
            <ChapterPreview 
              number={10} 
              title="PROPOSITION DE CALENDRIER DE MISE EN ŒUVRE" 
              hasData={false}
              icon="📆"
            >
              <p className="text-gray-500 italic">• Date de notification envisagée</p>
              <p className="text-gray-500 italic">• Date de démarrage du marché</p>
              <p className="text-gray-500 italic">• Étapes clés du déploiement</p>
              <p className="text-gray-500 italic">• Planning prévisionnel d'exécution</p>
              <p className="text-sm text-orange-600 mt-2">⚠️ Section à renseigner manuellement</p>
            </ChapterPreview>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher un chapitre du rapport
const ChapterPreview: React.FC<{ 
  number: number | string; 
  title: string; 
  hasData: boolean;
  icon: string;
  children: React.ReactNode;
}> = ({ number, title, hasData, icon, children }) => (
  <div className={`border rounded-lg p-5 transition-all ${
    hasData 
      ? 'bg-green-50 border-green-300' 
      : 'bg-gray-50 border-gray-300'
  } ${typeof number === 'string' ? 'ml-8' : ''}`}>
    <div className="flex items-start gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className={`${typeof number === 'string' ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>
            {number}. {title}
          </h3>
          {hasData ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
              <Check className="w-3 h-3" />
              Données disponibles
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded">
              <AlertCircle className="w-3 h-3" />
              En attente
            </span>
          )}
        </div>
        <div className={`text-sm space-y-1 ${hasData ? 'text-gray-800' : 'text-gray-600'}`}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

// Fonction pour créer le tableau des offres
function createOffersTable(offers: any[]): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Raison sociale", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rang", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note /100", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note Fin. /60", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note Tech. /40", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    // Données
    ...offers.map(o => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.raisonSociale, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(o.rangFinal), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.noteFinaleSur100.toFixed(2), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.noteFinanciereSur60.toFixed(2), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.noteTechniqueSur40.toFixed(2), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(o.montantTTC), font: "Aptos", size: 22 })] })] }),
      ],
    })),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Fonction pour créer le tableau de synthèse des lots
// Fonction pour créer le tableau de performance par lot (section 8)
function createPerformanceLotsTable(lotsDetails: any[]): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Performance %", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Impact TTC", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    // Données
    ...lotsDetails.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${lot.performancePourcent.toFixed(1)}%`, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lot.impactTTC), font: "Aptos", size: 22 })] })] }),
      ],
    })),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Fonction pour créer le tableau des attributaires (section 9)
function createAttributairesTable(lots: any[]): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Attributaire pressenti", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    // Données
    ...lots.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.attributaire, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lot.montantAttributaire), font: "Aptos", size: 22 })] })] }),
      ],
    })),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function createLotsTable(lots: any[]): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Attributaire", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Offres", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    // Données
    ...lots.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lot.montantAttributaire), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.attributaire, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.nombreOffres), font: "Aptos", size: 22 })] })] }),
      ],
    })),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

export default RapportPresentation;
