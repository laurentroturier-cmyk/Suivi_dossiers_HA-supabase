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
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";

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
      const rapportContent = generateRapportData({
        procedure: procedureSelectionnee,
        dossier: dossierRattache,
        depots: depotsData,
        retraits: retraitsData,
        an01Data: an01Data,
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

  // Export DOCX
  const handleExportDOCX = async () => {
    if (!state.rapportGenere) return;
    
    setIsExporting(true);
    
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // En-tête
            new Paragraph({
              text: "RAPPORT DE PRÉSENTATION",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              text: procedureSelectionnee?.['Nom de la procédure'] || '',
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            
            // Section 1 : Contexte
            new Paragraph({
              text: "1. CONTEXTE",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Le présent marché a pour objet ${state.rapportGenere.section1_contexte.objetMarche} pour une durée totale de ${state.rapportGenere.section1_contexte.dureeMarche} mois.`,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 2 : Déroulement
            new Paragraph({
              text: "2. DÉROULEMENT DE LA PROCÉDURE",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: "La procédure a été lancée sur la plateforme « " }),
                new TextRun({ text: state.rapportGenere.section2_deroulement.supportProcedure, bold: true }),
                new TextRun({ text: " » selon le calendrier suivant :" }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `• Date de publication : ${state.rapportGenere.section2_deroulement.datePublication}` }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `• Nombre de dossiers retirés : ${state.rapportGenere.section2_deroulement.nombreRetraits}` }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `• Date de réception des offres : ${state.rapportGenere.section2_deroulement.dateReceptionOffres}` }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `• Nombre de plis reçus : ${state.rapportGenere.section2_deroulement.nombrePlisRecus}` }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `• Date d'ouverture des plis : ${state.rapportGenere.section2_deroulement.dateOuverturePlis}` }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 7 : Tableau des offres
            new Paragraph({
              text: "7. ANALYSE DE LA VALEUR DES OFFRES",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            createOffersTable(state.rapportGenere.section7_valeurOffres.tableau),
            
            new Paragraph({
              children: [
                new TextRun({ text: `Le montant de l'offre du prestataire pressenti s'élève à ` }),
                new TextRun({ 
                  text: formatCurrency(state.rapportGenere.section7_valeurOffres.montantAttributaire), 
                  bold: true 
                }),
                new TextRun({ text: `.` }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `Pour rappel, le montant estimé dans la note d'opportunité était de ` }),
                new TextRun({ text: formatCurrency(state.rapportGenere.section7_valeurOffres.montantEstime) }),
                new TextRun({ text: `, soit un écart de ` }),
                new TextRun({ 
                  text: `${formatCurrency(state.rapportGenere.section7_valeurOffres.ecartAbsolu)} (${state.rapportGenere.section7_valeurOffres.ecartPourcent.toFixed(2)}%)`, 
                  bold: true 
                }),
                new TextRun({ text: `.` }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 8 : Performance
            new Paragraph({
              text: "8. ANALYSE DE LA PERFORMANCE DU DOSSIER",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `Au global, la performance achat est de ` }),
                new TextRun({ 
                  text: `${state.rapportGenere.section8_performance.performanceAchatPourcent.toFixed(1)}%`, 
                  bold: true 
                }),
                new TextRun({ text: `.` }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `L'impact budgétaire estimé est de ` }),
                new TextRun({ 
                  text: formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireTTC), 
                  bold: true 
                }),
                new TextRun({ text: ` TTC (soit ${formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireHT)} HT).` }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 9 : Attribution
            new Paragraph({
              text: "9. PROPOSITION D'ATTRIBUTION",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à ` }),
                new TextRun({ text: state.rapportGenere.section9_attribution.attributairePressenti, bold: true }),
                new TextRun({ text: `.` }),
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
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rapport de Présentation</h1>
              <p className="text-gray-600">Génération automatique à partir des données de la procédure</p>
            </div>
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
                      Sélectionner le lot :
                    </label>
                    <select
                      value={selectedLotIndex}
                      onChange={(e) => {
                        const index = parseInt(e.target.value);
                        setSelectedLotIndex(index);
                        setAn01Data(an01GlobalData.lots[index]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {an01GlobalData.lots.map((lot: any, index: number) => (
                        <option key={index} value={index}>
                          {lot.lotName || `Lot ${index + 1}`} {lot.metadata?.description ? `- ${lot.metadata.description}` : ''}
                        </option>
                      ))}
                    </select>
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

        {/* Prévisualisation et Export */}
        {state.rapportGenere && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">3. Rapport généré</h2>
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
            </div>
            
            {/* Prévisualisation du contenu */}
            <div className="space-y-6 border-t pt-6">
              <PreviewSection title="1. CONTEXTE">
                <p>Objet : {state.rapportGenere.section1_contexte.objetMarche}</p>
                <p>Durée : {state.rapportGenere.section1_contexte.dureeMarche} mois</p>
              </PreviewSection>
              
              <PreviewSection title="2. DÉROULEMENT">
                <p>Date de publication : {state.rapportGenere.section2_deroulement.datePublication}</p>
                <p>Nombre de retraits : {state.rapportGenere.section2_deroulement.nombreRetraits}</p>
                <p>Nombre de plis reçus : {state.rapportGenere.section2_deroulement.nombrePlisRecus}</p>
              </PreviewSection>
              
              <PreviewSection title="7. ANALYSE DES OFFRES">
                <p className="font-semibold">Classement :</p>
                {state.rapportGenere.section7_valeurOffres.tableau.slice(0, 3).map((offre, idx) => (
                  <div key={idx} className="ml-4">
                    <p>#{offre.rangFinal} - {offre.raisonSociale} : {formatCurrency(offre.montantTTC)} (Note: {offre.noteFinaleSur100}/100)</p>
                  </div>
                ))}
              </PreviewSection>
              
              <PreviewSection title="9. ATTRIBUTION">
                <p className="font-semibold text-blue-700">Attributaire pressenti : {state.rapportGenere.section9_attribution.attributairePressenti}</p>
              </PreviewSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour la prévisualisation
const PreviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-l-4 border-blue-500 pl-4">
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <div className="text-sm text-gray-700 space-y-1">{children}</div>
  </div>
);

// Fonction pour créer le tableau des offres
function createOffersTable(offers: any[]): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Raison sociale", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rang", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note /100", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note Fin. /60", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note Tech. /40", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true })] })] }),
      ],
    }),
    // Données
    ...offers.map(o => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(o.raisonSociale)] }),
        new TableCell({ children: [new Paragraph(String(o.rangFinal))] }),
        new TableCell({ children: [new Paragraph(o.noteFinaleSur100.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(o.noteFinanciereSur60.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(o.noteTechniqueSur40.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(o.montantTTC))] }),
      ],
    })),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

export default RapportPresentation;
