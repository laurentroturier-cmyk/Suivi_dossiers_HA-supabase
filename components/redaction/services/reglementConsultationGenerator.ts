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
      children: [
        new TextRun({ 
          text: data.enTete.typeMarcheTitle || 'MARCHE PUBLIC DE FOURNITURES ET SERVICES',
          bold: true,
          font: 'Rockwell',
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: 'RÈGLEMENT DE CONSULTATION',
          bold: true,
          font: 'Rockwell',
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    
    ...(data.enTete.numeroProcedure ? [
      new Paragraph({
        children: [
          new TextRun({ text: 'Procédure n° ', font: 'Aptos', size: 22 }),
          new TextRun({ text: data.enTete.numeroProcedure, bold: true, font: 'Aptos', size: 22 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    ] : []),
    
    new Paragraph({
      children: [
        new TextRun({ text: data.enTete.titreMarche || '', bold: true, font: 'Aptos', size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    ...(data.enTete.numeroMarche ? [
      new Paragraph({
        children: [
          new TextRun({ text: 'N° de marché : ', font: 'Aptos', size: 22 }),
          new TextRun({ text: data.enTete.numeroMarche, font: 'Aptos', size: 22 }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 },
      }),
    ] : []),
    
    ...(data.enTete.dateLimiteOffres ? [
      new Paragraph({
        children: [
          new TextRun({ text: 'Date limite de réception des offres : ', font: 'Aptos', size: 22 }),
          new TextRun({ text: data.enTete.dateLimiteOffres, font: 'Aptos', size: 22 }),
          ...(data.enTete.heureLimiteOffres ? [
            new TextRun({ text: ' à ', font: 'Aptos', size: 22 }),
            new TextRun({ text: data.enTete.heureLimiteOffres, font: 'Aptos', size: 22 }),
          ] : []),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 400 },
      }),
    ] : []),
  ];
}

function createChapter1Terminologie(): Paragraph[] {
  return [
    // Titre avec fond turquoise
    new Paragraph({
      children: [new TextRun({ text: '1  TERMINOLOGIE', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: {
        fill: '5DBDB4', // Turquoise/vert comme sur la photo
      },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Acheteur : ', bold: true, font: 'Aptos', size: 22 }),
        new TextRun({ text: 'Désigne l\'Afpa, acheteur agissant en tant que pouvoir adjudicateur', font: 'Aptos', size: 22 }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter2PouvoirAdjudicateur(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: '2  PRESENTATION DU POUVOIR ADJUDICATEUR', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "L'Agence Nationale pour la Formation Professionnelle des Adultes (ci-après Afpa) est un établissement public à caractère industriel et commercial (EPIC) d'Etat, créé le 1er janvier 2017 par l'Ordonnance n°2016-1519 du 10 novembre 2016 portant création au sein du service public de l'emploi de l'établissement public chargé de la formation professionnelle, ratifiée par la loi n°2017-204 du 21 février 2017, qui s'est substituée à l'Ancienne « Association nationale pour la formation professionnelle des adultes » qui avait été créée le 11 janvier 1949.", font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "L'Afpa a depuis lors pour principales missions et spécialités définies au Code du Travail (articles L5315-1 à L5315-10) :", font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De participer à la formation et à la qualification des personnes les plus éloignées de l'emploi et à leur insertion professionnelle", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à la politique de certification du ministère de l'Emploi", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à l'égal accès des hommes et femmes à la formation professionnelle, de contribuer à la mixité des métiers", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à l'égal accès sur tout le territoire aux services de l'emploi et de la formation professionnelle", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à l'émergence et à l'organisation de nouveaux métiers et de nouvelles compétences, notamment par le développement d'une ingénierie de formation adaptée aux besoins ;", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à la politique de certification de l'Etat exercée par d'autres ministres que celui chargé de l'emploi.", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "De participer à la formation des personnes en recherche d'emploi et à la formation des personnes en situation d'emploi par l'intermédiaire de ses filiales, les Sociétés par actions simplifiées et à actionnaire unique, respectivement à ce jour « Afpa Accès à l'Emploi », et « Afpa Entreprises ».", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "A ces fins, le groupe Afpa se caractérise par un maillage territorial complet, proches des milieux professionnels, des collectivités territoriales, et des organismes déconcentrés de l'Etat, avec pour chacune des trois entités du groupe :", font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "Un Siège, situé à Montreuil ;", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "13 Directions régionales, une par Région administrative ;", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "126 sites, rattachés aux Directions régionales comportant pour certains des plateaux techniques, des services d'hébergement et des services de restauration pour les personnes formées.", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 200 },
    }),
  ];
}

function createChapter3Objet(data: RapportCommissionData): Paragraph[] {
  const obj = data.objet;
  
  return [
    new Paragraph({
      children: [new TextRun({ text: '3  OBJET DE LA CONSULTATION', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
      alignment: AlignmentType.LEFT,
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '3.1 Objet de la consultation', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: obj.description || '', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '3.2 Nomenclature', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'CPV principal : ', bold: true, font: 'Aptos', size: 22 }),
        new TextRun({ text: `${obj.cpvPrincipal || ''} - ${obj.cpvPrincipalLib || ''}`, font: 'Aptos', size: 22 }),
      ],
      spacing: { after: 100 },
    }),
    
    ...(obj.cpvSecondaires && obj.cpvSecondaires.length > 0 ? [
      new Paragraph({
        children: [new TextRun({ text: 'CPV secondaires :', bold: true, font: 'Aptos', size: 22 })],
        spacing: { before: 100, after: 50 },
      }),
      ...obj.cpvSecondaires.map((cpv: any) => 
        new Paragraph({
          children: [new TextRun({ text: `- ${cpv.code} - ${cpv.libelle}`, font: 'Aptos', size: 22 })],
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
      children: [new TextRun({ text: '4  CONDITIONS DE LA CONSULTATION', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
      alignment: AlignmentType.LEFT,
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '4.1 Mode de passation', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Le marché est passé selon la procédure d'${cond.modePassation || 'appel d\'offres ouvert'} conformément au Code de la commande publique.`, font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '4.2 Décomposition en lots', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Le marché est décomposé en ${cond.nbLots || ''} lot(s).`, font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
  ];

  if (cond.lots && cond.lots.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Détail des lots :', bold: true, font: 'Aptos', size: 22 })],
        spacing: { before: 100, after: 50 },
      })
    );
    
    cond.lots.forEach((lot: any) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `Lot n°${lot.numero} : ${lot.intitule}${lot.montantMax ? ` - Montant maximum : ${lot.montantMax} € HT` : ''}`, font: 'Aptos', size: 22 })],
          spacing: { after: 50 },
        })
      );
    });
  }

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '4.3 Variantes', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: cond.variantesAutorisees ? 'Les variantes sont autorisées.' : 'Les variantes ne sont pas autorisées.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '4.4 Conditions de participation - Groupement d\'opérateurs économiques', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Les groupements ${cond.groupementSolidaire ? 'solidaires' : ''} ${cond.groupementSolidaire && cond.groupementConjoint ? 'et' : ''} ${cond.groupementConjoint ? 'conjoints' : ''} sont autorisés.`, font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    })
  );

  return paragraphs;
}

function createChapter5TypeMarche(data: RapportCommissionData): Paragraph[] {
  const tm = data.typeMarche;
  
  return [
    new Paragraph({
      children: [new TextRun({ text: '5  TYPE DE MARCHE', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
      alignment: AlignmentType.LEFT,
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '5.1 Type et forme du marché', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Il s'agit d'un ${tm.forme || 'accord-cadre'}.`, font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '5.2 Durée du marché', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Le marché est conclu pour une durée de ${tm.dureeInitiale || '12'} mois à compter de sa notification.`, font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Il est reconductible ${tm.nbReconductions || '3'} fois par périodes de ${tm.dureeReconduction || '12'} mois, soit une durée maximale de ${tm.dureeMax || '48'} mois.`, font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '5.3 Sous-traitance', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: tm.sousTraitanceTotaleInterdite 
        ? 'La sous-traitance totale est interdite.' 
        : 'La sous-traitance est autorisée dans les conditions fixées au CCAP.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '5.4 Lieu d\'exécution', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: tm.lieuExecution || 'À préciser', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter6DCE(data: RapportCommissionData): Paragraph[] {
  const dce = data.dce;
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: '6  CONTENU DU DOSSIER DE CONSULTATION DES ENTREPRISES', font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '6.1 Liste des documents du DCE', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Le dossier de consultation comprend les documents suivants :', font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
  ];

  if (dce.documents && dce.documents.length > 0) {
    dce.documents.forEach((doc: string) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `- ${doc}`, font: 'Aptos', size: 22 })],
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
      children: [new TextRun({ text: `Les CCAG applicables sont consultables à l'adresse : ${dce.urlCCAG || 'https://www.economie.gouv.fr/daj/cahiers-clauses-administratives-generales-et-techniques#CCAG'}`, font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '6.2 Renseignements complémentaires', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Les candidats peuvent poser des questions par écrit via la plateforme de dématérialisation jusqu\'\u00e0 la date limite indiquée en page de garde.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    })
  );

  return paragraphs;
}

function createChapter7Remise(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: '7  CONDITIONS DE REMISE DES CANDIDATURES ET DES OFFRES', font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '7.1 Documents à produire', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Les documents de candidature et d\'offre sont précisés dans le règlement de la consultation et doivent être transmis via le profil d\'acheteur.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '7.2 Format des documents à remettre', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Les documents doivent être remis sous format électronique (PDF de préférence).', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '7.3 Délai de validité des offres', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `Les offres devront rester valables pendant une durée de ${data.remise.delaiValiditeOffres || '150'} jours à compter de la date limite de réception des offres.`, font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter8Jugement(data: RapportCommissionData): Paragraph[] {
  const jug = data.jugement;
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: '8  SELECTION DES CANDIDATURES ET JUGEMENT DES OFFRES', font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '8.1 Sélection des candidatures', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Les candidatures seront examinées selon les critères de capacité technique et financière définis au CCAP.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '8.2 Jugement des offres', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'L\'offre économiquement la plus avantageuse sera retenue sur la base des critères pondérés suivants :', font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `- Critère Financier : ${jug.critereFinancier || '60'} %`, font: 'Aptos', size: 22 })],
      spacing: { after: 50 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: `- Critère Technique : ${jug.critereTechnique || '40'} %`, font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
  ];

  if (jug.sousCriteresTechniques && jug.sousCriteresTechniques.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Le critère technique se décompose en :', bold: true, font: 'Aptos', size: 22 })],
        spacing: { before: 100, after: 50 },
      })
    );
    
    jug.sousCriteresTechniques.forEach((sc: any) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `- ${sc.nom} : ${sc.points} points`, font: 'Aptos', size: 22 })],
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
      children: [new TextRun({ text: '9  CONDITION DE VALIDITE DE L\'ATTRIBUTAIRE PRESSENTI', font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Après l\'analyse des offres, le candidat dont l\'offre a été retenue sera invité à produire les pièces complémentaires nécessaires à la signature du marché, conformément au Code de la commande publique.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter10Negociation(): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: '10  NEGOCIATION', font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Le pouvoir adjudicateur se réserve le droit de négocier avec les candidats dans les conditions prévues par le Code de la commande publique.', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter11DeclarationSansSuite(): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: '11  DECLARATION SANS SUITE', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "L'AFPA pourra décider de ne pas donner suite à la présente consultation pour un motif d'intérêt général. Dans l'hypothèse où l'AFPA déciderait de la déclarer sans suite, les candidats ne pourront prétendre à aucune indemnité.", font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
  ];
}

function createChapter12Recours(data: RapportCommissionData): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: '12  PROCEDURE DE RECOURS', font: 'Rockwell', size: 32, bold: true })],
      spacing: { before: 400, after: 200 },
      shading: { fill: '5DBDB4' },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'En cas de litige, seul le Tribunal administratif de Montreuil est compétent :', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Tribunal Administratif de Montreuil', font: 'Aptos', size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '7, rue Catherine Puig', font: 'Aptos', size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '93 100 Montreuil', font: 'Aptos', size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Téléphone : 01 49 20 20 00 - Télécopie : 01 49 20 20 99', font: 'Aptos', size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Courriel : ', font: 'Aptos', size: 22 }),
        new TextRun({ 
          text: 'greffe.ta-montreuil@juradm.fr', 
          font: 'Aptos',
          size: 22,
          color: 'FF6600',
          underline: { type: UnderlineType.SINGLE }
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'SIRET : 130 006 869 00015', font: 'Aptos', size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Référé précontractuel : ', bold: true, font: 'Aptos', size: 22 }),
        new TextRun({ text: "conformément à l'article L. 551-1 et aux articles R. 551-1 à R. 551-6 du Code de Justice Administrative, tout opérateur économique ayant intérêt à conclure le contrat peut introduire un référé précontractuel contre tout acte de la passation jusqu'à la date de signature du marché, auprès du Tribunal Administratif compétent.", font: 'Aptos', size: 22 }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Référé contractuel : ', bold: true, font: 'Aptos', size: 22 }),
        new TextRun({ text: "conformément à l'article L. 551-13 et aux articles R. 551-7 à R. 551-7 à R. 551-10 du Code de Justice Administrative, tout opérateur économique ayant intérêt à conclure le contrat peut introduire un référé contractuel contre tout acte de la passation, dans un délai de 31 jours à compter de la publication de l'avis d'attribution ou à défaut d'un tel avis dans un délai de six (6) mois à compter de la conclusion du marché devant le Tribunal Administratif compétent.", font: 'Aptos', size: 22 }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Recours pour excès de pouvoir : ', bold: true, font: 'Aptos', size: 22 }),
        new TextRun({ text: "conformément aux articles R. 421-1  et R. 421-2 du Code de Justice Administrative, tout opérateur économique ayant un intérêt à agir, dispose d'un délai de deux mois pour exercer un recours contentieux au tribunal administratif compétent, à compter de la décision lui faisant grief. Il peut assortir son recours d'un référé suspension conformément à l'article L. 521-1 du Code de Justice Administrative.", font: 'Aptos', size: 22 }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Recours de plein contentieux : ', bold: true, font: 'Aptos', size: 22 }),
        new TextRun({ text: "prévu à l'article R. 421-3 du code de justice administrative et pouvant être exercé dans un délai de deux mois contre les décisions de rejet.", font: 'Aptos', size: 22 }),
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
      children: [new TextRun({ text: 'Fait à Montreuil-sous-Bois,', font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Le ........................', font: 'Aptos', size: 22 })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Le Pouvoir Adjudicateur', bold: true, font: 'Aptos', size: 22 })],
      spacing: { after: 400 },
    }),
  ];
}
