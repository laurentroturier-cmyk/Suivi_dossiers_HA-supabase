import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { Noti1Data } from '../types/noti1';

export async function generateNoti1Word(data: Noti1Data): Promise<void> {
  const blob = await generateNoti1WordAsBlob(data);
  saveAs(blob, `NOTI1_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.titulaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
}

export async function generateNoti1WordAsBlob(data: Noti1Data): Promise<Blob> {
  const doc = createNoti1Document(data);
  return await Packer.toBlob(doc);
}

function createNoti1Document(data: Noti1Data): Document {
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
      children: [
        // En-tête
        new Paragraph({
          children: [
            new TextRun({
              text: "MINISTERE DE L'ECONOMIE ET DES FINANCES",
              size: 20,
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
                          text: 'INFORMATION DU TITULAIRE PRESSENTI',
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
                          text: 'NOTI1',
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
              text: "Le formulaire NOTI1 est un modèle de lettre qui peut être utilisé, par le pouvoir adjudicateur ou l'entité adjudicatrice, pour informer le titulaire pressenti de son intention de lui attribuer le marché public.",
              size: 18,
              italics: true,
            }),
          ],
          spacing: { before: 200, after: 400 },
        }),

        // Section A
        createSectionHeader("A - Identification du pouvoir adjudicateur ou de l'entité adjudicatrice"),

        new Paragraph({
          children: [
            new TextRun({
              text: 'AFPA',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.pouvoirAdjudicateur.nom,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.pouvoirAdjudicateur.adresseVoie,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `${data.pouvoirAdjudicateur.codePostal} ${data.pouvoirAdjudicateur.ville}`,
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section B
        createSectionHeader('B - Objet de la consultation'),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Objet de la consultation',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.objetConsultation,
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section C
        createSectionHeader("C - Identification du titulaire pressenti"),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Entreprise',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.titulaire.denomination,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Adresse 1',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.titulaire.adresse1,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        ...(data.titulaire.adresse2 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Adresse 2',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.titulaire.adresse2,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),
        ] : []),

        new Paragraph({
          children: [
            new TextRun({
              text: `${data.titulaire.codePostal} ${data.titulaire.ville}`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'SIRET',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.titulaire.siret,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Email',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.titulaire.email,
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section D
        createSectionHeader("D - Information sur l'attribution envisagée"),

        new Paragraph({
          children: [
            new TextRun({
              text: "Je vous informe que je compte vous attribuer :",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.attribution.type === 'ensemble' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " l'ensemble du marché public (en cas de non allotissement).",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.attribution.type === 'lots' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ` le(s) lot(s) n° ${data.attribution.lots.map(l => `${l.numero}:${l.intitule}`).join(', ')}`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "de la procédure de passation du marché public ou de l'accord cadre (en cas d'allotissement).",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section E
        createSectionHeader('E - Documents à fournir'),

        new Paragraph({
          children: [
            new TextRun({
              text: `En application de l'article R. 2144-1 du code de la commande publique, je vous demande de me transmettre les pièces suivantes, datées et signées, avant le ${data.documents.dateSignature || '[DATE]'} :`,
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.documents.candidatFrance ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ' Si vous êtes établi en France :',
              size: 20,
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.documents.documentsPreuve || 'Liste des documents à fournir selon le règlement de consultation',
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.documents.candidatEtranger ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " Si vous êtes établi à l'étranger :",
              size: 20,
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Documents équivalents selon la législation du pays d'établissement",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Vous disposez d'un délai de ${data.documents.delaiReponse || '[NOMBRE]'} jours pour me transmettre ces documents.`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Ce délai court à compter de :',
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.documents.decompteA === 'réception' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ' la réception de la présente information.',
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.documents.decompteA === 'transmission' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ' la transmission par mes soins des documents complémentaires.',
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section F
        createSectionHeader("F - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice"),

        new Paragraph({
          children: [
            new TextRun({
              text: `À ${data.signature.lieu}, le ${data.signature.date}`,
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Signature',
              size: 20,
              bold: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "(représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)",
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
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 600 },
        }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: `NOTI1 – Information au titulaire pressenti | N° de procédure: ${data.numeroProcedure} | Page 1 / 1`,
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
          shading: { fill: '9CC3E5' },
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
        bold: true,
        size: 22,
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
