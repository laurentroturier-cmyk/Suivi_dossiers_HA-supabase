import type { Noti1Data } from '../types';
import type { EntrepriseDepot } from '../../../types/depots';
import type { EntrepriseRetrait } from '../../../types/retraits';

/**
 * Enrichit les données NOTI1 avec les coordonnées complètes de l'entreprise
 * en cherchant dans les registres de retraits et dépôts stockés dans le rapport de présentation
 */
export function enrichNoti1WithEntrepriseCoordonnees(
  noti1Data: Noti1Data,
  rapportData: any
): Noti1Data {
  const enriched = JSON.parse(JSON.stringify(noti1Data)) as Noti1Data;

  // Si pas de nom d'entreprise, on ne peut rien faire
  const nomEntreprise = enriched.titulaire.denomination?.trim();
  if (!nomEntreprise) {
    console.log('[NOTI1-Registres] Pas de nom d\'entreprise à enrichir');
    return enriched;
  }

  console.log(`[NOTI1-Registres] Recherche des coordonnées pour: "${nomEntreprise}"`);

  // Récupérer les données des fichiers sources
  const fichiersSources = rapportData?.fichiers_sources;
  if (!fichiersSources) {
    console.log('[NOTI1-Registres] Pas de fichiers_sources dans le rapport');
    return enriched;
  }

  // 1. Chercher dans le registre des DÉPÔTS (priorité car plus récent)
  const depotsData = fichiersSources.depots || fichiersSources.depotsParsed;
  if (depotsData?.entreprises) {
    const entrepriseDepot = findEntrepriseInDepots(
      nomEntreprise,
      depotsData.entreprises
    );

    if (entrepriseDepot) {
      console.log(`✅ [NOTI1-Registres] Entreprise trouvée dans registre des dépôts`);
      enriched.titulaire.adresse1 = entrepriseDepot.adresse || '';
      enriched.titulaire.codePostal = entrepriseDepot.cp || '';
      enriched.titulaire.ville = entrepriseDepot.ville || '';
      enriched.titulaire.telephone = entrepriseDepot.telephone || '';
      enriched.titulaire.fax = entrepriseDepot.fax || '';
      enriched.titulaire.email = entrepriseDepot.email || '';
      // Le registre des dépôts ne contient pas le SIRET

      console.log('[NOTI1-Registres] Coordonnées enrichies depuis dépôts:', {
        adresse: enriched.titulaire.adresse1,
        ville: enriched.titulaire.ville,
        email: enriched.titulaire.email,
      });

      return enriched;
    }
  }

  // 2. Chercher dans le registre des RETRAITS (si pas trouvé dans dépôts)
  const retraitsData = fichiersSources.retraits || fichiersSources.retraitsParsed;
  if (retraitsData?.entreprises) {
    const entrepriseRetrait = findEntrepriseInRetraits(
      nomEntreprise,
      retraitsData.entreprises
    );

    if (entrepriseRetrait) {
      console.log(`✅ [NOTI1-Registres] Entreprise trouvée dans registre des retraits`);
      enriched.titulaire.siret = entrepriseRetrait.siret || '';
      enriched.titulaire.adresse1 = entrepriseRetrait.adresse || '';
      enriched.titulaire.codePostal = entrepriseRetrait.cp || '';
      enriched.titulaire.ville = entrepriseRetrait.ville || '';
      enriched.titulaire.telephone = entrepriseRetrait.telephone || '';
      enriched.titulaire.fax = entrepriseRetrait.fax || '';
      enriched.titulaire.email = entrepriseRetrait.email || '';

      console.log('[NOTI1-Registres] Coordonnées enrichies depuis retraits:', {
        siret: enriched.titulaire.siret,
        adresse: enriched.titulaire.adresse1,
        ville: enriched.titulaire.ville,
        email: enriched.titulaire.email,
      });

      return enriched;
    }
  }

  console.log(`ℹ️ [NOTI1-Registres] Entreprise "${nomEntreprise}" non trouvée dans les registres`);
  return enriched;
}

/**
 * Cherche une entreprise dans le registre des dépôts par nom
 * (matching flexible : ignore casse, espaces, accents)
 */
function findEntrepriseInDepots(
  nomRecherche: string,
  entreprises: EntrepriseDepot[]
): EntrepriseDepot | null {
  const nomNormalise = normalizeEntrepriseName(nomRecherche);

  for (const entreprise of entreprises) {
    const nomEntrepriseNormalise = normalizeEntrepriseName(entreprise.societe);

    if (nomNormalise === nomEntrepriseNormalise) {
      return entreprise;
    }

    // Match partiel : le nom recherché contient le nom de l'entreprise ou vice-versa
    if (
      nomNormalise.includes(nomEntrepriseNormalise) ||
      nomEntrepriseNormalise.includes(nomNormalise)
    ) {
      console.log(`  → Match partiel trouvé: "${entreprise.societe}"`);
      return entreprise;
    }
  }

  return null;
}

/**
 * Cherche une entreprise dans le registre des retraits par nom
 */
function findEntrepriseInRetraits(
  nomRecherche: string,
  entreprises: EntrepriseRetrait[]
): EntrepriseRetrait | null {
  const nomNormalise = normalizeEntrepriseName(nomRecherche);

  for (const entreprise of entreprises) {
    const nomEntrepriseNormalise = normalizeEntrepriseName(entreprise.societe);

    if (nomNormalise === nomEntrepriseNormalise) {
      return entreprise;
    }

    // Match partiel
    if (
      nomNormalise.includes(nomEntrepriseNormalise) ||
      nomEntrepriseNormalise.includes(nomNormalise)
    ) {
      console.log(`  → Match partiel trouvé: "${entreprise.societe}"`);
      return entreprise;
    }
  }

  return null;
}

/**
 * Normalise un nom d'entreprise pour la comparaison
 * - Supprime espaces multiples, ponctuation
 * - Convertit en minuscules
 * - Supprime les accents
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
