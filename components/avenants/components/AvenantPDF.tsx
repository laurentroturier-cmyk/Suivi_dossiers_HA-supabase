// ============================================
// AvenantPDF — Composant React PDF (EXE10)
// Style identique aux documents NOTI
// ============================================

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { AvenantData } from '../types';

// ─── Couleurs (palette teal de l'application) ─────────────────────────────────
const TEAL        = '#2F5B58';
const TEAL_DARK   = '#1e3d3b';
const TEAL_LIGHT  = '#e8f4f3';
const TEAL_BORDER = '#a7d4d1';
const TEXT_DARK   = '#1f2937';
const TEXT_GRAY   = '#6b7280';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 65,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // ── Header fixe ──────────────────────────────────────────────────────────────
  headerFixed: {
    position: 'absolute',
    top: 18,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    borderBottomStyle: 'solid',
  },
  logo: {
    width: 70,
    height: 45,
    objectFit: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: TEAL_DARK,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 7,
    color: TEAL,
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Footer fixe ──────────────────────────────────────────────────────────────
  footerFixed: {
    position: 'absolute',
    bottom: 15,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: TEAL_BORDER,
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft:   { fontSize: 7, color: TEAL_DARK },
  footerCenter: { fontSize: 7, color: TEAL, fontWeight: 'bold' },
  footerRight:  { fontSize: 7, color: TEAL_DARK },
  footerLine2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerAfpa: {
    fontSize: 6,
    color: TEAL,
    textAlign: 'center',
  },

  // ── Contenu ───────────────────────────────────────────────────────────────────
  content: { flex: 1 },

  // Bandeau titre
  titleBanner: {
    flexDirection: 'row',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: 4,
    overflow: 'hidden',
  },
  titleBannerLeft: {
    flex: 1,
    backgroundColor: TEAL_LIGHT,
    padding: 12,
    justifyContent: 'center',
  },
  titleBannerRight: {
    width: 70,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  titleH1: {
    fontSize: 11,
    fontWeight: 'bold',
    color: TEAL_DARK,
    textAlign: 'center',
    marginBottom: 3,
  },
  titleH2: {
    fontSize: 9,
    color: TEAL,
    textAlign: 'center',
  },
  notiCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  notiSub: {
    fontSize: 7,
    color: '#d1ede8',
    marginTop: 2,
  },

  // Intro
  intro: {
    fontSize: 8,
    fontStyle: 'italic',
    color: TEAL_DARK,
    marginBottom: 12,
    lineHeight: 1.4,
    textAlign: 'justify',
    paddingHorizontal: 5,
  },

  // Sections
  section: {
    marginBottom: 10,
    breakInside: 'avoid',
  },
  sectionHeader: {
    backgroundColor: TEAL,
    color: '#ffffff',
    padding: 8,
    paddingLeft: 12,
    fontSize: 9,
    fontWeight: 'bold',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    breakAfter: 'avoid',
  },
  sectionContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: TEAL_BORDER,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 10,
    backgroundColor: TEAL_LIGHT,
    breakInside: 'avoid',
  },

  // Lignes de champs
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: TEAL_DARK,
    width: 130,
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: 8,
    color: TEXT_DARK,
    flex: 1,
  },
  fieldValueFull: {
    fontSize: 8,
    color: TEXT_DARK,
    marginBottom: 4,
  },

  // Séparateur
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: TEAL_BORDER,
    borderBottomStyle: 'solid',
    marginVertical: 6,
  },

  // Tableau montants
  table: {
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: TEAL,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: TEAL_BORDER,
  },
  tableRowAlt: {
    backgroundColor: '#f0faf9',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 7.5,
    color: TEXT_DARK,
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: TEAL_BORDER,
  },
  tableCellLast: {
    flex: 1,
    padding: 5,
    fontSize: 7.5,
    color: TEXT_DARK,
    textAlign: 'center',
  },
  tableCellHead: {
    flex: 1,
    padding: 5,
    fontSize: 7.5,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#5a9c98',
  },
  tableCellHeadLast: {
    flex: 1,
    padding: 5,
    fontSize: 7.5,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCellHighlight: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    color: TEAL_DARK,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Encadré montant nouveau total
  montantBox: {
    backgroundColor: '#d1f0ed',
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  montantBoxLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: TEAL_DARK,
  },
  montantBoxValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: TEAL,
  },

  // Encadré délai
  delaiBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  delaiLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    width: 130,
  },
  delaiValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
  },

  // Signatures
  signatureRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f8fcfc',
    minHeight: 55,
  },
  signatureTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: TEAL,
    textAlign: 'center',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 8,
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 3,
  },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: TEAL_BORDER,
    marginTop: 12,
    marginHorizontal: 6,
  },
  signatureDate: {
    fontSize: 7,
    color: TEXT_GRAY,
    textAlign: 'center',
    marginTop: 3,
  },

  paragraph: {
    fontSize: 8,
    color: TEXT_DARK,
    marginBottom: 5,
    lineHeight: 1.5,
  },
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

function formatMontant(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' € HT';
}

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function today(): string {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label} :</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text>{letter} – {title}</Text>
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
  const montantPrecedent = data.montant_precedent_ht ?? 0;
  const montantAvenant   = data.montant_avenant_ht ?? 0;
  const montantNouveau   = montantPrecedent + montantAvenant;
  const tauxTVA          = parseFloat((data.taux_tva || '20').replace('%', '').trim()) / 100;
  const montantTTC       = montantNouveau * (1 + tauxTVA);
  const description      = htmlToText(data.description_avenant);

  // Header & footer partagés entre toutes les pages
  const Header = () => (
    <View style={styles.headerFixed} fixed>
      {logoAfpa ? (
        <Image style={styles.logo} src={logoAfpa} />
      ) : (
        <View style={styles.logo} />
      )}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</Text>
        <Text style={styles.headerSubtitle}>Direction des affaires juridiques — Marchés publics</Text>
      </View>
      {logoRepublique ? (
        <Image style={styles.logo} src={logoRepublique} />
      ) : (
        <View style={styles.logo} />
      )}
    </View>
  );

  const Footer = () => (
    <View style={styles.footerFixed} fixed>
      <View style={styles.footerContent}>
        <Text style={styles.footerLeft}>Avenant au marché — {data.demande || data.contrat_reference || 'EXE10'}</Text>
        <Text style={styles.footerCenter}>{data.contrat_reference || ''}</Text>
        <Text
          style={styles.footerRight}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        />
      </View>
      <View style={styles.footerLine2}>
        <Text style={styles.footerAfpa}>
          AFPA — Association nationale pour la formation professionnelle des adultes
        </Text>
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
            <View style={styles.titleBannerLeft}>
              <Text style={styles.titleH1}>MARCHÉS PUBLICS</Text>
              <Text style={styles.titleH2}>Avenant au marché public</Text>
            </View>
            <View style={styles.titleBannerRight}>
              <Text style={styles.notiCode}>EXE10</Text>
              <Text style={styles.notiSub}>Avenant</Text>
            </View>
          </View>

          {/* ── Intro ─────────────────────────────────────────────────────── */}
          <Text style={styles.intro}>
            Formulaire d'avenant à un marché public — Ce document formalise les modifications apportées
            au marché d'origine conformément aux articles L2194-1 et suivants du Code de la commande publique.
            Il doit être signé par les deux parties avant toute exécution des prestations modifiées.
          </Text>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION A — Identification du pouvoir adjudicateur
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="A" title="Identification du pouvoir adjudicateur" />
            <View style={styles.sectionContent}>
              <Field label="Organisme"           value="AFPA — Association nationale pour la formation professionnelle des adultes" />
              <Field label="Demandeur"           value={data.demandeur} />
              <Field label="Référence demande"   value={data.demande} />
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION B — Identification du marché
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="B" title="Identification du marché" />
            <View style={styles.sectionContent}>
              <Field label="N° Agreement"        value={data.contrat_reference} />
              <Field label="Intitulé du marché"  value={data.contrat_libelle} />
              <Field label="Titulaire"           value={data.titulaire} />
              <Field label="Date de notification" value={formatDate(data.date_notification)} />
              <Field label="Durée du marché"     value={data.duree_marche} />
              <View style={styles.divider} />
              <Field label="Montant initial HT"  value={formatMontant(data.montant_initial_ht)} />
              <Field label="Taux de TVA"         value={data.taux_tva} />
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION C — Objet de l'avenant
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="C" title="Objet de l'avenant" />
            <View style={styles.sectionContent}>
              <Field label="Numéro d'avenant"    value={data.numero_avenant != null ? String(data.numero_avenant) : undefined} />
              <View style={styles.divider} />
              <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>Description des modifications :</Text>
              {description.split('\n').filter(Boolean).map((line, i) => (
                <Text key={i} style={styles.paragraph}>{line}</Text>
              ))}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION D — Incidence financière
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="D" title="Incidence financière" />
            <View style={styles.sectionContent}>

              {/* Ligne Oui / Non */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.fieldLabel, { flex: 1 }]}>
                  L'avenant a une incidence financière sur le montant du marché public :
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {/* Non */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{
                      width: 11, height: 11,
                      borderWidth: 1, borderColor: TEAL, borderRadius: 2,
                      backgroundColor: !data.incidence_financiere ? TEAL : 'transparent',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      {!data.incidence_financiere && <Text style={{ color: '#fff', fontSize: 7, fontWeight: 'bold' }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: 8, color: TEXT_DARK }}>Non</Text>
                  </View>
                  {/* Oui */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{
                      width: 11, height: 11,
                      borderWidth: 1, borderColor: TEAL, borderRadius: 2,
                      backgroundColor: data.incidence_financiere ? TEAL : 'transparent',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      {data.incidence_financiere && <Text style={{ color: '#fff', fontSize: 7, fontWeight: 'bold' }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: 8, color: TEXT_DARK }}>Oui</Text>
                  </View>
                </View>
              </View>

              {data.incidence_financiere && (
                <>
                  <Text style={[styles.fieldLabel, { marginBottom: 5 }]}>Montant de l'avenant :</Text>

                  {/* Tableau montants */}
                  <View style={styles.table}>
                    <View style={styles.tableHead}>
                      <Text style={styles.tableCellHead}>Taux de TVA</Text>
                      <Text style={styles.tableCellHead}>Montant avenant HT</Text>
                      <Text style={styles.tableCellHead}>Montant avenant TTC</Text>
                      <Text style={styles.tableCellHeadLast}>% d'écart</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{data.taux_tva || '20%'}</Text>
                      <Text style={styles.tableCell}>{formatMontant(montantAvenant)}</Text>
                      <Text style={styles.tableCell}>{formatMontant(montantAvenant * (1 + tauxTVA))}</Text>
                      <Text style={[styles.tableCellLast, {
                        color: montantAvenant >= 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 'bold',
                      }]}>
                        {montantPrecedent
                          ? `${(montantAvenant / montantPrecedent * 100).toFixed(2)} %`
                          : '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Récap montants du marché */}
                  <View style={[styles.table, { marginTop: 8 }]}>
                    <View style={styles.tableHead}>
                      <Text style={styles.tableCellHead}>Montant précédent HT</Text>
                      <Text style={styles.tableCellHead}>Montant avenant HT</Text>
                      <Text style={styles.tableCellHead}>Nouveau montant HT</Text>
                      <Text style={styles.tableCellHeadLast}>Nouveau montant TTC</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{formatMontant(montantPrecedent)}</Text>
                      <Text style={styles.tableCell}>{formatMontant(montantAvenant)}</Text>
                      <Text style={[styles.tableCell, { color: TEAL, fontWeight: 'bold' }]}>{formatMontant(montantNouveau)}</Text>
                      <Text style={[styles.tableCellLast, { color: TEAL_DARK, fontWeight: 'bold' }]}>{formatMontant(montantTTC)}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Modification du délai */}
              {data.nouvelle_date_fin && (
                <View style={[styles.delaiBox, { marginTop: 8 }]}>
                  <Text style={styles.delaiLabel}>Nouvelle date de fin :</Text>
                  <Text style={styles.delaiValue}>{formatDate(data.nouvelle_date_fin)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION E — Identification du signataire fournisseur
          ══════════════════════════════════════════════════════════════════ */}
          {(data.frn_nom_signataire || data.frn_fonction_signataire) && (
            <View style={styles.section}>
              <SectionHeader letter="E" title="Identification du signataire fournisseur" />
              <View style={styles.sectionContent}>
                <Field label="Nom du signataire"      value={data.frn_nom_signataire} />
                <Field label="Fonction du signataire" value={data.frn_fonction_signataire} />
                <Field label="Raison sociale"         value={data.titulaire} />
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION F — Signatures
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader letter="F" title="Signatures" />
            <View style={styles.sectionContent}>
              <Text style={[styles.paragraph, { marginBottom: 8, fontStyle: 'italic' }]}>
                Fait le {today()}, en deux exemplaires originaux.
              </Text>

              {/* Signatures AFPA */}
              <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Pour le pouvoir adjudicateur (AFPA) :</Text>
              <View style={styles.signatureRow}>
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureTitle}>Rédigé par</Text>
                  <Text style={styles.signatureName}>{data.redige_par || '—'}</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureDate}>Signature</Text>
                </View>
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureTitle}>Demandeur</Text>
                  <Text style={styles.signatureName}>{data.demandeur || '—'}</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureDate}>Signature</Text>
                </View>
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureTitle}>Valideur</Text>
                  <Text style={styles.signatureName}>—</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureDate}>Signature</Text>
                </View>
              </View>

              <View style={[styles.divider, { marginTop: 14 }]} />

              {/* Signature fournisseur */}
              <Text style={[styles.fieldLabel, { marginBottom: 6, marginTop: 8 }]}>Pour le titulaire :</Text>
              <View style={styles.signatureRow}>
                <View style={[styles.signatureBox, { flex: 0, width: '45%' }]}>
                  <Text style={styles.signatureTitle}>{data.titulaire || 'Titulaire'}</Text>
                  <Text style={styles.signatureName}>{data.frn_nom_signataire || '—'}</Text>
                  {data.frn_fonction_signataire ? (
                    <Text style={styles.signatureDate}>{data.frn_fonction_signataire}</Text>
                  ) : null}
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureDate}>Signature et cachet</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}
