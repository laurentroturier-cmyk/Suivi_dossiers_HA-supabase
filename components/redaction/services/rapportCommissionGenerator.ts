import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  BorderStyle,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import type { RapportCommissionData } from '../types/rapportCommission';

export async function generateRapportCommissionWord(data: RapportCommissionData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79),
            right: convertInchesToTwip(0.79),
            bottom: convertInchesToTwip(0.79),
            left: convertInchesToTwip(0.79),
          },
        },
      },
      children: [
        // En-tête du document
        new Paragraph({
          text: "RÈGLEMENT DE CONSULTATION",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        new Paragraph({
          text: "",
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // 1. IDENTIFICATION DU MARCHÉ
        createChapterHeading("1. IDENTIFICATION DU MARCHÉ"),
        
        ...(data.identification.numProcedure ? [
          createLabelValue("N° de procédure", data.identification.numProcedure),
        ] : []),
        
        ...(data.identification.objet ? [
          createLabelValue("Objet du marché", data.identification.objet),
        ] : []),
        
        ...(data.identification.typeMarche ? [
          createLabelValue("Type de marché", data.identification.typeMarche),
        ] : []),
        
        ...(data.identification.modePassation ? [
          createLabelValue("Mode de passation", data.identification.modePassation),
        ] : []),
        
        ...(data.identification.montantEstime ? [
          createLabelValue("Montant estimé", `${data.identification.montantEstime} € HT`),
        ] : []),
        
        ...(data.identification.codeCPV ? [
          createLabelValue("Code CPV", data.identification.codeCPV),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 2. COMPOSITION DE LA COMMISSION
        createChapterHeading("2. COMPOSITION DE LA COMMISSION"),
        
        ...(data.commission.dateReunion ? [
          createLabelValue("Date de réunion", formatDate(data.commission.dateReunion)),
        ] : []),
        
        ...(data.commission.lieuReunion ? [
          createLabelValue("Lieu", data.commission.lieuReunion),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        ...(data.commission.president.nom ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Président de séance : ", bold: true }),
              new TextRun({ text: `${data.commission.president.nom} - ${data.commission.president.fonction}` }),
            ],
            spacing: { after: 200 },
          }),
        ] : []),

        ...(data.commission.membres.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Membres présents :", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          ...data.commission.membres.map(membre => 
            new Paragraph({
              text: `• ${membre.nom} - ${membre.fonction}`,
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.25) },
            })
          ),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 3. OBJET DE LA RÉUNION
        createChapterHeading("3. OBJET DE LA RÉUNION"),
        
        ...(data.objetReunion.typeAnalyse ? [
          createLabelValue("Type d'analyse", data.objetReunion.typeAnalyse),
        ] : []),
        
        ...(data.objetReunion.dateOuverture ? [
          createLabelValue("Date d'ouverture", formatDate(data.objetReunion.dateOuverture)),
        ] : []),
        
        ...(data.objetReunion.heureOuverture ? [
          createLabelValue("Heure d'ouverture", data.objetReunion.heureOuverture),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 4. RAPPEL DU CONTEXTE
        createChapterHeading("4. RAPPEL DU CONTEXTE"),
        
        ...(data.contexte.publicationDate ? [
          createLabelValue("Date de publication", formatDate(data.contexte.publicationDate)),
        ] : []),
        
        ...(data.contexte.dateLimiteDepot ? [
          createLabelValue("Date limite de dépôt", formatDate(data.contexte.dateLimiteDepot)),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        ...(data.contexte.criteres.prix || data.contexte.criteres.technique ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Critères d'attribution :", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          ...(data.contexte.criteres.prix ? [
            new Paragraph({
              text: `• Prix : ${data.contexte.criteres.prix}%`,
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.25) },
            }),
          ] : []),
          ...(data.contexte.criteres.technique ? [
            new Paragraph({
              text: `• Valeur technique : ${data.contexte.criteres.technique}%`,
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.25) },
            }),
          ] : []),
          ...(data.contexte.criteres.autres?.map(critere => 
            new Paragraph({
              text: `• ${critere}`,
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.25) },
            })
          ) || []),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 5. DÉROULEMENT DE LA SÉANCE
        createChapterHeading("5. DÉROULEMENT DE LA SÉANCE"),
        
        ...(data.deroulement.nombreOffresRecues ? [
          createLabelValue("Nombre d'offres reçues", data.deroulement.nombreOffresRecues),
        ] : []),
        
        ...(data.deroulement.nombreOffresRecevables ? [
          createLabelValue("Nombre d'offres recevables", data.deroulement.nombreOffresRecevables),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        ...(data.deroulement.offresIrrecevables && data.deroulement.offresIrrecevables.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Offres irrecevables :", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          ...data.deroulement.offresIrrecevables.map(offre => 
            new Paragraph({
              children: [
                new TextRun({ text: `• ${offre.nom}`, bold: true }),
                new TextRun({ text: ` - ${offre.motif}` }),
              ],
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.25) },
            })
          ),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 6. ANALYSE DES OFFRES
        createChapterHeading("6. ANALYSE DES OFFRES"),

        ...(data.analyse.candidats && data.analyse.candidats.length > 0 ? [
          new Paragraph({ text: "", spacing: { after: 200 } }),
          createTableAnalyse(data.analyse.candidats),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 7. PROPOSITIONS
        createChapterHeading("7. PROPOSITIONS"),

        ...(data.propositions.attributaire.nom ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Attributaire proposé", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          createLabelValue("Nom", data.propositions.attributaire.nom),
          ...(data.propositions.attributaire.montantHT ? [
            createLabelValue("Montant HT", `${data.propositions.attributaire.montantHT} €`),
          ] : []),
          ...(data.propositions.attributaire.montantTTC ? [
            createLabelValue("Montant TTC", `${data.propositions.attributaire.montantTTC} €`),
          ] : []),
          ...(data.propositions.attributaire.delaiExecution ? [
            createLabelValue("Délai d'exécution", data.propositions.attributaire.delaiExecution),
          ] : []),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        ...(data.propositions.conditionsParticulieres ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Conditions particulières :", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.propositions.conditionsParticulieres,
            spacing: { after: 200 },
          }),
        ] : []),

        ...(data.propositions.reserves ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Réserves :", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.propositions.reserves,
            spacing: { after: 200 },
          }),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 300 } }),

        // 8. DÉCISIONS
        createChapterHeading("8. DÉCISIONS"),

        ...(data.decisions.avisCommission ? [
          createLabelValue("Avis de la commission", data.decisions.avisCommission),
        ] : []),

        ...(data.decisions.dateNotification ? [
          createLabelValue("Date de notification prévue", formatDate(data.decisions.dateNotification)),
        ] : []),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        ...(data.decisions.observations ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Observations complémentaires :", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.decisions.observations,
            spacing: { after: 400 },
          }),
        ] : []),

        // Signature
        new Paragraph({ text: "", spacing: { after: 600 } }),
        
        new Paragraph({
          text: "Fait à _________________, le _________________",
          spacing: { after: 400 },
        }),

        new Paragraph({
          text: "Le Pouvoir Adjudicateur",
          spacing: { after: 800 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "Signature", italics: true }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Reglement_Consultation_${data.identification.numProcedure || 'draft'}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
}

function createChapterHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    thematicBreak: true,
  });
}

function createLabelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label} : `, bold: true }),
      new TextRun({ text: value }),
    ],
    spacing: { after: 150 },
  });
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function createTableAnalyse(candidats: Array<{ nom: string; noteTechnique: string; noteFinanciere: string; noteGlobale: string }>): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Candidat", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Note technique", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Note financière", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Note globale", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "CCCCCC" },
        }),
      ],
    }),
    // Lignes de données
    ...candidats.map(candidat => 
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: candidat.nom })],
          }),
          new TableCell({
            children: [new Paragraph({ text: candidat.noteTechnique, alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            children: [new Paragraph({ text: candidat.noteFinanciere, alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            children: [new Paragraph({ text: candidat.noteGlobale, alignment: AlignmentType.CENTER })],
          }),
        ],
      })
    ),
  ];

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}
