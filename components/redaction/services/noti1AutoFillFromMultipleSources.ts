import { supabase } from '../../../lib/supabase';
import type { Noti1Data } from '../types/noti1';
import type { EntrepriseDepot } from '../../../types/depots';
import type { EntrepriseRetrait } from '../../../types/retraits';

/**
 * Cherche les coordonnées complètes de l'entreprise dans TOUTES les sources disponibles :
 * 1. Table procédures (colonnes depots/retraits JSONB)
 * 2. Table ouverture_plis (colonne candidats JSONB)
 * 3. Table rapports_presentation (fichiers_sources.depots/retraits)
 */
export async function enrichNoti1FromAllSources(
  numeroCourt: string,
  noti1Data: Noti1Data
): Promise<Noti1Data> {
  const enriched = JSON.parse(JSON.stringify(noti1Data)) as Noti1Data;

  const nomEntreprise = enriched.titulaire.denomination?.trim();
  if (!nomEntreprise) {
    console.log('[NOTI1-MultiSources] ⚠️ Pas de nom d\'entreprise à rechercher');
    console.log('[NOTI1-MultiSources] Données titulaire actuelles:', enriched.titulaire);
    return enriched;
  }

  console.log(`\n🔍 [NOTI1-MultiSources] === RECHERCHE COORDONNÉES ===`);
  console.log(`📋 Entreprise: "${nomEntreprise}"`);
  console.log(`🔢 Procédure: ${numeroCourt}`);
  console.log(`📊 État actuel du titulaire:`, {
    denomination: enriched.titulaire.denomination,
    siret: enriched.titulaire.siret,
    adresse: enriched.titulaire.adresse1,
    ville: enriched.titulaire.ville,
    email: enriched.titulaire.email,
  });

  // SOURCE 1 : Table procédures (colonnes depots/retraits en JSONB)
  const coordFromProcedures = await fetchCoordonneesFromProceduresTable(numeroCourt, nomEntreprise);
  if (coordFromProcedures) {
    console.log(`✅ [Source 1] Trouvé dans table procédures`);
    return mergeCoordonneesIntoNoti1(enriched, coordFromProcedures);
  }

  // SOURCE 2 : Table ouverture_plis (candidats JSONB)
  const coordFromOuverturePlis = await fetchCoordonneesFromOuverturePlis(numeroCourt, nomEntreprise);
  if (coordFromOuverturePlis) {
    console.log(`✅ [Source 2] Trouvé dans table ouverture_plis`);
    return mergeCoordonneesIntoNoti1(enriched, coordFromOuverturePlis);
  }

  // SOURCE 3 : Table rapports_presentation déjà gérée par noti1EnrichFromRegistres
  console.log(`ℹ️  [NOTI1-MultiSources] Coordonnées non trouvées dans les tables directes`);
  console.log(`   → La recherche continuera dans rapports_presentation.fichiers_sources\n`);

  return enriched;
}

/**
 * SOURCE 1 : Cherche dans la table procédures (colonnes depots/retraits)
 */
async function fetchCoordonneesFromProceduresTable(
  numeroCourt: string,
  nomEntreprise: string
): Promise<EntrepriseCoordonnees | null> {
  try {
    console.log(`📊 [Source 1] Recherche dans table procédures...`);

    const { data: allProcedures, error } = await supabase
      .from('procédures')
      .select('depots, retraits, "numero court procédure afpa"');

    if (error) {
      console.error('[Source 1] ❌ Erreur Supabase:', error);
      return null;
    }

    if (!allProcedures || allProcedures.length === 0) {
      console.log('[Source 1] ⚠️ Aucune procédure trouvée dans la table');
      return null;
    }

    console.log(`[Source 1] 📋 ${allProcedures.length} procédures trouvées dans la table`);

    // Filtrer pour trouver la procédure avec le bon numéro
    const procedure = allProcedures.find(p => {
      const numProc = String(p['numero court procédure afpa'] || '');
      const match = numProc === numeroCourt || numProc.includes(numeroCourt);
      if (match) {
        console.log(`[Source 1] ✓ Match trouvé: "${numProc}" correspond à "${numeroCourt}"`);
      }
      return match;
    });

    if (!procedure) {
      console.log(`[Source 1] ⚠️ Procédure ${numeroCourt} non trouvée dans les ${allProcedures.length} résultats`);
      console.log(`[Source 1] Numéros disponibles:`, allProcedures.slice(0, 5).map(p => p['numero court procédure afpa']));
      return null;
    }

    // Chercher d'abord dans les dépôts
    console.log(`[Source 1] 🔍 Analyse de la procédure pour dépôts...`);
    if (procedure.depots) {
      console.log(`[Source 1] Colonne 'depots' présente, type:`, typeof procedure.depots);
      const depots = typeof procedure.depots === 'string'
        ? JSON.parse(procedure.depots)
        : procedure.depots;

      const entreprises = depots?.entreprises || [];
      console.log(`[Source 1] ${entreprises.length} entreprises dans depots`);
      if (entreprises.length > 0) {
        console.log(`[Source 1] Première entreprise:`, entreprises[0]);
      }

      const entreprise = findEntrepriseByName(entreprises, nomEntreprise);

      if (entreprise) {
        console.log(`[Source 1] ✅ Trouvé dans depots:`, entreprise);
        return {
          siret: entreprise.siret || '',
          adresse: entreprise.adresse || '',
          codePostal: entreprise.cp || '',
          ville: entreprise.ville || '',
          telephone: entreprise.telephone || '',
          fax: entreprise.fax || '',
          email: entreprise.email || '',
        };
      }
    } else {
      console.log(`[Source 1] ⚠️ Colonne 'depots' absente ou null`);
    }

    // Puis dans les retraits
    console.log(`[Source 1] 🔍 Analyse de la procédure pour retraits...`);
    if (procedure.retraits) {
      console.log(`[Source 1] Colonne 'retraits' présente, type:`, typeof procedure.retraits);
      const retraits = typeof procedure.retraits === 'string'
        ? JSON.parse(procedure.retraits)
        : procedure.retraits;

      const entreprises = retraits?.entreprises || [];
      console.log(`[Source 1] ${entreprises.length} entreprises dans retraits`);
      if (entreprises.length > 0) {
        console.log(`[Source 1] Première entreprise:`, entreprises[0]);
      }

      const entreprise = findEntrepriseByName(entreprises, nomEntreprise);

      if (entreprise) {
        console.log(`[Source 1] ✅ Trouvé dans retraits:`, entreprise);
        return {
          siret: entreprise.siret || '',
          adresse: entreprise.adresse || '',
          codePostal: entreprise.cp || '',
          ville: entreprise.ville || '',
          telephone: entreprise.telephone || '',
          fax: entreprise.fax || '',
          email: entreprise.email || '',
        };
      }
    } else {
      console.log(`[Source 1] ⚠️ Colonne 'retraits' absente ou null`);
    }

    console.log(`[Source 1] ❌ Entreprise "${nomEntreprise}" non trouvée dans depots/retraits`);
    return null;
  } catch (err) {
    console.error('[Source 1] Erreur:', err);
    return null;
  }
}

/**
 * SOURCE 2 : Cherche dans la table ouverture_plis (candidats JSONB)
 */
async function fetchCoordonneesFromOuverturePlis(
  numeroCourt: string,
  nomEntreprise: string
): Promise<EntrepriseCoordonnees | null> {
  try {
    console.log(`📊 [Source 2] Recherche dans table ouverture_plis...`);

    const { data: plis, error } = await supabase
      .from('ouverture_plis')
      .select('candidats, num_proc')
      .eq('num_proc', numeroCourt);

    if (error) {
      console.error('[Source 2] ❌ Erreur Supabase:', error);
      return null;
    }

    if (!plis || plis.length === 0) {
      console.log(`[Source 2] ⚠️ Aucune ouverture de plis pour ${numeroCourt}`);
      return null;
    }

    console.log(`[Source 2] 📋 ${plis.length} enregistrement(s) trouvé(s)`);

    // Prendre le plus récent (premier résultat)
    const pli = plis[0];
    const candidats = Array.isArray(pli.candidats) ? pli.candidats : [];

    console.log(`[Source 2] ${candidats.length} candidats dans l'ouverture de plis`);
    if (candidats.length > 0) {
      console.log(`[Source 2] Premier candidat:`, candidats[0]);
    }

    const candidat = findEntrepriseByName(candidats, nomEntreprise);

    if (candidat) {
      console.log(`[Source 2] ✅ Trouvé dans candidats:`, candidat);
      return {
        siret: candidat.siret || '',
        adresse: candidat.adresse || '',
        codePostal: candidat.codePostal || candidat.cp || '',
        ville: candidat.ville || '',
        telephone: candidat.telephone || '',
        fax: candidat.fax || '',
        email: candidat.email || '',
      };
    }

    console.log(`[Source 2] ❌ Entreprise "${nomEntreprise}" non trouvée dans les ${candidats.length} candidats`);
    return null;
  } catch (err) {
    console.error('[Source 2] Erreur:', err);
    return null;
  }
}

/**
 * Cherche une entreprise par nom dans un tableau (matching flexible)
 */
function findEntrepriseByName(
  entreprises: any[],
  nomRecherche: string
): any | null {
  const nomNormalise = normalizeEntrepriseName(nomRecherche);
  console.log(`   🔍 Recherche: "${nomRecherche}" → normalisé: "${nomNormalise}"`);

  for (const entreprise of entreprises) {
    const nomEntreprise = entreprise.societe || entreprise.denomination || '';
    const nomEntrepriseNormalise = normalizeEntrepriseName(nomEntreprise);

    console.log(`   📝 Comparaison avec: "${nomEntreprise}" → normalisé: "${nomEntrepriseNormalise}"`);

    // Match exact
    if (nomNormalise === nomEntrepriseNormalise) {
      console.log(`   ✅ Match exact trouvé!`);
      return entreprise;
    }

    // Match partiel
    if (
      nomNormalise.includes(nomEntrepriseNormalise) ||
      nomEntrepriseNormalise.includes(nomNormalise)
    ) {
      console.log(`   ✅ Match partiel trouvé: "${nomEntreprise}"`);
      return entreprise;
    }
  }

  console.log(`   ❌ Aucun match trouvé dans les ${entreprises.length} entreprises`);
  return null;
}

/**
 * Normalise un nom d'entreprise pour la comparaison
 */
function normalizeEntrepriseName(nom: string): string {
  if (!nom) return '';

  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Garde seulement lettres, chiffres et espaces
    .replace(/\s+/g, ' ') // Espaces multiples → un seul espace
    .trim();
}

/**
 * Fusionne les coordonnées trouvées dans le NOTI1
 */
function mergeCoordonneesIntoNoti1(
  noti1Data: Noti1Data,
  coordonnees: EntrepriseCoordonnees
): Noti1Data {
  const merged = { ...noti1Data };

  merged.titulaire = {
    ...merged.titulaire,
    siret: coordonnees.siret || merged.titulaire.siret || '',
    adresse1: coordonnees.adresse || merged.titulaire.adresse1 || '',
    codePostal: coordonnees.codePostal || merged.titulaire.codePostal || '',
    ville: coordonnees.ville || merged.titulaire.ville || '',
    telephone: coordonnees.telephone || merged.titulaire.telephone || '',
    fax: coordonnees.fax || merged.titulaire.fax || '',
    email: coordonnees.email || merged.titulaire.email || '',
  };

  console.log(`✅ [Merge] Coordonnées fusionnées:`, {
    siret: merged.titulaire.siret,
    adresse: merged.titulaire.adresse1,
    ville: merged.titulaire.ville,
    email: merged.titulaire.email,
  });

  return merged;
}

/**
 * Interface pour les coordonnées d'entreprise
 */
interface EntrepriseCoordonnees {
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  fax: string;
  email: string;
}
