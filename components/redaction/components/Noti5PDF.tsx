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
    paddingTop: 85,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // ===== HEADER FIXE =====
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
    bottom: 15,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#86efac',
    borderTopStyle: 'solid',
    paddingTop: 8,
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
    marginBottom: 12,
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
    backgroundColor: '#16a34a',
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
    borderColor: '#bbf7d0',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 10,
    backgroundColor: '#f0fdf4',
    breakInside: 'avoid',
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
    breakInside: 'avoid',
  },
  
  // Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 8,
    breakInside: 'avoid',
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
    padding: 10,
    marginVertical: 10,
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
    marginTop: 10,
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
    marginTop: 20,
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
            <Text style={styles.titleH2}>NOTIFICATION DU MARCHÉ PUBLIC</Text>
          </View>
          <View style={styles.titleBannerRight}>
            <Text style={styles.notiCode}>NOTI5</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Le formulaire NOTI5 est un modèle de lettre qui peut être utilisé, par le pouvoir adjudicateur ou l'entité adjudicatrice, après qu'il ou elle ait signé le marché public, pour le notifier à l'attributaire.
        </Text>

        {/* Section A */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>A – Identification du pouvoir adjudicateur ou de l'entité adjudicatrice</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#14532d', marginBottom: 8 }]}>
              (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
            </Text>
            <Text style={[styles.paragraph, { fontWeight: 'bold', marginBottom: 4 }]}>AFPA</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold' }]}>Agence nationale pour la formation professionnelle des adultes</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.adresseVoie}</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.codePostal} {data.pouvoirAdjudicateur.ville}</Text>
          </View>
        </View>

        {/* Section B */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>B – Objet de la consultation</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#14532d', marginBottom: 8 }]}>
              (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
            </Text>
            <Text style={[styles.fieldValueFull, { marginBottom: 8 }]}>{data.objetConsultation || '—'}</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold' }]}>{data.numeroProcedure}</Text>
          </View>
        </View>

        {/* Section C */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>C – Identification de l'attributaire</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#14532d', marginBottom: 8 }]}>
              [Indiquer le nom commercial et la dénomination sociale de l'attributaire individuel ou de chaque membre du groupement
              d'entreprises attributaire, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse
              électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de groupement d'entreprises attributaire, identifier précisément le
              mandataire du groupement.]
            </Text>
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
            {data.attributaire.telephone && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Téléphone :</Text>
                <Text style={styles.fieldValue}>{data.attributaire.telephone}</Text>
              </View>
            )}
            {data.attributaire.fax && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Fax :</Text>
                <Text style={styles.fieldValue}>{data.attributaire.fax}</Text>
              </View>
            )}
            {data.attributaire.estMandataire && (
              <Text style={[styles.fieldValueFull, { fontStyle: 'italic', marginTop: 5 }]}>
                (Mandataire du groupement)
              </Text>
            )}
          </View>
        </View>

        {/* Section D */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>D – Notification de l'attribution du marché public ou de l'accord-cadre</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#14532d', marginBottom: 8 }]}>
              [Étant entendu qu'un attributaire ne peut recevoir qu'une seule notification de l'attribution du marché public ou de l'accord-cadre,
              il faut faire autant de lettres qu'il y a d'attributaires. Plusieurs lots peuvent être précisés si un seul attributaire est titulaire de plusieurs lots.]
            </Text>
            <Text style={styles.paragraph}>Je vous notifie l'attribution de :</Text>
            <Checkbox 
              checked={data.notification.type === 'ensemble'} 
              label="L'ensemble du marché public (en cas de non allotissement)"
            />
            <Checkbox 
              checked={data.notification.type === 'lots'} 
              label="Le(s) lot(s) suivant(s) :"
            />
            {data.notification.type === 'lots' && data.notification.lots && data.notification.lots.length > 0 && (
              <View style={{ paddingLeft: 20, marginTop: 6 }}>
                {data.notification.lots.map((lot, index) => (
                  <Text key={index} style={[styles.paragraph, { marginBottom: 4 }]}>
                    • Lot n°{lot.numero} : {lot.intitule}
                  </Text>
                ))}
              </View>
            )}
            
            <Text style={[styles.paragraph, { marginTop: 12, marginBottom: 6 }]}>Début d'exécution :</Text>
            <Checkbox 
              checked={data.notification.executionImmediateChecked || data.executionPrestations?.type === 'immediate' || false} 
              label="L'exécution commencera à compter de la date de notification et selon les modalités prévues aux documents de la consultation."
            />
            <Checkbox 
              checked={data.notification.executionOrdreServiceChecked || data.executionPrestations?.type === 'sur_commande' || false} 
              label="L'exécution commencera à compter de la réception de l'ordre de service qui vous sera adressé dans les conditions prévues par les documents de la consultation."
            />
          </View>
        </View>

        {/* Section E */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>E – Retenue de garantie ou garantie à première demande</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#14532d', marginBottom: 8 }]}>
              [La retenue de garantie peut être remplacée, au choix du titulaire, soit par une garantie à première demande, soit par une caution personnelle et solidaire.
              Celle-ci ne s'applique pas en cas d'allotissement lorsque le montant du marché public est inférieur à 90 000 € HT.
              Les documents de la consultation précisent si elle a été prévue ou non ainsi que son éventuel taux et ses modalités.]
            </Text>
            <Checkbox 
              checked={data.garantie?.pasPrevue || data.garanties?.aucuneGarantie || false} 
              label="Les documents de la consultation ne prévoient pas de retenue de garantie ou de garantie à première demande."
            />
            <Checkbox 
              checked={data.garantie?.prevueSansAllotissement || false} 
              label="En l'absence d'allotissement de ce marché public :"
            />
            {data.garantie?.prevueSansAllotissement && (
              <View style={{ paddingLeft: 20, marginTop: 4 }}>
                <Checkbox 
                  checked={data.garantie?.retenueGarantieSansAllotissement || false} 
                  label="Une retenue de garantie est prévue par les documents de la consultation (préciser son taux et ses modalités)."
                  sub
                />
                <Checkbox 
                  checked={data.garantie?.garantiePremiereDemandeOuCautionSansAllotissement || false} 
                  label="Une garantie à première demande ou une caution personnelle et solidaire est prévue par les documents de la consultation (préciser son taux et ses modalités)."
                  sub
                />
              </View>
            )}
            <Checkbox 
              checked={data.garantie?.prevueAvecAllotissement || false} 
              label="En cas d'allotissement de ce marché public :"
            />
            {data.garantie?.prevueAvecAllotissement && (
              <View style={{ paddingLeft: 20, marginTop: 4 }}>
                <Checkbox 
                  checked={data.garantie?.montantInferieur90k || false} 
                  label="Le montant de votre offre est inférieur à 90 000 € HT. Aucune retenue de garantie ou garantie à première demande n'est exigée pour le(s) lot(s) dont vous êtes attributaire."
                  sub
                />
                <Checkbox 
                  checked={data.garantie?.montantSuperieur90kRetenue || false} 
                  label="Le montant de votre offre est supérieur ou égal à 90 000 € HT. Une retenue de garantie est prévue par les documents de la consultation pour le(s) lot(s) dont vous êtes attributaire (préciser son taux et ses modalités)."
                  sub
                />
                <Checkbox 
                  checked={data.garantie?.montantSuperieur90kGarantie || false} 
                  label="Le montant de votre offre est supérieur ou égal à 90 000 € HT. Une garantie à première demande ou une caution personnelle et solidaire est prévue par les documents de la consultation pour le(s) lot(s) dont vous êtes attributaire (préciser son taux et ses modalités)."
                  sub
                />
              </View>
            )}
            
            {/* Rétro-compatibilité avec l'ancienne structure */}
            {data.garanties?.retenue?.active && (
              <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f0fdf4', borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={[styles.paragraph, { fontWeight: 'bold', marginBottom: 4 }]}>Retenue de garantie :</Text>
                <Text style={styles.paragraph}>{data.garanties.retenue.pourcentage}%</Text>
                {data.garanties.retenue.remplacablePar.garantiePremieredemande && (
                  <Text style={styles.paragraph}>• Remplaçable par garantie à première demande</Text>
                )}
                {data.garanties.retenue.remplacablePar.cautionPersonnelle && (
                  <Text style={styles.paragraph}>• Remplaçable par caution personnelle et solidaire</Text>
                )}
              </View>
            )}
            
            {data.garantie?.modalites && (
              <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f0fdf4', borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={[styles.paragraph, { fontWeight: 'bold', marginBottom: 4 }]}>Modalités :</Text>
                <Text style={styles.paragraph}>{data.garantie.modalites}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section F */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>F – Pièces jointes</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#14532d', marginBottom: 8 }]}>
              [Indiquer les pièces à fournir par le titulaire pour compléter le marché public.]
            </Text>
            <Checkbox 
              checked={data.piecesJointes.actEngagementPapier} 
              label="2 exemplaires papier de l'acte d'engagement signés en original, un exemplaire comportant au verso du dernier feuillet la mention manuscrite « exemplaire unique »."
            />
            <Checkbox 
              checked={data.piecesJointes.actEngagementPDF} 
              label="1 copie électronique de l'acte d'engagement (PDF)."
            />
          </View>
        </View>

        {/* Section G - Signature */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>G – Signature</Text>
          <View style={styles.sectionContent}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureText}>
                À {data.signature.lieu || 'Montreuil'}, le {data.signature.date || new Date().toLocaleDateString('fr-FR')}
              </Text>
              <Text style={[styles.signatureText, { marginTop: 8 }]}>
                {data.signature.signataireNom || ''}
              </Text>
              <Text style={[styles.signatureText, { marginTop: 2 }]}>
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
