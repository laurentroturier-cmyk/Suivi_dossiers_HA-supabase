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
    breakInside: 'avoid',
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
    breakAfter: 'avoid',
  },
  
  sectionContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#fde68a',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 12,
    backgroundColor: '#fffbeb',
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
    breakInside: 'avoid',
  },
  
  // Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingLeft: 8,
    breakInside: 'avoid',
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
            <Text style={styles.titleH2}>NOTIFICATION DE REJET DE CANDIDATURE OU D'OFFRE</Text>
          </View>
          <View style={styles.titleBannerRight}>
            <Text style={styles.notiCode}>NOTI3</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Le formulaire NOTI3 est un modèle de lettre qui peut être utilisé par le pouvoir adjudicateur ou l'entité adjudicatrice pour notifier 
          au candidat non retenu, le rejet de sa candidature ou de son offre et l'attribution du marché public ou en cas d'abandon de la procédure.
        </Text>

        {/* Section A */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>A – Identification du pouvoir adjudicateur ou de l'entité adjudicatrice</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#78350f', marginBottom: 8 }]}>
              (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
            </Text>
            {data.pouvoirAdjudicateur.nom.split('\n').map((line, index) => (
              <Text key={index} style={[styles.fieldValueFull, index === 0 && { fontWeight: 'bold' }]}>{line}</Text>
            ))}
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.adresseVoie}</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.codePostal} {data.pouvoirAdjudicateur.ville}</Text>
          </View>
        </View>

        {/* Section B */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>B – Objet de la notification</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#78350f', marginBottom: 8 }]}>
              (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
            </Text>
            <Text style={[styles.paragraph, { fontWeight: 'bold', marginBottom: 4 }]}>Objet de la consultation :</Text>
            <Text style={[styles.fieldValueFull, { marginBottom: 8 }]}>{data.objetConsultation || '—'}</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold' }]}>{data.numeroProcedure}</Text>
            
            <Text style={[styles.paragraph, { marginTop: 12, fontWeight: 'bold' }]}>La présente notification correspond :</Text>
            <Checkbox 
              checked={data.notification.type === 'ensemble'} 
              label="à l'ensemble du marché public ou de l'accord-cadre" 
            />
            {data.notification.type === 'lots' && data.notification.lots.length > 0 && data.notification.lots.map((lot, index) => (
              <View key={index} style={{ marginTop: 6 }}>
                <Checkbox 
                  checked={true} 
                  label={`au lot n° ${lot.numero}`} 
                />
                <Text style={[styles.paragraph, { marginLeft: 20, fontSize: 7, fontStyle: 'italic' }]}>
                  de la procédure de passation du marché public ou de l'accord-cadre (en cas d'allotissement) :
                </Text>
                <Text style={[styles.paragraph, { marginLeft: 20, fontSize: 7 }]}>
                  {lot.intitule}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section C */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>C – Identification du candidat ou du soumissionnaire</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#78350f', marginBottom: 8 }]}>
              [Indiquer le nom commercial et la dénomination sociale du candidat ou soumissionnaire individuel ou de chaque membre du groupement 
              d'entreprises candidat, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse 
              électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de candidature groupée, identifier précisément le 
              mandataire du groupement.
            </Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Entreprise :</Text>
              <Text style={[styles.fieldValue, { fontWeight: 'bold' }]}>{data.candidat.denomination || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Adresse :</Text>
              <Text style={styles.fieldValue}>{data.candidat.adresse1 || '—'}</Text>
            </View>
            {data.candidat.adresse2 && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}></Text>
                <Text style={styles.fieldValue}>{data.candidat.adresse2}</Text>
              </View>
            )}
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
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Téléphone :</Text>
              <Text style={styles.fieldValue}>{data.candidat.telephone || '—'}</Text>
            </View>
            {data.candidat.fax && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Fax :</Text>
                <Text style={styles.fieldValue}>{data.candidat.fax}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section D */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>D – Notification de rejet de la candidature ou de l'offre</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#78350f', marginBottom: 8 }]}>
              (En cas d'allotissement, cette rubrique est à renseigner pour chacun des lots de la procédure de passation du marché public ou 
              de l'accord-cadre pour lesquels la candidature ou l'offre est rejetée. Préciser pour chaque lot, son numéro et son intitulé tels 
              qu'ils figurent dans les documents de la consultation.)
            </Text>
            
            <Text style={styles.paragraph}>
              J'ai le regret de vous faire connaître que, dans le cadre de la consultation rappelée ci-dessus :
            </Text>
            
            <Checkbox checked={data.rejet.type === 'candidature'} label="votre candidature n'a pas été retenue." />
            <Checkbox checked={data.rejet.type === 'offre'} label="votre offre n'a pas été retenue." />
            
            <Text style={[styles.paragraph, { marginTop: 10, fontWeight: 'bold' }]}>pour les motifs suivants :</Text>
            <Text style={[styles.fieldValueFull, { marginBottom: 8 }]}>{data.rejet.motifs || '—'}</Text>
            
            <Text style={styles.paragraph}>
              En considération des critères de choix définis dans le Règlement de la Consultation, votre offre a obtenu{' '}
              <Text style={{ fontWeight: 'bold' }}>{data.rejet.total} points</Text> sur un total de 100.
            </Text>
            
            <Text style={[styles.paragraph, { marginTop: 8, fontWeight: 'bold' }]}>Le détail est le suivant :</Text>
            <Text style={styles.fieldValueFull}>
              Note économique : <Text style={{ fontWeight: 'bold' }}>{data.rejet.noteEco} / {data.rejet.maxEco || '60'} points</Text>
            </Text>
            <Text style={styles.fieldValueFull}>
              Note technique : <Text style={{ fontWeight: 'bold' }}>{data.rejet.noteTech} / {data.rejet.maxTech || '40'} points</Text>
            </Text>
            
            <Text style={[styles.paragraph, { marginTop: 8 }]}>
              Au classement final, votre offre se classe au <Text style={{ fontWeight: 'bold' }}>rang {data.rejet.classement || '—'}</Text>.
            </Text>
          </View>
        </View>

        {/* Section E */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>E – Identification de l'attributaire</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#78350f', marginBottom: 8 }]}>
              (En cas d'allotissement, cette rubrique est à renseigner pour chacun des lots de la procédure de passation du marché public ou 
              de l'accord-cadre pour lesquels une offre a été retenue. Préciser pour chaque lot, son numéro et son intitulé tels qu'ils figurent 
              dans les documents de la consultation.)
            </Text>
            <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 7, color: '#78350f', marginBottom: 8 }]}>
              (En cas d'infructuosité de la procédure, mention en est faite à cette rubrique, justifiant l'absence de désignation de tout 
              attributaire).
            </Text>
            
            <Text style={[styles.paragraph, { fontWeight: 'bold', marginBottom: 4 }]}>Désignation de l'attributaire :</Text>
            <Text style={styles.paragraph}>Le marché public ou l'accord-cadre est attribué à :</Text>
            
            <Text style={[styles.paragraph, { fontWeight: 'bold', marginTop: 8, marginBottom: 8 }]}>
              {data.attributaire.denomination || '—'}
            </Text>
            
            <Text style={styles.paragraph}>
              En effet, en considération des critères de choix définis dans le Règlement de la Consultation, son offre a obtenu{' '}
              <Text style={{ fontWeight: 'bold' }}>{data.attributaire.total} points</Text> sur un total de 100.
            </Text>
            
            <Text style={[styles.paragraph, { marginTop: 8, fontWeight: 'bold' }]}>Le détail est le suivant :</Text>
            <Text style={styles.fieldValueFull}>
              Note économique : <Text style={{ fontWeight: 'bold' }}>{data.attributaire.noteEco} / {data.attributaire.maxEco || '60'} points</Text>
            </Text>
            <Text style={styles.fieldValueFull}>
              Note technique : <Text style={{ fontWeight: 'bold' }}>{data.attributaire.noteTech} / {data.attributaire.maxTech || '40'} points</Text>
            </Text>
            
            {data.attributaire.motifs && (
              <>
                <Text style={[styles.paragraph, { marginTop: 10, fontWeight: 'bold' }]}>Pour les motifs suivants :</Text>
                <Text style={styles.fieldValueFull}>{data.attributaire.motifs}</Text>
              </>
            )}
          </View>
        </View>

        {/* Section F - Délais et voies de recours */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>F – Délais et voies de recours</Text>
          <View style={styles.sectionContent}>
            <Checkbox 
              checked={true} 
              label={`Le délai de suspension de la signature du marché public ou de l'accord-cadre est de ${data.delaiStandstill || '11'} jours, à compter de la date d'envoi de la présente notification.`} 
            />
            
            <View style={{ marginTop: 12, breakInside: 'avoid' }}>
              <Checkbox 
                checked={true} 
                label="Référé précontractuel :" 
              />
              <Text style={[styles.paragraph, { marginLeft: 20, marginTop: 4, fontSize: 7 }]}>
                Le candidat peut, s'il le souhaite, exercer un référé précontractuel contre la présente procédure de passation, 
                devant le président du tribunal administratif, avant la signature du marché public ou de l'accord-cadre.
              </Text>
            </View>
            
            <View style={{ marginTop: 12, breakInside: 'avoid' }}>
              <Checkbox 
                checked={true} 
                label="Recours pour excès de pouvoir en cas de déclaration d'infructuosité de la procédure :" 
              />
              <Text style={[styles.paragraph, { marginLeft: 20, marginTop: 4, fontSize: 7 }]}>
                Dans l'hypothèse d'une déclaration d'infructuosité de la procédure, le candidat peut, s'il le souhaite, 
                exercer un recours pour excès de pouvoir contre cette décision, devant le tribunal administratif. 
                Le juge doit être saisi dans un délai de deux mois à compter de la notification du présent courrier.
              </Text>
            </View>
          </View>
        </View>

        {/* Section G - Signature */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionHeader}>G – Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</Text>
          <View style={styles.sectionContent}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureText}>
                À {data.signature.lieu || 'Montreuil'}, le {data.signature.date || new Date().toLocaleDateString('fr-FR')}
              </Text>
              <Text style={[styles.signatureText, { marginTop: 20, fontWeight: 'bold' }]}>
                Signature
              </Text>
              <Text style={[styles.signatureLabel, { marginTop: 4 }]}>
                (représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)
              </Text>
              {data.signature.signataireNom && (
                <Text style={[styles.signatureText, { marginTop: 30, fontWeight: 'bold' }]}>
                  {data.signature.signataireNom}
                </Text>
              )}
              {data.signature.signataireTitre && (
                <Text style={[styles.signatureText, { marginTop: 8 }]}>
                  {data.signature.signataireTitre}
                </Text>
              )}
            </View>
          </View>
        </View>

      </View>

      {/* ===== FOOTER FIXE ===== */}
      <View style={styles.footerFixed} fixed>
        <View style={styles.footerContent}>
          <Text style={styles.footerLeft}>NOTI3 – Notification de rejet de candidature ou d'offre</Text>
          <Text style={styles.footerCenter}>N° de procédure: {data.numeroProcedure || '—'}</Text>
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
