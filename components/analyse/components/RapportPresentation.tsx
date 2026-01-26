import React, { useState, useEffect } from 'react';
import { FileText, Upload, Check, X, FileSpreadsheet, FileCog, Download, Edit2, Eye, AlertCircle, Save, FolderOpen, Clock, FileSignature, FileCheck, Construction } from 'lucide-react';
import { RapportContent, RapportState } from '../types';
import { generateRapportData } from '../utils/generateRapportData';
import { parseDepotsFile } from '../../../utils/depotsParser';
import { parseRetraitsFile } from '../../../utils/retraitsParser';
import { parseExcelFile, AnalysisData } from '@/components/an01';
import { DepotsData } from '../../types/depots';
import { RetraitsData } from '../../types/retraits';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, Footer, Header, PageNumber, NumberFormat, ImageRun, TableOfContents } from "docx";
import { supabase } from '../../../lib/supabase';
import { NotificationsQuickAccess, NotiMultiAttributaires } from '../../redaction';

interface Props {
  procedures: any[]; // Liste des procédures disponibles
  dossiers: any[]; // Liste des dossiers disponibles
}

interface RapportSauvegarde {
  id: string;
  num_proc: string;
  titre: string;
  auteur: string;
  date_creation: string;
  date_modification: string;
  statut: string;
  version: number;
  rapport_data: any;
  fichiers_sources: any;
  notes: string;
}

const RapportPresentation: React.FC<Props> = ({ procedures, dossiers }) => {
  // État pour NotificationsQuickAccess
  const [showNotificationsQuickAccess, setShowNotificationsQuickAccess] = useState(false);
  const [showNotiMultiAttributaires, setShowNotiMultiAttributaires] = useState(false);
  
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
  const [selectedLots, setSelectedLots] = useState<number[]>([]); // Sélection multiple des lots
  const [numeroAfpa, setNumeroAfpa] = useState('');
  
  // Contenu des chapitres à compléter manuellement
  const [contenuChapitre3, setContenuChapitre3] = useState('');
  const [contenuChapitre4, setContenuChapitre4] = useState('');
  
  // Structure du Chapitre 10 - Calendrier de mise en œuvre
  const [chapitre10, setCharpitre10] = useState({
    validationAttribution: 'à l\'issue de la validation d\'attribution du marché',
    envoiRejet: 'à l\'issue du délai de standstill',
    attributionMarche: '',
    autresElements: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Gestion des rapports sauvegardés
  const [rapportsSauvegardes, setRapportsSauvegardes] = useState<RapportSauvegarde[]>([]);
  const [rapportActuelId, setRapportActuelId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [titreRapport, setTitreRapport] = useState('');
  const [notesRapport, setNotesRapport] = useState('');
  
  // Mode édition des chapitres
  const [modeEdition, setModeEdition] = useState(false);
  const [rapportEditable, setRapportEditable] = useState<any>(null);
  
  // État pour les données DCE
  const [dceData, setDceData] = useState<any>(null);
  const [loadingDCE, setLoadingDCE] = useState(false);

  const procedureSelectionnee = procedures.find(p => p.NumProc === state.procedureSelectionnee);
  const dossierRattache = dossiers.find(d => d.IDProjet === procedureSelectionnee?.IDProjet);

  // Charger la liste des rapports sauvegardés pour la procédure sélectionnée
  useEffect(() => {
    if (procedureSelectionnee?.NumProc) {
      loadRapportsList();
    }
  }, [procedureSelectionnee?.NumProc]);

  // Charger la liste des rapports sauvegardés
  const loadRapportsList = async () => {
    if (!procedureSelectionnee?.NumProc) return;

    try {
      const { data, error } = await supabase
        .from('rapports_presentation')
        .select('*')
        .eq('num_proc', procedureSelectionnee.NumProc)
        .order('date_creation', { ascending: false });

      if (error) throw error;
      setRapportsSauvegardes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    }
  };

  // Charger les données du DCE depuis la table 'dce' (nouveau système)
  const loadDCEData = async () => {
    if (!procedureSelectionnee?.NumProc) {
      alert('Aucune procédure sélectionnée');
      return;
    }

    // Extraire le numéro à 5 chiffres depuis "Numéro de procédure (Afpa)"
    const numeroAfpa = procedureSelectionnee['Numéro de procédure (Afpa)'];
    const numero5chiffres = numeroAfpa?.match(/^(\d{5})/)?.[1] || procedureSelectionnee['NumeroAfpa5Chiffres'];
    
    if (!numero5chiffres) {
      alert(`Impossible de trouver le numéro à 5 chiffres pour la procédure ${procedureSelectionnee.NumProc}`);
      return;
    }

    setLoadingDCE(true);
    try {
      // Charger depuis la nouvelle table 'dce'
      const { data, error } = await supabase
        .from('dce')
        .select('reglement_consultation')
        .eq('numero_procedure', numero5chiffres)
        .single();

      if (error) {
        // Si le DCE n'existe pas encore
        if (error.code === 'PGRST116') {
          alert(`Aucun DCE trouvé pour la procédure ${numero5chiffres} (${procedureSelectionnee.NumProc}).\n\nVeuillez d'abord créer le DCE dans le module "DCE Complet".`);
          return;
        }
        throw error;
      }

      if (!data?.reglement_consultation) {
        alert(`Le DCE existe mais le Règlement de Consultation n'a pas encore été rempli.\n\nAllez dans le module "DCE Complet" > "Règlement de Consultation" pour le compléter.`);
        return;
      }

      const rcData = data.reglement_consultation;
      setDceData(rcData);

      // Auto-remplir le champ "Dossier de Consultation" avec la liste des documents
      if (rcData.dce?.documents && Array.isArray(rcData.dce.documents)) {
        const documentsList = rcData.dce.documents
          .map((doc: string, index: number) => `${index + 1}. ${doc}`)
          .join('\n');
        
        const dceDescription = `Description du DCE et des documents fournis :\n\n${documentsList}`;
        setContenuChapitre3(dceDescription);
        
        alert('✅ Données du DCE chargées avec succès !\n\nLe paragraphe 3 "DOSSIER DE CONSULTATION" a été automatiquement rempli.');
      } else {
        alert('⚠️ Le Règlement de Consultation ne contient pas de liste de documents.');
      }

    } catch (error: any) {
      console.error('Erreur lors du chargement du DCE:', error);
      alert(`Erreur lors du chargement du DCE :\n${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoadingDCE(false);
    }
  };

  // Sauvegarder le rapport actuel
  const handleSaveRapport = async () => {
    if (!procedureSelectionnee?.NumProc) {
      alert('Aucune procédure sélectionnée');
      return;
    }

    if (!titreRapport.trim()) {
      alert('Veuillez saisir un titre pour le rapport');
      return;
    }

    try {
      setSaveMessage(null);

      // Préparer les données du rapport
      const rapportData = {
        ...state.rapportGenere,
        contenuChapitre3,
        contenuChapitre4,
        chapitre10,
      };

      // Préparer les métadonnées des fichiers sources
      const fichiersSources = {
        depots: state.fichiersCharges.depots,
        retraits: state.fichiersCharges.retraits,
        an01: state.fichiersCharges.an01,
      };

      if (rapportActuelId) {
        // Mise à jour d'un rapport existant
        const { error } = await supabase
          .from('rapports_presentation')
          .update({
            titre: titreRapport,
            rapport_data: rapportData,
            fichiers_sources: fichiersSources,
            notes: notesRapport,
            date_modification: new Date().toISOString(),
          })
          .eq('id', rapportActuelId);

        if (error) throw error;
        setSaveMessage('Rapport mis à jour avec succès');
      } else {
        // Création d'un nouveau rapport
        // Déterminer le numéro de version
        const maxVersion = rapportsSauvegardes.length > 0
          ? Math.max(...rapportsSauvegardes.map(r => r.version))
          : 0;

        const { error } = await supabase
          .from('rapports_presentation')
          .insert({
            num_proc: procedureSelectionnee.NumProc,
            titre: titreRapport,
            rapport_data: rapportData,
            fichiers_sources: fichiersSources,
            notes: notesRapport,
            version: maxVersion + 1,
            statut: 'brouillon',
          });

        if (error) throw error;
        setSaveMessage('Rapport enregistré avec succès');
      }

      // Recharger la liste des rapports
      await loadRapportsList();
      
      // Fermer le dialogue après 2 secondes
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveMessage('Erreur lors de la sauvegarde du rapport');
    }
  };

  // Charger un rapport sauvegardé
  const handleLoadRapport = async (rapportId: string) => {
    try {
      const { data, error } = await supabase
        .from('rapports_presentation')
        .select('*')
        .eq('id', rapportId)
        .single();

      if (error) throw error;

      if (data) {
        // Charger les données du rapport dans l'état
        const rapport = data.rapport_data;
        
        // Migration: Si clientInterne n'existe pas dans le rapport chargé, le récupérer du dossier
        if (rapport.section2_deroulement && !rapport.section2_deroulement.clientInterne) {
          rapport.section2_deroulement.clientInterne = dossierRattache?.Client_Interne || '';
        }
        
        setState(prev => ({
          ...prev,
          rapportGenere: rapport,
          fichiersCharges: data.fichiers_sources || prev.fichiersCharges,
        }));

        setContenuChapitre3(rapport.contenuChapitre3 || '');
        setContenuChapitre4(rapport.contenuChapitre4 || '');
        setCharpitre10(rapport.chapitre10 || {
          validationAttribution: 'à l\'issue de la validation d\'attribution du marché',
          envoiRejet: 'à l\'issue du délai de standstill',
          attributionMarche: '',
          autresElements: ''
        });
        setRapportActuelId(rapportId);
        setTitreRapport(data.titre);
        setNotesRapport(data.notes || '');
        setShowLoadDialog(false);

        alert(`Rapport "${data.titre}" chargé avec succès`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
      alert('Erreur lors du chargement du rapport');
    }
  };

  // Supprimer un rapport sauvegardé
  const deleteRapport = async (rapportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

    try {
      const { error } = await supabase
        .from('rapports_presentation')
        .delete()
        .eq('id', rapportId);

      if (error) throw error;

      // Recharger la liste
      await loadRapportsList();
      
      // Si c'est le rapport actuel, réinitialiser
      if (rapportActuelId === rapportId) {
        setRapportActuelId(null);
        setTitreRapport('');
        setNotesRapport('');
      }

      alert('Rapport supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du rapport');
    }
  };

  // Changer le statut d'un rapport
  const changeStatut = async (rapportId: string, newStatut: string) => {
    try {
      const { error } = await supabase
        .from('rapports_presentation')
        .update({ statut: newStatut })
        .eq('id', rapportId);

      if (error) throw error;
      
      await loadRapportsList();
      alert('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

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
    setContenuChapitre3('');
    setContenuChapitre4('');
    setCharpitre10({
      validationAttribution: 'à l\'issue de la validation d\'attribution du marché',
      envoiRejet: 'à l\'issue du délai de standstill',
      attributionMarche: '',
      autresElements: ''
    });
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
      let dataToUse;
      
      // Déterminer les données à utiliser selon la sélection
      const isMultiLot = an01GlobalData && an01GlobalData.lots && an01GlobalData.lots.length > 1;
      
      if (isMultiLot && selectedLots.length === 0) {
        // Multi-lots MAIS aucun lot sélectionné : erreur
        alert('Veuillez sélectionner au moins un lot');
        setIsGenerating(false);
        return;
      } else if (!isMultiLot || selectedLots.length === 1) {
        // Mono-lot OU un seul lot sélectionné : utiliser an01Data (lot unique)
        dataToUse = an01Data;
      } else {
        // Plusieurs lots sélectionnés : créer une structure avec les lots sélectionnés
        if (an01GlobalData) {
          const selectedLotsData = an01GlobalData.lots.filter((_, index) => 
            selectedLots.includes(index)
          );
          dataToUse = { 
            allLots: selectedLotsData, 
            globalMetadata: an01GlobalData.globalMetadata 
          };
        } else {
          dataToUse = an01Data;
        }
      }
      
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

  // Fonction pour convertir un texte avec retours à la ligne en paragraphes
  const createParagraphsFromText = (text: string): Paragraph[] => {
    if (!text) return [];
    
    // Séparer par les retours à la ligne
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    return lines.map(line => {
      const trimmedLine = line.trim();
      
      // Détecter si c'est un élément de liste (commence par -, •, *, ou un chiffre suivi de .)
      const isBullet = /^[-•*]\s/.test(trimmedLine);
      const isNumbered = /^\d+\.\s/.test(trimmedLine);
      
      if (isBullet || isNumbered) {
        // Retirer le marqueur de liste du texte
        const textWithoutMarker = trimmedLine.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');
        return new Paragraph({
          children: [createBodyText(textWithoutMarker)],
          bullet: { level: 0 },
          spacing: { after: 100 },
        });
      } else {
        // Paragraphe normal
        return new Paragraph({
          children: [createBodyText(trimmedLine)],
          spacing: { after: 100 },
        });
      }
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
        // Configuration pour mettre à jour automatiquement les champs sans demander
        settings: {
          updateFields: true,
        },
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
                // Logo supprimé temporairement (problème de compatibilité ImageRun)
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
            // En-tête (sans HeadingLevel pour ne pas apparaître dans le sommaire)
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
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            
            // Sommaire
            new Paragraph({
              children: [
                new TextRun({
                  text: "SOMMAIRE",
                  font: "Rockwell",
                  size: 28, // 14pt
                  bold: true,
                  color: "56BAA2",
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 400, after: 200 },
            }),
            new TableOfContents("Sommaire", {
              hyperlink: true,
              headingStyleRange: "1-2",
            }),
            new Paragraph({
              text: "",
              spacing: { after: 400 },
              pageBreakBefore: true,
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
            
            // Introduction de l'objet du marché
            new Paragraph({
              children: [
                createBodyText("Le présent marché a pour objet :"),
              ],
              spacing: { after: 100 },
            }),
            
            // Traiter l'objet du marché avec support des listes à puces
            ...createParagraphsFromText(state.rapportGenere.section1_contexte.objetMarche),
            
            // Durée du marché
            new Paragraph({
              children: [
                createBodyText(`Pour une durée totale de ${state.rapportGenere.section1_contexte.dureeMarche} mois.`),
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
                new TextRun({ text: "La procédure, menée conjointement avec la ", font: "Aptos", size: 22 }),
                new TextRun({ text: state.rapportGenere.section2_deroulement.clientInterne || dossierRattache?.Client_Interne || 'le client interne', bold: true, font: "Aptos", size: 22 }),
                new TextRun({ text: " de l'Afpa, a été lancée sur la plateforme « ", font: "Aptos", size: 22 }),
                new TextRun({ text: state.rapportGenere.section2_deroulement.supportProcedure, bold: true, font: "Aptos", size: 22 }),
                new TextRun({ text: " » selon le calendrier suivant :", font: "Aptos", size: 22 }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({ text: `Date de publication : ${state.rapportGenere.section2_deroulement.datePublication}`, font: "Aptos", size: 22 }),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Nombre de dossiers retirés : ${state.rapportGenere.section2_deroulement.nombreRetraits}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Date de réception des offres : ${state.rapportGenere.section2_deroulement.dateReceptionOffres}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Nombre de plis reçus : ${state.rapportGenere.section2_deroulement.nombrePlisRecus}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Date d'ouverture des plis : ${state.rapportGenere.section2_deroulement.dateOuverturePlis}`),
              ],
              bullet: { level: 0 },
              spacing: { after: 200 },
            }),
            
            // Section 3 : Dossier de consultation
            new Paragraph({
              children: [createHeadingText("3. DOSSIER DE CONSULTATION")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            ...(contenuChapitre3
              ? (() => {
                  // Vérifier si le contenu contient la phrase d'introduction
                  const introPhrase = "Le dossier de consultation comprenait :";
                  const hasIntro = contenuChapitre3.includes(introPhrase);

                  if (hasIntro) {
                    const paragraphs: any[] = [];

                    // Ajouter l'introduction
                    paragraphs.push(
                      new Paragraph({
                        children: [createBodyText(introPhrase)],
                        spacing: { after: 200 },
                      })
                    );

                    // Parser les lignes suivantes comme liste à puces
                    const lines = contenuChapitre3.split(/\r?\n/);
                    let startParsing = false;

                    for (const line of lines) {
                      const trimmedLine = line.trim();

                      if (trimmedLine.includes(introPhrase)) {
                        startParsing = true;
                        continue;
                      }

                      if (startParsing && trimmedLine) {
                        // Enlever les marqueurs de liste existants
                        const cleanedLine = trimmedLine.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');

                        if (cleanedLine) {
                          paragraphs.push(
                            new Paragraph({
                              children: [createBodyText(cleanedLine)],
                              bullet: { level: 0 },
                              spacing: { after: 100 },
                            })
                          );
                        }
                      }
                    }

                    return paragraphs;
                  } else {
                    // Sinon, utiliser le comportement par défaut
                    return createParagraphsFromText(contenuChapitre3);
                  }
                })()
              : [new Paragraph({
                  children: [new TextRun({ text: "[À compléter : Description du DCE et des documents fournis]", italics: true, color: "FF8800", font: "Aptos", size: 22 })],
                  spacing: { after: 200 },
                })]
            ),
            
            // Section 4 : Questions-Réponses
            new Paragraph({
              children: [createHeadingText("4. QUESTIONS - RÉPONSES")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            ...(contenuChapitre4
              ? createParagraphsFromText(contenuChapitre4)
              : [new Paragraph({
                  children: [new TextRun({ text: "[À compléter : Questions posées et réponses apportées]", italics: true, color: "FF8800", font: "Aptos", size: 22 })],
                  spacing: { after: 200 },
                })]
            ),
            
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
                createBodyText("Critères d'attribution :", true),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Critère technique : `),
                createBodyText(`${state.rapportGenere.section6_methodologie?.ponderationTechnique || 30}%`, true),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Critère financier : `),
                createBodyText(`${state.rapportGenere.section6_methodologie?.ponderationFinancier || 70}%`, true),
              ],
              bullet: { level: 0 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                createBodyText("Méthode de notation :", true),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Note technique sur ${state.rapportGenere.section6_methodologie?.ponderationTechnique || 30} points`),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Note financière sur ${state.rapportGenere.section6_methodologie?.ponderationFinancier || 70} points`),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                createBodyText(`Note finale sur 100 points`),
              ],
              bullet: { level: 0 },
              spacing: { after: 200 },
            }),
            
            // Section 7 : Analyse de la valeur des offres
            new Paragraph({
              children: [createHeadingText("7. ANALYSE DE LA VALEUR DES OFFRES")],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [createBodyText("L'analyse économique et technique dans son détail est jointe au présent document en annexe.")],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [createBodyText("Le classement final des offres est le suivant.")],
              spacing: { after: 200 },
            }),
            
            // Si multi-lots : afficher un titre + tableau par lot
            ...(state.rapportGenere.section7_2_syntheseLots ? 
              state.rapportGenere.section7_2_syntheseLots.lots.flatMap((lot: any, index: number) => [
                new Paragraph({
                  children: [createBodyText(lot.nomLot, true)],
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 300, after: 150 },
                }),
                createOffersTable(
                  lot.tableau, 
                  lot.poidsTechnique || 30, 
                  lot.poidsFinancier || 70
                ),
                new Paragraph({ text: "", spacing: { after: 200 } }),
              ]) : [
              // Sinon : afficher le tableau de classement classique
              createOffersTable(
                state.rapportGenere.section7_valeurOffres.tableau,
                state.rapportGenere.section6_methodologie?.ponderationTechnique || 30,
                state.rapportGenere.section6_methodologie?.ponderationFinancier || 70
              ),
              
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
            
            // Si multi-lots ET tableau détaillé disponible : afficher le tableau détaillé
            ...(state.rapportGenere.section8_performance?.tableauDetaille ? [
              new Paragraph({
                children: [
                  createBodyText(`Le tableau ci-dessous présente la performance achat détaillée pour chaque lot :`),
                ],
                spacing: { after: 200 },
              }),
              
              createPerformanceDetailTable(state.rapportGenere.section8_performance.tableauDetaille),
              
              new Paragraph({
                children: [
                  createBodyText(`Au global, la performance achat tous lots confondus est de `),
                  createBodyText(`${state.rapportGenere.section8_performance.performanceAchatPourcent.toFixed(1)}%`, true),
                  createBodyText(`.`),
                ],
                spacing: { before: 200, after: 100 },
              }),
              
              new Paragraph({
                children: [
                  createBodyText(`L'impact budgétaire total estimé est de `),
                  createBodyText(formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireTTC), true),
                  createBodyText(` TTC (soit `),
                  createBodyText(formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireHT)),
                  createBodyText(` HT).`),
                ],
                spacing: { after: 200 },
              }),
            ] : state.rapportGenere.section8_1_synthesePerformance ? [
              // Ancien format si pas de tableau détaillé mais multi-lots
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
                createBodyText("Validation de la proposition d'attribution du marché : ", true),
                createBodyText(chapitre10.validationAttribution),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                createBodyText("Envoi des lettres de rejet : ", true),
                createBodyText(chapitre10.envoiRejet),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                createBodyText("Attribution du marché : ", true),
                createBodyText(chapitre10.attributionMarche || "[À compléter]"),
              ],
              spacing: { after: 200 },
            }),
            
            ...(chapitre10.autresElements
              ? [
                  new Paragraph({
                    children: [
                      createBodyText("Autres éléments du calendrier : ", true),
                      createBodyText(chapitre10.autresElements),
                    ],
                    spacing: { after: 200 },
                  }),
                ]
              : []),
            
            // Bloc de signature
            new Paragraph({
              text: "",
              spacing: { before: 600 },
            }),
            new Paragraph({
              children: [
                createBodyText(procedureSelectionnee?.Acheteur || "RPA responsable", true),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                createBodyText(`Fait à Montreuil, le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`),
              ],
              alignment: AlignmentType.RIGHT,
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
                
                {/* Sélection des lots si plusieurs lots */}
                {an01GlobalData && an01GlobalData.lots && an01GlobalData.lots.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Sélectionner le(s) lot(s) à inclure dans le rapport :
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedLots(an01GlobalData.lots.map((_: any, i: number) => i))}
                          className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                        >
                          Tous
                        </button>
                        <button
                          onClick={() => setSelectedLots([])}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        >
                          Aucun
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {an01GlobalData.lots.map((lot: any, index: number) => (
                        <label key={index} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLots.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLots([...selectedLots, index]);
                              } else {
                                setSelectedLots(selectedLots.filter(i => i !== index));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {lot.lotName || `Lot ${index + 1}`}
                          </span>
                          {lot.metadata?.description && (
                            <span className="text-xs text-gray-500">- {lot.metadata.description}</span>
                          )}
                        </label>
                      ))}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {selectedLots.length === 0 && (
                        <p className="text-orange-600">⚠️ Aucun lot sélectionné</p>
                      )}
                      {selectedLots.length === 1 && (
                        <p className="text-blue-600">📊 1 lot sélectionné</p>
                      )}
                      {selectedLots.length > 1 && selectedLots.length < an01GlobalData.lots.length && (
                        <p className="text-green-600">📊 {selectedLots.length} lots sélectionnés (synthèse multi-lots)</p>
                      )}
                      {selectedLots.length === an01GlobalData.lots.length && (
                        <p className="text-purple-600">📊 Tous les lots sélectionnés (synthèse globale)</p>
                      )}
                    </div>
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
        {tousLesFileursCharges && (
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
                  {state.rapportGenere ? 'Regénérer le Rapport de Présentation' : 'Générer le Rapport de Présentation'}
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
            <div className="flex gap-2">
              {/* Bouton Mode édition */}
              {state.rapportGenere && (
                <button
                  onClick={() => {
                    if (!modeEdition) {
                      setRapportEditable(JSON.parse(JSON.stringify(state.rapportGenere)));
                    }
                    setModeEdition(!modeEdition);
                  }}
                  className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {modeEdition ? 'Quitter l\'édition' : 'Modifier'}
                </button>
              )}
              
              {/* Bouton Valider les modifications */}
              {modeEdition && (
                <button
                  onClick={() => {
                    setState(prev => ({ ...prev, rapportGenere: rapportEditable }));
                    setModeEdition(false);
                    alert('Modifications enregistrées dans le rapport');
                  }}
                  className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Valider les modifications
                </button>
              )}
              
              {/* Bouton Sauvegarder */}
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={!state.rapportGenere || modeEdition}
                className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
              
              {/* Bouton Charger */}
              <button
                onClick={() => setShowLoadDialog(true)}
                disabled={rapportsSauvegardes.length === 0}
                className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Charger ({rapportsSauvegardes.length})
              </button>

              {/* Bouton Exporter */}
              {state.rapportGenere && (
                <>
                  <button
                    onClick={handleExportDOCX}
                    disabled={isExporting}
                    className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                  {/* Bouton unique pour générer les NOTI */}
                  <button
                    onClick={() => setShowNotificationsQuickAccess(true)}
                    className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                    title="Générer les notifications (NOTI1, NOTI5, NOTI3) avec fonctionnalités avancées"
                  >
                    <FileText className="w-4 h-4" />
                    Générer NOTI
                  </button>

                  {/* Bouton NOTI Multi-Attributaires (en construction) */}
                  <button
                    onClick={() => setShowNotiMultiAttributaires(true)}
                    className="py-2 px-4 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 opacity-70"
                    title="NOTI Multi-Attributaires (en construction)"
                  >
                    <Construction className="w-4 h-4" />
                    NOTI Multi 🚧
                  </button>
                </>
              )}
            </div>
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
                modeEdition && rapportEditable ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Objet du marché</label>
                      <textarea
                        value={rapportEditable.section1_contexte.objetMarche}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section1_contexte: { ...rapportEditable.section1_contexte, objetMarche: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée du marché (mois)</label>
                      <input
                        type="number"
                        value={rapportEditable.section1_contexte.dureeMarche}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section1_contexte: { ...rapportEditable.section1_contexte, dureeMarche: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p><strong>Objet du marché :</strong> {state.rapportGenere.section1_contexte.objetMarche}</p>
                    <p><strong>Durée du marché :</strong> {state.rapportGenere.section1_contexte.dureeMarche} mois</p>
                  </>
                )
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
                modeEdition && rapportEditable ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Interne</label>
                      <input
                        type="text"
                        value={rapportEditable.section2_deroulement.clientInterne || dossierRattache?.Client_Interne || ''}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section2_deroulement: { ...rapportEditable.section2_deroulement, clientInterne: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Support de procédure</label>
                      <input
                        type="text"
                        value={rapportEditable.section2_deroulement.supportProcedure}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section2_deroulement: { ...rapportEditable.section2_deroulement, supportProcedure: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de publication</label>
                      <input
                        type="text"
                        value={rapportEditable.section2_deroulement.datePublication}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section2_deroulement: { ...rapportEditable.section2_deroulement, datePublication: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de retraits</label>
                      <input
                        type="number"
                        value={rapportEditable.section2_deroulement.nombreRetraits}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section2_deroulement: { ...rapportEditable.section2_deroulement, nombreRetraits: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de réception des offres</label>
                      <input
                        type="text"
                        value={rapportEditable.section2_deroulement.dateReceptionOffres}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section2_deroulement: { ...rapportEditable.section2_deroulement, dateReceptionOffres: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de plis reçus</label>
                      <input
                        type="number"
                        value={rapportEditable.section2_deroulement.nombrePlisRecus}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section2_deroulement: { ...rapportEditable.section2_deroulement, nombrePlisRecus: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p><strong>Client Interne :</strong> {state.rapportGenere.section2_deroulement.clientInterne || dossierRattache?.Client_Interne || 'Non renseigné'}</p>
                    <p><strong>Support :</strong> {state.rapportGenere.section2_deroulement.supportProcedure}</p>
                    <p><strong>Date de publication :</strong> {state.rapportGenere.section2_deroulement.datePublication}</p>
                    <p><strong>Nombre de retraits :</strong> {state.rapportGenere.section2_deroulement.nombreRetraits}</p>
                    <p><strong>Date de réception :</strong> {state.rapportGenere.section2_deroulement.dateReceptionOffres}</p>
                    <p><strong>Nombre de plis reçus :</strong> {state.rapportGenere.section2_deroulement.nombrePlisRecus}</p>
                  </>
                )
              ) : (
                <>
                  <p className="text-gray-500 italic">• Client Interne</p>
                  <p className="text-gray-500 italic">• Support de procédure (e-marchespublics, etc.)</p>
                  <p className="text-gray-500 italic">• Date de publication</p>
                  <p className="text-gray-500 italic">• Nombre de retraits du DCE</p>
                  <p className="text-gray-500 italic">• Date de réception des offres</p>
                  <p className="text-gray-500 italic">• Nombre de plis reçus</p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 3 : Dossier de consultation */}
            <ChapterPreview 
              number={3} 
              title="DOSSIER DE CONSULTATION" 
              hasData={!!contenuChapitre3}
              icon="📁"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-700 font-medium">✏️ Saisissez ou collez le contenu ci-dessous :</p>
                  <button
                    onClick={loadDCEData}
                    disabled={!procedureSelectionnee || loadingDCE}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all"
                    title="Charger automatiquement les données depuis le module DCE Complet"
                  >
                    {loadingDCE ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        Charger depuis DCE
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={contenuChapitre3}
                  onChange={(e) => setContenuChapitre3(e.target.value)}
                  placeholder="Description du DCE et des documents fournis...\n\nExemple :\n- Acte d'engagement\n- CCAP\n- CCTP\n- BPU\n- etc.\n\nOu cliquez sur 'Charger depuis DCE' pour importer automatiquement la liste des documents."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {contenuChapitre3 && (
                  <p className="text-xs text-green-600">✓ {contenuChapitre3.length} caractères saisis</p>
                )}
                {dceData && (
                  <div className="mt-2 p-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                    <p className="text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
                      <Check className="w-3 h-3" />
                      Données chargées depuis le DCE (Procédure {procedureSelectionnee?.NumProc})
                    </p>
                  </div>
                )}
              </div>
            </ChapterPreview>

            {/* Chapitre 4 : Questions-Réponses */}
            <ChapterPreview 
              number={4} 
              title="QUESTIONS - RÉPONSES" 
              hasData={!!contenuChapitre4}
              icon="💬"
            >
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">✏️ Saisissez ou collez le contenu ci-dessous :</p>
                <textarea
                  value={contenuChapitre4}
                  onChange={(e) => setContenuChapitre4(e.target.value)}
                  placeholder="Questions posées et réponses apportées...\n\nExemple :\nQ1: [Question du candidat]\nR1: [Réponse apportée]\n\nQ2: ..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {contenuChapitre4 && (
                  <p className="text-xs text-green-600">✓ {contenuChapitre4.length} caractères saisis</p>
                )}
              </div>
            </ChapterPreview>

            {/* Chapitre 5 : Analyse des candidatures */}
            <ChapterPreview 
              number={5} 
              title="ANALYSE DES CANDIDATURES" 
              hasData={true}
              icon="👥"
            >
              {modeEdition && rapportEditable ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Texte principal</label>
                    <textarea
                      value={rapportEditable.section5_proposition?.texteAnalyse || "L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la recevabilité des documents administratifs demandés dans chacune de nos procédures."}
                      onChange={(e) => setRapportEditable({
                        ...rapportEditable,
                        section5_proposition: { ...rapportEditable.section5_proposition, texteAnalyse: e.target.value }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note complémentaire</label>
                    <input
                      type="text"
                      value={rapportEditable.section5_proposition?.noteAnnexe || "L'analyse des candidatures est disponible en annexe."}
                      onChange={(e) => setRapportEditable({
                        ...rapportEditable,
                        section5_proposition: { ...rapportEditable.section5_proposition, noteAnnexe: e.target.value }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800">
                    L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la 
                    recevabilité des documents administratifs demandés dans chacune de nos procédures.
                  </p>
                  <p className="text-gray-800 mt-2">
                    L'analyse des candidatures est disponible en annexe.
                  </p>
                </>
              )}
            </ChapterPreview>

            {/* Chapitre 6 : Méthodologie d'analyse */}
            <ChapterPreview 
              number={6} 
              title="MÉTHODOLOGIE D'ANALYSE DES OFFRES" 
              hasData={!!state.rapportGenere}
              icon="⚖️"
            >
              {state.rapportGenere ? (
                modeEdition && rapportEditable ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pondération technique (%)</label>
                      <input
                        type="number"
                        value={rapportEditable.section6_methodologie?.ponderationTechnique || 30}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section6_methodologie: { ...rapportEditable.section6_methodologie, ponderationTechnique: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pondération financière (%)</label>
                      <input
                        type="number"
                        value={rapportEditable.section6_methodologie?.ponderationFinancier || 70}
                        onChange={(e) => setRapportEditable({
                          ...rapportEditable,
                          section6_methodologie: { ...rapportEditable.section6_methodologie, ponderationFinancier: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p><strong>Critères d'attribution :</strong></p>
                    <p className="ml-4">• Critère technique : {an01Data?.metadata?.poidsTechnique || state.rapportGenere.section6_methodologie?.ponderationTechnique || 30}%</p>
                    <p className="ml-4">• Critère financier : {an01Data?.metadata?.poidsFinancier || state.rapportGenere.section6_methodologie?.ponderationFinancier || 70}%</p>
                    <p className="mt-2"><strong>Méthode de notation :</strong></p>
                    <p className="ml-4 text-sm">• Note technique sur {an01Data?.metadata?.poidsTechnique || 30} points</p>
                    <p className="ml-4 text-sm">• Note financière sur {an01Data?.metadata?.poidsFinancier || 70} points</p>
                    <p className="ml-4 text-sm">• Note finale sur 100 points</p>
                  </>
                )
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
                  {state.rapportGenere.section7_2_syntheseLots ? (
                    // Mode multi-lots : afficher UN TABLEAU PAR LOT avec titre
                    <>
                      {state.rapportGenere.section7_2_syntheseLots.lots.map((lot: any, idx: number) => (
                        <div key={idx} className="mb-6">
                          <p className="font-bold mb-2 text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                            {lot.nomLot}
                          </p>
                          <div className="mt-2 overflow-x-auto">
                            <table className="min-w-full text-xs border border-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-2 py-1 text-left border-b">Raison sociale</th>
                                  <th className="px-2 py-1 text-center border-b">Rang</th>
                                  <th className="px-2 py-1 text-center border-b">Note /100</th>
                                  <th className="px-2 py-1 text-center border-b">Note Fin. /{lot.poidsFinancier}</th>
                                  <th className="px-2 py-1 text-center border-b">Note Tech. /{lot.poidsTechnique}</th>
                                  <th className="px-2 py-1 text-right border-b">Montant TTC</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lot.tableau.map((offre: any, offreIdx: number) => (
                                  <tr key={offreIdx} className={offreIdx === 0 ? 'bg-green-50 font-semibold' : ''}>
                                    <td className="px-2 py-1 border-b">{offre.raisonSociale}</td>
                                    <td className="px-2 py-1 border-b text-center">{offre.rangFinal}</td>
                                    <td className="px-2 py-1 border-b text-center">{offre.noteFinaleSur100.toFixed(2)}</td>
                                    <td className="px-2 py-1 border-b text-center">{offre.noteFinanciere.toFixed(2)}</td>
                                    <td className="px-2 py-1 border-b text-center">{offre.noteTechnique.toFixed(2)}</td>
                                    <td className="px-2 py-1 border-b text-right">{formatCurrency(offre.montantTTC)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
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
                              <th className="px-3 py-2 text-right border-b">Note Tech. /{an01Data?.metadata?.poidsTechnique || 30}</th>
                              <th className="px-3 py-2 text-right border-b">Note Fin. /{an01Data?.metadata?.poidsFinancier || 70}</th>
                              <th className="px-3 py-2 text-right border-b">Note Totale /100</th>
                              <th className="px-3 py-2 text-right border-b">Montant TTC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.rapportGenere.section7_valeurOffres.tableau.map((offre, idx) => (
                              <tr key={idx} className={idx === 0 ? 'bg-green-50 font-semibold' : ''}>
                                <td className="px-3 py-2 border-b">#{offre.rangFinal}</td>
                                <td className="px-3 py-2 border-b">{offre.raisonSociale}</td>
                                <td className="px-3 py-2 border-b text-right">{offre.noteTechnique?.toFixed(2) || offre.noteTechniqueSur40?.toFixed(2)}</td>
                                <td className="px-3 py-2 border-b text-right">{offre.noteFinanciere?.toFixed(2) || offre.noteFinanciereSur60?.toFixed(2)}</td>
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
                  {state.rapportGenere.section8_performance?.tableauDetaille ? (
                    // Mode multi-lots avec tableau détaillé
                    <>
                      <p className="font-semibold mb-3 text-blue-700">📊 Performance détaillée par lot</p>
                      <div className="overflow-x-auto mb-3">
                        <table className="min-w-full text-xs border border-gray-200">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="px-2 py-1 text-left border-b">Lot</th>
                              <th className="px-2 py-1 text-right border-b">Moy. HT</th>
                              <th className="px-2 py-1 text-right border-b">Moy. TTC</th>
                              <th className="px-2 py-1 text-right border-b">Retenue HT</th>
                              <th className="px-2 py-1 text-right border-b">Retenue TTC</th>
                              <th className="px-2 py-1 text-right border-b">Gains HT</th>
                              <th className="px-2 py-1 text-right border-b">Gains TTC</th>
                              <th className="px-2 py-1 text-right border-b">Gains %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.rapportGenere.section8_performance.tableauDetaille.map((lot: any, idx: number) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-2 py-1 border-b font-semibold">{lot.nomLot}</td>
                                <td className="px-2 py-1 border-b text-right">{formatCurrency(lot.moyenneHT)}</td>
                                <td className="px-2 py-1 border-b text-right">{formatCurrency(lot.moyenneTTC)}</td>
                                <td className="px-2 py-1 border-b text-right">{formatCurrency(lot.offreRetenueHT)}</td>
                                <td className="px-2 py-1 border-b text-right">{formatCurrency(lot.offreRetenueTTC)}</td>
                                <td className={`px-2 py-1 border-b text-right font-semibold ${lot.gainsHT < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(lot.gainsHT)}
                                </td>
                                <td className={`px-2 py-1 border-b text-right font-semibold ${lot.gainsTTC < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(lot.gainsTTC)}
                                </td>
                                <td className={`px-2 py-1 border-b text-right font-bold ${lot.gainsPourcent < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {lot.gainsPourcent.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-sm mt-3"><strong>Performance globale :</strong> {state.rapportGenere.section8_performance.performanceAchatPourcent.toFixed(1)}%</p>
                      <p className="text-sm"><strong>Impact budgétaire total :</strong> {formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireTTC)} TTC 
                        (soit {formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireHT)} HT)</p>
                    </>
                  ) : state.rapportGenere.section8_1_synthesePerformance ? (
                    // Mode multi-lots : afficher la performance des lots sélectionnés (ancien format)
                    <>
                      <p className="font-semibold mb-2 text-blue-700">📊 Performance tous lots confondus</p>
                      <p className="text-sm mb-2"><strong>Performance globale :</strong> {state.rapportGenere.section8_performance.performanceAchatPourcent.toFixed(1)}%</p>
                      <p className="text-sm mb-3"><strong>Impact budgétaire total :</strong> {formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireTTC)} TTC 
                        (soit {formatCurrency(state.rapportGenere.section8_performance.impactBudgetaireHT)} HT)</p>
                      
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
                  {state.rapportGenere.section7_2_syntheseLots ? (
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
              hasData={!!(chapitre10.attributionMarche || chapitre10.autresElements)}
              icon="📆"
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-700 font-medium">✏️ Complétez les informations :</p>
                
                {/* Validation de la proposition d'attribution du marché */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-900">
                    Validation de la proposition d'attribution du marché :
                  </label>
                  <p className="text-sm text-gray-700 mt-1">
                    {chapitre10.validationAttribution}
                  </p>
                </div>

                {/* Envoi des lettres de rejet */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Envoi des lettres de rejet :
                  </label>
                  <select
                    value={chapitre10.envoiRejet}
                    onChange={(e) => setCharpitre10({...chapitre10, envoiRejet: e.target.value})}
                    className="w-full p-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="à l'issue du délai de standstill">à l'issue du délai de standstill</option>
                    <option value="à l'issue de la validation d'attribution du marché">à l'issue de la validation d'attribution du marché</option>
                  </select>
                </div>

                {/* Attribution du marché */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Attribution du marché :
                  </label>
                  <input
                    type="text"
                    value={chapitre10.attributionMarche}
                    onChange={(e) => setCharpitre10({...chapitre10, attributionMarche: e.target.value})}
                    placeholder="Ex: novembre 2025 (mois en cours + 1)"
                    className="w-full p-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Suggestion : {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                </div>

                {/* Autres éléments du calendrier */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Autres éléments du calendrier (optionnel) :
                  </label>
                  <textarea
                    value={chapitre10.autresElements}
                    onChange={(e) => setCharpitre10({...chapitre10, autresElements: e.target.value})}
                    placeholder="Ajoutez d'autres jalons ou informations..."
                    className="w-full h-24 p-2 border border-purple-300 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Aperçu */}
                {(chapitre10.attributionMarche || chapitre10.autresElements) && (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-2">✓ Données saisies</p>
                    <div className="space-y-1 text-xs text-gray-700 font-mono">
                      <p><strong>Validation :</strong> {chapitre10.validationAttribution}</p>
                      <p><strong>Rejet :</strong> {chapitre10.envoiRejet}</p>
                      <p><strong>Attribution :</strong> {chapitre10.attributionMarche}</p>
                      {chapitre10.autresElements && <p><strong>Autres :</strong> {chapitre10.autresElements}</p>}
                    </div>
                  </div>
                )}
              </div>
            </ChapterPreview>
          </div>
        </div>
      </div>

      {/* Dialogue Sauvegarder */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sauvegarder le rapport</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du rapport *
                </label>
                <input
                  type="text"
                  value={titreRapport}
                  onChange={(e) => setTitreRapport(e.target.value)}
                  placeholder="Ex: Rapport de présentation - Version initiale"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notesRapport}
                  onChange={(e) => setNotesRapport(e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {saveMessage && (
                <div className={`p-3 rounded-lg ${saveMessage.includes('succès') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {saveMessage}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveRapport}
                  className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {rapportActuelId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue Charger */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Charger un rapport sauvegardé</h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rapportsSauvegardes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun rapport sauvegardé pour cette procédure</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rapportsSauvegardes.map((rapport) => (
                  <div
                    key={rapport.id}
                    className={`border rounded-lg p-4 hover:border-purple-500 transition-colors ${rapportActuelId === rapport.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{rapport.titre}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rapport.statut === 'brouillon' ? 'bg-gray-200 text-gray-700' :
                            rapport.statut === 'en_revision' ? 'bg-blue-200 text-blue-700' :
                            rapport.statut === 'valide' ? 'bg-green-200 text-green-700' :
                            'bg-purple-200 text-purple-700'
                          }`}>
                            {rapport.statut === 'brouillon' ? 'Brouillon' :
                             rapport.statut === 'en_revision' ? 'En révision' :
                             rapport.statut === 'valide' ? 'Validé' : 'Publié'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            v{rapport.version}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Créé le {new Date(rapport.date_creation).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {rapport.date_modification && (
                            <div className="flex items-center gap-2">
                              <Edit2 className="w-3 h-3" />
                              <span>Modifié le {new Date(rapport.date_modification).toLocaleDateString('fr-FR', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          )}
                        </div>
                        
                        {rapport.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{rapport.notes}"</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleLoadRapport(rapport.id)}
                          className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded flex items-center gap-1"
                        >
                          <FolderOpen className="w-3 h-3" />
                          Charger
                        </button>
                        
                        <select
                          value={rapport.statut}
                          onChange={(e) => changeStatut(rapport.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="brouillon">Brouillon</option>
                          <option value="en_revision">En révision</option>
                          <option value="valide">Validé</option>
                          <option value="publie">Publié</option>
                        </select>
                        
                        <button
                          onClick={() => deleteRapport(rapport.id)}
                          className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Suppr.
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal NotificationsQuickAccess */}
      {showNotificationsQuickAccess && procedureSelectionnee && state.rapportGenere && (
        <NotificationsQuickAccess
          onClose={() => setShowNotificationsQuickAccess(false)}
          preloadedData={{
            procedure: procedureSelectionnee,
            candidats: [], // Sera chargé depuis Supabase dans NotificationsQuickAccess
            rapportData: state.rapportGenere,
          }}
        />
      )}

      {/* Modal NOTI Multi-Attributaires (en construction) */}
      {showNotiMultiAttributaires && (
        <NotiMultiAttributaires
          isOpen={showNotiMultiAttributaires}
          onClose={() => setShowNotiMultiAttributaires(false)}
        />
      )}
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
function createOffersTable(offers: any[], poidsTechnique: number = 30, poidsFinancier: number = 70): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Raison sociale", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rang", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note /100", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Note Fin. /${poidsFinancier}`, bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Note Tech. /${poidsTechnique}`, bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
      ],
    }),
    // Données
    ...offers.map(o => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.raisonSociale || '', font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(o.rangFinal || 0), font: "Aptos", size: 20 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (o.noteFinaleSur100 || 0).toFixed(2), font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ((o.noteFinanciere !== undefined ? o.noteFinanciere : o.noteFinanciereSur60) || 0).toFixed(2), font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ((o.noteTechnique !== undefined ? o.noteTechnique : o.noteTechniqueSur40) || 0).toFixed(2), font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(o.montantTTC || 0), font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
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
// Fonction pour créer le tableau détaillé de performance (chapitre 8)
function createPerformanceDetailTable(tableauDetaille: any[]): Table {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  
  // Vérifier que tableauDetaille n'est pas vide
  if (!tableauDetaille || tableauDetaille.length === 0) {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Aucune donnée disponible", font: "Aptos", size: 20 })] })] }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }
  
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.LEFT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Moy. HT", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Moy. TTC", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Retenue HT", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Retenue TTC", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Gains HT", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Gains TTC", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: "Gains %", bold: true, font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })], 
          shading: { fill: "D0E0E3" } 
        }),
      ],
    }),
    // Données
    ...tableauDetaille.map(lot => {
      // Couleur pour les gains : vert si négatif (économie), rouge si positif (surcoût)
      const gainsColor = (lot.gainsPourcent || 0) < 0 ? "00B050" : (lot.gainsPourcent || 0) > 0 ? "FF0000" : "000000";
      
      return new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: lot.nomLot || '', font: "Aptos", size: 18 })], alignment: AlignmentType.LEFT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.moyenneHT || 0), font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.moyenneTTC || 0), font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.offreRetenueHT || 0), font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.offreRetenueTTC || 0), font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.gainsHT || 0), font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.gainsTTC || 0), font: "Aptos", size: 18 })], alignment: AlignmentType.RIGHT })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: `${(lot.gainsPourcent || 0).toFixed(1)}%`, font: "Aptos", size: 18, bold: true, color: gainsColor })], alignment: AlignmentType.RIGHT })] 
          }),
        ],
      });
    }),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

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
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Attributaire pressenti", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
      ],
    }),
    // Données
    ...lots.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.attributaire, font: "Aptos", size: 20 })], alignment: AlignmentType.LEFT })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lot.montantAttributaire), font: "Aptos", size: 20 })], alignment: AlignmentType.RIGHT })] }),
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
