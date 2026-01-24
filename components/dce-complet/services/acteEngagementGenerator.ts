// ============================================
// GÉNÉRATEUR WORD POUR L'ACTE D'ENGAGEMENT (ATTRI1)
// Format officiel du Ministère de l'Économie et des Finances
// ============================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Footer,
  PageNumber,
  NumberFormat,
  Header,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  ShadingType,
  VerticalAlign,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ActeEngagementATTRI1Data } from '../types/acteEngagement';

// ============================================
// STYLES ET CONSTANTES
// Style officiel administratif sobre
// ============================================

const FONT_PRINCIPAL = 'Arial';
const FONT_SIZE_NORMAL = 20; // 10pt en demi-points
const FONT_SIZE_SMALL = 16; // 8pt
const FONT_SIZE_TITLE = 28; // 14pt
const FONT_SIZE_HEADER = 24; // 12pt
// Couleurs officielles sobres
const COLOR_BLUE = '0070C0';        // Bleu officiel sobre (pas trop vif)
const COLOR_DARK_BLUE = '002060';   // Bleu marine foncé pour les titres
const COLOR_BLACK = '000000';
const COLOR_HEADER_BG = 'DAEEF3';   // Fond très léger bleu-gris pour les en-têtes
const COLOR_CYAN_LIGHT = COLOR_HEADER_BG; // Alias pour compatibilité

// ============================================
// HELPERS
// ============================================

const createCheckbox = (checked: boolean): string => checked ? '☑' : '☐';

const createBlueText = (text: string, bold = false, size = FONT_SIZE_NORMAL): TextRun => 
  new TextRun({ text, color: COLOR_BLUE, bold, size, font: FONT_PRINCIPAL });

const createBlackText = (text: string, bold = false, size = FONT_SIZE_NORMAL): TextRun => 
  new TextRun({ text, color: COLOR_BLACK, bold, size, font: FONT_PRINCIPAL });

const createItalicText = (text: string, size = FONT_SIZE_NORMAL): TextRun => 
  new TextRun({ text, italics: true, size, font: FONT_PRINCIPAL, color: COLOR_BLACK });

const createBlueBoldText = (text: string, size = FONT_SIZE_NORMAL): TextRun => 
  new TextRun({ text, color: COLOR_BLUE, bold: true, size, font: FONT_PRINCIPAL });

const emptyParagraph = (): Paragraph => new Paragraph({ spacing: { after: 100 } });

// Créer un paragraphe avec texte bleu
const createBlueParagraph = (text: string, options: { bold?: boolean; alignment?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: { before?: number; after?: number } } = {}): Paragraph => 
  new Paragraph({
    children: [createBlueText(text, options.bold)],
    alignment: options.alignment,
    spacing: options.spacing || { after: 120 },
  });

// Créer un paragraphe d'instruction en italique (noir, pas bleu)
const createInstructionParagraph = (text: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, italics: true, size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL, color: COLOR_BLACK })],
    spacing: { after: 80 },
  });

// Créer une ligne de case à cocher (en noir pour sobriété)
const createCheckboxLine = (checked: boolean, label: string, additionalText = ''): Paragraph =>
  new Paragraph({
    children: [
      createBlackText(`${createCheckbox(checked)} `),
      createBlackText(label),
      additionalText ? createBlackText(additionalText) : new TextRun(''),
    ],
    spacing: { after: 80 },
    indent: { left: 360 },
  });

// ============================================
// GÉNÉRATION DU DOCUMENT
// ============================================

export const generateActeEngagementWord = async (
  data: ActeEngagementATTRI1Data,
  numeroProcedure: string,
  numeroLot: number
): Promise<void> => {
  const numeroReference = data.objet.numeroReference || numeroProcedure;
  const lotNum = data.objet.typeActe.numeroLot || String(numeroLot);
  const lotIntitule = data.objet.typeActe.intituleLot || '';

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_PRINCIPAL,
            size: FONT_SIZE_NORMAL,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 1080, // 0.75 inch
              right: 1080,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'RÉPUBLIQUE FRANÇAISE', size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `ATTRI1 – Acte d'engagement`, size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
                  new TextRun({ text: `     N° ${numeroReference} Lot ${lotNum}`, size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
                  new TextRun({ text: '     Page : ', size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: FONT_SIZE_SMALL,
                    font: FONT_PRINCIPAL,
                  }),
                  new TextRun({ text: ' / ', size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: FONT_SIZE_SMALL,
                    font: FONT_PRINCIPAL,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Version code de la commande publique - 2019', size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ============================================
          // EN-TÊTE DU DOCUMENT
          // ============================================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'MINISTERE DE L\'ECONOMIE ET DES FINANCES', bold: true, size: FONT_SIZE_HEADER, font: FONT_PRINCIPAL, color: COLOR_BLACK }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Direction des Affaires Juridiques', size: FONT_SIZE_NORMAL, font: FONT_PRINCIPAL, color: COLOR_BLACK }),
            ],
            spacing: { after: 200 },
          }),
          
          // Titre MARCHES PUBLICS (fond léger, texte bleu sobre)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: COLOR_HEADER_BG },
            children: [
              new TextRun({ text: 'MARCHES PUBLICS', bold: true, size: 28, font: FONT_PRINCIPAL, color: COLOR_BLUE }),
            ],
            spacing: { before: 100, after: 40 },
          }),
          
          // Titre ACTE D'ENGAGEMENT
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: COLOR_HEADER_BG },
            children: [
              new TextRun({ text: 'ACTE D\'ENGAGEMENT', bold: true, size: 28, font: FONT_PRINCIPAL, color: COLOR_BLUE }),
              new TextRun({ text: '¹', size: 16, font: FONT_PRINCIPAL, color: COLOR_BLUE, superScript: true }),
            ],
            spacing: { after: 40 },
          }),
          
          // ATTRI1
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'ATTRI1', bold: true, size: 24, font: FONT_PRINCIPAL, color: COLOR_BLACK }),
            ],
            spacing: { after: 200 },
          }),

          // ============================================
          // TEXTE D'INTRODUCTION
          // ============================================
          new Paragraph({
            children: [
              createItalicText('Alors qu\'un acte d\'engagement était autrefois requis de l\'opérateur économique soumissionnaire lors du dépôt de son offre, sa signature n\'est plus aujourd\'hui requise qu\'au stade de l\'attribution du marché public.', FONT_SIZE_SMALL),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              createItalicText('Le formulaire ATTRI1 est un modèle d\'acte d\'engagement qui peut être utilisé par l\'acheteur, s\'il le souhaite, pour conclure un marché public avec le titulaire pressenti.', FONT_SIZE_SMALL),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              createItalicText('Il est conseillé aux acheteurs de renseigner les différentes rubriques de ce formulaire avant de l\'adresser à l\'attributaire. Ce dernier retourne l\'acte d\'engagement signé, permettant à l\'acheteur de le signer à son tour.', FONT_SIZE_SMALL),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              createItalicText('En cas d\'allotissement, un formulaire ATTRI1 peut être établi pour chaque lot. Lorsqu\'un même opérateur économique se voit attribuer plusieurs lots, un seul ATTRI1 peut être complété. Si l\'attributaire est retenu sur la base d\'une offre variable portant sur plusieurs lots, soit un acte d\'engagement est établi pour les seuls lots concernés, soit l\'acte d\'engagement unique mentionne expressément les lots retenus sur la base d\'une offre variable.', FONT_SIZE_SMALL),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              createItalicText('En cas de groupement d\'entreprises, un acte d\'engagement unique est rempli pour le groupement d\'entreprises.', FONT_SIZE_SMALL),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              createItalicText('Il est rappelé qu\'en application du code de la commande publique, et notamment ses articles L. 1110-1, et R. 2162-1 à R. 2162-6, R. 2162-7 à R. 2162-12, R. 2162-13 à R. 2162-14 et R. 2162-15 à R. 2162-21 (marchés publics autres que de défense ou de sécurité), ainsi que R. 23612-1 à R. 2362-6, R. 2362-7, R. 2362-8, R. 2362-9 à R. 2362-12, et R. 2362-13 à R. 2362-18 (marchés de défense ou de sécurité), le vocable de « marché public » recouvre aussi les marchés de partenariat et les marchés de défense ou de sécurité ainsi que les marchés subséquents et les marchés spécifiques, indépendamment des techniques d\'achats utilisées (accords-cadres s\'exécutant par la conclusion de marchés subséquents ou par l\'émission de bons de commande, concours, systèmes d\'acquisition dynamiques, catalogues électroniques et enchères électroniques), qu\'ils soient ou non soumis aux obligations relatives à la préparation et à la passation prévues par ce code. Dans tous ces cas, le présent formulaire type est utilisable.', FONT_SIZE_SMALL),
            ],
            spacing: { after: 240 },
          }),

          // ============================================
          // SECTION A - OBJET DE L'ACTE D'ENGAGEMENT
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('A - Objet de l\'acte d\'engagement', FONT_SIZE_HEADER),
            ],
            spacing: { before: 200, after: 160 },
          }),

          // Objet du marché public
          new Paragraph({
            children: [
              createBlueText('■ ', true),
              createBlueBoldText('Objet du marché public'),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Reprendre le contenu de la mention figurant dans l\'avis d\'appel à la concurrence ou l\'invitation à confirmer l\'intérêt ; en cas de publication d\'une annonce au Journal officiel de l\'Union européenne ou au Bulletin officiel des annonces de marchés publics, la simple indication de la référence à cet avis est suffisante ; dans tous les cas, l\'indication du numéro de référence attribué au dossier par l\'acheteur est également une information suffisante. Toutefois, en cas d\'allotissement, identifier également le ou les lots concernés par le présent acte d\'engagement.)'),
          
          new Paragraph({
            children: [createBlackText(data.objet.objetMarche || '(Non renseigné)')],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [createBlackText(`N° ${numeroReference}`, true)],
            spacing: { after: 160 },
          }),

          // Cet acte d'engagement correspond
          new Paragraph({
            children: [
              createBlueText('■ ', true),
              createBlueBoldText('Cet acte d\'engagement correspond :'),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher les cases correspondantes.)'),

          // Cases à cocher
          new Paragraph({
            children: [
              createBlackText('1. '),
              createBlackText(`${createCheckbox(data.objet.typeActe.ensembleMarche)} `),
              createBlackText('à l\'ensemble du marché public '),
              createItalicText('(en cas de non allotissement)', FONT_SIZE_NORMAL),
              createBlackText(' ;'),
            ],
            spacing: { after: 80 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.objet.typeActe.lotSpecifique)} `),
              createBlackText(`au lot n°${lotNum}${lotIntitule ? ` - ${lotIntitule}` : ''} du marché public`),
            ],
            spacing: { after: 120 },
            indent: { left: 360 },
          }),

          new Paragraph({
            children: [
              createBlackText('2. '),
              createBlackText(`${createCheckbox(data.objet.typeOffre.offreBase)} `),
              createBlackText('à l\'offre de base ;'),
            ],
            spacing: { after: 80 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.objet.typeOffre.variante)} `),
              createBlackText('à la variante suivante : '),
              createBlackText(data.objet.typeOffre.descriptionVariante || ''),
            ],
            spacing: { after: 120 },
            indent: { left: 360 },
          }),

          new Paragraph({
            children: [
              createBlackText('3. '),
              createBlackText(`${createCheckbox(data.objet.prestationsSupplementaires.avecPrestations)} `),
              createBlackText('avec les prestations supplémentaires suivantes : '),
              createBlackText(data.objet.prestationsSupplementaires.description || ''),
            ],
            spacing: { after: 200 },
            indent: { left: 360 },
          }),

          // ============================================
          // SECTION B - ENGAGEMENT DU TITULAIRE
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('B - Engagement du titulaire ou du groupement titulaire', FONT_SIZE_HEADER),
            ],
            spacing: { before: 200, after: 160 },
          }),

          // B1 - Identification
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('B1 - Identification et engagement du titulaire ou du groupement titulaire'),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher les cases correspondantes.)'),

          new Paragraph({
            children: [createBlackText('Après avoir pris connaissance des pièces constitutives du marché public suivantes,')],
            spacing: { after: 80 },
          }),

          // Pièces constitutives
          ...(data.piecesConstitutives.ccatp ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText(`CCATP n° ${data.piecesConstitutives.ccatpNumero}`),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.ccagFCS ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText('CCAG de Fournitures Courantes et de Services'),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.ccagTravaux ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText('CCAG de Travaux'),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.ccagPI ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText('CCAG de Prestations Intellectuelles'),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.ccagTIC ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText('CCAG des Technologies de l\'Information et de la Communication'),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.ccagMOE ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText('CCAG de Maîtrise d\'Œuvre'),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.cctp ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText(`CCTP n° ${data.piecesConstitutives.cctpNumero}`),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),
          ...(data.piecesConstitutives.autres ? [
            new Paragraph({
              children: [
                createBlackText(`${createCheckbox(true)} `),
                createBlackText(`Autres : ${data.piecesConstitutives.autresDescription}`),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
          ] : []),

          new Paragraph({
            children: [createBlackText('et conformément à leurs clauses,')],
            spacing: { before: 120, after: 120 },
          }),

          // Le signataire
          new Paragraph({
            children: [
              createBlackText(`${createCheckbox(data.titulaire.typeEngagement === 'societe')} `),
              createBlackText('le signataire '),
              createBlackText(`${data.titulaire.civilite} ${data.titulaire.nomPrenom}`, true),
            ],
            spacing: { after: 80 },
          }),

          // Type d'engagement - Propre compte
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.titulaire.typeEngagement === 'propre-compte')} `),
              createBlackText('s\'engage, sur la base de son offre et pour son propre compte', true),
              createBlackText(' ;'),
            ],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
          createInstructionParagraph('[Indiquer le nom commercial et la dénomination sociale du soumissionnaire, les adresses de son établissement et de son siège social (si elle est différente de celle de l\'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET.]'),

          // Type d'engagement - Société
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.titulaire.typeEngagement === 'societe')} `),
              createBlackText('engage la société ', true),
              createBlackText(data.titulaire.nomCommercial || data.titulaire.denominationSociale || '', true),
              createBlackText(' sur la base de son offre ;'),
            ],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
          createInstructionParagraph('[Indiquer le nom commercial et la dénomination sociale du soumissionnaire, les adresses de son établissement et de son siège social (si elle est différente de celle de l\'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET.]'),

          // Adresses société
          ...(data.titulaire.typeEngagement === 'societe' && data.titulaire.adresseEtablissement ? [
            new Paragraph({
              children: [createBlackText(data.titulaire.adresseEtablissement)],
              spacing: { after: 40 },
              indent: { left: 720 },
            }),
            new Paragraph({
              children: [createBlackText(`Tél : ${data.titulaire.telephone} – Siret : ${data.titulaire.siret}`)],
              spacing: { after: 60 },
              indent: { left: 720 },
            }),
          ] : []),
          ...(data.titulaire.typeEngagement === 'societe' && data.titulaire.adresseSiegeSocial ? [
            new Paragraph({
              children: [createBlackText(data.titulaire.adresseSiegeSocial)],
              spacing: { after: 120 },
              indent: { left: 720 },
            }),
          ] : []),

          // Type d'engagement - Groupement
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.titulaire.typeEngagement === 'groupement')} `),
              createBlackText('l\'ensemble des membres du groupement s\'engagent, sur la base de l\'offre du groupement', true),
              createBlackText(' ;'),
            ],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
          createInstructionParagraph('[Indiquer le nom commercial et la dénomination sociale de chaque membre du groupement, les adresses de son établissement et de son siège social (si elle est différente de celle de l\'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET.]'),

          // Membres du groupement
          ...data.membresGroupement.flatMap(membre => [
            new Paragraph({
              children: [createBlackText(`${membre.nomCommercial} - ${membre.adresseAgence}`)],
              spacing: { after: 40 },
              indent: { left: 720 },
            }),
            new Paragraph({
              children: [createBlackText(`Siret : ${membre.siretAgence}`)],
              spacing: { after: 60 },
              indent: { left: 720 },
            }),
          ]),

          emptyParagraph(),

          // À livrer les fournitures
          new Paragraph({
            children: [createBlackText('à livrer les fournitures demandées ou à exécuter les prestations demandées :')],
            spacing: { after: 80 },
          }),

          // Prix
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.prix.typePrix === 'indiques-ci-dessous')} `),
              createBlackText('aux prix indiqués ci-dessous ;'),
            ],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
          ...(data.prix.typePrix === 'indiques-ci-dessous' ? [
            new Paragraph({
              children: [createBlackText(`        Taux de la TVA : ${data.prix.tauxTVA}%`)],
              indent: { left: 720 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [createBlackText(`        Montant hors taxes arrêté en chiffres à : ${data.prix.montantHTChiffres}`)],
              indent: { left: 720 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [createBlackText(`        Montant hors taxes arrêté en lettres à : ${data.prix.montantHTLettres}`)],
              indent: { left: 720 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [createBlackText(`        Montant TTC arrêté en chiffres à : ${data.prix.montantTTCChiffres}`)],
              indent: { left: 720 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [createBlackText(`        Montant TTC arrêté en lettres à : ${data.prix.montantTTCLettres}`)],
              indent: { left: 720 },
              spacing: { after: 80 },
            }),
          ] : []),
          new Paragraph({
            children: [createBlackText('OU')],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.prix.typePrix === 'annexe-financiere')} `),
              createBlackText('aux prix indiqués ci-dessous ou dans l\'annexe financière jointe au présent document.'),
            ],
            spacing: { after: 200 },
            indent: { left: 360 },
          }),

          // ============================================
          // B2 - NATURE DU GROUPEMENT
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('B2 – Nature du groupement et, en cas de groupement conjoint, répartition des prestations'),
            ],
            spacing: { before: 120, after: 80 },
          }),
          createInstructionParagraph('(En cas de groupement d\'opérateurs économiques.)'),

          new Paragraph({
            children: [createBlackText('Pour l\'exécution du marché public, le groupement d\'opérateurs économiques est :')],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher la case correspondante.)'),

          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.groupement.typeGroupement === 'conjoint')} `),
              createBlackText('conjoint'),
              createBlackText('          OU          '),
              createBlackText(`${createCheckbox(data.groupement.typeGroupement === 'solidaire')} `),
              createBlackText('solidaire'),
            ],
            spacing: { after: 120 },
            indent: { left: 360 },
          }),

          createInstructionParagraph('(Les membres du groupement conjoint indiquent dans le tableau ci-dessous la répartition des prestations que chacun d\'entre eux s\'engage à réaliser.)'),

          // Tableau des prestations du groupement
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                    children: [new Paragraph({ children: [createBlueBoldText('Désignation des membres\ndu groupement conjoint')], alignment: AlignmentType.CENTER })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                    children: [new Paragraph({ children: [createBlueBoldText('Nature de la prestation')], alignment: AlignmentType.CENTER })],
                    width: { size: 45, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                    children: [new Paragraph({ children: [createBlueBoldText('Montant HT\nde la prestation')], alignment: AlignmentType.CENTER })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...data.groupement.repartitionPrestations.map(p => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [createBlackText(p.designationMembre)] })] }),
                  new TableCell({ children: [new Paragraph({ children: [createBlackText(p.naturePrestations)] })] }),
                  new TableCell({ children: [new Paragraph({ children: [createBlackText(p.montantHT)], alignment: AlignmentType.RIGHT })] }),
                ],
              })),
              // Lignes vides si pas de données
              ...(data.groupement.repartitionPrestations.length === 0 ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [createBlackText('')] })] }),
                    new TableCell({ children: [new Paragraph({ children: [createBlackText('')] })] }),
                    new TableCell({ children: [new Paragraph({ children: [createBlackText('')] })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [createBlackText('')] })] }),
                    new TableCell({ children: [new Paragraph({ children: [createBlackText('')] })] }),
                    new TableCell({ children: [new Paragraph({ children: [createBlackText('')] })] }),
                  ],
                }),
              ] : []),
            ],
          }),

          emptyParagraph(),

          // ============================================
          // B3 - COMPTE À CRÉDITER
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('B3 - Compte(s) à créditer'),
            ],
            spacing: { before: 120, after: 80 },
          }),
          createInstructionParagraph('(Joindre un ou des relevé(s) d\'identité bancaire ou postal.)'),

          ...data.comptesBancaires.flatMap(compte => [
            new Paragraph({
              children: [
                createBlackText('■ ', true),
                createBlackText(`Nom de l'établissement bancaire : `),
                createBlackText(`${compte.nomEtablissement}${compte.codeEtablissement ? ` (${compte.codeEtablissement})` : ''}`, true),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                createBlackText('■ ', true),
                createBlackText('Numéro de compte : '),
                createBlackText(compte.numeroCompte, true),
              ],
              spacing: { after: 120 },
            }),
          ]),

          // ============================================
          // B4 - AVANCE
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('B4 - Avance '),
              createItalicText('(article R. 2191-3 ou article R. 2391-1 du code de la commande publique)', FONT_SIZE_NORMAL),
            ],
            spacing: { before: 120, after: 80 },
          }),

          new Paragraph({
            children: [
              createBlackText('Je renonce au bénéfice de l\'avance :'),
              createBlackText('          '),
              createBlackText(`${createCheckbox(!data.avance.renonceBenefice)} `),
              createBlackText('Non'),
              createBlackText('          '),
              createBlackText(`${createCheckbox(data.avance.renonceBenefice)} `),
              createBlackText('Oui'),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher la case correspondante.)'),

          // ============================================
          // B5 - DURÉE D'EXÉCUTION
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('B5 - Durée d\'exécution du marché public'),
            ],
            spacing: { before: 120, after: 80 },
          }),

          new Paragraph({
            children: [
              createBlackText(`La durée d'exécution du marché public est de `),
              createBlackText(`${data.dureeExecution.dureeEnMois} mois`, true),
              createBlackText(` à compter de :`),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher la case correspondante.)'),

          new Paragraph({
            children: [
              createBlackText(`${createCheckbox(data.dureeExecution.pointDepart === 'notification')} `),
              createBlackText('la date de notification du marché public ;'),
            ],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              createBlackText(`${createCheckbox(data.dureeExecution.pointDepart === 'ordre-service')} `),
              createBlackText('la date de notification de l\'ordre de service ;'),
            ],
            spacing: { after: 60 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              createBlackText(`${createCheckbox(data.dureeExecution.pointDepart === 'date-execution')} `),
              createBlackText('la date de début d\'exécution prévue par le marché public lorsqu\'elle est postérieure à la date de notification.'),
            ],
            spacing: { after: 120 },
            indent: { left: 360 },
          }),

          new Paragraph({
            children: [
              createBlackText('Le marché public est reconductible :'),
              createBlackText('          '),
              createBlackText(`${createCheckbox(!data.dureeExecution.estReconductible)} `),
              createBlackText('Non'),
              createBlackText('          '),
              createBlackText(`${createCheckbox(data.dureeExecution.estReconductible)} `),
              createBlackText('Oui'),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher la case correspondante.)'),

          ...(data.dureeExecution.estReconductible ? [
            new Paragraph({
              children: [createBlackText('Si oui, préciser :')],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                createBlackText('■ ', true),
                createBlackText('Nombre des reconductions : '),
                createBlackText(data.dureeExecution.nombreReconductions || '…………'),
              ],
              spacing: { after: 60 },
              indent: { left: 360 },
            }),
            new Paragraph({
              children: [
                createBlackText('■ ', true),
                createBlackText('Durée des reconductions : '),
                createBlackText(data.dureeExecution.dureeReconductions || '…………'),
              ],
              spacing: { after: 120 },
              indent: { left: 360 },
            }),
          ] : []),

          // ============================================
          // SECTION C - SIGNATURE
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('C - Signature du marché public par le titulaire individuel ou, en cas groupement, le mandataire dûment habilité ou chaque membre du groupement', FONT_SIZE_NORMAL),
            ],
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            children: [
              createBlackText('Attention', true),
              createBlackText(', si le soumissionnaire (individuel ou groupement d\'entreprises) a présenté un sous-traitant au stade du dépôt de l\'offre et que l\'acte spécial concernant ce sous-traitant n\'a pas été signé par le soumissionnaire ou membre du groupement et le sous-traitant concerné, il convient de faire signer ce DC4 par le biais du formulaire ATTRI2.'),
            ],
            spacing: { after: 160 },
          }),

          // C1 - Signature titulaire individuel
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('C1 – Signature du marché public par le titulaire individuel :'),
            ],
            spacing: { after: 120 },
          }),

          // Tableau signature C1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                    children: [new Paragraph({ children: [createBlueBoldText('Nom, prénom et qualité\ndu signataire (*)')], alignment: AlignmentType.CENTER })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                    children: [new Paragraph({ children: [createBlueBoldText('Lieu et date de\nsignature')], alignment: AlignmentType.CENTER })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                    children: [new Paragraph({ children: [createBlueBoldText('Signature')], alignment: AlignmentType.CENTER })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [createBlackText(`${data.signatureTitulaire.nomPrenom} –`)] }),
                      new Paragraph({ children: [createBlackText(data.signatureTitulaire.qualite)] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [createBlackText(`A ${data.signatureTitulaire.lieuSignature},`)] }),
                      new Paragraph({ children: [createBlackText(`Le ${data.signatureTitulaire.dateSignature}`)] }),
                    ],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [createBlackText(data.signatureTitulaire.signatureElectronique ? 'électronique' : '')],
                      alignment: AlignmentType.CENTER,
                    })],
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [createItalicText('(*) Le signataire doit avoir le pouvoir d\'engager la personne qu\'il représente.', FONT_SIZE_SMALL)],
            spacing: { before: 60, after: 160 },
          }),

          // C2 - Signature groupement
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('C2 – Signature du marché public en cas de groupement :'),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              createBlackText('Les membres du groupement d\'opérateurs économiques désignent le mandataire suivant '),
              createItalicText('(article R. 2142-23 ou article R. 2342-12 du code de la commande publique)', FONT_SIZE_NORMAL),
              createBlackText(' :'),
            ],
            spacing: { after: 60 },
          }),
          createInstructionParagraph('[Indiquer le nom commercial et la dénomination sociale du mandataire]'),
          new Paragraph({
            children: [createBlackText(data.mandataireGroupement.nomCommercial || data.mandataireGroupement.denominationSociale || '', true)],
            spacing: { after: 120 },
            indent: { left: 360 },
          }),

          new Paragraph({
            children: [createBlackText('En cas de groupement conjoint, le mandataire du groupement est :')],
            spacing: { after: 60 },
          }),
          createInstructionParagraph('(Cocher la case correspondante.)'),
          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.mandataireGroupement.typeMandataire === 'conjoint')} `),
              createBlackText('conjoint'),
              createBlackText('          OU          '),
              createBlackText(`${createCheckbox(data.mandataireGroupement.typeMandataire === 'solidaire')} `),
              createBlackText('solidaire'),
            ],
            spacing: { after: 120 },
            indent: { left: 360 },
          }),

          new Paragraph({
            children: [
              createBlackText(`${createCheckbox(data.mandataireGroupement.mandats.signerActeEngagement || data.mandataireGroupement.mandats.representerAcheteur || data.mandataireGroupement.mandats.coordonnerPrestations)} `),
              createBlackText('Les membres du groupement ont donné mandat au mandataire, qui signe le présent acte d\'engagement :'),
            ],
            spacing: { after: 80 },
          }),
          createInstructionParagraph('(Cocher la ou les cases correspondantes.)'),

          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.mandataireGroupement.mandats.signerActeEngagement)} `),
              createBlackText('pour signer le présent acte d\'engagement en leur nom et pour leur compte, pour les représenter vis-à-vis de l\'acheteur et pour coordonner l\'ensemble des prestations ;'),
            ],
            spacing: { after: 40 },
            indent: { left: 720 },
          }),
          new Paragraph({
            children: [createItalicText('(joindre les pouvoirs en annexe du présent document en cas de marché public autre que de défense ou de sécurité. Dans le cas contraire, ces documents ont déjà été fournis)', FONT_SIZE_SMALL)],
            spacing: { after: 80 },
            indent: { left: 720 },
          }),

          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.mandataireGroupement.mandats.signerModifications)} `),
              createBlackText('pour signer, en leur nom et pour leur compte, les modifications ultérieures du marché public ;'),
            ],
            spacing: { after: 40 },
            indent: { left: 720 },
          }),
          new Paragraph({
            children: [createItalicText('(joindre les pouvoirs en annexe du présent document en cas de marché public autre que de défense ou de sécurité. Dans le cas contraire, ces documents ont déjà été fournis)', FONT_SIZE_SMALL)],
            spacing: { after: 80 },
            indent: { left: 720 },
          }),

          new Paragraph({
            children: [
              createBlackText(`    ${createCheckbox(data.mandataireGroupement.mandats.conditionsAnnexe)} `),
              createBlackText('ont donné mandat au mandataire dans les conditions définies par les pouvoirs joints en annexe.'),
            ],
            spacing: { after: 40 },
            indent: { left: 720 },
          }),
          new Paragraph({
            children: [createItalicText('(hors cas des marchés de défense ou de sécurité dans lequel ces documents ont déjà été fournis).', FONT_SIZE_SMALL)],
            spacing: { after: 120 },
            indent: { left: 720 },
          }),

          // Tableau signatures groupement
          ...(data.mandataireGroupement.signataires.length > 0 ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({
                      shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                      children: [new Paragraph({ children: [createBlueBoldText('Nom, prénom et qualité\ndu signataire (*)')], alignment: AlignmentType.CENTER })],
                      width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                      children: [new Paragraph({ children: [createBlueBoldText('Lieu et date de signature')], alignment: AlignmentType.CENTER })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
                      children: [new Paragraph({ children: [createBlueBoldText('Signature')], alignment: AlignmentType.CENTER })],
                      width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                ...data.mandataireGroupement.signataires.map(sig => new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [createBlackText(`${sig.nomPrenom} –`)] }),
                        new Paragraph({ children: [createBlackText(sig.qualite)] }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [createBlackText(`A ${sig.lieuSignature},`)] }),
                        new Paragraph({ children: [createBlackText(`Le ${sig.dateSignature}`)] }),
                      ],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [createBlackText(sig.signatureElectronique ? 'électronique' : '')],
                        alignment: AlignmentType.CENTER,
                      })],
                      verticalAlign: VerticalAlign.CENTER,
                    }),
                  ],
                })),
              ],
            }),
            new Paragraph({
              children: [createItalicText('(*) Le signataire doit avoir le pouvoir d\'engager la personne qu\'il représente.', FONT_SIZE_SMALL)],
              spacing: { before: 60, after: 160 },
            }),
          ] : []),

          // ============================================
          // SECTION D - ACHETEUR
          // ============================================
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: COLOR_CYAN_LIGHT },
            children: [
              createBlueBoldText('D - Identification et signature de l\'acheteur.', FONT_SIZE_HEADER),
            ],
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            children: [
              createBlackText('■ ', true),
              createBlueBoldText('Désignation de l\'acheteur'),
            ],
            spacing: { after: 60 },
          }),
          createInstructionParagraph('(Reprendre le contenu de la mention figurant dans l\'avis d\'appel à la concurrence ou l\'invitation à confirmer l\'intérêt ; en cas de publication d\'une annonce au Journal officiel de l\'Union européenne ou au Bulletin officiel des annonces de marchés publics, la simple indication de la référence à cet avis est suffisante.)'),
          new Paragraph({
            children: [createBlackText(data.acheteur.designation || '')],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              createBlackText('■ ', true),
              createBlueBoldText('Nom, prénom, qualité du signataire du marché public'),
            ],
            spacing: { after: 60 },
          }),
          createInstructionParagraph('(Le signataire doit avoir le pouvoir d\'engager l\'acheteur qu\'il représente.)'),
          new Paragraph({
            children: [createBlackText(`${data.acheteur.signataire.civilite} ${data.acheteur.signataire.nomPrenom} ${data.acheteur.signataire.qualite}`)],
            spacing: { after: 160 },
          }),

          new Paragraph({
            children: [
              createBlackText(`A : ${data.acheteur.lieuSignature} , le `),
              createBlackText(data.acheteur.dateSignature || '…………………'),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              createBlackText('Signature', true),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              createItalicText('(représentant de l\'acheteur habilité à signer le\nmarché public)', FONT_SIZE_SMALL),
            ],
            spacing: { after: 200 },
          }),

          // Note de bas de page
          new Paragraph({
            children: [
              new TextRun({ text: '¹ ', size: FONT_SIZE_SMALL, superScript: true }),
              new TextRun({ text: 'Formulaire non obligatoire disponible, avec sa notice explicative, sur le site du ministère chargé de l\'économie.', size: FONT_SIZE_SMALL, font: FONT_PRINCIPAL }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  // Générer et télécharger le fichier
  const blob = await Packer.toBlob(doc);
  const filename = `ATTRI1_Acte_Engagement_${numeroReference.replace(/[^a-zA-Z0-9]/g, '_')}_Lot${lotNum}.docx`;
  saveAs(blob, filename);
};
