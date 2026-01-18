import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { Noti5Data } from '../types/noti5';

export async function generateNoti5Word(data: Noti5Data): Promise<void> {
  const blob = await generateNoti5WordAsBlob(data);
  saveAs(blob, `NOTI5_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.attributaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
}

export async function generateNoti5WordAsBlob(data: Noti5Data): Promise<Blob> {
  const doc = createNoti5Document(data);
  return await Packer.toBlob(doc);
}

function createNoti5Document(data: Noti5Data): Document {
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
                          text: 'NOTIFICATION DU MARCHE PUBLIC',
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
                          text: 'NOTI5',
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
              text: "Le formulaire NOTI5 est un modèle de lettre qui peut être utilisé, par le pouvoir adjudicateur ou l'entité adjudicatrice, après qu'il ou elle ait signé le marché public, pour le notifier à l'attributaire.",
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
              text: '(Reprendre le contenu de la mention figurant dans les documents de la consultation.)',
              size: 16,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),

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
              text: '(Reprendre le contenu de la mention figurant dans les documents de la consultation.)',
              size: 16,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Objet de la consultation',
              bold: true,
              size: 20,
              highlight: 'yellow',
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
        createSectionHeader("C - Identification de l'attributaire"),
        new Paragraph({
          children: [
            new TextRun({
              text: "[Indiquer le nom commercial et la dénomination sociale de l'attributaire individuel ou de chaque membre du groupement d'entreprises attributaire, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de groupement d'entreprises attributaire, identifier précisément le mandataire du groupement.]",
              size: 16,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Entreprise',
              bold: true,
              size: 20,
              highlight: 'yellow',
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.attributaire.denomination,
              size: 20,
              highlight: 'yellow',
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
              highlight: 'yellow',
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.attributaire.adresse1,
              size: 20,
              highlight: 'yellow',
            }),
          ],
          spacing: { after: 100 },
        }),

        ...(data.attributaire.adresse2 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Adresse 2',
                bold: true,
                size: 20,
                highlight: 'yellow',
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.attributaire.adresse2,
                size: 20,
                highlight: 'yellow',
              }),
            ],
            spacing: { after: 100 },
          }),
        ] : []),

        new Paragraph({
          children: [
            new TextRun({
              text: `${data.attributaire.codePostal} ${data.attributaire.ville}`,
              size: 20,
              highlight: 'yellow',
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
              highlight: 'yellow',
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.attributaire.siret,
              size: 20,
              highlight: 'yellow',
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
              highlight: 'yellow',
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.attributaire.email,
              size: 20,
              highlight: 'yellow',
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section D
        createSectionHeader("D - Notification de l'attribution"),

        new Paragraph({
          children: [
            new TextRun({
              text: "Je vous informe que l'offre que vous avez faite au titre de la consultation désignée ci-dessus a été retenue :",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '(Cocher la case correspondante.)',
              size: 16,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.notification.type === 'ensemble' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " pour l'ensemble du marché public (en cas de non allotissement).",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.notification.type === 'lots' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ` pour le(s) lot(s) n° ${data.notification.lots.map(l => `${l.numero}:${l.intitule}`).join(', ')}`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "de la procédure de passation du marché public ou de l'accord cadre (en cas d'allotissement.)",
              size: 20,
            }),
          ],
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'L\'exécution des prestations commencera :',
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '(Cocher la case correspondante.)',
              size: 16,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.executionPrestations.type === 'immediate' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ' dès réception de la présente notification.',
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.executionPrestations.type === 'sur_commande' ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " à réception d'un bon de commande ou d'un ordre de service que j'émettrai ultérieurement.",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section E
        createSectionHeader('E - Retenue de garantie ou garantie à première demande'),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Le marché public qui vous est notifié comporte :',
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.garanties.aucuneGarantie ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ' aucune retenue de garantie ou garantie à première demande.',
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.garanties.retenue.active ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: ` une retenue de garantie d'un montant de ${data.garanties.retenue.pourcentage} % du montant initial du marché public ou de l'accord-cadre, que vous pouvez remplacer par :`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        ...(data.garanties.retenue.active ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '    ',
                size: 20,
              }),
              new TextRun({
                text: data.garanties.retenue.remplacablePar.garantiePremieredemande ? '☒' : '☐',
                size: 24,
              }),
              new TextRun({
                text: ' une garantie à première demande.',
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '    ',
                size: 20,
              }),
              new TextRun({
                text: data.garanties.retenue.remplacablePar.cautionPersonnelle ? '☒' : '☐',
                size: 24,
              }),
              new TextRun({
                text: ' une caution personnelle et solidaire.',
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),
        ] : []),

        new Paragraph({
          children: [
            new TextRun({
              text: data.garanties.garantieAvanceSuperieure30 ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " une garantie à première demande en garantie du remboursement d'une avance supérieure à 30%. Vous ne pourrez recevoir cette avance qu'après avoir constitué cette garantie.",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.garanties.garantieAvanceInferieure30.active ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " (pour les collectivités territoriales uniquement.) une garantie à première demande en garantie du remboursement de toute ou partie d'une avance inférieure ou égale à 30%.",
              size: 20,
            }),
          ],
          spacing: { after: data.garanties.garantieAvanceInferieure30.active ? 100 : 400 },
        }),

        ...(data.garanties.garantieAvanceInferieure30.active ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '    ',
                size: 20,
              }),
              new TextRun({
                text: data.garanties.garantieAvanceInferieure30.remplacableParCaution ? '☒' : '☐',
                size: 24,
              }),
              new TextRun({
                text: ' vous pouvez remplacer cette garantie à première demande par une caution personnelle et solidaire.',
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),
        ] : []),

        // Section F
        createSectionHeader('F - Pièces jointes à la présente notification'),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Vous trouverez ci-joints :',
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.piecesJointes.actEngagementPapier ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " deux photocopies de l'acte d'engagement avec ses annexes, dont l'une est revêtue de la formule dite « d'exemplaire unique ». Cet exemplaire est destiné à être remis à l'établissement de crédit en cas de cession ou de nantissement de toute ou partie de votre créance. J'attire votre attention sur le fait qu'il n'est pas possible, en cas de perte, de délivrer un duplicata de l'exemplaire unique.",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: data.piecesJointes.actEngagementPDF ? '☒' : '☐',
              size: 24,
            }),
            new TextRun({
              text: " une copie au format électronique Adobe PDF de l'acte d'engagement.",
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Section G
        createSectionHeader("G - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice"),

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

        // Section H
        createSectionHeader('H - Notification du marché public au titulaire'),

        new Paragraph({
          children: [
            new TextRun({
              text: "Cette rubrique comprend tous les éléments relatifs à la réception de la notification du marché public, que cette notification soit remise contre récépissé, ou qu'elle soit transmise par courrier (lettre recommandée avec accusé de réception) ou par voie électronique (profil d'acheteur).",
              size: 18,
              italics: true,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "La date d'effet du marché public court à compter de la réception de cette notification par l'attributaire, qui devient alors le titulaire du marché public et responsable de sa bonne exécution.",
              size: 18,
              bold: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: `NOTI5 – Notification du marché public | N° de procédure: ${data.numeroProcedure} | Page 2 / 2`,
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
