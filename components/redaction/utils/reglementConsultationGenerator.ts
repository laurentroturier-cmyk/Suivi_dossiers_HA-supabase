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
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  VerticalAlign,
  BorderStyle,
  WidthType
} from 'docx';
import { saveAs } from 'file-saver';
import type { RapportCommissionData } from '../types';

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

    // Bloc AVERTISSEMENT (fond vert clair)
    new Paragraph({
      children: [
        new TextRun({ text: 'AVERTISSEMENT', bold: true, font: 'Aptos', size: 28 }),
      ],
      alignment: AlignmentType.CENTER,
      shading: { fill: 'EAF6DE' },
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "En application du code de la commande publique la candidature et l’offre du candidat n’ont plus à être signées au stade du dépôt de l’offre.",
          font: 'Aptos',
          size: 22,
        })
      ],
      shading: { fill: 'EAF6DE' },
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Le dépôt de l’offre engage le candidat sur la sincérité des documents, la véracité et la complétude des informations.",
          font: 'Aptos',
          size: 22,
        })
      ],
      shading: { fill: 'EAF6DE' },
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "L’offre déposée engage toutes les sociétés qui y sont désignées, à savoir le candidat, ses éventuels cotraitants et ses (leurs) éventuels sous-traitants.",
          font: 'Aptos',
          size: 22,
        })
      ],
      shading: { fill: 'EAF6DE' },
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "L’offre est de ce fait réputée avoir eu l’aval d’une personne habilitée à engager la ou les sociétés candidates, laquelle personne sera amenée en cas d’attribution à signer les éléments constitutifs de l’offre.",
          font: 'Aptos',
          size: 22,
        })
      ],
      shading: { fill: 'EAF6DE' },
      spacing: { after: 200 },
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

    // Bloc institutionnel Afpa
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
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à la politique de certification du ministère de l'Emploi", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à l'égal accès des hommes et femmes à la formation professionnelle, de contribuer à la mixité des métiers", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à l'égal accès sur tout le territoire aux services de l'emploi et de la formation professionnelle", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à l'émergence et à l'organisation de nouveaux métiers et de nouvelles compétences, notamment par le développement d'une ingénierie de formation adaptée aux besoins ;", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "De contribuer à la politique de certification de l'Etat exercée par d'autres ministres que celui chargé de l'emploi.", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "De participer à la formation des personnes en recherche d'emploi et à la formation des personnes en situation d'emploi par l'intermédiaire de ses filiales, les Sociétés par actions simplifiées et à actionnaire unique, respectivement à ce jour « Afpa Accès à l'Emploi », et « Afpa Entreprises ».", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "A ces fins, le groupe Afpa se caractérise par un maillage territorial complet, proches des milieux professionnels, des collectivités territoriales, et des organismes déconcentrés de l'Etat, avec pour chacune des trois entités du groupe :", font: 'Aptos', size: 22 })],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Un Siège, situé à Montreuil ;", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "13 Directions régionales, une par Région administrative ;", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "126 sites, rattachés aux Directions régionales", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 100 },
    }),

    // 2.1 Nom et adresse
    new Paragraph({
      children: [new TextRun({ text: '2.1 Nom et adresse', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Agence nationale pour la formation professionnelle des adultes (Afpa)", font: 'Aptos', size: 22 })],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "36-38 rue Léon Morane, 93200 Saint-Denis", font: 'Aptos', size: 22 })],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "SIRET : 130 006 869 00015", font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),

    // 2.2 Communication
    new Paragraph({
      children: [new TextRun({ text: '2.2 Communication', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Les documents du marché sont disponibles gratuitement en accès direct non restreint et complet, à l'adresse : ", font: 'Aptos', size: 22 }),
        new TextRun({ text: 'http://afpa.e-marchespublics.com', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } })
      ],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Adresse à laquelle des informations complémentaires peuvent être obtenues : ", font: 'Aptos', size: 22 }),
        new TextRun({ text: 'http://afpa.e-marchespublics.com', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } })
      ],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Les offres ou les demandes de participation doivent être envoyées par voie électronique via : ", font: 'Aptos', size: 22 }),
        new TextRun({ text: 'http://afpa.e-marchespublics.com', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } })
      ],
      spacing: { after: 100 },
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
      children: [new TextRun({ text: "Les candidats sont tenus d’indiquer dans l’acte d’engagement, la nature et le montant des prestations qu’ils envisagent de faire exécuter par des sous-traitants, ainsi que le nom de ces sous-traitants, afin de les présenter à l’acceptation et à l’agrément de l’Afpa.", font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "La sous-traitance de la totalité de l’accord-cadre est interdite.", font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Le candidat devra pour cela se conformer notamment aux dispositions des articles R.2193-1 à R.2193-22 du Code de la commande publique relatifs à la sous-traitance dans les marchés publics.", font: 'Aptos', size: 22 })],
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
    // Encart AVERTISSEMENT
    new Paragraph({
      children: [new TextRun({ text: 'AVERTISSEMENT', bold: true, font: 'Aptos', size: 28 })],
      shading: { fill: 'EAF6E0' },
      border: { top: { color: '000000', space: 1, size: 8, style: 'single' }, bottom: { color: '000000', space: 1, size: 8, style: 'single' }, left: { color: '000000', space: 1, size: 8, style: 'single' }, right: { color: '000000', space: 1, size: 8, style: 'single' } },
      spacing: { before: 200, after: 100 },
      alignment: 'center',
    }),
    new Paragraph({
      children: [new TextRun({ text: "Il est de la responsabilité du candidat de s’assurer de la compatibilité de ses outils informatiques, avec la plateforme de dématérialisation.", font: 'Aptos', size: 22 })],
      shading: { fill: 'EAF6E0' },
      border: { top: { color: '000000', space: 1, size: 8, style: 'single' }, bottom: { color: '000000', space: 1, size: 8, style: 'single' }, left: { color: '000000', space: 1, size: 8, style: 'single' }, right: { color: '000000', space: 1, size: 8, style: 'single' } },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "L'attention du candidat est attirée sur la durée d'acheminement des plis électroniques volumineux.", font: 'Aptos', size: 22 })],
      shading: { fill: 'EAF6E0' },
      border: { top: { color: '000000', space: 1, size: 8, style: 'single' }, bottom: { color: '000000', space: 1, size: 8, style: 'single' }, left: { color: '000000', space: 1, size: 8, style: 'single' }, right: { color: '000000', space: 1, size: 8, style: 'single' } },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Il appartient à chaque candidat de tenir compte de la durée du téléchargement qui est fonction du débit d’accès internet dont il dispose et de la taille des documents qu’il transmet.", font: 'Aptos', size: 22 })],
      shading: { fill: 'EAF6E0' },
      border: { top: { color: '000000', space: 1, size: 8, style: 'single' }, bottom: { color: '000000', space: 1, size: 8, style: 'single' }, left: { color: '000000', space: 1, size: 8, style: 'single' }, right: { color: '000000', space: 1, size: 8, style: 'single' } },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Seules la date et l’heure de la fin d’acheminement font foi pour déterminer le caractère recevable ou hors délai d’une offre transmise par voie dématérialisée. Ainsi les offres qui seraient réceptionnées par le serveur après l’heure limite (même si le début de la transmission a été effectué avant cette heure) ne seront pas examinées et seront considérées comme « hors délai ».", font: 'Aptos', size: 22 })],
      shading: { fill: 'EAF6E0' },
      border: { top: { color: '000000', space: 1, size: 8, style: 'single' }, bottom: { color: '000000', space: 1, size: 8, style: 'single' }, left: { color: '000000', space: 1, size: 8, style: 'single' }, right: { color: '000000', space: 1, size: 8, style: 'single' } },
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "En cas d’envois successifs, seule sera retenue la dernière réponse déposée avant la date limite de remise des plis.", font: 'Aptos', size: 22 })],
      shading: { fill: 'EAF6E0' },
      border: { top: { color: '000000', space: 1, size: 8, style: 'single' }, bottom: { color: '000000', space: 1, size: 8, style: 'single' }, left: { color: '000000', space: 1, size: 8, style: 'single' }, right: { color: '000000', space: 1, size: 8, style: 'single' } },
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [new TextRun({ text: '7  CONDITIONS DE REMISE DES CANDIDATURES ET DES OFFRES', font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: 'Chaque candidat produit un dossier complet comprenant les pièces suivantes :', font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),

    new Paragraph({
      children: [new TextRun({ text: 'D’une part, les documents relatifs à la candidature, conformément à l’article R.2143-3 du Code de la commande publique, à savoir :', font: 'Aptos', size: 22 })],
      spacing: { after: 50 },
    }),

    // 1- Présentation du candidat et de la candidature
    new Paragraph({
      children: [new TextRun({ text: '1- Présentation du candidat et de la candidature', font: 'Aptos', size: 22, bold: true })],
      spacing: { after: 30 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'soit :', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Le Document Unique de Marché Européen (DUME),', font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Le formulaire DUME peut être rempli en ligne, sur l’un des sites suivants :', font: 'Aptos', size: 22 })
      ],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'https://ec.europa.eu/tools/espd/filter?lang=fr', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } })],
      bullet: { level: 1 },
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'https://dume.chorus-pro.gouv.fr/#/accueil/operateur-economique', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } })],
      bullet: { level: 1 },
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'soit :', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Les formulaires DC1 et DC2 disponibles à l’adresse suivante', font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'http://www.economie.gouv.fr/daj/formulaires-declaration-du-candidat', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } })],
      bullet: { level: 1 },
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '1) Imprimé DC1 (version 2019) : La lettre de candidature précisant les éventuels co-traitants ou contenu identique sur papier libre', font: 'Aptos', size: 22 })],
      bullet: { level: 2 },
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Le candidat devra indiquer une adresse mail valide sur laquelle pourront éventuellement être envoyés les échanges électroniques.', font: 'Aptos', size: 22 })],
      bullet: { level: 2 },
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '2) Imprimé DC2 (version 2023) : la déclaration du candidat comprenant les renseignements permettant d’évaluer ses capacités professionnelles, techniques et financières du candidat.', font: 'Aptos', size: 22 })],
      bullet: { level: 2 },
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Une déclaration sur l’honneur certifiant :', font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'N’entrer dans aucun des cas d’interdiction de soumissionner obligatoires prévus aux articles L.2141-1 à L.2141-6 du Code de la commande publique', font: 'Aptos', size: 22 })],
      bullet: { level: 1 },
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Etre en règle au regard des articles L. 5212-1 à L. 5212-11 du code du travail concernant l’emploi des travailleurs handicapés.', font: 'Aptos', size: 22 })],
      bullet: { level: 1 },
      spacing: { after: 10 },
    }),

    // 2- Numéro INSEE ou équivalent
    new Paragraph({
      children: [new TextRun({ text: '2- Le numéro INSEE ou à défaut un extrait de l’inscription au registre du commerce et des sociétés (K ou K bis) ou à la chambre des métiers (D1) ou un document équivalent pour les candidats non établis en France (datant de moins de 6 mois).', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),

    // 3- Pouvoir
    new Paragraph({
      children: [new TextRun({ text: '3- Pouvoir : documents relatifs aux pouvoirs de la personne habilitée pour engager l’entreprise candidate (tel que Kbis, ou délégation de pouvoir si cette personne n’apparait pas au Kbis).', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),

    // 4- Attestation d’assurance
    new Paragraph({
      children: [new TextRun({ text: '4- Attestation d’assurance : une attestation d’assurance en responsabilité civile professionnelle signée, mentionnant :', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'la période de validité,', font: 'Aptos', size: 22 })],
      bullet: { level: 1 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'la nature des activités garanties,', font: 'Aptos', size: 22 })],
      bullet: { level: 1 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'le nom de la compagnie et le n° de contrat,', font: 'Aptos', size: 22 })],
      bullet: { level: 1 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'les plafonds éventuels de responsabilité.', font: 'Aptos', size: 22 })],
      bullet: { level: 1 },
      spacing: { after: 10 },
    }),

    new Paragraph({
      children: [new TextRun({ text: 'Le dossier de candidature devra alors fournir toutes les informations nécessaires à la consultation sur le système électronique ou l’espace de stockage numérique.', font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
    }),

    // Remarques sur la candidature
    new Paragraph({
      children: [new TextRun({ text: 'Remarques sur la candidature :', font: 'Aptos', size: 22, bold: true })],
      spacing: { after: 10 },
    }),
    // A
    new Paragraph({
      children: [new TextRun({ text: "A. Dans l’hypothèse où le candidat ou l’un des membres du groupement est admis à la procédure de redressement judiciaire, son attention est attirée sur le fait qu’il lui sera demandé de prouver qu’il a été habilité à poursuivre ses activités pendant la durée prévisible d’exécution du marché public.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    // B
    new Paragraph({
      children: [new TextRun({ text: "B. En cas de groupement d'entreprises, chacun des membres du groupement devra remettre un dossier de candidature complet (dont un formulaire DC2 par cotraitant ou DUME) et renseignements attestant de ses capacités juridiques, professionnelles, techniques et financières. L'appréciation des capacités du groupement est globale ; un seul formulaire DC1 sera remis lors de la candidature et sera rempli par tous les cotraitants. Les conditions de paiement relatives au paiement en groupement sont décrites au Cahier des Clauses Administratives Particulières du marché.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    // C
    new Paragraph({
      children: [new TextRun({ text: "C. En application des articles R.2143-13 et R.2143-14 du Code de la commande publique, les entreprises ne seront pas tenues de produire les documents relatifs à la candidature, en cours de validité, s’ils sont laissés gratuitement à la disposition du pouvoir adjudicateur par le biais d’un système électronique administré par un organisme officiel ou d’un espace de stockage. Le dossier de candidature devra alors fournir toutes les informations nécessaires à la consultation sur le système électronique ou l’espace de stockage numérique. Les candidats ont la possibilité d’anticiper la transmission des moyens de preuves demandés au § 9 infra. La transmission est fortement recommandée par l’Afpa afin d’accélérer la procédure de passation.", font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
    }),

    new Paragraph({
      children: [new TextRun({ text: 'D’autre part, les documents relatifs à l’offre, à savoir :', font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),

    // ... (le reste du chapitre 7)
    new Paragraph({
      children: [new TextRun({ text: '7.2 Format des documents à remettre', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Les réponses à la consultation devront impérativement être déposées en version dématérialisée, sur le site internet Dematis à l’adresse ', font: 'Aptos', size: 22 }),
        new TextRun({ text: 'http://afpa.e-marchespublics.com', font: 'Aptos', size: 22, color: 'FF6600', underline: { type: 'single' } }),
        new TextRun({ text: '.', font: 'Aptos', size: 22 })
      ],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'En cas de difficulté, vous pouvez contacter le support du site Dematis, accessible gratuitement via le bouton vert « Contacter le support » disponible en bas à droite de l’écran (jusqu’à 17h30) ou par téléphone au 01 72 36 55 48.', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'L’offre doit être déposée sur la page de réponse de la plate-forme afpa.e-marchespublics, spécifique à une consultation dans l’espace qui lui est réservé.', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Les documents seront fournis dans l\'un des formats suivants :', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Bureautique (Word, Excel, Powerpoint, etc.) : norme Office Open XML (2008) à savoir avec les suffixes .docx, .xlsx, .pptx, etc.', font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'PDF : norme ISO 3200-1 (2008)', font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Pour chaque document, le candidat veillera à limiter à 30 caractères maximum le nom du fichier et ne pas utiliser de caractères spéciaux («, *, :, <, >, ?, /, \, |, #, et %).', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'NOTA : Le Bordereau de Prix Unitaires, le Détail Quantitatif Estimatif (DQE) ainsi que le Questionnaire Technique doivent être déposés également en format Excel.', font: 'Aptos', size: 22, italics: true })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Les candidats remettront leur offre impérativement avant le JJ MM 20XX – XX h 00.', font: 'Aptos', size: 22, bold: true })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Un message leur indiquant que l’opération de dépôt de l’offre a été réalisée avec succès leur est transmis, puis un accusé de réception leur est adressé par courriel validant leur dépôt à la date et l’heure d’arrivée de la transmission. Il est rappelé que la durée du téléchargement est fonction du débit de l’accès à Internet du soumissionnaire et de la taille des documents à transmettre.', font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
    }),

    new Paragraph({
      children: [new TextRun({ text: '7.3 Langue et devise', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Tous les documents constituant ou accompagnant l’offre doivent être rédigés en français, ou traduits en français s’ils émanent d’une autorité étrangère.', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Les indications monétaires présentes dans les candidatures et les offres seront établies en Euros.', font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
    }),

    new Paragraph({
      children: [new TextRun({ text: '7.4 Copie de Sauvegarde', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Conformément aux dispositions de l'article 2132-11 du code de la commande publique, le candidat peut, s'il le souhaite, adresser parallèlement une copie de sauvegarde à l’Afpa. Reprenant strictement les mêmes éléments que le dossier principal, la-dite copie doit impérativement être faite sur support physique électronique (Clé USB) ou, le cas échéant, sur support papier.", font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Elle doit parvenir dans les délais impartis pour la réception des plis et être placée dans un pli scellé comportant l\'objet de la consultation et la mention lisible : « copie de sauvegarde » ainsi que la référence du pli déposé sur la plate-forme « http://www.afpa.e-marchespublics.com/ ».', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Cette copie de sauvegarde doit être placée dans un pli scellé comportant la mention lisible :', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '« AAXXX_XX_XXX-XXX_XXX / COPIE DE SAUVEGARDE - NE PAS OUVRIR »', font: 'Aptos', size: 22, bold: true })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'et être envoyée par tout moyen permettant de donner date certaine à sa réception ou déposée contre récépissé (du lundi au vendredi de 9h30 à 12h00 et de 14h00 à 17h00) à l’adresse suivante :', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Accueil Afpa', font: 'Aptos', size: 22, bold: true }),
      ],
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Direction Nationale des Achats', font: 'Aptos', size: 22 })],
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Tour Cityscope', font: 'Aptos', size: 22 })],
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '3 rue Franklin', font: 'Aptos', size: 22 })],
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '93100 MONTREUIL', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Pour le dépôt sur place, le prestataire (ou coursier) devra se présenter à l'accueil de la tour Cityscope afin d'obtenir un badge qui lui sera remis contre une pièce d'identité permettant d’accéder à l’Accueil de l’Afpa du 14ème étage de la tour, ce service étant le seul habilité à attester de l’heure de réception.", font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Rappel : une copie de sauvegarde ne pourra être ouverte que si l’offre transmise sur le profil acheteur est altérée ou corrompue. Elle ne pourra se substituer à une offre incomplète, ou transmise en retard.', font: 'Aptos', size: 22, italics: true })],
      spacing: { after: 20 },
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
      children: [new TextRun({ text: '8.1 Examen des candidatures', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Avant de procéder à l'examen des candidatures, s'il apparaît que des pièces du dossier de candidature sont manquantes ou incomplètes, le Pouvoir Adjudicateur peut décider de demander à tous les candidats concernés de produire ou compléter ces pièces dans un délai maximum de cinq (5) jours.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Les candidatures conformes et recevables seront examinées à partir des seuls renseignements et documents exigés dans le cadre de cette consultation, pour évaluer leur situation juridique ainsi que leurs capacités professionnelles, techniques et financières.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "La sélection des candidatures sera effectuée dans les conditions prévues aux articles R.2144-1 à R2144-7 du Code de la commande publique.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Les critères de sélection des candidatures sont :', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Dossier administratif complet', font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Adéquation des capacités économiques, financières, techniques et professionnelles avec l'objet du marché", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: '8.2 Jugement des offres', bold: true, font: 'Aptos', size: 28 })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'La méthode de notation financière utilisée est celle recommandée par le Ministère de l’Economie et des Finances : la formule linéaire GRAMP. Cette dernière attribue la note maximale au candidat le moins disant ; les notes des autres candidats sont proportionnées à la note du candidat de rang 1 rapportées à la pondération maximale de la valeur financière.', font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Concernant les prix, en cas de discordance constatée dans une offre, les montants portés dans le Bordereau des prix par le candidat prévaudront sur toutes autres indications de l’offre et le montant du détail quantitatif estimatif sera recalculé en conséquence.', font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Le jugement des offres sera effectué dans les conditions prévues aux articles R.2152-1 et suivants du code de la commande publique et donnera lieu à un classement des offres.', font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "L'attention des candidats est attirée sur le fait que toute offre irrégulière pourra faire l'objet d'une demande de régularisation, à condition qu'elle ne soit pas anormalement basse. En revanche, toute offre inacceptable ou inappropriée sera éliminée.", font: 'Aptos', size: 22 })],
      spacing: { after: 5 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Le jugement des offres sera effectué dans le respect des principes fondamentaux de la commande publique et donnera lieu à un classement en fonction de la pondération suivante :', font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'L\'offre économiquement la plus avantageuse sera retenue sur la base des critères pondérés suivants :', font: 'Aptos', size: 22 })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "L’échelle de notation utilisée pour chaque question est la suivante :", font: 'Aptos', size: 22 })],
      spacing: { after: 30 },
    }),
    // Tableau d'échelle de notation
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Notations des questions', bold: true, font: 'Aptos', size: 22 })] })],
              shading: { fill: 'EAF6E0' },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Définitions', bold: true, font: 'Aptos', size: 22 })] })],
              shading: { fill: 'EAF6E0' },
              verticalAlign: VerticalAlign.CENTER,
              columnSpan: 2,
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Pondération rapportée à la valeur de la question', bold: true, font: 'Aptos', size: 22 })] })],
              shading: { fill: 'EAF6E0' },
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '0', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '0- Ne répond pas', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Pas de réponse', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '0', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1- Très insuffisant', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Répond de manière très insuffisante à la question et/ou au besoin exprimé', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '0.25', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '2', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '2- Moyen', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Répond moyennement à la question et/ou au besoin exprimé', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '0.5', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3- bon et adapté', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Apporte une réponse bonne et adaptée à la question et/ou au besoin exprimé', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '0.75', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '4', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '4- Au-delà du besoin', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Apporte une réponse au-delà de la demande et/ou au besoin exprimé', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1', font: 'Aptos', size: 22 })] })], verticalAlign: VerticalAlign.CENTER }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
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
      children: [new TextRun({ text: "9  CONDITION DE VALIDITÉ DE L'ATTRIBUTAIRE PRESSENTI", font: 'Rockwell', size: 32, bold: true })],
      shading: { fill: '5DBDB4' },
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "En application de l’article R.2144-4 du Code de la commande publique, le marché est définitivement attribué au candidat retenu sous réserve que celui-ci produise, dans les dix (10) jours suivants la notification d’attribution, les documents détaillés ci-dessous :", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Une déclaration sur l’honneur attestant que le candidat ne se trouve pas dans un cas d’interdiction de soumissionner mentionné au 1° de l’article R2143-3 du Code de la commande publique,", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Les certificats sociaux  suivants : attestation URSSAF/AGEFIPH  ou RSI, versement régulier des cotisations  de congés payés et de chômage intempéries,", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Les certificats fiscaux suivants : impôt sur le revenu, impôt sur les sociétés, impôt sur la valeur ajoutée,", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Le cas échéant, en cas de redressement judiciaire la copie du ou des jugements prononcés,", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 2 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Le cas échéant, les pièces prévues aux articles R. 1263-12, D. 8222-5 ou D. 8222-7 ou D. 8254-2 à D. 8254-5 du code du travail sur le travail dissimulé.", font: 'Aptos', size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Bien que les documents précités ne soient exigibles qu’auprès de l’attributaire du marché public, il est fortement conseillé aux candidats de se doter de ces documents dès qu’ils soumissionnent à un marché public.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "En cas de cotraitance ou sous-traitance, ces éléments seront à fournir par chaque cotraitant et sous-traitant.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Le non-respect de ces formalités relatives aux attestions et certificats dans un délai maximum de dix (10) jours à compter de la demande du pouvoir adjudicateur entraîne le rejet de l’offre. La même demande est alors faite au candidat suivant dans le classement des offres.", font: 'Aptos', size: 22 })],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Pour rappel, le candidat retenu est informé que les documents mentionnés aux articles D. 8222-5 ou D. 8222-7 ou D. 8254-2 à D. 8254-5 du code du travail, seront à remettre à l’acheteur tous les 6 mois jusqu’à la fin de l’exécution de son marché, ainsi qu’une attestation d’assurance responsabilité civile en cours de validité (chaque année).", font: 'Aptos', size: 22 })],
      spacing: { after: 20 },
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
