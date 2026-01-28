import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  Image, 
  StyleSheet
} from '@react-pdf/renderer';
import type { Noti3Data } from '../types/noti3';

// Styles professionnels du document NOTI3 (couleur orange/ambre)
const styles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 70,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // ===== HEADER FIXE =====
  headerFixed: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#d97706',
    borderBottomStyle: 'solid',
  },
  
  logo: {
    width: 70,
    height: 45,
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  
  headerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#78350f',
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 7,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // ===== FOOTER FIXE =====
  footerFixed: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#fbbf24',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  footerLeft: {
    fontSize: 7,
    color: '#92400e',
  },
  
  footerCenter: {
    fontSize: 7,
    color: '#d97706',
    fontWeight: 'bold',
  },
  
  footerRight: {
    fontSize: 7,
    color: '#92400e',
  },
  
  footerLine2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  
  footerAfpa: {
    fontSize: 6,
    color: '#b45309',
    textAlign: 'center',
  },
  
  // ===== CONTENU =====
  content: {
    flex: 1,
  },
  
  // Bandeau titre NOTI
  titleBanner: {
    flexDirection: 'row',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  titleBannerLeft: {
    flex: 1,
    backgroundColor: '#fef3c7',
    padding: 12,
    justifyContent: 'center',
  },
  
  titleBannerRight: {
    width: 70,
    backgroundColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  
  titleH1: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#78350f',
    textAlign: 'center',
    marginBottom: 3,
  },
  
  titleH2: {
    fontSize: 9,
    color: '#92400e',
    textAlign: 'center',
  },
  
  notiCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Intro
  intro: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#78350f',
    marginBottom: 18,
    lineHeight: 1.5,
    textAlign: 'justify',
    paddingHorizontal: 5,
  },
  
  // Sections
  section: {
    marginBottom: 12,
  },
  
  sectionHeader: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    padding: 8,
    paddingLeft: 12,
    fontSize: 9,
    fontWeight: 'bold',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  
  sectionContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#fde68a',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 12,
    backgroundColor: '#fffbeb',
  },
  
  // Champs
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  fieldLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#78350f',
    width: 100,
  },
  
  fieldValue: {
    fontSize: 8,
    color: '#1f2937',
    flex: 1,
  },
  
  fieldValueFull: {
    fontSize: 8,
    color: '#1f2937',
    marginBottom: 3,
  },
  
  paragraph: {
    fontSize: 8,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  
  // Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingLeft: 8,
  },
  
  checkboxIcon: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkboxChecked: {
    backgroundColor: '#d97706',
  },
  
  checkboxMark: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  checkboxText: {
    fontSize: 8,
    color: '#374151',
    flex: 1,
    lineHeight: 1.4,
  },
  
  // Tableau des notes
  notesTable: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  notesTableRow: {
    flexDirection: 'row',
  },
  
  notesTableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  
  notesTableHeader: {
    backgroundColor: '#fef3c7',
  },
  
  notesTableCell: {
    flex: 1,
    padding: 6,
    fontSize: 7,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#fde68a',
  },
  
  notesTableCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 7,
    textAlign: 'center',
  },
  
  notesTableCellHeader: {
    fontWeight: 'bold',
    color: '#78350f',
  },
  
  // Standstill
  standstillBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 4,
    padding: 12,
    marginVertical: 12,
  },
  
  standstillTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  
  standstillText: {
    fontSize: 8,
    color: '#78350f',
  },
  
  // Signature
  signatureBlock: {
    marginTop: 20,
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  
  signatureText: {
    fontSize: 8,
    color: '#374151',
    marginBottom: 4,
  },
  
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: '#fbbf24',
    marginTop: 30,
    marginBottom: 5,
  },
  
  signatureLabel: {
    fontSize: 7,
    color: '#92400e',
    fontStyle: 'italic',
  },
});

// Composant Checkbox réutilisable
const Checkbox = ({ checked, label }: { checked: boolean; label: string }) => (
  <View style={styles.checkboxRow}>
    <View style={[styles.checkboxIcon, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxMark}>✓</Text>}
    </View>
    <Text style={styles.checkboxText}>{label}</Text>
  </View>
);

interface Noti3PDFProps {
  data: Noti3Data;
  logoAfpa?: string;
  logoRepublique?: string;
}

export const Noti3PDF = ({ 
  data,
  logoAfpa,
  logoRepublique
}: Noti3PDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* ===== HEADER FIXE ===== */}
      <View style={styles.headerFixed} fixed>
        {logoRepublique ? (
          <Image src={logoRepublique} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#fef3c7', borderRadius: 4 }]} />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</Text>
          <Text style={styles.headerSubtitle}>Direction des Affaires Juridiques</Text>
        </View>
        {logoAfpa ? (
          <Image src={logoAfpa} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#fef3c7', borderRadius: 4 }]} />
        )}
      </View>

      {/* ===== CONTENU ===== */}
      <View style={styles.content}>
        
        {/* Bandeau titre */}
        <View style={styles.titleBanner}>
          <View style={styles.titleBannerLeft}>
            <Text style={styles.titleH1}>MARCHÉS PUBLICS</Text>
            <Text style={styles.titleH2}>Lettre de rejet d'une candidature ou d'une offre</Text>
          </View>
          <View style={styles.titleBannerRight}>
            <Text style={styles.notiCode}>NOTI3</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Le formulaire NOTI3 est un modèle de lettre qui peut être utilisé par le pouvoir adjudicateur pour informer un candidat du rejet de sa candidature ou de son offre.
        </Text>

        {/* Section A */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>A – Identification du pouvoir adjudicateur</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold' }]}>{data.pouvoirAdjudicateur.nom}</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.adresseVoie}</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.codePostal} {data.pouvoirAdjudicateur.ville}</Text>
          </View>
        </View>

        {/* Section B */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>B – Objet de la consultation</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.fieldValueFull}>{data.objetConsultation || '—'}</Text>
          </View>
        </View>

        {/* Section C */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>C – Identification du candidat évincé</Text>
          <View style={styles.sectionContent}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Entreprise :</Text>
              <Text style={styles.fieldValue}>{data.candidat.denomination || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Adresse :</Text>
              <Text style={styles.fieldValue}>{data.candidat.adresse1 || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>CP / Ville :</Text>
              <Text style={styles.fieldValue}>{data.candidat.codePostal} {data.candidat.ville}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>SIRET :</Text>
              <Text style={styles.fieldValue}>{data.candidat.siret || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email :</Text>
              <Text style={styles.fieldValue}>{data.candidat.email || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Section D */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>D – Motif du rejet</Text>
          <View style={styles.sectionContent}>
            <Checkbox checked={data.rejet.type === 'candidature'} label="Rejet de la candidature" />
            <Checkbox checked={data.rejet.type === 'offre'} label="Rejet de l'offre" />
            
            <Text style={[styles.paragraph, { marginTop: 10, fontWeight: 'bold' }]}>Motifs du rejet :</Text>
            <Text style={styles.fieldValueFull}>{data.rejet.motifs || '—'}</Text>
            
            <Text style={[styles.paragraph, { marginTop: 8 }]}>
              Classement de votre offre : <Text style={{ fontWeight: 'bold' }}>{data.rejet.classement || '—'}</Text>
            </Text>

            {/* Tableau des notes */}
            <View style={styles.notesTable}>
              <View style={[styles.notesTableRow, styles.notesTableRowBorder, styles.notesTableHeader]}>
                <Text style={[styles.notesTableCell, styles.notesTableCellHeader]}>Critère</Text>
                <Text style={[styles.notesTableCell, styles.notesTableCellHeader]}>Votre note</Text>
                <Text style={[styles.notesTableCell, styles.notesTableCellHeader]}>Attributaire</Text>
                <Text style={[styles.notesTableCellLast, styles.notesTableCellHeader]}>Max</Text>
              </View>
              <View style={[styles.notesTableRow, styles.notesTableRowBorder]}>
                <Text style={styles.notesTableCell}>Technique</Text>
                <Text style={styles.notesTableCell}>{data.rejet.noteTech || '—'}</Text>
                <Text style={styles.notesTableCell}>{data.attributaire.noteTech || '—'}</Text>
                <Text style={styles.notesTableCellLast}>{data.rejet.maxTech || '—'}</Text>
              </View>
              <View style={[styles.notesTableRow, styles.notesTableRowBorder]}>
                <Text style={styles.notesTableCell}>Économique</Text>
                <Text style={styles.notesTableCell}>{data.rejet.noteEco || '—'}</Text>
                <Text style={styles.notesTableCell}>{data.attributaire.noteEco || '—'}</Text>
                <Text style={styles.notesTableCellLast}>{data.rejet.maxEco || '—'}</Text>
              </View>
              <View style={styles.notesTableRow}>
                <Text style={[styles.notesTableCell, { fontWeight: 'bold' }]}>TOTAL</Text>
                <Text style={[styles.notesTableCell, { fontWeight: 'bold' }]}>{data.rejet.total || '—'}</Text>
                <Text style={[styles.notesTableCell, { fontWeight: 'bold' }]}>{data.attributaire.total || '—'}</Text>
                <Text style={[styles.notesTableCellLast, { fontWeight: 'bold' }]}>100</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section E */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>E – Attributaire retenu</Text>
          <View style={styles.sectionContent}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Entreprise :</Text>
              <Text style={[styles.fieldValue, { fontWeight: 'bold' }]}>{data.attributaire.denomination || '—'}</Text>
            </View>
            <Text style={[styles.paragraph, { marginTop: 8 }]}>
              <Text style={{ fontWeight: 'bold' }}>Caractéristiques et avantages de l'offre retenue :</Text>
            </Text>
            <Text style={styles.fieldValueFull}>{data.attributaire.motifs || '—'}</Text>
          </View>
        </View>

        {/* Standstill */}
        <View style={styles.standstillBox}>
          <Text style={styles.standstillTitle}>⚠ Délai de standstill</Text>
          <Text style={styles.standstillText}>
            Conformément à l'article R. 2182-1 du CCP, vous disposez d'un délai de {data.delaiStandstill || '11'} jours à compter de la notification de la présente décision pour exercer un recours.
          </Text>
        </View>

        {/* Section F - Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>F – Signature</Text>
          <View style={styles.sectionContent}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureText}>
                À {data.signature.lieu || 'Montreuil'}, le {data.signature.date || new Date().toLocaleDateString('fr-FR')}
              </Text>
              <Text style={[styles.signatureText, { marginTop: 8 }]}>
                {data.signature.signataireTitre || 'Direction Nationale des Achats'}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature du représentant habilité</Text>
            </View>
          </View>
        </View>

      </View>

      {/* ===== FOOTER FIXE ===== */}
      <View style={styles.footerFixed} fixed>
        <View style={styles.footerContent}>
          <Text style={styles.footerLeft}>NOTI3 – Lettre de rejet</Text>
          <Text style={styles.footerCenter}>N° {data.numeroProcedure || '—'}</Text>
          <Text 
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
        <View style={styles.footerLine2}>
          <Text style={styles.footerAfpa}>
            AFPA – Agence nationale pour la formation professionnelle des adultes – 3 rue Franklin, 93100 Montreuil
          </Text>
        </View>
      </View>

    </Page>
  </Document>
);

export default Noti3PDF;
