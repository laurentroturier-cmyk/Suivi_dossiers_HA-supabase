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
            <Text style={styles.titleH2}>Information du titulaire pressenti</Text>
          </View>
          <View style={styles.titleBannerRight}>
            <Text style={styles.notiCode}>NOTI1</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Le formulaire NOTI1 est un modèle de lettre qui peut être utilisé par le pouvoir adjudicateur ou l'entité adjudicatrice pour informer le titulaire pressenti de son intention de lui attribuer le marché public.
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
          <Text style={styles.sectionHeader}>C – Identification du titulaire pressenti</Text>
          <View style={styles.sectionContent}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Entreprise :</Text>
              <Text style={styles.fieldValue}>{data.titulaire.denomination || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Adresse :</Text>
              <Text style={styles.fieldValue}>{data.titulaire.adresse1 || '—'}</Text>
            </View>
            {data.titulaire.adresse2 && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}></Text>
                <Text style={styles.fieldValue}>{data.titulaire.adresse2}</Text>
              </View>
            )}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>CP / Ville :</Text>
              <Text style={styles.fieldValue}>{data.titulaire.codePostal} {data.titulaire.ville}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>SIRET :</Text>
              <Text style={styles.fieldValue}>{data.titulaire.siret || '—'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email :</Text>
              <Text style={styles.fieldValue}>{data.titulaire.email || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Section D */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>D – Attribution envisagée</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>Je vous informe que je compte vous attribuer :</Text>
            <Checkbox 
              checked={data.attribution.type === 'ensemble'} 
              label="L'ensemble du marché public (en cas de non allotissement)"
            />
            <Checkbox 
              checked={data.attribution.type === 'lots'} 
              label={`Le(s) lot(s) n° ${data.attribution.type === 'lots' && data.attribution.lots?.length 
                ? data.attribution.lots.map(l => `${l.numero}: ${l.intitule}`).join(', ')
                : '________________'}`}
            />
          </View>
        </View>

        {/* Section E */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>E – Documents à fournir</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>
              En application de l'article R. 2144-1 du code de la commande publique, je vous demande de me transmettre les pièces suivantes avant le {data.documents.dateSignature || '________'} :
            </Text>
            <Checkbox 
              checked={data.documents.candidatFrance} 
              label="Candidat établi en France : attestations fiscales et sociales"
            />
            <Checkbox 
              checked={data.documents.candidatEtranger} 
              label="Candidat établi à l'étranger : documents équivalents"
            />
            <Text style={[styles.paragraph, { marginTop: 8 }]}>
              Délai de réponse : {data.documents.delaiReponse || '__'} jours à compter de :
            </Text>
            <Checkbox 
              checked={data.documents.decompteA === 'réception'} 
              label="La réception de la présente information"
            />
            <Checkbox 
              checked={data.documents.decompteA === 'transmission'} 
              label="La transmission des documents complémentaires"
            />
          </View>
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
      </View>

    </Page>
  </Document>
);

export default Noti1PDF;
