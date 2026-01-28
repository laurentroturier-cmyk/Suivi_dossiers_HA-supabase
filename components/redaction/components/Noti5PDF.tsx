import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  Image, 
  StyleSheet
} from '@react-pdf/renderer';
import type { Noti5Data } from '../types/noti5';

// Styles professionnels du document NOTI5 (couleur verte)
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
    borderBottomColor: '#16a34a',
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
    color: '#14532d',
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 7,
    color: '#166534',
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
    borderTopColor: '#86efac',
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
    color: '#166534',
  },
  
  footerCenter: {
    fontSize: 7,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  
  footerRight: {
    fontSize: 7,
    color: '#166534',
  },
  
  footerLine2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  
  footerAfpa: {
    fontSize: 6,
    color: '#15803d',
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
    borderColor: '#16a34a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  titleBannerLeft: {
    flex: 1,
    backgroundColor: '#dcfce7',
    padding: 12,
    justifyContent: 'center',
  },
  
  titleBannerRight: {
    width: 70,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  
  titleH1: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#14532d',
    textAlign: 'center',
    marginBottom: 3,
  },
  
  titleH2: {
    fontSize: 9,
    color: '#166534',
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
    color: '#14532d',
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
    backgroundColor: '#16a34a',
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
    borderColor: '#bbf7d0',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 12,
    backgroundColor: '#f0fdf4',
  },
  
  // Champs
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  fieldLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#14532d',
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
    borderColor: '#16a34a',
    borderRadius: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkboxChecked: {
    backgroundColor: '#16a34a',
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
  
  // Sous-checkbox indenté
  subCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 30,
  },
  
  // Success box
  successBox: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 4,
    padding: 12,
    marginVertical: 12,
  },
  
  successTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  
  successText: {
    fontSize: 8,
    color: '#14532d',
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
    backgroundColor: '#86efac',
    marginTop: 30,
    marginBottom: 5,
  },
  
  signatureLabel: {
    fontSize: 7,
    color: '#166534',
    fontStyle: 'italic',
  },
});

// Composant Checkbox réutilisable
const Checkbox = ({ checked, label, sub = false }: { checked: boolean; label: string; sub?: boolean }) => (
  <View style={sub ? styles.subCheckboxRow : styles.checkboxRow}>
    <View style={[styles.checkboxIcon, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxMark}>✓</Text>}
    </View>
    <Text style={styles.checkboxText}>{label}</Text>
  </View>
);

interface Noti5PDFProps {
  data: Noti5Data;
  logoAfpa?: string;
  logoRepublique?: string;
}

export const Noti5PDF = ({ 
  data,
  logoAfpa,
  logoRepublique
}: Noti5PDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* ===== HEADER FIXE ===== */}
      <View style={styles.headerFixed} fixed>
        {logoRepublique ? (
          <Image src={logoRepublique} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#dcfce7', borderRadius: 4 }]} />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</Text>
          <Text style={styles.headerSubtitle}>Direction des Affaires Juridiques</Text>
        </View>
        {logoAfpa ? (
          <Image src={logoAfpa} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#dcfce7', borderRadius: 4 }]} />
        )}
      </View>

      {/* ===== CONTENU ===== */}
      <View style={styles.content}>
        
        {/* Bandeau titre */}
        <View style={styles.titleBanner}>
          <View style={styles.titleBannerLeft}>
            <Text style={styles.titleH1}>MARCHÉS PUBLICS</Text>
            <Text style={styles.titleH2}>Notification d'un marché public ou accord-cadre</Text>
          </View>
          <View style={styles.titleBannerRight}>
            <Text style={styles.notiCode}>NOTI5</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Le formulaire NOTI5 est un modèle de lettre qui peut être utilisé pour notifier au titulaire l'attribution définitive du marché public ou de l'accord-cadre.
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
          <Text style={styles.sectionHeader}>C – Identification de l'attributaire</Text>
          <View style={styles.sectionContent}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Entreprise :</Text>
              <Text style={[styles.fieldValue, { fontWeight: 'bold' }]}>{data.attributaire.denomination || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Adresse :</Text>
              <Text style={styles.fieldValue}>{data.attributaire.adresse1 || '—'}</Text>
            </View>
            {data.attributaire.adresse2 && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}></Text>
                <Text style={styles.fieldValue}>{data.attributaire.adresse2}</Text>
              </View>
            )}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>CP / Ville :</Text>
              <Text style={styles.fieldValue}>{data.attributaire.codePostal} {data.attributaire.ville}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>SIRET :</Text>
              <Text style={styles.fieldValue}>{data.attributaire.siret || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email :</Text>
              <Text style={styles.fieldValue}>{data.attributaire.email || '—'}</Text>
            </View>
            {data.attributaire.estMandataire && (
              <Text style={[styles.fieldValueFull, { fontStyle: 'italic', marginTop: 5 }]}>
                (Mandataire du groupement)
              </Text>
            )}
          </View>
        </View>

        {/* Section D */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>D – Attribution</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>Je vous notifie l'attribution de :</Text>
            <Checkbox 
              checked={data.notification.type === 'ensemble'} 
              label="L'ensemble du marché public (en cas de non allotissement)"
            />
            <Checkbox 
              checked={data.notification.type === 'lots'} 
              label={`Le(s) lot(s) n° ${data.notification.type === 'lots' && data.notification.lots?.length 
                ? data.notification.lots.map(l => `${l.numero}: ${l.intitule}`).join(', ')
                : '________________'}`}
            />
          </View>
        </View>

        {/* Section E */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>E – Exécution des prestations</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>L'exécution des prestations débutera :</Text>
            <Checkbox 
              checked={data.executionPrestations.type === 'immediate'} 
              label="Dès réception de la présente notification"
            />
            <Checkbox 
              checked={data.executionPrestations.type === 'sur_commande'} 
              label="À réception d'un bon de commande ou ordre de service"
            />
          </View>
        </View>

        {/* Section F */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>F – Garanties demandées</Text>
          <View style={styles.sectionContent}>
            <Checkbox 
              checked={data.garanties.aucuneGarantie} 
              label="Aucune garantie n'est exigée"
            />
            <Checkbox 
              checked={data.garanties.retenue?.active || false} 
              label={`Retenue de garantie de ${data.garanties.retenue?.pourcentage || 5}%`}
            />
            {data.garanties.retenue?.active && (
              <>
                <Checkbox 
                  checked={data.garanties.retenue?.remplacablePar?.garantiePremieredemande || false} 
                  label="Remplaçable par garantie à première demande"
                  sub
                />
                <Checkbox 
                  checked={data.garanties.retenue?.remplacablePar?.cautionPersonnelle || false} 
                  label="Remplaçable par caution personnelle et solidaire"
                  sub
                />
              </>
            )}
            <Checkbox 
              checked={data.garanties.garantieAvanceSuperieure30} 
              label="Garantie à première demande pour avance > 30%"
            />
          </View>
        </View>

        {/* Section G */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>G – Pièces jointes</Text>
          <View style={styles.sectionContent}>
            <Checkbox 
              checked={data.piecesJointes.actEngagementPapier} 
              label="2 photocopies de l'acte d'engagement (1 avec mention « exemplaire unique »)"
            />
            <Checkbox 
              checked={data.piecesJointes.actEngagementPDF} 
              label="Copie électronique de l'acte d'engagement (PDF)"
            />
          </View>
        </View>

        {/* Success box */}
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✓ Notification effective</Text>
          <Text style={styles.successText}>
            La présente notification vaut ordre de service pour l'exécution du marché conformément aux stipulations contractuelles.
          </Text>
        </View>

        {/* Section H - Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>H – Signature</Text>
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
          <Text style={styles.footerLeft}>NOTI5 – Notification de marché</Text>
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

export default Noti5PDF;
