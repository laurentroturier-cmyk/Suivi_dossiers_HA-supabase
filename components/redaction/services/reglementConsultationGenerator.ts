import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import type { RapportCommissionData } from '../types/rapportCommission';

export async function generateReglementConsultationWord(data: RapportCommissionData) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // En-tête du document
        ...createHeader(data),
        
        // Chapitre 1 : TERMINOLOGIE
        ...createChapter1Terminologie(),
        
        // Chapitre 2 : PRESENTATION DU POUVOIR ADJUDICATEUR
        ...createChapter2PouvoirAdjudicateur(data),
        
        // Chapitre 3 : OBJET DE LA CONSULTATION
        ...createChapter3Objet(data),
        
        // Chapitre 4 : CONDITIONS DE LA CONSULTATION
        ...createChapter4Conditions(data),
        
        // Chapitre 5 : TYPE DE MARCHE
        ...createChapter5TypeMarche(data),
        
        // Chapitre 6 : CONTENU DU DCE
        ...createChapter6DCE(data),
        
        // Chapitre 7 : CONDITIONS DE REMISE
        ...createChapter7Remise(data),
        
        // Chapitre 8 : JUGEMENT DES OFFRES
        ...createChapter8Jugement(data),
        
        // Chapitre 9 : VALIDITE ATTRIBUTAIRE
        ...createChapter9Validite(),
        
        // Chapitre 10 : NEGOCIATION
        ...createChapter10Negociation(),
        
        // Chapitre 11 : DECLARATION SANS SUITE
        ...createChapter11DeclarationSansSuite(),
        
        // Chapitre 12 : PROCEDURE DE RECOURS
        ...createChapter12Recours(data),
        
        // Signature
        ...createSignature(),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Reglement_Consultation_${data.enTete.numeroMarche || 'draft'}.docx`);
}

function createHeader(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      text: data.enTete.typeMarcheTitle || 'MARCHE PUBLIC DE FOURNITURES ET SERVICES',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: 'REGLEMENT DE CONSULTATION',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    
    ...(data.enTete.numeroProcedure ? [
      new Paragraph({
        children: [
          new TextRun({ text: 'Procédure n° ', size: 22 }),
          new TextRun({ text: data.enTete.numeroProcedure, bold: true, size: 24 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ] : [
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ]),
    
    new Paragraph({
      children: [
        new TextRun({ text: data.enTete.titreMarche || '', bold: true, size: 24 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: data.enTete.numeroMarche || '',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    new Paragraph({ text: '', spacing: { after: 400 } }),
  ];
}

function createChapter1Terminologie(): Paragraph[] {
  return [
    // Titre avec fond turquoise
    new Paragraph({
      text: '1  TERMINOLOGIE',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      shading: {
        fill: '5DBDB4', // Turquoise/vert comme sur la photo
      },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Acheteur : ', bold: true }),
        new TextRun({ text: 'Désigne l\'Afpa, acheteur agissant en tant que pouvoir adjudicateur' }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter2PouvoirAdjudicateur(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      text: '2  PRESENTATION DU POUVOIR ADJUDICATEUR',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
    }),
    
    new Paragraph({
      text: "L'Agence Nationale pour la Formation Professionnelle des Adultes (ci-après Afpa) est un établissement public à caractère industriel et commercial (EPIC) d'Etat, créé le 1er janvier 2017 par l'Ordonnance n°2016-1519 du 10 novembre 2016 portant création au sein du service public de l'emploi de l'établissement public chargé de la formation professionnelle, ratifiée par la loi n°2017-204 du 21 février 2017, qui s'est substituée à l'Ancienne « Association nationale pour la formation professionnelle des adultes » qui avait été créée le 11 janvier 1949.",
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: "L'Afpa a depuis lors pour principales missions et spécialités définies au Code du Travail (articles L5315-1 à L5315-10) :",
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De participer à la formation et à la qualification des personnes les plus éloignées de l'emploi et à leur insertion professionnelle",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De contribuer à la politique de certification du ministère de l'Emploi",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De contribuer à l'égal accès des hommes et femmes à la formation professionnelle, de contribuer à la mixité des métiers",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De contribuer à l'égal accès sur tout le territoire aux services de l'emploi et de la formation professionnelle",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De contribuer à l'émergence et à l'organisation de nouveaux métiers et de nouvelles compétences, notamment par le développement d'une ingénierie de formation adaptée aux besoins ;",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De contribuer à la politique de certification de l'Etat exercée par d'autres ministres que celui chargé de l'emploi.",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "De participer à la formation des personnes en recherche d'emploi et à la formation des personnes en situation d'emploi par l'intermédiaire de ses filiales, les Sociétés par actions simplifiées et à actionnaire unique, respectivement à ce jour « Afpa Accès à l'Emploi », et « Afpa Entreprises ».",
      bullet: { level: 0 },
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: "A ces fins, le groupe Afpa se caractérise par un maillage territorial complet, proches des milieux professionnels, des collectivités territoriales, et des organismes déconcentrés de l'Etat, avec pour chacune des trois entités du groupe :",
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "Un Siège, situé à Montreuil ;",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "13 Directions régionales, une par Région administrative ;",
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: "126 sites, rattachés aux Directions régionales comportant pour certains des plateaux techniques, des services d'hébergement et des services de restauration pour les personnes formées.",
      bullet: { level: 0 },
      spacing: { after: 200 },
    }),
  ];
}

function createChapter3Objet(data: RapportCommissionData): Paragraph[] {
  const obj = data.objet;
  
  return [
    new Paragraph({
      text: '3. OBJET DE LA CONSULTATION',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: '3.1 Objet de la consultation',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: obj.description || '',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '3.2 Nomenclature',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'CPV principal : ', bold: true }),
        new TextRun({ text: `${obj.cpvPrincipal || ''} - ${obj.cpvPrincipalLib || ''}` }),
      ],
      spacing: { after: 100 },
    }),
    
    ...(obj.cpvSecondaires && obj.cpvSecondaires.length > 0 ? [
      new Paragraph({
        children: [new TextRun({ text: 'CPV secondaires :', bold: true })],
        spacing: { before: 100, after: 50 },
      }),
      ...obj.cpvSecondaires.map((cpv: any) => 
        new Paragraph({
          text: `- ${cpv.code} - ${cpv.libelle}`,
          spacing: { after: 50 },
        })
      ),
    ] : []),
  ];
}

function createChapter4Conditions(data: RapportCommissionData): Paragraph[] {
  const cond = data.conditions;
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: '4. CONDITIONS DE LA CONSULTATION',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: '4.1 Mode de passation',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: `Le marché est passé selon la procédure d'${cond.modePassation || 'appel d\'offres ouvert'} conformément au Code de la commande publique.`,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '4.2 Décomposition en lots',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: `Le marché est décomposé en ${cond.nbLots || ''} lot(s).`,
      spacing: { after: 100 },
    }),
  ];

  if (cond.lots && cond.lots.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Détail des lots :', bold: true })],
        spacing: { before: 100, after: 50 },
      })
    );
    
    cond.lots.forEach((lot: any) => {
      paragraphs.push(
        new Paragraph({
          text: `Lot n°${lot.numero} : ${lot.intitule}${lot.montantMax ? ` - Montant maximum : ${lot.montantMax} € HT` : ''}`,
          spacing: { after: 50 },
        })
      );
    });
  }

  paragraphs.push(
    new Paragraph({
      text: '4.3 Variantes',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: cond.variantesAutorisees ? 'Les variantes sont autorisées.' : 'Les variantes ne sont pas autorisées.',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '4.4 Conditions de participation - Groupement d\'opérateurs économiques',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: `Les groupements ${cond.groupementSolidaire ? 'solidaires' : ''} ${cond.groupementSolidaire && cond.groupementConjoint ? 'et' : ''} ${cond.groupementConjoint ? 'conjoints' : ''} sont autorisés.`,
      spacing: { after: 200 },
    })
  );

  return paragraphs;
}

function createChapter5TypeMarche(data: RapportCommissionData): Paragraph[] {
  const tm = data.typeMarche;
  
  return [
    new Paragraph({
      text: '5. TYPE DE MARCHE',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: '5.1 Type et forme du marché',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: `Il s'agit d'un ${tm.forme || 'accord-cadre'}.`,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '5.2 Durée du marché',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: `Le marché est conclu pour une durée de ${tm.dureeInitiale || '12'} mois à compter de sa notification.`,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: `Il est reconductible ${tm.nbReconductions || '3'} fois par périodes de ${tm.dureeReconduction || '12'} mois, soit une durée maximale de ${tm.dureeMax || '48'} mois.`,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '5.3 Sous-traitance',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: tm.sousTraitanceTotaleInterdite 
        ? 'La sous-traitance totale est interdite.' 
        : 'La sous-traitance est autorisée dans les conditions fixées au CCAP.',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '5.4 Lieu d\'exécution',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: tm.lieuExecution || 'À préciser',
      spacing: { after: 200 },
    }),
  ];
}

function createChapter6DCE(data: RapportCommissionData): Paragraph[] {
  const dce = data.dce;
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: '6. CONTENU DU DOSSIER DE CONSULTATION DES ENTREPRISES',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: '6.1 Liste des documents du DCE',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: 'Le dossier de consultation comprend les documents suivants :',
      spacing: { after: 100 },
    }),
  ];

  if (dce.documents && dce.documents.length > 0) {
    dce.documents.forEach((doc: string) => {
      paragraphs.push(
        new Paragraph({
          text: `- ${doc}`,
          spacing: { after: 50 },
        })
      );
    });
  }

  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: `Les CCAG applicables sont consultables à l'adresse : ${dce.urlCCAG || 'https://www.economie.gouv.fr/daj/cahiers-clauses-administratives-generales-et-techniques#CCAG'}`,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '6.2 Renseignements complémentaires',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: 'Les candidats peuvent poser des questions par écrit via la plateforme de dématérialisation jusqu\'à la date limite indiquée en page de garde.',
      spacing: { after: 200 },
    })
  );

  return paragraphs;
}

function createChapter7Remise(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      text: '7. CONDITIONS DE REMISE DES CANDIDATURES ET DES OFFRES',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: '7.1 Documents à produire',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: 'Les documents de candidature et d\'offre sont précisés dans le règlement de la consultation et doivent être transmis via le profil d\'acheteur.',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '7.2 Format des documents à remettre',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: 'Les documents doivent être remis sous format électronique (PDF de préférence).',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '7.3 Délai de validité des offres',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: `Les offres devront rester valables pendant une durée de ${data.remise.delaiValiditeOffres || '150'} jours à compter de la date limite de réception des offres.`,
      spacing: { after: 200 },
    }),
  ];
}

function createChapter8Jugement(data: RapportCommissionData): Paragraph[] {
  const jug = data.jugement;
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: '8. SELECTION DES CANDIDATURES ET JUGEMENT DES OFFRES',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: '8.1 Sélection des candidatures',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: 'Les candidatures seront examinées selon les critères de capacité technique et financière définis au CCAP.',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: '8.2 Jugement des offres',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      text: 'L\'offre économiquement la plus avantageuse sera retenue sur la base des critères pondérés suivants :',
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: `- Critère Financier : ${jug.critereFinancier || '60'} %`,
      spacing: { after: 50 },
    }),
    
    new Paragraph({
      text: `- Critère Technique : ${jug.critereTechnique || '40'} %`,
      spacing: { after: 100 },
    }),
  ];

  if (jug.sousCriteresTechniques && jug.sousCriteresTechniques.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Le critère technique se décompose en :', bold: true })],
        spacing: { before: 100, after: 50 },
      })
    );
    
    jug.sousCriteresTechniques.forEach((sc: any) => {
      paragraphs.push(
        new Paragraph({
          text: `- ${sc.nom} : ${sc.points} points`,
          spacing: { after: 50 },
        })
      );
    });
  }

  return paragraphs;
}

function createChapter9Validite(): Paragraph[] {
  return [
    new Paragraph({
      text: '9. CONDITION DE VALIDITE DE L\'ATTRIBUTAIRE PRESSENTI',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: 'Après l\'analyse des offres, le candidat dont l\'offre a été retenue sera invité à produire les pièces complémentaires nécessaires à la signature du marché, conformément au Code de la commande publique.',
      spacing: { after: 200 },
    }),
  ];
}

function createChapter10Negociation(): Paragraph[] {
  return [
    new Paragraph({
      text: '10. NEGOCIATION',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      text: 'Le pouvoir adjudicateur se réserve le droit de négocier avec les candidats dans les conditions prévues par le Code de la commande publique.',
      spacing: { after: 200 },
    }),
  ];
}

function createChapter11DeclarationSansSuite(): Paragraph[] {
  return [
    new Paragraph({
      text: '11  DECLARATION SANS SUITE',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
    }),
    
    new Paragraph({
      text: "L'AFPA pourra décider de ne pas donner suite à la présente consultation pour un motif d'intérêt général. Dans l'hypothèse où l'AFPA déciderait de la déclarer sans suite, les candidats ne pourront prétendre à aucune indemnité.",
      spacing: { after: 200 },
    }),
  ];
}

function createChapter12Recours(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      text: '12  PROCEDURE DE RECOURS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
    }),
    
    new Paragraph({
      text: 'En cas de litige, seul le Tribunal administratif de Montreuil est compétent :',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      text: 'Tribunal Administratif de Montreuil',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: '7, rue Catherine Puig',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: '93 100 Montreuil',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: 'Téléphone : 01 49 20 20 00 - Télécopie : 01 49 20 20 99',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Courriel : ' }),
        new TextRun({ 
          text: 'greffe.ta-montreuil@juradm.fr', 
          color: 'FF6600',
          underline: { type: UnderlineType.SINGLE }
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: 'SIRET : 130 006 869 00015',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Référé précontractuel : ', bold: true }),
        new TextRun({ text: "conformément à l'article L. 551-1 et aux articles R. 551-1 à R. 551-6 du Code de Justice Administrative, tout opérateur économique ayant intérêt à conclure le contrat peut introduire un référé précontractuel contre tout acte de la passation jusqu'à la date de signature du marché, auprès du Tribunal Administratif compétent." }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Référé contractuel : ', bold: true }),
        new TextRun({ text: "conformément à l'article L. 551-13 et aux articles R. 551-7 à R. 551-7 à R. 551-10 du Code de Justice Administrative, tout opérateur économique ayant intérêt à conclure le contrat peut introduire un référé contractuel contre tout acte de la passation, dans un délai de 31 jours à compter de la publication de l'avis d'attribution ou à défaut d'un tel avis dans un délai de six (6) mois à compter de la conclusion du marché devant le Tribunal Administratif compétent." }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Recours pour excès de pouvoir : ', bold: true }),
        new TextRun({ text: "conformément aux articles R. 421-1  et R. 421-2 du Code de Justice Administrative, tout opérateur économique ayant un intérêt à agir, dispose d'un délai de deux mois pour exercer un recours contentieux au tribunal administratif compétent, à compter de la décision lui faisant grief. Il peut assortir son recours d'un référé suspension conformément à l'article L. 521-1 du Code de Justice Administrative." }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Recours de plein contentieux : ', bold: true }),
        new TextRun({ text: "prévu à l'article R. 421-3 du code de justice administrative et pouvant être exercé dans un délai de deux mois contre les décisions de rejet." }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

function createSignature(): Paragraph[] {
  return [
    new Paragraph({
      text: '',
      spacing: { before: 600 },
    }),
    
    new Paragraph({
      text: 'Fait à Montreuil-sous-Bois,',
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      text: 'Le ........................',
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Le Pouvoir Adjudicateur', bold: true })],
      spacing: { after: 400 },
    }),
  ];
}
