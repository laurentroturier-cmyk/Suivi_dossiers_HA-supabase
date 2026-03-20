// ============================================
// MAPPING PROCÉDURE → DCE
// Transforme les données ProjectData en DCEState
// ============================================

import type { ProjectData } from '../../../types';
import type { DCEState, ConfigurationGlobale, LotConfiguration } from '../types';
import {
  createDefaultActeEngagement,
  createDefaultBPU,
  createDefaultCCAP,
  createDefaultCCTP,
  createDefaultDPGF,
  createDefaultDQE,
  createDefaultDocumentsAnnexes,
  createDefaultCRT,
  createDefaultQT,
  createDefaultReglementConsultation,
} from '../components/modules/defaults';
import { formatExcelDate } from '@/utils';

/**
 * Mappe automatiquement les données d'une procédure vers toutes les sections du DCE
 * Cette fonction centralise toute la logique d'auto-remplissage
 */
export function mapProcedureToDCE(procedure: ProjectData): Omit<DCEState, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  // Récupération des champs de base
  const numeroProcedure = String(procedure['Numéro de procédure (Afpa)'] || procedure['NumProc'] || '').substring(0, 5);
  const titreMarche = String(procedure['Intitulé'] || '');
  const montantEstime = Number(procedure['Montant estimé (€ HT)'] || 0);
  const acheteur = String(procedure['Acheteur'] || '');
  const dateLimiteCandidature = String(procedure['Date limite de candidature'] || '');
  const dateLimiteOffre = String(procedure['Date limite de transmission des offres'] || '');
  const codePostal = String(procedure['Code postal'] || '');
  const ville = String(procedure['Ville'] || '');
  const lieuExecution = `${codePostal} ${ville}`.trim();
  const modePassation = String(procedure['Mode de passation'] || '');
  const nombreLots = parseInt(procedure['Nombre de lots'] || '1');
  const typeProcedure = String(procedure['Type de procédure'] || '');
  const dureeMarche = String(procedure['Durée du marché (en mois)'] || '');
  const ccagApplicable = String(procedure['CCAG'] || '');

  // 🆕 CONFIGURATION GLOBALE
  const lots: LotConfiguration[] = Array.from(
    { length: Math.max(1, nombreLots) }, 
    (_, i) => ({
      numero: String(i + 1),
      intitule: `Lot ${i + 1}`,
      montant: '',
      description: '',
    })
  );

  const configurationGlobale: ConfigurationGlobale = {
    informationsGenerales: {
      acheteur,
      titreMarche,
      typeProcedure,
      dureeMarche,
      dateRemiseOffres: dateLimiteOffre || dateLimiteCandidature,
    },
    lots,
    variablesCommunes: {
      ccagApplicable,
      delaiPaiement: '30',
      delaiExecution: '',
      garantieFinanciere: false,
      avance: false,
      montantAvance: '',
    },
    contacts: {
      responsableProcedure: '',
      emailContact: '',
      telephoneContact: '',
    }
  };

  const rc = createDefaultReglementConsultation();
  rc.enTete.numeroProcedure = numeroProcedure;
  rc.enTete.titreMarche = titreMarche;
  rc.enTete.dateLimiteOffres = dateLimiteOffre || dateLimiteCandidature;
  rc.pouvoirAdjudicateur.nom = acheteur;
  rc.pouvoirAdjudicateur.codePostal = codePostal;
  rc.pouvoirAdjudicateur.ville = ville;
  rc.conditions.modePassation = modePassation;
  rc.typeMarche.lieuExecution = lieuExecution;

  const ae = createDefaultActeEngagement();
  ae.acheteur.nom = acheteur;
  ae.acheteur.codePostal = codePostal;
  ae.acheteur.ville = ville;
  ae.marche.numero = numeroProcedure;
  ae.marche.objet = titreMarche;
  ae.marche.montant = montantEstime ? montantEstime.toString() : '';
  ae.prix.montantHT = montantEstime ? montantEstime.toString() : '';
  ae.prix.tva = montantEstime ? (montantEstime * 0.2).toFixed(2) : '';
  ae.prix.montantTTC = montantEstime ? (montantEstime * 1.2).toFixed(2) : '';
  ae.prix.delaiPaiement = '30 jours';
  ae.conditions.delaiExecution = '';

  const ccap = createDefaultCCAP();
  ccap.dispositionsGenerales.objet = titreMarche;
  ccap.dispositionsGenerales.duree = '';
  ccap.prixPaiement.delaiPaiement = '30 jours';
  ccap.execution.delaiExecution = '';

  const cctp = createDefaultCCTP();
  cctp.contexte.presentation = titreMarche;

  const bpu = createDefaultBPU();
  const dqe = createDefaultDQE();
  const dpgf = createDefaultDPGF();
  const annexes = createDefaultDocumentsAnnexes();
  const crt = createDefaultCRT();
  const qt = createDefaultQT();

  return {
    numeroProcedure,
    procedureId: undefined,
    statut: 'brouillon',
    titreMarche,
    version: 1,
    notes: '',
    configurationGlobale,
    reglementConsultation: rc,
    acteEngagement: ae,
    ccap,
    cctp,
    bpu,
    bpuTMA: null,
    dqe,
    dpgf,
    documentsAnnexes: annexes,
    crt,
    qt,
    qtGenerique: null,
  };
}

import { formatExcelDate } from '@/utils';

/**
 * Utilitaire pour formater un montant
 */
function formatMontant(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}
