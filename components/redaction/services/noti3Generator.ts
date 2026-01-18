import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Footer, PageNumber, NumberFormat } from 'docx';
import { saveAs } from 'file-saver';
import type { Noti3Data } from '../types/noti3';

export async function generateNoti3Word(data: Noti3Data): Promise<void> {
  const blob = await generateNoti3WordAsBlob(data);
  saveAs(blob, `NOTI3_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.candidat.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
}

export async function generateNoti3WordAsBlob(data: Noti3Data): Promise<Blob> {
  const doc = createNoti3Document(data);
  return await Packer.toBlob(doc);
}

// Helper pour créer du texte avec style Aptos Corps 11
function createBodyText(text: string, options: { bold?: boolean } = {}): TextRun {
  return new TextRun({
    text,
    font: 'Aptos (Corps)',
    size: 22, // 11pt = 22 half-points
    bold: options.bold || false,
  });
}

// Helper pour créer un titre de section avec Aptos 14
function createSectionTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: 'Aptos',
        size: 28, // 14pt = 28 half-points
        bold: true,
      }),
    ],
    spacing: { before: 300, after: 200 },
  });
}

function createNoti3Document(data: Noti3Data): Document {
  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,
            right: 1134,
            bottom: 1134,
            left: 1134,
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "NOTI3 – Notification de rejet de candidature ou d'offre | N° de procédure: ",
                  font: 'Aptos (Corps)',
                  size: 18, // 9pt
                }),
                new TextRun({
                  text: data.numeroProcedure,
                  font: 'Aptos (Corps)',
                  size: 18,
                }),
                new TextRun({
                  text: ' | Page ',
                  font: 'Aptos (Corps)',
                  size: 18,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: 'Aptos (Corps)',
                  size: 18,
                }),
                new TextRun({
                  text: ' / ',
                  font: 'Aptos (Corps)',
                  size: 18,
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: 'Aptos (Corps)',
                  size: 18,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: [
        // En-tête
        new Paragraph({
          children: [
            new TextRun({
              text: "MINISTERE DE L'ECONOMIE ET DES FINANCES",
              font: 'Aptos (Corps)',
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Direction des Affaires Juridiques',
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        // Titre principal
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'MARCHES PUBLICS',
                          bold: true,
                          size: 24,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'NOTIFICATION DE REJET DE CANDIDATURE OU D’OFFRE',
                          bold: true,
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: { fill: '9CC3E5' },
                  width: { size: 85, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'NOTI3',
                          bold: true,
                          size: 28,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: { fill: '9CC3E5' },
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Le formulaire NOTI3 est un modèle de lettre qui peut être utilisé par le pouvoir adjudicateur ou l’entité adjudicatrice pour notifier au candidat non retenu, le rejet de sa candidature ou de son offre et l’attribution du marché public ou en cas d’abandon de la procédure.",
              size: 18,
              italics: true,
            }),
          ],
          spacing: { before: 200, after: 400 },
        }),
        // Section A
        createSectionHeader("A - Identification du pouvoir adjudicateur ou de l’entité adjudicatrice"),
        new Paragraph({
          children: [
            new TextRun({
              text: 'AFPA',
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.pouvoirAdjudicateur.nom,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.pouvoirAdjudicateur.adresseVoie,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${data.pouvoirAdjudicateur.codePostal} ${data.pouvoirAdjudicateur.ville}`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),
        // Section B
        createSectionHeader('B - Objet de la notification'),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Objet de la consultation',
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.objetConsultation,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'La présente notification correspond :',
              font: 'Aptos (Corps)',
              size: 22,
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.notification.type === 'ensemble' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " à l’ensemble du marché public",
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        ...(data.notification.type === 'lots' ? [
          ...data.notification.lots.map((lot, i) => (
            new Paragraph({
              children: [
                new TextRun({
                  text: '☒',
                  size: 24,
                }),
                new TextRun({
                  text: ` au lot n° ${lot.numero} : ${lot.intitule}`,
                  font: 'Aptos (Corps)',
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
            })
          )),
        ] : []),
        // Section C
        createSectionHeader('C - Identification du candidat ou du soumissionnaire'),
        new Paragraph({
          children: [
            new TextRun({
              text: data.candidat.denomination,
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.candidat.adresse1,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        ...(data.candidat.adresse2 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: data.candidat.adresse2!,
                font: 'Aptos (Corps)',
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),
        ] : []),
        new Paragraph({
          children: [
            new TextRun({
              text: `${data.candidat.codePostal} ${data.candidat.ville}`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'SIRET : ' + data.candidat.siret,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Email : ' + data.candidat.email,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Téléphone : ' + data.candidat.telephone,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        // Section D
        createSectionHeader('D - Notification de rejet de la candidature ou de l’offre'),
        new Paragraph({
          children: [
            new TextRun({
              text: 'J’ai le regret de vous faire connaître que, dans le cadre de la consultation rappelée ci-dessus :',
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.rejet.type === 'candidature' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ' votre candidature n’a pas été retenue.',
              font: 'Aptos (Corps)',
              size: 22,
            }),
            new TextRun({
              text: data.rejet.type === 'offre' ? '☒' : '☐',
              size: 24,
              break: 1,
            }),
            new TextRun({
              text: ' votre offre n’a pas été retenue.',
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'pour les motifs suivants :',
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.rejet.motifs,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `En considération des critères de choix définis dans le Règlement de la Consultation, votre offre a obtenu ${data.rejet.total} points sur un total de 100.`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Note économique : ${data.rejet.noteEco} / ${data.rejet.maxEco || '60'} points`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Note technique : ${data.rejet.noteTech} / ${data.rejet.maxTech || '40'} points`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Au classement final, votre offre se classe au rang ${data.rejet.classement}.`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),
        // Section E
        createSectionHeader('E - Identification de l’attributaire'),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Le marché public ou l’accord-cadre est attribué à :',
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.attributaire.denomination,
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `En effet, en considération des critères de choix définis dans le Règlement de la Consultation, son offre a obtenu ${data.attributaire.total} points sur un total de 100.`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Note économique : ${data.attributaire.noteEco} / ${data.attributaire.maxEco || '60'} points`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Note technique : ${data.attributaire.noteTech} / ${data.attributaire.maxTech || '40'} points`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Pour les motifs suivants :',
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.attributaire.motifs,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),
        // Section F
        createSectionHeader('F - Délais et voies de recours'),
        new Paragraph({
          children: [
            new TextRun({
              text: `Le délai de suspension de la signature du marché public ou de l’accord-cadre est de ${data.delaiStandstill} jours, à compter de la date d’envoi de la présente notification.`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Référé précontractuel :',
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
            new TextRun({
              text: " Le candidat peut, s’il le souhaite, exercer un référé précontractuel contre la présente procédure de passation, devant le président du tribunal administratif, avant la signature du marché public ou de l’accord-cadre.",
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Recours pour excès de pouvoir :',
              bold: true,
              font: 'Aptos (Corps)',
              size: 22,
            }),
            new TextRun({
              text: " Dans l’hypothèse d’une déclaration d’infructuosité de la procédure, le candidat peut, s’il le souhaite, exercer un recours pour excès de pouvoir contre cette décision, devant le tribunal administratif. Le juge doit être saisi dans un délai de deux mois à compter de la notification du présent courrier.",
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),
        // Section G
        createSectionHeader('G - Signature du pouvoir adjudicateur ou de l’entité adjudicatrice'),
        new Paragraph({
          children: [
            new TextRun({
              text: `À ${data.signature.lieu}, le ${data.signature.date}`,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Signature',
              font: 'Aptos (Corps)',
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "(représentant du pouvoir adjudicateur ou de l’entité adjudicatrice habilité à signer le marché public)",
              size: 16,
              italics: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.signature.signataireTitre,
              font: 'Aptos (Corps)',
              size: 22,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 600 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Pour la Direction Nationale des Achats',
              font: 'Aptos (Corps)',
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
        }),

      ],
    }],
  });
}

function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        font: 'Aptos',
        bold: true,
        size: 28,
        color: '1F4E78',
      }),
    ],
    shading: { fill: '9CC3E5' },
    spacing: { before: 400, after: 200 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '1F4E78' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '1F4E78' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '1F4E78' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '1F4E78' },
    },
  });
}


