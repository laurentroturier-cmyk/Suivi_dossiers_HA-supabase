// ============================================
// Templates CCAP selon le type de marché
// ============================================

import type { CCAPData, CCAPType } from '../types';

export const CCAP_TYPES: Array<{
  value: CCAPType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'travaux',
    label: 'Travaux',
    description: 'CCAP pour les marchés de travaux (construction, rénovation, etc.)',
    icon: '🏗️'
  },
  {
    value: 'tic',
    label: 'TIC',
    description: 'Technologies de l\'Information et de la Communication',
    icon: '💻'
  },
  {
    value: 'mopo',
    label: 'Matériaux et Outillage',
    description: 'Achat de matériaux et d\'outillage',
    icon: '🛠️'
  },
  {
    value: 'prestations_intellectuelles',
    label: 'Prestations intellectuelles',
    description: 'Conseil, études, audit, formation, etc.',
    icon: '🎓'
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    description: 'Maintenance préventive et curative',
    icon: '🔧'
  },
  {
    value: 'services',
    label: 'Services',
    description: 'Services généraux (nettoyage, gardiennage, restauration, etc.)',
    icon: '🛎️'
  }
];

/**
 * Crée un CCAP pré-rempli selon le type de marché
 */
export function createCCAPFromTemplate(type: CCAPType, objet: string = ''): CCAPData {
  const baseTemplate: CCAPData = {
    typeCCAP: type,
    dispositionsGenerales: {
      objet,
      ccagApplicable: '',
      duree: '',
      reconduction: false,
      nbReconductions: '',
    },
    prixPaiement: {
      typePrix: 'forfaitaire',
      revision: false,
      modalitesPaiement: '',
      delaiPaiement: '30 jours',
      avance: false,
      retenuGarantie: false,
    },
    execution: {
      delaiExecution: '',
      penalitesRetard: '',
      conditionsReception: '',
    },
    sections: [],
  };

  // Personnalisation selon le type
  switch (type) {
    case 'travaux':
      return {
        ...baseTemplate,
        dispositionsGenerales: {
          ...baseTemplate.dispositionsGenerales,
          ccagApplicable: 'CCAG Travaux (décret n° 2009-147 du 10 février 2009)',
        },
        prixPaiement: {
          ...baseTemplate.prixPaiement,
          typePrix: 'forfaitaire',
          retenuGarantie: true,
          avance: true,
        },
        execution: {
          ...baseTemplate.execution,
          penalitesRetard: '1/3000 du montant du marché par jour de retard',
          conditionsReception: 'Réception avec ou sans réserves selon PV de réception',
        },
        sections: [
          { titre: 'Sous-traitance', contenu: 'La sous-traitance est autorisée dans les conditions du CCAG Travaux.' },
          { titre: 'Garanties', contenu: 'Garantie de parfait achèvement (1 an), garantie biennale, garantie décennale.' },
          { titre: 'Assurances', contenu: 'Le titulaire doit justifier d\'une assurance responsabilité civile et décennale.' },
        ],
      };

    case 'tic':
      return {
        ...baseTemplate,
        typeCCAP: 'tic',
        dispositionsGenerales: {
          ...baseTemplate.dispositionsGenerales,
          objet: '',
          ccagApplicable: '',
          duree: '',
          reconduction: false,
          nbReconductions: '',
          periodeTransitoire: '',
        },
        prixPaiement: {
          ...baseTemplate.prixPaiement,
          typePrix: '',
          revision: false,
          formuleRevision: '',
          modalitesPaiement: '',
          delaiPaiement: '',
          avance: false,
          retenuGarantie: false,
        },
        execution: {
          ...baseTemplate.execution,
          delaiExecution: '',
          penalitesRetard: '',
          conditionsReception: '',
          lieuxExecution: '',
        },
        sections: [
          { 
            titre: '1. Objet du marché', 
            contenu: 'Le présent marché a pour objet la Tierce-Maintenance Applicative (TMA) comprenant :\n- Maintenance corrective (correction des anomalies)\n- Maintenance évolutive (développement de nouvelles fonctionnalités)\n- Support et assistance aux utilisateurs\n- Documentation technique et fonctionnelle\n- Garantie de continuité de service'
          },
          { 
            titre: '2. Durée et reconduction', 
            contenu: 'Durée initiale : 24 mois à compter de la notification.\nReconduction : Tacite par périodes de 12 mois, dans la limite de 48 mois au total.\nNon-reconduction : Notification 3 mois avant terme, sans indemnité.\nPériode transitoire : 3 mois en début et fin de marché pour transfert de compétences.'
          },
          { 
            titre: '3. Lieux d\'exécution', 
            contenu: 'Prestations réalisées principalement en télétravail/locaux du titulaire, avec obligation d\'une journée hebdomadaire (fixe) dans les locaux du client.\nFrais de mission inclus dans les prix unitaires, sauf déplacements exceptionnels facturés selon barème client annexé.'
          },
          { 
            titre: '4. Prix et révision', 
            contenu: 'Prix forfaitaires et unitaires fermes année 1.\nRévision annuelle à partir de l\'année 2 selon formule SYNTEC.\nSi augmentation > 3%/an, possibilité de négociation.\nBordereau prix révisé transmis 1 mois avant date anniversaire.'
          },
          { 
            titre: '5. Bons de commande', 
            contenu: 'Exécution sur bons de commande générés par système FINA.\nContenu BC : n° contrat, n° BC, nature prestation, période, coût unitaire HT, quantité, taxes, montants HT/TTC.\nAnnulation possible jusqu\'à 7 jours avant début prestation, sans indemnité.\nValidité BC : 3 mois max après échéance marché si notifié avant expiration.'
          },
          { 
            titre: '6. Réception et contrôle', 
            contenu: 'Maintenance corrective : Réception mensuelle lors comité projet.\nMaintenance évolutive : Réception formelle avec PV (définitive, provisoire avec réserves, ou refus).\nDélai validation : 15 jours ouvrés. Absence réponse = acceptation tacite.\nContrôles qualité à tout moment (annoncés ou inopinés).'
          },
          { 
            titre: '7. Facturation et paiement', 
            contenu: 'Dépôt factures dématérialisées obligatoire sur Chorus Pro.\nDélai paiement : 30 jours date réception facture.\nMentions obligatoires : date, nom/adresse, n° marché, n° BC, détail prestations, dates début/fin, prix HT/TTC, TVA, échéance, RIB.\nIntérêts moratoires : Taux BCE + 8 points. Indemnité forfaitaire : 40€.'
          },
          { 
            titre: '8. Propriété intellectuelle', 
            contenu: 'Résultats (codes sources, scripts, bases de données, documentation) : Cession irrévocable, exclusive et définitive au client.\nConnaissances antérieures : Notification écrite obligatoire. Propriété titulaire conservée.\nLogiciels standards : Licence non-exclusive pour durée légale droits auteur.\nDonnées client : Propriété exclusive client, y compris si hébergées par titulaire.'
          },
          { 
            titre: '9. Confidentialité et sécurité', 
            contenu: 'Confidentialité absolue sur documents, informations, données communiqués.\nInterdiction publication sans accord écrit préalable.\nInterdiction accès non autorisé aux fichiers client.\nConformité RGPD : Contrat protection données en annexe.\nSécurité : ISO 27001, garantie absence virus/malwares, protection intrusions.'
          },
          { 
            titre: '10. Réversibilité', 
            contenu: 'Période transitoire 3 mois en fin de marché.\nTransmission connaissances, documentation, codes sources au nouveau titulaire.\nAccompagnement et formation équipes entrantes.\nProlongation exceptionnelle possible (max 5 mois) si retard procédure attribution.\nPas d\'indemnité pour transfert, rémunération prestations effectivement réalisées.'
          },
          { 
            titre: '11. Obligations du titulaire', 
            contenu: 'Obligation de résultat sur : conformité prestations, respect planning/délais, qualité livrables.\nCollaboration active avec tous intervenants projet.\nParticipation instances pilotage et comités.\nTableau de bord prestations actualisé.\nRespect lois : Code travail, sécurité sociale, fiscalité, propriété intellectuelle.\nJustificatifs régularité tous les 6 mois (URSSAF, SIRENE, assurances).'
          },
          { 
            titre: '12. Langue d\'exécution', 
            contenu: 'Langue française obligatoire pour tous échanges (oraux/écrits).\nDocuments en français exclusivement : livrables, CR, rapports, emails, interfaces.\nIntervenants devant s\'exprimer couramment en français.\nRefus possible si taux fautes orthographe/syntaxe excessif (impact pénalités).'
          },
          { 
            titre: '13. Responsabilité et assurances', 
            contenu: 'Titulaire responsable tous dommages (corporels, matériels, immatériels) causés au client, personnel ou tiers.\nAssurance RC obligatoire : compagnie agréée, sans limitation de somme, franchise à charge titulaire.\nAttestation à fournir sous 15 jours notification + chaque date anniversaire.\nInformation modifications assurance sous 48h.'
          },
          { 
            titre: '14. Sous-traitance', 
            contenu: 'Autorisée sous responsabilité titulaire, après acceptation client et agrément conditions paiement.\nInterdiction sous-traitance totale.\nDossier demande : DC4, SIRENE, assurances, agréments, URSSAF, liste salariés étrangers, RIB.\nPaiement direct si ≥ 600€ TTC.\nLimite souhaitée : rang 1.'
          },
          { 
            titre: '15. Pénalités', 
            contenu: 'Pénalités selon indicateurs KPI définis au CCTP :\n- Disponibilité applicative\n- Délais traitement incidents/anomalies\n- Taux résolution\n- Qualité livrables\n- Respect délais évolutions\n\nPénalités déduites facture mois suivant ou du solde. Non libératoires.'
          },
          { 
            titre: '16. Évaluation annuelle', 
            contenu: 'Évaluation performance annuelle par Direction Achats et DSI.\nCritères : conformité livrables, qualité services, fiabilité prix, facturation, respect délais, documents administratifs, relation commerciale.\nEn cas écart significatif : entretien + plan actions correctives.\nNon-atteinte répétée : application mesures contractuelles (pénalités, résiliation).'
          },
          { 
            titre: '17. Engagement responsable (RSE)', 
            contenu: 'Respect conventions fondamentales OIT :\n- Interdiction travail forcé (C29, C105)\n- Interdiction travail enfants (C138, C182)\n- Non-discrimination (C111) : race, couleur, sexe, religion, opinions, origines, handicap, santé, orientations, âge, famille\n\nSanté/sécurité : respect règles sécurité sites, amélioration continue conditions travail.\nEnvironnement : législations protection environnement, maîtrise énergie, recyclage, prévention déchets.\nDémarche amélioration continue : reporting RSE annuel si disponible.'
          },
          { 
            titre: '18. Résiliation', 
            contenu: 'Résiliation possible aux torts titulaire si :\n- Inexactitude documents candidature\n- Refus produire pièces justificatives\n- Non-respect obligations contractuelles\n- Situation interdiction soumissionner (L.2141-1 à L.2141-11 CCP)\n- Manquement grave CJUE\n\nProcédure : Mise en demeure LRAR avec délai. Pas d\'indemnité. Liquidation selon CCAG-TIC art.52.'
          },
          { 
            titre: '19. Litiges', 
            contenu: 'En cas litige : recherche solution amiable pendant 1 mois.\nLitiges ne libèrent pas titulaire de ses obligations d\'exécution.\nCompétence exclusive : Tribunal Administratif de Montreuil.\n7 rue Catherine Puig, 93558 Montreuil Cedex\nTél : 01 49 20 20 00\ngreffe.ta-montreuil@juradm.fr'
          },
          { 
            titre: '20. Dérogations au CCAG-TIC', 
            contenu: 'Article 6 Documents contractuels → déroge art. 4.1 CCAG-TIC\nArticle 10.2 Vérification/Réception → déroge art. 30-34 CCAG-TIC\nArticle 11.2 Règlement → déroge art. 12.1.1 CCAG-TIC\nArticle 16 Pénalités → déroge art. 14 CCAG-TIC'
          },
        ],
      };

    case 'mopo':
      return {
        ...baseTemplate,
        dispositionsGenerales: {
          ...baseTemplate.dispositionsGenerales,
          ccagApplicable: 'CCAG Fournitures Courantes et Services (décret n° 2009-150 du 10 février 2009)',
        },
        prixPaiement: {
          ...baseTemplate.prixPaiement,
          typePrix: 'unitaire',
          avance: false,
          retenuGarantie: false,
        },
        execution: {
          ...baseTemplate.execution,
          penalitesRetard: '1/1000 du montant du marché par jour de retard',
          conditionsReception: 'Réception quantitative et qualitative à la livraison',
        },
        sections: [
          { titre: 'Spécifications techniques', contenu: 'Conformité aux normes et caractéristiques techniques du CCTP' },
          { titre: 'Livraison', contenu: 'Délais et modalités de livraison, emballage et conditionnement' },
          { titre: 'Garanties', contenu: 'Garantie constructeur et conformité aux normes en vigueur' },
          { titre: 'Contrôle qualité', contenu: 'Contrôle quantitatif et qualitatif à la réception' },
        ],
      };

    case 'prestations_intellectuelles':
      return {
        ...baseTemplate,
        dispositionsGenerales: {
          ...baseTemplate.dispositionsGenerales,
          ccagApplicable: 'CCAG-PI (décret n° 2009-149 du 10 février 2009)',
        },
        prixPaiement: {
          ...baseTemplate.prixPaiement,
          typePrix: 'forfaitaire',
        },
        execution: {
          ...baseTemplate.execution,
          conditionsReception: 'Réception sur présentation du rapport final',
        },
        sections: [
          { titre: 'Propriété intellectuelle', contenu: 'Cession des droits de propriété intellectuelle à l\'acheteur' },
          { titre: 'Confidentialité', contenu: 'Obligation de confidentialité pendant et après le marché' },
          { titre: 'Livrables', contenu: 'Définition des livrables attendus (rapports, études, formations...)' },
        ],
      };

    case 'maintenance':
      return {
        ...baseTemplate,
        dispositionsGenerales: {
          ...baseTemplate.dispositionsGenerales,
          ccagApplicable: 'CCAG Fournitures Courantes et Services (décret n° 2009-150 du 10 février 2009)',
          reconduction: true,
          nbReconductions: '3',
        },
        prixPaiement: {
          ...baseTemplate.prixPaiement,
          typePrix: 'forfaitaire',
          revision: true,
        },
        execution: {
          ...baseTemplate.execution,
          penalitesRetard: 'Pénalités selon délai d\'intervention et de résolution',
        },
        sections: [
          { titre: 'Niveaux de service (SLA)', contenu: 'Délai d\'intervention : 4h / Délai de résolution : 24h' },
          { titre: 'Maintenance préventive', contenu: 'Visites périodiques selon planning' },
          { titre: 'Maintenance curative', contenu: 'Intervention sur appel avec astreinte 24/7' },
          { titre: 'Pièces détachées', contenu: 'Stock de pièces détachées garanties' },
        ],
      };

    case 'services':
      return {
        ...baseTemplate,
        dispositionsGenerales: {
          ...baseTemplate.dispositionsGenerales,
          ccagApplicable: 'CCAG Fournitures Courantes et Services (décret n° 2009-150 du 10 février 2009)',
          reconduction: true,
          nbReconductions: '2',
        },
        prixPaiement: {
          ...baseTemplate.prixPaiement,
          typePrix: 'unitaire',
          revision: true,
        },
        sections: [
          { titre: 'Prestations', contenu: 'Description détaillée des prestations attendues' },
          { titre: 'Moyens humains et matériels', contenu: 'Qualification du personnel et équipements requis' },
          { titre: 'Contrôles et audits', contenu: 'Modalités de contrôle de la qualité des prestations' },
        ],
      };

    default:
      return baseTemplate;
  }
}

/**
 * Retourne le libellé d'un type de CCAP
 */
export function getCCAPTypeLabel(type: CCAPType): string {
  const ccapType = CCAP_TYPES.find(t => t.value === type);
  return ccapType ? ccapType.label : type;
}
