// ============================================
// AvenantPDF — Composant React PDF (EXE10)
// Structure officielle du formulaire EXE10
// ============================================

import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer';
import type { AvenantData } from '../types';

// ─── Palette ──────────────────────────────────────────────────────────────────
const TEAL        = '#2F5B58';
const TEAL_DARK   = '#1e3d3b';
const TEAL_LIGHT  = '#e8f4f3';
const TEAL_BORDER = '#a7d4d1';
const TEXT_DARK   = '#1f2937';
const TEXT_GRAY   = '#6b7280';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 88,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // Header
  headerFixed: {
    position: 'absolute', top: 16, left: 48, right: 48,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: TEAL,
  },
  logo:           { width: 68, height: 44, objectFit: 'contain' },
  headerCenter:   { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle:    { fontSize: 8.5, fontWeight: 'bold', color: TEAL_DARK, textAlign: 'center' },
  headerSubtitle: { fontSize: 7, color: TEAL, textAlign: 'center', marginTop: 2 },

  // Footer
  footerFixed: {
    position: 'absolute', bottom: 14, left: 48, right: 48,
    borderTopWidth: 1, borderTopColor: TEAL_BORDER, paddingTop: 7,
  },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft:    { fontSize: 7, color: TEAL_DARK, fontStyle: 'italic' },
  footerCenter:  { fontSize: 7, color: TEAL },
  footerRight:   { fontSize: 7, color: TEAL_DARK },

  content: { flex: 1 },

  // Bandeau titre
  titleBanner: {
    marginBottom: 5, borderWidth: 1, borderColor: TEAL, borderRadius: 4, overflow: 'hidden',
  },
  titleBannerTop: { flexDirection: 'row' },
  titleBannerLeft: {
    flex: 1, backgroundColor: TEAL_LIGHT, paddingHorizontal: 12, paddingVertical: 7, justifyContent: 'center',
  },
  titleBannerRight: {
    width: 68, backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center', padding: 8,
  },
  titleH1:  { fontSize: 10, fontWeight: 'bold', color: TEAL_DARK, textAlign: 'center', marginBottom: 2 },
  titleH2:  { fontSize: 7.5, color: TEAL, textAlign: 'center' },
  notiCode: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  notiSub:  { fontSize: 6.5, color: '#d1ede8', marginTop: 2 },
  titleAvenantNum: {
    backgroundColor: '#f0faf9', paddingHorizontal: 12, paddingVertical: 5,
    borderTopWidth: 1, borderTopColor: TEAL_BORDER, alignItems: 'center',
  },
  titleAvenantNumText: { fontSize: 9, fontWeight: 'bold', color: TEAL_DARK, textAlign: 'center' },

  // Intro
  intro: {
    fontSize: 7.5, fontStyle: 'italic', color: TEXT_GRAY,
    marginBottom: 8, marginTop: 3, lineHeight: 1.4, textAlign: 'justify',
  },

  // Sections
  section:       { marginBottom: 8 },
  sectionHeader: {
    backgroundColor: TEAL, color: '#ffffff', paddingVertical: 5, paddingHorizontal: 10,
    fontSize: 8, fontWeight: 'bold',
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  sectionContent: {
    borderWidth: 1, borderTopWidth: 0, borderColor: TEAL_BORDER,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    padding: 8, backgroundColor: TEAL_LIGHT,
  },

  // Instruction italique
  instruction: { fontSize: 7, fontStyle: 'italic', color: TEXT_GRAY, marginBottom: 5, lineHeight: 1.4 },

  // Sous-titres
  subLabel: {
    fontSize: 8, fontWeight: 'bold', color: TEAL_DARK, marginBottom: 2, marginTop: 5,
    textDecoration: 'underline',
  },
  subLabelSmall: { fontSize: 7.5, fontWeight: 'bold', color: TEAL_DARK, marginBottom: 2, marginTop: 5 },

  // Champs
  fieldRow:      { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  fieldLabel:    { fontSize: 7.5, fontWeight: 'bold', color: TEAL_DARK, width: 140, flexShrink: 0 },
  fieldValue:    { fontSize: 7.5, color: TEXT_DARK, flex: 1 },
  fieldValueFull: { fontSize: 7.5, color: TEXT_DARK, marginBottom: 3 },

  // Bullets
  bulletItem:  { flexDirection: 'row', marginBottom: 2, paddingLeft: 8 },
  bulletDot:   { fontSize: 7.5, color: TEAL_DARK, width: 12 },
  bulletText:  { fontSize: 7.5, color: TEAL_DARK, flex: 1 },
  bulletValue: { fontSize: 7.5, fontWeight: 'bold', color: TEXT_DARK, flex: 1.5 },

  // Séparateur
  divider: { borderBottomWidth: 0.5, borderBottomColor: TEAL_BORDER, marginVertical: 5 },

  // Cases à cocher
  checkbox: {
    width: 10, height: 10, borderWidth: 1, borderColor: TEXT_DARK, borderRadius: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: TEAL, borderColor: TEAL },

  // Délai
  delaiBox: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 4, padding: 7, marginTop: 6, flexDirection: 'row', alignItems: 'center',
  },
  delaiLabel: { fontSize: 7.5, fontWeight: 'bold', color: '#92400e', width: 140 },
  delaiValue: { fontSize: 8, fontWeight: 'bold', color: '#92400e' },

  // Tableau signatures E
  sigTable:          { borderWidth: 1, borderColor: TEAL_BORDER, borderRadius: 3, overflow: 'hidden', marginTop: 5 },
  sigTableHead:      { flexDirection: 'row', backgroundColor: TEAL },
  sigTableRow:       { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: TEAL_BORDER, minHeight: 28 },
  sigTableCellHead:  { padding: 5, fontSize: 7.5, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#5a9c98' },
  sigTableCellHLast: { padding: 5, fontSize: 7.5, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' },
  sigTableCell:      { padding: 4, fontSize: 7, color: TEXT_DARK, borderRightWidth: 0.5, borderRightColor: TEAL_BORDER },
  sigTableCellLast:  { padding: 4, fontSize: 7, color: TEXT_DARK },
  sigNote:           { fontSize: 6.5, color: TEXT_GRAY, fontStyle: 'italic', marginTop: 4 },

  paragraph: { fontSize: 7.5, color: TEXT_DARK, marginBottom: 3, lineHeight: 1.5 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime()))
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { /* ignore */ }
  return d;
}

function formatMontant(val: number | null | undefined, suffix = '€ HT'): string {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + suffix;
}

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label} :</Text>
      <Text style={styles.fieldValue}>{value != null && value !== '' ? String(value) : '—'}</Text>
    </View>
  );
}

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return <View style={styles.sectionHeader}><Text>{letter} – {title}</Text></View>;
}

function Bullet({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{label} : </Text>
      <Text style={styles.bulletValue}>{value || '—'}</Text>
    </View>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked ? styles.checkboxChecked : {}]}>
      {checked && <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold' }}>✓</Text>}
    </View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface AvenantPDFProps {
  data: AvenantData;
  logoAfpa?: string;
  logoRepublique?: string;
}

export function AvenantPDF({ data, logoAfpa, logoRepublique }: AvenantPDFProps) {
  const montantInitial    = data.montant_initial_ht ?? 0;
  const montantPrecedent  = data.montant_precedent_ht ?? 0;
  const montantAvenant    = data.montant_avenant_ht ?? 0;
  const montantNouveau    = montantPrecedent + montantAvenant;
  const tauxTVA           = parseFloat((data.taux_tva || '20').replace('%', '').trim()) / 100;
  const montantInitialTTC = montantInitial * (1 + tauxTVA);
  const montantAvenantTTC = montantAvenant * (1 + tauxTVA);
  const montantNouveauTTC = montantNouveau * (1 + tauxTVA);
  const montantCumule     = montantNouveau - montantInitial;
  const pctEcart          = montantInitial ? (montantAvenant / montantInitial * 100) : null;
  const pctCumule         = montantInitial ? (montantCumule / montantInitial * 100) : null;
  const description       = htmlToText(data.description_avenant);

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
        <Text style={styles.footerLeft}>EXE10 – Avenant</Text>
        <Text style={styles.footerCenter}>
          ({data.contrat_reference || "référence du marché public ou de l'accord-cadre"})
        </Text>
        <Text
          style={styles.footerRight}
          render={({ pageNumber, totalPages }) => `Page : ${pageNumber} / ${totalPages}`}
        />
      </View>
    </View>
  );

  return (
    <Document title={`Avenant N°${data.numero_avenant ?? 'X'} — ${data.contrat_reference || ''}`} author="AFPA">
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />

        <View style={styles.content}>

          {/* ── Bandeau titre ─────────────────────────────────────────────── */}
          <View style={styles.titleBanner}>
            <View style={styles.titleBannerTop}>
              <View style={styles.titleBannerLeft}>
                <Text style={styles.titleH1}>MARCHÉS PUBLICS</Text>
                <Text style={styles.titleH2}>Avenant au marché public</Text>
              </View>
              <View style={styles.titleBannerRight}>
                <Text style={styles.notiCode}>EXE10</Text>
                <Text style={styles.notiSub}>Avenant</Text>
              </View>
            </View>
            <View style={styles.titleAvenantNum}>
              <Text style={styles.titleAvenantNumText}>
                AVENANT N° {data.numero_avenant ?? '…………………'}{' '}
                au marché {data.contrat_reference || '…………………………………………'}
              </Text>
            </View>
          </View>

          {/* ── Intro ─────────────────────────────────────────────────────── */}
          <Text style={styles.intro}>
            Le formulaire EXE10 est un modèle d'avenant, qui peut être utilisé par le pouvoir adjudicateur
            ou l'entité adjudicatrice, dans le cadre de l'exécution d'un marché public.
          </Text>

          {/* ═══════════════════════════════════════════════════════
              A — Identification du pouvoir adjudicateur
          ═══════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="A" title="Identification du pouvoir adjudicateur ou de l'entité adjudicatrice" />
            <View style={styles.sectionContent}>
              <Text style={styles.instruction}>
                (Reprendre le contenu de la mention figurant dans les documents constitutifs du marché public.)
              </Text>
              <Field label="Organisme" value={"Afpa - Agence pour la formation professionnelle des adultes\n3 rue Franklin\n93100 MONTREUIL"} />
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              B — Identification du titulaire du marché public
          ═══════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="B" title="Identification du titulaire du marché public" />
            <View style={styles.sectionContent}>
              <Text style={styles.instruction}>
                [Indiquer le nom commercial et la dénomination sociale du titulaire individuel ou de chaque
                membre du groupement titulaire, les adresses de son établissement et de son siège social
                (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros
                de téléphone et de télécopie et son numéro SIRET. En cas de groupement d'entreprises
                titulaire, identifier le mandataire du groupement.]
              </Text>
              <Field label="Nom / Raison sociale" value={data.titulaire_nom || data.titulaire} />
              <Field label="Numéro SIRET"         value={data.titulaire_siret} />
              <Field label="Adresse"              value={data.titulaire_adresse} />
              <Field label="E-mail"               value={data.titulaire_email} />
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              C — Objet du marché public
          ═══════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="C" title="Objet du marché public" />
            <View style={styles.sectionContent}>

              <Text style={[styles.subLabel, { marginTop: 0 }]}>Objet du marché public :</Text>
              <Text style={styles.fieldValueFull}>{data.contrat_libelle || '—'}</Text>
              <Text style={styles.instruction}>
                (Reprendre le contenu de la mention figurant dans les documents constitutifs du marché public.
                En cas d'allotissement, préciser également l'objet et la dénomination du lot concerné.)
              </Text>

              <View style={styles.divider} />

              <Field label="Date de la notification du marché public" value={formatDate(data.date_notification)} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Durée d'exécution :</Text>
                <Text style={styles.fieldValue}>
                  {data.duree_marche || '……………………'} mois ou …………………… jours
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.subLabelSmall}>Montant initial du marché public :</Text>
              <Bullet label="Taux de la TVA" value={data.taux_tva || '—'} />
              <Bullet label="Montant HT"     value={formatMontant(data.montant_initial_ht)} />
              <Bullet label="Montant TTC"    value={formatMontant(montantInitialTTC, '€ TTC')} />
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              D — Objet de l'avenant
          ═══════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="D" title="Objet de l'avenant" />
            <View style={styles.sectionContent}>

              {/* Modifications introduites — titre + instruction ne se séparent pas */}
              <View wrap={false}>
                <Text style={[styles.subLabel, { marginTop: 0 }]}>Modifications introduites par le présent avenant :</Text>
                <Text style={styles.instruction}>
                  (Détailler toutes les modifications, avec ou sans incidence financière, introduites dans le
                  marché public par le présent avenant. Préciser les articles du CCAP ou du CCTP modifiés ou
                  complétés ainsi que l'incidence financière de chacune des modifications apportées.)
                </Text>
              </View>

              {/* Chaque paragraphe de description reste entier (pas de coupure au milieu) */}
              {description
                ? description.split('\n').filter(Boolean).map((line, i) => (
                    <View key={i} wrap={false}>
                      <Text style={styles.paragraph}>{line}</Text>
                    </View>
                  ))
                : <Text style={[styles.paragraph, { color: TEXT_GRAY, fontStyle: 'italic' }]}>—</Text>
              }

              <View style={[styles.divider, { marginTop: 8 }]} />

              {/* Incidence financière — bloc entier non coupable */}
              <View wrap={false}>
                <Text style={styles.subLabel}>Incidence financière de l'avenant :</Text>
                <Text style={[styles.paragraph, { marginBottom: 2 }]}>
                  L'avenant a une incidence financière sur le montant du marché public :
                </Text>
                <Text style={[styles.instruction, { marginBottom: 6 }]}>(Cocher la case correspondante.)</Text>
                <View style={{ flexDirection: 'row', gap: 30, marginBottom: 8, paddingLeft: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <CheckBox checked={!data.incidence_financiere} />
                    <Text style={{ fontSize: 8, color: TEXT_DARK }}>Non</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <CheckBox checked={!!data.incidence_financiere} />
                    <Text style={{ fontSize: 8, color: TEXT_DARK }}>Oui</Text>
                  </View>
                </View>
              </View>

              {data.incidence_financiere && (
                <>
                  {/* Montant de l'avenant — bloc entier non coupable */}
                  <View wrap={false}>
                    <Text style={styles.subLabelSmall}>Montant de l'avenant :</Text>
                    <Bullet label="Taux de la TVA"                     value={data.taux_tva || '—'} />
                    <Bullet label="Montant HT"                         value={formatMontant(data.montant_avenant_ht)} />
                    <Bullet label="Montant TTC"                        value={formatMontant(montantAvenantTTC, '€ TTC')} />
                    <Bullet
                      label="% d'écart introduit par l'avenant"
                      value={pctEcart !== null ? `${pctEcart >= 0 ? '+' : ''}${pctEcart.toFixed(2)} %` : '—'}
                    />
                    {pctCumule !== null && (
                      <Bullet
                        label="% d'écart cumulé (tous avenants)"
                        value={`${pctCumule >= 0 ? '+' : ''}${pctCumule.toFixed(2)} %`}
                      />
                    )}
                  </View>

                  {/* Nouveau montant — bloc entier non coupable */}
                  <View wrap={false}>
                    <Text style={[styles.subLabelSmall, { marginTop: 6 }]}>Nouveau montant du marché public :</Text>
                    <Bullet label="Taux de la TVA" value={data.taux_tva || '—'} />
                    <Bullet label="Montant HT"     value={formatMontant(montantNouveau)} />
                    <Bullet label="Montant TTC"    value={formatMontant(montantNouveauTTC, '€ TTC')} />
                  </View>
                </>
              )}

              {/* Modification du délai — bloc entier non coupable */}
              {data.nouvelle_date_fin && (
                <View wrap={false} style={[styles.delaiBox, { marginTop: 8 }]}>
                  <Text style={styles.delaiLabel}>Nouvelle date de fin :</Text>
                  <Text style={styles.delaiValue}>{formatDate(data.nouvelle_date_fin)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              E — Signature du titulaire du marché public
          ═══════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="E" title="Signature du titulaire du marché public" />
            <View style={styles.sectionContent}>
              <View style={styles.sigTable}>
                <View style={styles.sigTableHead}>
                  <Text style={[styles.sigTableCellHead, { flex: 2 }]}>
                    Nom, prénom et qualité{'\n'}du signataire (*)
                  </Text>
                  <Text style={[styles.sigTableCellHead, { flex: 1.5 }]}>Lieu et date de signature</Text>
                  <Text style={[styles.sigTableCellHLast, { flex: 1 }]}>Signature</Text>
                </View>
                {/* 1ère ligne : préremplie si signataire connu */}
                <View style={styles.sigTableRow}>
                  <Text style={[styles.sigTableCell, { flex: 2 }]}>
                    {[data.frn_nom_signataire, data.frn_fonction_signataire].filter(Boolean).join('\n') || ' '}
                  </Text>
                  <Text style={[styles.sigTableCell, { flex: 1.5 }]}>{' '}</Text>
                  <Text style={[styles.sigTableCellLast, { flex: 1 }]}>{' '}</Text>
                </View>
                {/* 4 lignes vides */}
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={styles.sigTableRow}>
                    <Text style={[styles.sigTableCell, { flex: 2 }]}>{' '}</Text>
                    <Text style={[styles.sigTableCell, { flex: 1.5 }]}>{' '}</Text>
                    <Text style={[styles.sigTableCellLast, { flex: 1 }]}>{' '}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sigNote}>
                (*) Le signataire doit avoir le pouvoir d'engager la personne qu'il représente.
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              F — Signature du pouvoir adjudicateur
          ═══════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="F" title="Signature du pouvoir adjudicateur ou de l'entité adjudicatrice" />
            <View style={styles.sectionContent}>
              <Text style={[styles.paragraph, { fontWeight: 'bold' }]}>
                Pour l'Etat et ses établissements :
              </Text>
              <Text style={styles.instruction}>
                (Visa ou avis de l'autorité chargée du contrôle financier.)
              </Text>

              {/* Bloc signature officiel — aligné à droite */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <View style={{ width: '55%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, color: TEXT_DARK, textAlign: 'center', marginBottom: 20 }}>
                    A : …………………………… le ……………………
                  </Text>
                  <Text style={{ fontSize: 8, color: TEXT_DARK, textAlign: 'center', marginBottom: 3 }}>
                    Signature
                  </Text>
                  <Text style={{ fontSize: 6.5, fontStyle: 'italic', color: TEXT_GRAY, textAlign: 'center' }}>
                    (représentant du pouvoir adjudicateur ou de l'entité adjudicatrice)
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
