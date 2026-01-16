import { supabase } from '../../../lib/supabase';
import type { RapportCommissionData } from '../types/rapportCommission';
import type { ProjectData } from '../../../types';

/**
 * Mapping entre les champs de la table procédures (ProjectData) 
 * et les champs du Règlement de Consultation (RapportCommissionData)
 */
export const PROCEDURE_TO_RC_MAPPING = {
  // En-tête
  'Numéro de procédure (Afpa)': 'enTete.numeroMarche',
  'Nom de la procédure': 'enTete.titreMarche',
  'Date de remise des offres': 'enTete.dateLimiteOffres',
  'Date de remise des offres finales': 'enTete.dateLimiteOffres', // Fallback
  'Forme du marché': 'enTete.typeMarcheTitle',
  
  // Pouvoir adjudicateur : NOM RETIRÉ car doit toujours être "Agence pour la formation professionnelle des Adultes"
  // 'Acheteur' correspond à la personne (ex: Lauriane Malard), pas à la société
  
  // Objet
  'Objet court': 'objet.description',
  'Code CPV Principal': 'objet.cpvPrincipal',
  
  // Conditions
  'Type de procédure': 'conditions.modePassation',
  'Nombre de lots': 'conditions.nbLots',
  
  // Type de marché
  'Durée du marché (en mois)': 'typeMarche.dureeInitiale',
  
  // Remise
  'Durée de validité des offres (en jours)': 'remise.delaiValiditeOffres',
};

/**
 * Extrait les 5 premiers chiffres d'un numéro de procédure Afpa
 */
export function extractNumeroCourt(numeroAfpa: string): string {
  const match = numeroAfpa.match(/\d{5}/);
  return match ? match[0] : '';
}

/**
 * Récupère les données d'une procédure depuis Supabase via le numéro court (5 chiffres)
 */
export async function fetchProcedureByNumeroCourt(numeroCourt: string): Promise<ProjectData | null> {
  if (!numeroCourt || numeroCourt.length !== 5) {
    return null;
  }

  try {
    // Récupérer toutes les procédures et filtrer côté client (workaround pour les noms de colonnes avec caractères spéciaux)
    const { data: allProcedures, error } = await supabase
      .from('procédures')
      .select('*');

    if (error) {
      console.error('Erreur récupération procédures:', error);
      return null;
    }

    if (!allProcedures || allProcedures.length === 0) {
      console.warn('Aucune procédure dans la base');
      return null;
    }

    // Filtrer côté client pour trouver une procédure dont le numéro Afpa commence par le numéro court
    const procedures = allProcedures.filter(p => {
      const numAfpa = String(p['Numéro de procédure (Afpa)'] || '');
      return numAfpa.startsWith(numeroCourt);
    });

    if (!procedures || procedures.length === 0) {
      console.warn(`Aucune procédure trouvée avec le numéro court ${numeroCourt}`);
      return null;
    }

    // Retourner la première procédure trouvée
    return procedures[0] as ProjectData;
  } catch (err) {
    console.error('Erreur lors de la requête Supabase:', err);
    return null;
  }
}

/**
 * Mappe un champ de la procédure vers le chemin du RC
 */
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc, key) => acc[key], obj);
  target[lastKey] = value;
}

/**
 * Mappe les données de la procédure vers le format RC
 */
export function mapProcedureToRC(
  procedure: ProjectData,
  currentData: RapportCommissionData
): RapportCommissionData {
  const mapped = JSON.parse(JSON.stringify(currentData)) as RapportCommissionData;

  // Mapping automatique
  Object.entries(PROCEDURE_TO_RC_MAPPING).forEach(([procedureKey, rcPath]) => {
    const value = procedure[procedureKey as keyof ProjectData];
    if (value && value !== '') {
      try {
        setNestedValue(mapped, rcPath, value);
      } catch (err) {
        console.warn(`Impossible de mapper ${procedureKey} vers ${rcPath}:`, err);
      }
    }
  });

  // Mappings spécifiques

  // 1. Type de marché → typeMarcheTitle
  const formeMarche = procedure['Forme du marché'];
  if (formeMarche) {
    if (formeMarche.toLowerCase().includes('travaux')) {
      mapped.enTete.typeMarcheTitle = 'MARCHE PUBLIC DE TRAVAUX';
    } else if (formeMarche.toLowerCase().includes('prestations intellectuelles')) {
      mapped.enTete.typeMarcheTitle = 'MARCHE PUBLIC DE PRESTATIONS INTELLECTUELLES';
    } else {
      mapped.enTete.typeMarcheTitle = 'MARCHE PUBLIC DE FOURNITURES ET SERVICES';
    }
  }

  // 2. Type de procédure → modePassation
  const typeProc = procedure['Type de procédure'];
  if (typeProc) {
    if (typeProc.toLowerCase().includes('appel d\'offres ouvert')) {
      mapped.conditions.modePassation = 'Appel d\'offres ouvert';
    } else if (typeProc.toLowerCase().includes('appel d\'offres restreint')) {
      mapped.conditions.modePassation = 'Appel d\'offres restreint';
    } else if (typeProc.toLowerCase().includes('procédure adaptée')) {
      mapped.conditions.modePassation = 'Procédure adaptée';
    } else if (typeProc.toLowerCase().includes('marché négocié')) {
      mapped.conditions.modePassation = 'Marché négocié';
    }
  }

  // 3. Forme du marché → typeMarche.forme
  if (formeMarche) {
    if (formeMarche.toLowerCase().includes('accord-cadre')) {
      if (formeMarche.toLowerCase().includes('multi')) {
        mapped.typeMarche.forme = 'Accord-cadre multi-attributaires';
      } else {
        mapped.typeMarche.forme = 'Accord-cadre mono-attributaire';
      }
    } else if (formeMarche.toLowerCase().includes('bons de commande')) {
      mapped.typeMarche.forme = 'Marché à bons de commande';
    } else {
      mapped.typeMarche.forme = 'Marché ordinaire';
    }
  }

  // 4. Dates : convertir format si nécessaire
  const dateRemise = procedure['Date de remise des offres'] || procedure['Date de remise des offres finales'];
  if (dateRemise) {
    // Convertir au format YYYY-MM-DD si nécessaire
    const date = new Date(dateRemise);
    if (!isNaN(date.getTime())) {
      mapped.enTete.dateLimiteOffres = date.toISOString().split('T')[0];
      
      // Calculer date limite questions (J-10 par défaut)
      const dateQuestions = new Date(date);
      dateQuestions.setDate(dateQuestions.getDate() - 10);
      mapped.enTete.dateLimiteQuestions = dateQuestions.toISOString().split('T')[0];
      
      // Calculer date limite réponses (J-7 par défaut)
      const dateReponses = new Date(date);
      dateReponses.setDate(dateReponses.getDate() - 7);
      mapped.enTete.dateLimiteReponses = dateReponses.toISOString().split('T')[0];
    }
  }

  // 5. Nombre de lots
  const nbLots = procedure['Nombre de lots'];
  if (nbLots) {
    mapped.conditions.nbLots = String(nbLots);
  }

  // 6. CPV
  const cpvPrincipal = procedure['Code CPV Principal'];
  if (cpvPrincipal) {
    mapped.objet.cpvPrincipal = cpvPrincipal;
    // Le libellé CPV devra être saisi manuellement
  }

  // 7. Durée validité offres
  const dureeValidite = procedure['Durée de validité des offres (en jours)'];
  if (dureeValidite) {
    mapped.remise.delaiValiditeOffres = String(dureeValidite);
  }

  // 8. Objet + Nom procédure
  const objetCourt = procedure['Objet court'];
  const nomProc = procedure['Nom de la procédure'];
  if (objetCourt && nomProc && objetCourt !== nomProc) {
    mapped.objet.description = `${objetCourt}\n\n${nomProc}`;
  } else if (nomProc) {
    mapped.objet.description = nomProc;
  } else if (objetCourt) {
    mapped.objet.description = objetCourt;
  }

  // 9. Titre marché (utiliser Nom de la procédure de préférence)
  if (nomProc) {
    mapped.enTete.titreMarche = nomProc;
  } else if (objetCourt) {
    mapped.enTete.titreMarche = objetCourt;
  }

  // 10. Acheteur → Conserver Afpa si pas d'info
  const acheteur = procedure['Acheteur'];
  if (!acheteur || acheteur.toLowerCase().includes('afpa')) {
    // Garder les valeurs par défaut Afpa
  } else {
    mapped.pouvoirAdjudicateur.nom = acheteur;
  }

  return mapped;
}

/**
 * Hook principal : récupère et mappe automatiquement les données
 */
export async function autoFillRCFromProcedure(
  numeroCourt: string,
  currentData: RapportCommissionData
): Promise<{ success: boolean; data?: RapportCommissionData; error?: string; procedureFound?: any }> {
  try {
    console.log(`🔍 Recherche procédure avec numéro court: ${numeroCourt}`);
    const procedure = await fetchProcedureByNumeroCourt(numeroCourt);

    if (!procedure) {
      console.warn(`❌ Aucune procédure trouvée pour ${numeroCourt}`);
      return {
        success: false,
        error: `Aucune procédure trouvée avec le numéro court ${numeroCourt}. Vérifiez que le champ "Numéro de procédure (Afpa)" contient bien ce numéro.`,
      };
    }

    console.log(`✅ Procédure trouvée:`, {
      NumProc: procedure.NumProc,
      'Numéro de procédure (Afpa)': procedure['Numéro de procédure (Afpa)'],
      'Nom de la procédure': procedure['Nom de la procédure'],
    });

    const mappedData = mapProcedureToRC(procedure, currentData);

    return {
      success: true,
      data: mappedData,
      procedureFound: procedure['Numéro de procédure (Afpa)'],
    };
  } catch (err) {
    console.error('❌ Erreur autoFillRCFromProcedure:', err);
    return {
      success: false,
      error: String(err),
    };
  }
}
