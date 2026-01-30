import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  Image, 
  StyleSheet,
  Link
} from '@react-pdf/renderer';

// Styles professionnels du Rapport de Présentation
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
  },
  
  headerTitle: {
    fontSize: 9,
    color: '#666666',
    flex: 1,
  },
  
  logo: {
    width: 100,
    height: 60,
    objectFit: 'contain',
  },
  
  // ===== FOOTER FIXE =====
  footerFixed: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
  },
  
  footerLine1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginBottom: 4,
  },
  
  footerLeft: {
    fontSize: 7,
    color: '#666666',
  },
  
  footerCenter: {
    fontSize: 7,
    color: '#666666',
  },
  
  footerRight: {
    fontSize: 7,
    color: '#666666',
  },
  
  footerLine2: {
    alignItems: 'center',
  },
  
  footerAfpa: {
    fontSize: 6,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  
  // ===== CONTENU =====
  content: {
    flex: 1,
  },
  
  // Bandeau titre principal
  titleBanner: {
    marginBottom: 20,
    alignItems: 'center',
  },
  
  titleH1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  
  titleH2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  // Chapitre
  chapter: {
    marginBottom: 20,
  },
  
  chapterHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
    marginBottom: 10,
    marginTop: 10,
  },
  
  chapterContent: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.5,
  },
  
  // Sous-titre
  subTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  
  // Paragraphe
  paragraph: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  
  // Liste
  listItem: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 4,
    paddingLeft: 12,
  },
  
  // Sommaire
  tocItem: {
    fontSize: 10,
    color: '#0f766e',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  
  tocPage: {
    fontSize: 10,
    color: '#334155',
    fontWeight: 'normal',
  },
  
  // Tableau
  table: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  
  tableCell: {
    fontSize: 8,
    color: '#334155',
  },
  
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  
  // Badge
  badge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 8,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  
  // Highlight
  highlight: {
    backgroundColor: '#fef9c3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 8,
  },
  
  highlightText: {
    fontSize: 9,
    color: '#713f12',
    fontWeight: 'bold',
  },
  
  // Section signature
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
});

interface RapportPresentationPDFProps {
  data: any;
  logoAfpa?: string;
}

export const RapportPresentationPDF = ({ 
  data,
  logoAfpa
}: RapportPresentationPDFProps) => {
  // Helper pour formater les montants
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount).replace(/\u202F/g, ' '); // Remplacer l'espace insécable par espace normal
  };
  
  // Helper pour formater les dates
  const formatDate = (date: string): string => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ===== HEADER FIXE ===== */}
        <View style={styles.headerFixed} fixed>
          <Text style={styles.headerTitle}>Rapport de présentation</Text>
          {logoAfpa && (
            <Image src={logoAfpa} style={styles.logo} />
          )}
        </View>

        {/* ===== FOOTER FIXE ===== */}
        <View style={styles.footerFixed} fixed>
          <View style={styles.footerLine1}>
            <Text style={styles.footerLeft}>Rapport de Présentation</Text>
            <Text style={styles.footerCenter}>N° {data?.numeroProcedure || '—'}</Text>
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

        {/* ===== CONTENU ===== */}
        <View style={styles.content}>
          
          {/* Titre principal */}
          <View style={styles.titleBanner}>
            <Text style={styles.titleH1}>RAPPORT DE PRÉSENTATION</Text>
            <Text style={styles.titleH2}>{data?.procedureSelectionnee?.['Nom de la procédure'] || ''}</Text>
          </View>

          {/* SOMMAIRE */}
          <View style={styles.chapter} id="sommaire">
            <Text style={styles.chapterHeader}>SOMMAIRE</Text>
            <View style={{ marginTop: 10 }}>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre1" style={styles.tocItem}>1. CONTEXTE</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre2" style={styles.tocItem}>2. DÉROULEMENT DE LA PROCÉDURE</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre3" style={styles.tocItem}>3. DOSSIER DE CONSULTATION</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre4" style={styles.tocItem}>4. QUESTIONS - RÉPONSES</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre5" style={styles.tocItem}>5. ANALYSE DES CANDIDATURES</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre6" style={styles.tocItem}>6. MÉTHODOLOGIE D'ANALYSE DES OFFRES</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre7" style={styles.tocItem}>7. ANALYSE DE LA VALEUR DES OFFRES</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre8" style={styles.tocItem}>8. ANALYSE DE LA PERFORMANCE DU DOSSIER</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre9" style={styles.tocItem}>9. PROPOSITION D'ATTRIBUTION</Link>
              </View>
              <View style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 }}>
                <Link src="#chapitre10" style={styles.tocItem}>10. PROPOSITION DE CALENDRIER DE MISE EN ŒUVRE</Link>
              </View>
            </View>
          </View>

          {/* Saut de page après le sommaire */}
          <View break />

          {/* 1. CONTEXTE */}
          <View style={styles.chapter} id="chapitre1">
            <Text style={styles.chapterHeader}>1. CONTEXTE</Text>
            {data?.section1_contexte?.objetMarche && (
              <Text style={styles.paragraph}>{data.section1_contexte.objetMarche}</Text>
            )}
            {data?.section1_contexte?.dureeMarche && (
              <Text style={styles.paragraph}>
                Pour une durée totale de {data.section1_contexte.dureeMarche} mois.
              </Text>
            )}
          </View>

          {/* 2. DÉROULEMENT DE LA PROCÉDURE */}
          <View style={styles.chapter} id="chapitre2">
            <Text style={styles.chapterHeader}>2. DÉROULEMENT DE LA PROCÉDURE</Text>
            <Text style={styles.paragraph}>
              La procédure, menée conjointement avec {data?.section2_deroulement?.clientInterne || 'le client interne'} de l'Afpa, 
              a été lancée sur la plateforme « {data?.section2_deroulement?.supportProcedure || '—'} » selon le calendrier suivant :
            </Text>
            <Text style={styles.listItem}>• Date de publication : {data?.section2_deroulement?.datePublication || '—'}</Text>
            <Text style={styles.listItem}>• Nombre de dossiers retirés : {data?.section2_deroulement?.nombreRetraits || 0}</Text>
            <Text style={styles.listItem}>• Date de réception des offres : {data?.section2_deroulement?.dateReceptionOffres || '—'}</Text>
            <Text style={styles.listItem}>• Nombre de plis reçus : {data?.section2_deroulement?.nombrePlisRecus || 0}</Text>
            <Text style={styles.listItem}>• Date d'ouverture des plis : {data?.section2_deroulement?.dateOuverturePlis || '—'}</Text>
          </View>

          {/* 3. DOSSIER DE CONSULTATION */}
          <View style={styles.chapter} id="chapitre3">
            <Text style={styles.chapterHeader}>3. DOSSIER DE CONSULTATION</Text>
            {data?.contenuChapitre3 ? (
              <>
                <Text style={styles.paragraph}>Le dossier de consultation comprenait :</Text>
                {data.contenuChapitre3.split('\n').map((ligne: string, idx: number) => {
                  const cleanedLine = ligne.trim().replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');
                  return cleanedLine ? (
                    <Text key={idx} style={styles.listItem}>• {cleanedLine}</Text>
                  ) : null;
                })}
              </>
            ) : (
              <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#FF8800' }]}>
                [À compléter : Description du DCE et des documents fournis]
              </Text>
            )}
          </View>

          {/* 4. QUESTIONS - RÉPONSES */}
          <View style={styles.chapter} id="chapitre4">
            <Text style={styles.chapterHeader}>4. QUESTIONS - RÉPONSES</Text>
            {data?.contenuChapitre4 ? (
              <Text style={styles.paragraph}>{data.contenuChapitre4}</Text>
            ) : (
              <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#FF8800' }]}>
                [À compléter : Questions posées et réponses apportées]
              </Text>
            )}
          </View>

          {/* 5. ANALYSE DES CANDIDATURES */}
          <View style={styles.chapter} id="chapitre5">
            <Text style={styles.chapterHeader}>5. ANALYSE DES CANDIDATURES</Text>
            <Text style={styles.paragraph}>
              L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la recevabilité 
              des documents administratifs demandés dans chacune de nos procédures.
            </Text>
            <Text style={styles.paragraph}>
              L'analyse des candidatures est disponible en annexe.
            </Text>
          </View>

          {/* 6. MÉTHODOLOGIE D'ANALYSE DES OFFRES */}
          <View style={styles.chapter} id="chapitre6">
            <Text style={styles.chapterHeader}>6. MÉTHODOLOGIE D'ANALYSE DES OFFRES</Text>
            <Text style={styles.subTitle}>Critères d'attribution :</Text>
            <Text style={styles.listItem}>
              • Critère technique : {data?.section6_methodologie?.ponderationTechnique || 30}%
            </Text>
            <Text style={styles.listItem}>
              • Critère financier : {data?.section6_methodologie?.ponderationFinancier || 70}%
            </Text>
            <Text style={[styles.subTitle, { marginTop: 10 }]}>Méthode de notation :</Text>
            <Text style={styles.listItem}>
              • Note technique sur {data?.section6_methodologie?.ponderationTechnique || 30} points
            </Text>
            <Text style={styles.listItem}>
              • Note financière sur {data?.section6_methodologie?.ponderationFinancier || 70} points
            </Text>
            <Text style={styles.listItem}>
              • Note finale sur 100 points
            </Text>
          </View>

          {/* 7. ANALYSE DE LA VALEUR DES OFFRES */}
          <View style={styles.chapter} id="chapitre7">
            <Text style={styles.chapterHeader}>7. ANALYSE DE LA VALEUR DES OFFRES</Text>
            <Text style={styles.paragraph}>
              L'analyse économique et technique dans son détail est jointe au présent document en annexe.
            </Text>
            <Text style={styles.paragraph}>
              Le classement final des offres est le suivant.
            </Text>
            
            {/* SI MULTI-LOTS : afficher un tableau par lot */}
            {data?.section7_2_syntheseLots?.lots ? (
              <>
                {data.section7_2_syntheseLots.lots.map((lot: any, lotIndex: number) => (
                  <View key={lotIndex} style={{ marginBottom: 15 }} wrap={false}>
                    <Text style={[styles.subTitle, { marginTop: 10, marginBottom: 8 }]}>
                      {lot.nomLot}
                    </Text>
                    {lot.tableau && lot.tableau.length > 0 && (
                      <View style={styles.table}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableCellHeader, { width: '30%' }]}>Raison sociale</Text>
                          <Text style={[styles.tableCellHeader, { width: '10%', textAlign: 'center' }]}>Rang</Text>
                          <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Note /100</Text>
                          <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Note Fin. /{lot.poidsFinancier || 70}</Text>
                          <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Note Tech. /{lot.poidsTechnique || 30}</Text>
                          <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Montant TTC</Text>
                        </View>
                        {lot.tableau.map((offre: any, idx: number) => (
                          <View 
                            key={idx} 
                            style={[
                              styles.tableRow, 
                              idx % 2 === 1 && styles.tableRowAlt
                            ]}
                          >
                            <Text style={[styles.tableCell, { width: '30%' }]}>
                              {offre.raisonSociale || '—'}
                            </Text>
                            <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>
                              {offre.rangFinal || '—'}
                            </Text>
                            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                              {offre.noteFinaleSur100?.toFixed(2) || '—'}
                            </Text>
                            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                              {(offre.noteFinanciere ?? offre.noteFinanciereSur60)?.toFixed(2) || '—'}
                            </Text>
                            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                              {(offre.noteTechnique ?? offre.noteTechniqueSur40)?.toFixed(2) || '—'}
                            </Text>
                            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                              {formatCurrency(offre.montantTTC || 0)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </>
            ) : data?.section7_valeurOffres?.tableau ? (
              /* SINON : afficher le tableau unique */
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { width: '10%', textAlign: 'center' }]}>Rang</Text>
                  <Text style={[styles.tableCellHeader, { width: '30%' }]}>Raison sociale</Text>
                  <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Note Tech.</Text>
                  <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Note Fin.</Text>
                  <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Note /100</Text>
                  <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Montant TTC</Text>
                </View>
                {data.section7_valeurOffres.tableau.map((offre: any, idx: number) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.tableRow, 
                      idx % 2 === 1 && styles.tableRowAlt
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>
                      {offre.rangFinal}
                    </Text>
                    <Text style={[styles.tableCell, { width: '30%' }]}>
                      {offre.raisonSociale}
                    </Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                      {(offre.noteTechnique ?? offre.noteTechniqueSur40)?.toFixed(2) || '—'}
                    </Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                      {(offre.noteFinanciere ?? offre.noteFinanciereSur60)?.toFixed(2) || '—'}
                    </Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                      {offre.noteFinaleSur100?.toFixed(2) || '—'}
                    </Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                      {formatCurrency(offre.montantTTC || 0)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data?.section7_valeurOffres?.montantEstime > 0 && (
              <Text style={[styles.paragraph, { marginTop: 10 }]}>
                <Text style={{ fontWeight: 'bold' }}>Montant de l'estimation : </Text>
                {formatCurrency(data.section7_valeurOffres.montantEstime)}
              </Text>
            )}

            {!data?.section7_2_syntheseLots && data?.section7_valeurOffres?.montantAttributaire && (
              <Text style={styles.paragraph}>
                <Text style={{ fontWeight: 'bold' }}>Montant de l'offre retenue : </Text>
                {formatCurrency(data.section7_valeurOffres.montantAttributaire)}
              </Text>
            )}

            {data?.section7_valeurOffres?.montantEstime > 0 && data?.section7_valeurOffres?.montantAttributaire && (() => {
              const ecart = data.section7_valeurOffres.montantAttributaire - data.section7_valeurOffres.montantEstime;
              const ecartPourcent = (ecart / data.section7_valeurOffres.montantEstime) * 100;
              const signe = ecart >= 0 ? '+' : '';
              return (
                <Text style={styles.paragraph}>
                  <Text style={{ fontWeight: 'bold' }}>Écart par rapport à l'estimation : </Text>
                  {signe}{formatCurrency(ecart)} ({signe}{ecartPourcent.toFixed(2)}%)
                </Text>
              );
            })()}
          </View>

          {/* 8. ANALYSE DE LA PERFORMANCE DU DOSSIER */}
          <View style={styles.chapter} id="chapitre8">
            <Text style={styles.chapterHeader}>8. ANALYSE DE LA PERFORMANCE DU DOSSIER</Text>
            
            {/* SI TABLEAU DÉTAILLÉ : afficher le tableau de performance par lot */}
            {data?.section8_performance?.tableauDetaille ? (
              <>
                <Text style={styles.paragraph}>
                  Le tableau ci-dessous présente la performance achat détaillée pour chaque lot :
                </Text>
                
                <View style={[styles.table, { marginTop: 10, marginBottom: 15 }]} wrap={false}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellHeader, { width: '12%' }]}>Lot</Text>
                    <Text style={[styles.tableCellHeader, { width: '12%', textAlign: 'right' }]}>Moy. HT</Text>
                    <Text style={[styles.tableCellHeader, { width: '12%', textAlign: 'right' }]}>Moy. TTC</Text>
                    <Text style={[styles.tableCellHeader, { width: '12%', textAlign: 'right' }]}>Retenue HT</Text>
                    <Text style={[styles.tableCellHeader, { width: '12%', textAlign: 'right' }]}>Retenue TTC</Text>
                    <Text style={[styles.tableCellHeader, { width: '12%', textAlign: 'right' }]}>Gains HT</Text>
                    <Text style={[styles.tableCellHeader, { width: '13%', textAlign: 'right' }]}>Gains TTC</Text>
                    <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'right' }]}>Gains %</Text>
                  </View>
                  {data.section8_performance.tableauDetaille.map((ligne: any, idx: number) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.tableRow, 
                        idx % 2 === 1 && styles.tableRowAlt
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7 }]}>
                        {ligne.nomLot || '—'}
                      </Text>
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7, textAlign: 'right' }]}>
                        {formatCurrency(ligne.moyenneHT || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7, textAlign: 'right' }]}>
                        {formatCurrency(ligne.moyenneTTC || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7, textAlign: 'right' }]}>
                        {formatCurrency(ligne.offreRetenueHT || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7, textAlign: 'right' }]}>
                        {formatCurrency(ligne.offreRetenueTTC || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7, textAlign: 'right' }]}>
                        {formatCurrency(ligne.gainsHT || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: '13%', fontSize: 7, textAlign: 'right' }]}>
                        {formatCurrency(ligne.gainsTTC || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: '15%', fontSize: 7, textAlign: 'right' }]}>
                        {ligne.gainsPourcent?.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
                
                <Text style={styles.paragraph}>
                  Au global, la performance achat tous lots confondus (par rapport à la moyenne des offres) est de{' '}
                  <Text style={{ fontWeight: 'bold' }}>{data.section8_performance.performanceAchatPourcent.toFixed(1)}%</Text>.
                </Text>
                <Text style={styles.paragraph}>
                  L'impact budgétaire total estimé est de{' '}
                  <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data.section8_performance.impactBudgetaireTTC)} TTC</Text>
                  {' '}(soit {formatCurrency(data.section8_performance.impactBudgetaireHT)} HT).
                </Text>
              </>
            ) : data?.section8_performance ? (
              <>
                <Text style={styles.paragraph}>
                  Au global, la performance achat (par rapport à la moyenne des offres) est de{' '}
                  <Text style={{ fontWeight: 'bold' }}>{data.section8_performance.performanceAchatPourcent.toFixed(1)}%</Text>.
                </Text>
                <Text style={styles.paragraph}>
                  L'impact budgétaire estimé est de{' '}
                  <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data.section8_performance.impactBudgetaireTTC)} TTC</Text>
                  {' '}(soit {formatCurrency(data.section8_performance.impactBudgetaireHT)} HT).
                </Text>
              </>
            ) : null}
          </View>

          {/* 9. PROPOSITION D'ATTRIBUTION */}
          <View style={styles.chapter} id="chapitre9">
            <Text style={styles.chapterHeader}>9. PROPOSITION D'ATTRIBUTION</Text>
            
            {/* SI MULTI-LOTS : afficher le tableau des attributaires */}
            {data?.section7_2_syntheseLots?.lots ? (
              <>
                <Text style={styles.paragraph}>
                  Au regard de ces éléments, la commission d'ouverture souhaite attribuer les lots comme suit :
                </Text>
                
                <View style={[styles.table, { marginTop: 10, marginBottom: 15 }]} wrap={false}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellHeader, { width: '10%', textAlign: 'center' }]}>Lot</Text>
                    <Text style={[styles.tableCellHeader, { width: '30%' }]}>Nom du lot</Text>
                    <Text style={[styles.tableCellHeader, { width: '40%' }]}>Attributaire pressenti</Text>
                    <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Montant TTC</Text>
                  </View>
                  {data.section7_2_syntheseLots.lots.map((lot: any, idx: number) => {
                    const attributaire = lot.tableau && lot.tableau.length > 0 
                      ? lot.tableau.find((o: any) => o.rangFinal === 1) || lot.tableau[0]
                      : null;
                    
                    return (
                      <View 
                        key={idx} 
                        style={[
                          styles.tableRow, 
                          idx % 2 === 1 && styles.tableRowAlt
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>
                          {idx + 1}
                        </Text>
                        <Text style={[styles.tableCell, { width: '30%' }]}>
                          {lot.nomLot || '—'}
                        </Text>
                        <Text style={[styles.tableCell, { width: '40%' }]}>
                          {attributaire?.raisonSociale || '—'}
                        </Text>
                        <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                          {attributaire ? formatCurrency(attributaire.montantTTC || 0) : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                
                <Text style={[styles.paragraph, { fontWeight: 'bold' }]}>
                  Montant total de l'attribution : {formatCurrency(data.section7_2_syntheseLots.montantTotalTTC)}
                </Text>
              </>
            ) : (
              /* SINON : afficher l'attributaire unique */
              <Text style={styles.paragraph}>
                Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à{' '}
                <Text style={{ fontWeight: 'bold' }}>{data?.section9_attribution?.attributairePressenti || '—'}</Text>.
              </Text>
            )}
          </View>

          {/* 10. CALENDRIER DE MISE EN ŒUVRE */}
          <View style={styles.chapter}>
            <Text style={styles.chapterHeader}>10. PROPOSITION DE CALENDRIER DE MISE EN ŒUVRE</Text>
            {data?.chapitre10 && (
              <>
                <Text style={styles.paragraph}>
                  <Text style={{ fontWeight: 'bold' }}>Validation de la proposition d'attribution du marché : </Text>
                  {data.chapitre10.validationAttribution}
                </Text>
                <Text style={styles.paragraph}>
                  <Text style={{ fontWeight: 'bold' }}>Envoi des lettres de rejet : </Text>
                  {data.chapitre10.envoiRejet}
                </Text>
                <Text style={styles.paragraph}>
                  <Text style={{ fontWeight: 'bold' }}>Attribution du marché : </Text>
                  {data.chapitre10.attributionMarche || '[À compléter]'}
                </Text>
                {data.chapitre10.autresElements && (
                  <Text style={styles.paragraph}>
                    <Text style={{ fontWeight: 'bold' }}>Autres éléments du calendrier : </Text>
                    {data.chapitre10.autresElements}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Section signature */}
          <View style={styles.signatureSection}>
            <Text style={[styles.paragraph, { textAlign: 'right', marginTop: 40 }]}>
              <Text style={{ fontWeight: 'bold' }}>{data?.procedureSelectionnee?.Acheteur || 'RPA responsable'}</Text>
            </Text>
            <Text style={[styles.paragraph, { textAlign: 'right' }]}>
              Fait à Montreuil, le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  );
};

export default RapportPresentationPDF;
