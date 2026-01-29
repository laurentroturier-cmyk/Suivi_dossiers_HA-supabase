import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  Image, 
  StyleSheet
} from '@react-pdf/renderer';
import type { Noti1Data } from '../types/noti1';

// Styles professionnels du document NOTI1
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
    borderBottomColor: '#1e40af',
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
    color: '#1e3a5f',
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 7,
    color: '#64748b',
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
    borderTopColor: '#cbd5e1',
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
    color: '#64748b',
  },
  
  footerCenter: {
    fontSize: 7,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  
  footerRight: {
    fontSize: 7,
    color: '#64748b',
  },
  
  footerLine2: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  
  footerAfpa: {
    fontSize: 6,
    color: '#94a3b8',
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
    borderColor: '#1e40af',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  titleBannerLeft: {
    flex: 1,
    backgroundColor: '#dbeafe',
    padding: 12,
    justifyContent: 'center',
  },
  
  titleBannerRight: {
    width: 70,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  
  titleH1: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
    marginBottom: 3,
  },
  
  titleH2: {
    fontSize: 9,
    color: '#1e3a5f',
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
    color: '#64748b',
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
    backgroundColor: '#1e40af',
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
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  
  // Champs
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  fieldLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
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
    borderColor: '#1e40af',
    borderRadius: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkboxChecked: {
    backgroundColor: '#1e40af',
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
    backgroundColor: '#cbd5e1',
    marginTop: 30,
    marginBottom: 5,
  },
  
  signatureLabel: {
    fontSize: 7,
    color: '#64748b',
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

interface Noti1PDFProps {
  data: Noti1Data;
  logoAfpa?: string;
  logoRepublique?: string;
}

export const Noti1PDF = ({ 
  data,
  logoAfpa,
  logoRepublique
}: Noti1PDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* ===== HEADER FIXE ===== */}
      <View style={styles.headerFixed} fixed>
        {logoRepublique ? (
          <Image src={logoRepublique} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#f1f5f9', borderRadius: 4 }]} />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</Text>
          <Text style={styles.headerSubtitle}>Direction des Affaires Juridiques</Text>
        </View>
        {logoAfpa ? (
          <Image src={logoAfpa} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#f1f5f9', borderRadius: 4 }]} />
        )}
      </View>

      {/* ===== CONTENU ===== */}
      <View style={styles.content}>
        
        {/* Bandeau titre */}
        <View style={styles.titleBanner}>
          <View style={styles.titleBannerLeft}>
            <Text style={styles.titleH1}>MARCHÉS PUBLICS</Text>
            <Text style={styles.titleH2}>Information au titulaire pressenti ¹</Text>
          </View>
          <View style={styles.titleBannerRight}>
            <Text style={styles.notiCode}>NOTI1</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Le formulaire NOTI1 peut être utilisé par le pouvoir adjudicateur ou l'entité adjudicatrice pour informer le soumissionnaire auquel il est envisagé d'attribuer le marché public que son offre a été retenue. Il permet aussi de réclamer au titulaire pressenti l'ensemble des documents prouvant qu'il a satisfait à ses obligations fiscales et sociales et à ses obligations d'assurance décennale s'il y est soumis, dans le délai fixé par l'acheteur.
        </Text>

        {/* Section A */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>A – Identification du pouvoir adjudicateur ou de l'entité adjudicatrice</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b', marginBottom: 6 }]}>(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold', fontSize: 9 }]}>AFPA</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold' }]}>{data.pouvoirAdjudicateur.nom}</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.adresseVoie}</Text>
            <Text style={styles.fieldValueFull}>{data.pouvoirAdjudicateur.codePostal} {data.pouvoirAdjudicateur.ville}</Text>
          </View>
        </View>

        {/* Section B */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>B – Objet de la consultation</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b', marginBottom: 6 }]}>(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</Text>
            <Text style={styles.fieldValueFull}>{data.objetConsultation || '—'}</Text>
            <Text style={styles.fieldValueFull}>{data.numeroProcedure || '—'}</Text>
          </View>
        </View>

        {/* Section C */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>C – Identification du titulaire pressenti</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b', marginBottom: 6 }]}>[Indiquer le nom commercial et la dénomination sociale du candidat individuel ou de chaque membre du groupement d'entreprises candidat, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de candidature groupée, identifier précisément le mandataire du groupement.]</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold' }]}>{data.titulaire.denomination || '—'}</Text>
            <Text style={styles.fieldValueFull}>{data.titulaire.adresse1 || '—'}</Text>
            {data.titulaire.adresse2 && (
              <Text style={styles.fieldValueFull}>{data.titulaire.adresse2}</Text>
            )}
            <Text style={styles.fieldValueFull}>{data.titulaire.codePostal} {data.titulaire.ville}</Text>
            <Text style={styles.fieldValueFull}>SIRET : {data.titulaire.siret || '—'}</Text>
            <Text style={styles.fieldValueFull}>{data.titulaire.email || '—'}</Text>
          </View>
        </View>

        {/* Section D */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>D – Information au titulaire pressenti</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>Je vous informe que l'offre que vous avez faite, au titre de la consultation désignée ci-dessus, a été retenue :</Text>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b' }]}>(Cocher la case correspondante.)</Text>
            <Checkbox 
              checked={data.attribution.type === 'ensemble'} 
              label="pour l'ensemble du marché public (en cas de non allotissement)."
            />
            <Checkbox 
              checked={data.attribution.type === 'lots'} 
              label={`pour le(s) lot(s) n° ${data.attribution.type === 'lots' && data.attribution.lots?.length 
                ? data.attribution.lots.map(l => `${l.numero}`).join(', ')
                : '________'} de la procédure de passation du marché public (en cas d'allotissement.)`}
            />
            {data.attribution.type === 'lots' && data.attribution.lots?.length > 0 && (
              <View style={{ marginLeft: 20, marginTop: 4 }}>
                <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b' }]}>(Indiquer l'intitulé du ou des lots concernés tel qu'il figure dans les documents de la consultation.)</Text>
                {data.attribution.lots.map((lot, idx) => (
                  <Text key={idx} style={styles.fieldValueFull}>{lot.intitule}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Section E */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>E – Délai de transmission, par le titulaire pressenti, des attestations sociales et fiscales et, s'il y est soumis, de l'attestation d'assurance de responsabilité décennale</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>
              Pour permettre la signature et la notification du marché public, vous devez me transmettre, avant le {data.documents.dateSignature || '________'}, les documents figurant :
            </Text>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b' }]}>(Cocher la ou les cases correspondantes.)</Text>
            <Checkbox 
              checked={data.documents.candidatFrance} 
              label="en rubrique F (candidat individuel ou membre du groupement établi en France) ;"
            />
            <Checkbox 
              checked={data.documents.candidatEtranger} 
              label="en rubrique G (candidat individuel ou membre du groupement établi ou domicilié à l'étranger)."
            />
          </View>
        </View>

        {/* Section F */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>F – Candidat individuel ou membre du groupement établi en France</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b' }]}>Uniquement si les informations permettant d'accéder aux documents de preuve n'ont pas été fournis à l'occasion de la présentation des candidatures ou s'ils n'ont pas déjà été fournis par l'opérateur concerné :</Text>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b', marginTop: 4 }]}>(Lister les documents de preuve exigés)</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold', marginTop: 6 }]}>Les documents à produire sont :</Text>
            <Text style={styles.fieldValueFull}>{data.documents.documentsPreuve || '• Attestation fiscale\n• Attestation URSSAF'}</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold', marginTop: 8 }]}>Délai pour répondre à la demande, à défaut de quoi l'offre sera rejetée :</Text>
            <Text style={styles.fieldValueFull}>{(() => {
              if (!data.documents.delaiReponse) return '________';
              const jours = parseInt(data.documents.delaiReponse);
              if (isNaN(jours)) return data.documents.delaiReponse;
              const today = new Date();
              const dateCalculee = new Date(today);
              dateCalculee.setDate(today.getDate() + jours);
              const dateStr = dateCalculee.toLocaleDateString('fr-FR');
              return `${dateStr} (${jours} jour${jours > 1 ? 's' : ''} à compter de la date d'export)`;
            })()}</Text>
          </View>
        </View>

        {/* Section G */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>G – Candidat individuel ou membre du groupement établi ou domicilié à l'étranger</Text>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b' }]}>Uniquement si les informations permettant d'accéder aux documents de preuve n'ont pas été fournis à l'occasion de la présentation des candidatures ou s'ils n'ont pas déjà été fournis par l'opérateur concerné :</Text>
            <Text style={[styles.paragraph, { fontSize: 7, fontStyle: 'italic', color: '#64748b', marginTop: 4 }]}>(Lister les documents de preuve exigés)</Text>
            <Text style={styles.fieldValueFull}>Documents équivalents selon la législation du pays d'établissement</Text>
            <Text style={[styles.fieldValueFull, { fontWeight: 'bold', marginTop: 8 }]}>Délai pour répondre à la demande, à défaut de quoi l'offre sera rejetée :</Text>
            <Text style={styles.fieldValueFull}>________</Text>
          </View>
        </View>

        {/* Section H - Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>H – Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</Text>
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
          <Text style={styles.footerLeft}>NOTI1 – Information au titulaire pressenti</Text>
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
        <View style={{ marginTop: 4 }}>
          <Text style={[styles.footerAfpa, { fontSize: 5 }]}>
            ¹ Formulaire non obligatoire disponible, avec sa notice explicative, sur le site du ministère chargé de l'économie.
          </Text>
        </View>
      </View>

    </Page>
  </Document>
);

export default Noti1PDF;
