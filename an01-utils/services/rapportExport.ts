import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, Footer, Header, PageNumber, ImageRun, TableOfContents } from "docx";
import { RapportContent } from '../../components/analyse/types';

export interface ExportRapportOptions {
  rapportData: RapportContent;
  procedureInfo: any;
  contenuChapitre3?: string;
  contenuChapitre4?: string;
  chapitre10?: {
    validationAttribution: string;
    envoiRejet: string;
    attributionMarche: string;
    autresElements: string;
  };
  an01Buyer?: string;
}

// Fonctions helper pour les polices
const createBodyText = (text: string, bold: boolean = false): TextRun => {
  return new TextRun({ text, font: "Aptos", size: 22, bold });
};

const createHeadingText = (text: string): TextRun => {
  return new TextRun({ text, font: "Rockwell", size: 32, bold: true, color: "56BAA2" });
};

const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

/**
 * Génère et télécharge un document DOCX du rapport de présentation
 */
export async function exportRapportDOCX(options: ExportRapportOptions): Promise<void> {
  const { rapportData, procedureInfo, contenuChapitre3, contenuChapitre4, chapitre10, an01Buyer } = options;

  // Charger l'image depuis public/
  const imageResponse = await fetch('/Image1.png');
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();

  const doc = new Document({
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
                  text: procedureInfo?.['Numéro de procédure (Afpa)'] || '',
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
              size: 32,
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
              text: procedureInfo?.['Nom de la procédure'] || '',
              font: "Rockwell",
              size: 32,
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
              size: 28,
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
          children: [createHeadingText("1. CONTEXTE")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            createBodyText(`Le présent marché a pour objet ${rapportData.section1_contexte.objetMarche} pour une durée totale de ${rapportData.section1_contexte.dureeMarche} mois.`),
          ],
          spacing: { after: 200 },
        }),
        
        // Section 2 : Déroulement
        new Paragraph({
          children: [createHeadingText("2. DÉROULEMENT DE LA PROCÉDURE")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            createBodyText("La procédure a été lancée sur la plateforme « "),
            createBodyText(rapportData.section2_deroulement.supportProcedure, true),
            createBodyText(" » selon le calendrier suivant :"),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [createBodyText(`• Date de publication : ${rapportData.section2_deroulement.datePublication}`)],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [createBodyText(`• Nombre de dossiers retirés : ${rapportData.section2_deroulement.nombreRetraits}`)],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [createBodyText(`• Date de réception des offres : ${rapportData.section2_deroulement.dateReceptionOffres}`)],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [createBodyText(`• Nombre de plis reçus : ${rapportData.section2_deroulement.nombrePlisRecus}`)],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [createBodyText(`• Date d'ouverture des plis : ${rapportData.section2_deroulement.dateOuverturePlis}`)],
          spacing: { after: 200 },
        }),
        
        // Section 3 : Dossier de consultation
        new Paragraph({
          children: [createHeadingText("3. DOSSIER DE CONSULTATION")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            contenuChapitre3 
              ? createBodyText(contenuChapitre3)
              : new TextRun({ text: "[À compléter : Description du DCE et des documents fournis]", italics: true, color: "FF8800", font: "Aptos", size: 22 }),
          ],
          spacing: { after: 200 },
        }),
        
        // Section 4 : Questions-Réponses
        new Paragraph({
          children: [createHeadingText("4. QUESTIONS - RÉPONSES")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            contenuChapitre4
              ? createBodyText(contenuChapitre4)
              : new TextRun({ text: "[À compléter : Questions posées et réponses apportées]", italics: true, color: "FF8800", font: "Aptos", size: 22 }),
          ],
          spacing: { after: 200 },
        }),
        
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
        
        // Section 6 : Méthodologie
        new Paragraph({
          children: [createHeadingText("6. MÉTHODOLOGIE D'ANALYSE DES OFFRES")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            createBodyText("Les offres ont été analysées selon les critères suivants :"),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            createBodyText(`• Critère technique : `),
            createBodyText(`${rapportData.section6_methodologie?.ponderationTechnique || 40}%`, true),
          ],
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            createBodyText(`• Critère financier : `),
            createBodyText(`${rapportData.section6_methodologie?.ponderationFinancier || 60}%`, true),
          ],
          spacing: { after: 200 },
        }),
        
        // Section 7 : Analyse de la valeur des offres
        new Paragraph({
          children: [createHeadingText("7. ANALYSE DE LA VALEUR DES OFFRES")],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        // Si multi-lots : afficher le tableau de synthèse
        ...(rapportData.section7_2_syntheseLots ? [
          new Paragraph({
            children: [
              createBodyText(`Le marché comporte ${rapportData.section7_2_syntheseLots.nombreLots} lots distincts. Voici la synthèse des attributaires pressenti pour chaque lot :`),
            ],
            spacing: { after: 200 },
          }),
          
          createLotsTable(rapportData.section7_2_syntheseLots.lots),
          
          new Paragraph({
            children: [
              createBodyText(`Montant total TTC tous lots confondus : `),
              createBodyText(formatCurrency(rapportData.section7_2_syntheseLots.montantTotalTTC), true),
            ],
            spacing: { before: 200, after: 100 },
          }),
        ] : [
          // Sinon : afficher le tableau de classement classique
          createOffersTable(rapportData.section7_valeurOffres.tableau),
          
          new Paragraph({
            children: [
              createBodyText(`Le montant de l'offre du prestataire pressenti s'élève à `),
              createBodyText(formatCurrency(rapportData.section7_valeurOffres.montantAttributaire), true),
              createBodyText(`.`),
            ],
            spacing: { before: 200, after: 100 },
          }),
        ]),
        
        // Comparaison avec Note d'Opportunité
        ...(rapportData.section7_valeurOffres.montantEstime > 0 ? [
          new Paragraph({
            children: [
              createBodyText(`Pour rappel, le montant estimé dans la note d'opportunité était de `),
              createBodyText(`${formatCurrency(rapportData.section7_valeurOffres.montantEstime)} TTC`, true),
              createBodyText(`, soit un écart de `),
              createBodyText(`${formatCurrency(rapportData.section7_valeurOffres.ecartAbsolu)} (${rapportData.section7_valeurOffres.ecartPourcent.toFixed(2)}%)`, true),
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
        
        // Si multi-lots : afficher la performance globale + tableau par lot
        ...(rapportData.section8_1_synthesePerformance ? [
          new Paragraph({
            children: [
              createBodyText(`Au global, la performance achat tous lots confondus est de `),
              createBodyText(`${rapportData.section8_performance.performanceAchatPourcent.toFixed(1)}%`, true),
              createBodyText(`.`),
            ],
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              createBodyText(`L'impact budgétaire total estimé est de `),
              createBodyText(formatCurrency(rapportData.section8_performance.impactBudgetaireTTC), true),
              createBodyText(` TTC (soit `),
              createBodyText(formatCurrency(rapportData.section8_performance.impactBudgetaireHT)),
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
          
          createPerformanceLotsTable(rapportData.section8_1_synthesePerformance.lotsDetails),
        ] : [
          // Sinon : afficher la performance du lot unique
          new Paragraph({
            children: [
              createBodyText(`Au global, la performance achat est de `),
              createBodyText(`${rapportData.section8_performance.performanceAchatPourcent.toFixed(1)}%`, true),
              createBodyText(`.`),
            ],
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              createBodyText(`L'impact budgétaire estimé est de `),
              createBodyText(formatCurrency(rapportData.section8_performance.impactBudgetaireTTC), true),
              createBodyText(` TTC (soit `),
              createBodyText(formatCurrency(rapportData.section8_performance.impactBudgetaireHT)),
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
        ...(rapportData.section7_2_syntheseLots ? [
          new Paragraph({
            children: [
              createBodyText(`Au regard de ces éléments, la commission d'ouverture souhaite attribuer les lots comme suit :`),
            ],
            spacing: { after: 200 },
          }),
          
          createAttributairesTable(rapportData.section7_2_syntheseLots.lots),
          
          new Paragraph({
            children: [
              createBodyText(`Montant total de l'attribution : `),
              createBodyText(formatCurrency(rapportData.section7_2_syntheseLots.montantTotalTTC), true),
            ],
            spacing: { before: 200, after: 200 },
          }),
        ] : [
          // Sinon : afficher l'attributaire unique
          new Paragraph({
            children: [
              createBodyText(`Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à `),
              createBodyText(rapportData.section9_attribution.attributairePressenti, true),
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
            createBodyText(chapitre10?.validationAttribution || "[À compléter]"),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            createBodyText("Envoi des lettres de rejet : ", true),
            createBodyText(chapitre10?.envoiRejet || "[À compléter]"),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            createBodyText("Attribution du marché : ", true),
            createBodyText(chapitre10?.attributionMarche || "[À compléter]"),
          ],
          spacing: { after: 200 },
        }),
        
        ...(chapitre10?.autresElements
          ? [
              new Paragraph({
                children: [
                  createBodyText("Autres éléments du calendrier : ", true),
                  createBodyText(chapitre10.autresElements),
                ],
                spacing: { after: 200 },
              }),
            ]
          : [])
        
        // Bloc de signature
        new Paragraph({
          text: "",
          spacing: { before: 600 },
        }),
        new Paragraph({
          children: [
            createBodyText(an01Buyer || "RPA responsable", true),
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
  link.download = `Rapport_Presentation_${procedureInfo?.['Numéro de procédure (Afpa)'] || 'export'}.docx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

// Fonction pour créer le tableau des offres
function createOffersTable(offers: any[]): Table {
  const rows = [
    // En-tête
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Raison sociale", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rang", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note /100", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note Fin. /60", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Note Tech. /40", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    // Données
    ...offers.map(o => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.raisonSociale, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(o.rangFinal), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.noteFinaleSur100.toFixed(2), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.noteFinanciereSur60.toFixed(2), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o.noteTechniqueSur40.toFixed(2), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(o.montantTTC), font: "Aptos", size: 22 })] })] }),
      ],
    })),
  ];
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Fonction pour créer le tableau de performance par lot (section 8)
function createPerformanceLotsTable(lotsDetails: any[]): Table {
  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Performance %", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Impact TTC", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    ...lotsDetails.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${lot.performancePourcent.toFixed(1)}%`, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.impactTTC), font: "Aptos", size: 22 })] })] }),
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
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Attributaire pressenti", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    ...lots.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.attributaire, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.montantAttributaire), font: "Aptos", size: 22 })] })] }),
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
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom du lot", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant TTC", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Attributaire", bold: true, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Offres", bold: true, font: "Aptos", size: 22 })] })] }),
      ],
    }),
    ...lots.map(lot => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(lot.numero), font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lot.nom, font: "Aptos", size: 22 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(lot.montantAttributaire), font: "Aptos", size: 22 })] })] }),
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
