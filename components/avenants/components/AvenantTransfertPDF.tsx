// ============================================
// AvenantTransfertPDF — Composant React PDF
// Avenant de transfert (art. R2194-6 2° CCP)
// ============================================

import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer';
import type { AvenantTransfertData } from '../types';

// ─── Palette (identique à AvenantPDF) ────────────────────────────────────────
const TEAL        = '#2F5B58';
const TEAL_DARK   = '#1e3d3b';
const TEAL_LIGHT  = '#e8f4f3';
const TEAL_BORDER = '#a7d4d1';
const TEXT_DARK   = '#1f2937';
const TEXT_GRAY   = '#6b7280';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 88, paddingBottom: 60, paddingHorizontal: 48,
    fontSize: 10, fontFamily: 'Helvetica', backgroundColor: '#ffffff',
  },
  headerFixed: {
    position: 'absolute', top: 16, left: 48, right: 48,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: TEAL,
  },
  logo:           { width: 68, height: 44, objectFit: 'contain' },
  headerCenter:   { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle:    { fontSize: 8.5, fontWeight: 'bold', color: TEAL_DARK, textAlign: 'center' },
  headerSubtitle: { fontSize: 7, color: TEAL, textAlign: 'center', marginTop: 2 },
  footerFixed: {
    position: 'absolute', bottom: 14, left: 48, right: 48,
    borderTopWidth: 1, borderTopColor: TEAL_BORDER, paddingTop: 7,
  },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft:    { fontSize: 7, color: TEAL_DARK, fontStyle: 'italic' },
  footerCenter:  { fontSize: 7, color: TEAL },
  footerRight:   { fontSize: 7, color: TEAL_DARK },
  content:       { flex: 1 },

  // Bandeau titre
  titleBanner:    { marginBottom: 8, borderWidth: 1, borderColor: TEAL, borderRadius: 4, overflow: 'hidden' },
  titleBannerTop: { flexDirection: 'row' },
  titleBannerLeft: {
    flex: 1, backgroundColor: TEAL_LIGHT, paddingHorizontal: 12, paddingVertical: 7, justifyContent: 'center',
  },
  titleBannerRight: {
    width: 80, backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center', padding: 8,
  },
  titleH1:       { fontSize: 10, fontWeight: 'bold', color: TEAL_DARK, textAlign: 'center', marginBottom: 2 },
  titleH2:       { fontSize: 7.5, color: TEAL, textAlign: 'center' },
  notiCode:      { fontSize: 8.5, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  notiSub:       { fontSize: 6.5, color: '#d1ede8', marginTop: 2, textAlign: 'center' },
  titleAvenantNum: {
    backgroundColor: '#f0faf9', paddingHorizontal: 12, paddingVertical: 5,
    borderTopWidth: 1, borderTopColor: TEAL_BORDER, alignItems: 'center',
  },
  titleAvenantNumText: { fontSize: 9, fontWeight: 'bold', color: TEAL_DARK, textAlign: 'center' },

  // Sections
  section:        { marginBottom: 8 },
  sectionHeader:  {
    backgroundColor: TEAL, color: '#ffffff', paddingVertical: 5, paddingHorizontal: 10,
    fontSize: 8, fontWeight: 'bold', borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  sectionContent: {
    borderWidth: 1, borderTopWidth: 0, borderColor: TEAL_BORDER,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    padding: 8, backgroundColor: TEAL_LIGHT,
  },

  // Champs
  fieldRow:   { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  fieldLabel: { fontSize: 7.5, fontWeight: 'bold', color: TEAL_DARK, width: 160, flexShrink: 0 },
  fieldValue: { fontSize: 7.5, color: TEXT_DARK, flex: 1 },

  // Texte courant
  paragraph:    { fontSize: 7.5, color: TEXT_DARK, marginBottom: 4, lineHeight: 1.5 },
  articleTitle: { fontSize: 8, fontWeight: 'bold', color: TEAL_DARK, marginBottom: 3, marginTop: 6 },
  instruction:  { fontSize: 7, fontStyle: 'italic', color: TEXT_GRAY, marginBottom: 5, lineHeight: 1.4 },
  subLabel:     { fontSize: 8, fontWeight: 'bold', color: TEAL_DARK, marginBottom: 3, marginTop: 5, textDecoration: 'underline' },
  divider:      { borderBottomWidth: 0.5, borderBottomColor: TEAL_BORDER, marginVertical: 5 },

  // Nouvean titulaire dans section A
  ntBox: {
    borderTopWidth: 0.5, borderTopColor: TEAL_BORDER, marginTop: 6, paddingTop: 5,
  },
  ntTitle: { fontSize: 7.5, fontWeight: 'bold', color: TEAL, marginBottom: 3 },

  // Signatures section C
  sigRow:       { flexDirection: 'row', borderWidth: 1, borderColor: TEAL_BORDER, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  sigColLeft:   { flex: 1, padding: 10, borderRightWidth: 0.5, borderRightColor: TEAL_BORDER, backgroundColor: '#f8fefd' },
  sigColRight:  { flex: 1, padding: 10, backgroundColor: '#f8fefd' },
  sigColTitle:  { fontSize: 8, fontWeight: 'bold', color: TEAL_DARK, marginBottom: 5 },
  sigColLine:   { fontSize: 7.5, color: TEXT_DARK, marginBottom: 3 },
  sigSpaceLine: { fontSize: 7.5, color: TEXT_GRAY, marginBottom: 14 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string | null | undefined): string {
  if (!d) return '……………………';
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime()))
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { /* ignore */ }
  return d;
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label} :</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return <View style={styles.sectionHeader}><Text>{letter} – {title}</Text></View>;
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface AvenantTransfertPDFProps {
  data: AvenantTransfertData;
  logoAfpa?: string;
  logoRepublique?: string;
}

export function AvenantTransfertPDF({ data, logoAfpa, logoRepublique }: AvenantTransfertPDFProps) {
  const nt = {
    denomination:      data.nouveau_titulaire_denomination || '…………………………………',
    formeJuridique:    data.nouveau_titulaire_forme_juridique || '…………………………………',
    rcs:               data.nouveau_titulaire_rcs || '…………………………………',
    rcsVille:          data.nouveau_titulaire_rcs_ville || '…………………',
    adresse:           data.nouveau_titulaire_adresse || '…………………………………',
  };
  const at = {
    denomination:      data.ancien_titulaire_denomination || '…………………………………',
    formeJuridique:    data.ancien_titulaire_forme_juridique || '…………………………………',
    rcs:               data.ancien_titulaire_rcs || '…………………………………',
    rcsVille:          data.ancien_titulaire_rcs_ville || '…………………',
    adresse:           data.ancien_titulaire_adresse || '…………………………………',
  };

  const Header = () => (
    <View style={styles.headerFixed} fixed>
      {logoAfpa ? <Image style={styles.logo} src={logoAfpa} /> : <View style={styles.logo} />}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</Text>
        <Text style={styles.headerSubtitle}>Direction des Affaires Juridiques</Text>
      </View>
      {logoRepublique ? <Image style={styles.logo} src={logoRepublique} /> : <View style={styles.logo} />}
    </View>
  );

  const Footer = () => (
    <View style={styles.footerFixed} fixed>
      <View style={styles.footerContent}>
        <Text style={styles.footerLeft}>Avenant de transfert</Text>
        <Text style={styles.footerCenter}>
          ({data.contrat_reference || 'référence du marché'})
        </Text>
        <Text
          style={styles.footerRight}
          render={({ pageNumber, totalPages }) => `Page : ${pageNumber} / ${totalPages}`}
        />
      </View>
    </View>
  );

  return (
    <Document
      title={`Avenant de transfert N°${data.numero_avenant ?? 'X'} — ${data.contrat_reference || ''}`}
      author="Afpa"
    >
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />

        <View style={styles.content}>

          {/* ── Bandeau titre ─────────────────────────────────────────────── */}
          <View style={styles.titleBanner} wrap={false}>
            <View style={styles.titleBannerTop}>
              <View style={styles.titleBannerLeft}>
                <Text style={styles.titleH1}>MARCHÉS PUBLICS</Text>
                <Text style={styles.titleH2}>Avenant de transfert au marché public</Text>
              </View>
              <View style={styles.titleBannerRight}>
                <Text style={styles.notiCode}>TRANSFERT</Text>
                <Text style={styles.notiSub}>Art. R2194-6 2°</Text>
                <Text style={styles.notiSub}>CCP</Text>
              </View>
            </View>
            <View style={styles.titleAvenantNum}>
              <Text style={styles.titleAvenantNumText}>
                AVENANT DE TRANSFERT N° {data.numero_avenant ?? '…………………'}{' '}
                au marché {data.contrat_reference || '…………………………………………'}
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              A — Renseignements concernant le contrat
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="A" title="Renseignements concernant le contrat" />
            <View style={styles.sectionContent}>

              <View wrap={false}>
                <Field label="Personne publique contractante"
                  value={"Afpa\nAgence nationale pour la Formation Professionnelle des Adultes"} />
                <Field label={data.responsable_contrat_titre || "Personne responsable du contrat"}
                  value={data.responsable_contrat_nom} />
                <Field label="Conducteur de l'opération"
                  value={"Direction Nationale des Achats\nAfpa - CITYSCOPE\n3 rue Franklin, 93100 MONTREUIL"} />
              </View>

              <View style={styles.divider} />

              {/* Nouveau Titulaire */}
              <View style={styles.ntBox} wrap={false}>
                <Text style={styles.ntTitle}>Nouveau Titulaire du Contrat</Text>
                <Field label="Désignation et adresse"
                  value={`${nt.denomination}\n${nt.formeJuridique} immatriculée au RCS de ${nt.rcsVille} sous le numéro ${nt.rcs}\n${nt.adresse}`} />
              </View>

              <View style={styles.divider} />

              <View wrap={false}>
                <Field label="Numéro de Contrat Modifié" value={data.contrat_reference} />
                <Field label="Date de notification" value={formatDate(data.date_notification)} />
                <Field label="Objet"
                  value="Avenant de transfert en application de l'article R2194-6 2° du Code de la Commande Publique" />
              </View>

            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              B — Objet de l'avenant
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="B" title="Objet de l'avenant" />
            <View style={styles.sectionContent}>

              {/* Préambule */}
              <View wrap={false}>
                <Text style={styles.subLabel}>Préambule</Text>
                <Text style={styles.paragraph}>
                  La société {at.denomination} (ci-après « ancien titulaire »),{' '}
                  {at.formeJuridique}, immatriculée au registre du commerce et des sociétés
                  de {at.rcsVille} sous le numéro {at.rcs}, et ayant comme adresse{' '}
                  {at.adresse}, a été attributaire du marché n° {data.contrat_reference || '……………………………………'},
                  par notification en date du {formatDate(data.date_notification)}.
                </Text>
                <Text style={styles.paragraph}>
                  Par décision de l'actionnaire unique de l'ancien titulaire et de son groupe,
                  il a été décidé de procéder à une {data.nature_operation || 'Fusion Absorption'}{' '}
                  entre la société {nt.denomination} (société absorbante)
                  et la société {at.denomination} (société absorbée), ayant des objets sociaux connexes.
                </Text>
                <Text style={styles.paragraph}>
                  Conformément au Code de la Commande publique, à la jurisprudence en la matière,
                  un accord préalable de l'Afpa a été réclamé et obtenu en date du{' '}
                  {formatDate(data.date_accord_afpa)}.
                </Text>
                <Text style={styles.paragraph}>
                  En conséquence de quoi il a été décidé ce qui suit :
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Article 1 */}
              <View wrap={false}>
                <Text style={styles.articleTitle}>Article 1. Objet</Text>
                <Text style={styles.paragraph}>
                  Le présent avenant a pour objet d'acter, en application de l'article R.2194-6 2°
                  du Code de la commande publique, la modification du titulaire du marché initial,
                  et des capacités suffisantes du nouveau Titulaire se substituant à l'ancien telles
                  que définies par l'Afpa dans la procédure de passation du marché initial.
                </Text>
              </View>

              {/* Article 2 */}
              <View wrap={false}>
                <Text style={styles.articleTitle}>Article 2. Modifications</Text>
                <Text style={styles.paragraph}>
                  À compter de la date de prise d'effet des présentes, la société {nt.denomination}{' '}
                  sera purement et simplement substituée à la société {at.denomination} dans
                  l'exécution du marché public initial, les autres termes et conditions dudit contrat
                  demeurant inchangés.
                </Text>
                <Text style={styles.paragraph}>
                  En conséquence, la société {nt.denomination} poursuivra jusqu'à son terme et dans
                  son intégralité l'exécution du Marché Public visé en préambule des présentes, en
                  lieu et place de l'ancien titulaire.
                </Text>
                <Text style={styles.paragraph}>
                  Les pièces nécessaires justifiant des capacités du nouveau titulaire (Annexe A : DC2
                  et ses annexes, ainsi que tous les documents justifiant de la{' '}
                  {data.nature_operation || 'fusion'}) sont jointes en annexe A du présent avenant.
                </Text>
                <Text style={styles.paragraph}>
                  L'Afpa se libérera des sommes dues par elle au titre du marché public cité en
                  préambule, au compte ouvert au nom de la société {nt.denomination},
                  sous la domiciliation bancaire annexée au présent avenant (Annexe B).
                </Text>
              </View>

              {/* Article 3 */}
              <View wrap={false}>
                <Text style={styles.articleTitle}>Article 3. Prise d'effet</Text>
                <Text style={styles.paragraph}>
                  Le présent avenant prend effet à compter du {formatDate(data.date_prise_effet)}{' '}
                  jusqu'à la complète exécution de la prestation du marché cité en objet.
                </Text>
              </View>

              {/* Article 4 */}
              <View wrap={false}>
                <Text style={styles.articleTitle}>Article 4. Incidence financière de l'avenant</Text>
                <Text style={styles.paragraph}>
                  Les conditions techniques et financières du marché restant inchangées, le présent
                  avenant n'emporte aucune incidence financière sur le marché.
                </Text>
              </View>

              {/* Article 5 */}
              <View wrap={false}>
                <Text style={styles.articleTitle}>Article 5. Conditions générales</Text>
                <Text style={styles.paragraph}>
                  Toutes les clauses et conditions du marché public initial cité en préambule non
                  contraires aux présentes restent et demeurent avec leur plein et entier effet.
                </Text>
              </View>

            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              C — Signatures
          ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.section} wrap={false}>
            <SectionHeader letter="C" title="Signatures de l'avenant" />
            <View style={styles.sectionContent}>
              <View style={styles.sigRow}>

                {/* Colonne gauche — Nouveau Titulaire */}
                <View style={styles.sigColLeft}>
                  <Text style={styles.sigColTitle}>
                    Le Nouveau Titulaire, la société {nt.denomination}
                  </Text>
                  <Text style={styles.sigSpaceLine}>
                    Signature, date et cachet de la Société
                  </Text>
                  <Text style={styles.sigColLine}>À ……………………………………… le ………………………</Text>
                </View>

                {/* Colonne droite — Afpa */}
                <View style={styles.sigColRight}>
                  <Text style={styles.sigColTitle}>Pour l'Afpa, par délégation,</Text>
                  <Text style={styles.sigColLine}>{data.signataire_afpa_nom || '………………………………'}</Text>
                  <Text style={[styles.sigColLine, { color: TEXT_GRAY, fontSize: 7 }]}>
                    {data.signataire_afpa_titre || '………………………………'}
                  </Text>
                  <Text style={[styles.sigSpaceLine, { marginTop: 8 }]}> </Text>
                  <Text style={styles.sigColLine}>
                    À Montreuil, le ………………………………………….
                  </Text>
                </View>

              </View>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}
