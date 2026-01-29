import { saveAs } from 'file-saver';
import type { Noti1Data } from '../types';
import { loadNotiLogos, generateHeaderWithLogos } from './logoLoader';
import { exportHtmlToPdf, htmlToPdfBlob } from './pdfExport';

/**
 * Génère un document HTML pour NOTI1
 */
export async function generateNoti1Html(data: Noti1Data): Promise<string> {
  // Charger les logos en base64
  const { logoAfpa, logoRepublique } = await loadNotiLogos();
  const logosHtml = generateHeaderWithLogos(logoAfpa, logoRepublique);
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOTI1 - Information au titulaire pressenti</title>
  <style>
    /* Mise en page A4 pour impression */
    @page {
      size: A4;
      margin: 2cm 2cm 2.5cm 2cm; /* haut droite bas gauche - plus d'espace en bas pour le pied de page */
    }

    body {
      font-family: Arial, "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111827; /* gris très foncé, plus doux que noir pur */
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }

    .document {
      max-width: 18cm;
      margin: 0 auto;
    }
    
    /* En‑tête principal */
    .header {
      text-align: center;
      margin: 10px 0 20px 0;
    }

    .header-logos {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 0 10px;
    }

    .header-logo-left,
    .header-logo-right {
      max-height: 70px;
      height: auto;
      width: auto;
      object-fit: contain;
    }

    .header-logo-left {
      margin-right: auto;
    }

    .header-logo-right {
      margin-left: auto;
    }
    
    .header h1 {
      font-size: 12pt;
      font-weight: bold;
      margin: 10px 0 4px 0;
    }
    
    .header p {
      font-size: 9pt;
      margin: 0;
    }
    
    /* Tableau de titre (bandeau NOTI) */
    .title-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #d0d7de;
      page-break-inside: avoid;
    }
    
    .title-table td {
      padding: 12px 10px;
      text-align: center;
      vertical-align: middle;
      border-right: 1px solid #d0d7de;
      background-color: #e5f0fb; /* bleu très clair, sobre à l'impression */
    }

    .title-table td:last-child {
      border-right: none;
    }
    
    .title-table td:first-child {
      width: 85%;
    }
    
    .title-table td:last-child {
      width: 15%;
    }
    
    .title-table h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 0 0 4px 0;
    }
    
    .title-table h3 {
      font-size: 11pt;
      font-weight: bold;
      margin: 0;
    }
    
    .title-table .noti-code {
      font-size: 14pt;
      font-weight: bold;
    }
    
    .intro {
      font-size: 9pt;
      font-style: italic;
      margin: 10px 0 24px 0;
      color: #4b5563;
    }
    
    /* Blocs de section : en‑tête + contenu encadrés */
    .section-header {
      background-color: #e5e7eb; /* gris clair pour impression */
      color: #111827;
      font-size: 13pt;
      font-weight: bold;
      padding: 8px 14px;
      margin: 24px 0 0 0;
      border: 1px solid #d0d7de;
      border-radius: 4px 4px 0 0;
      page-break-after: avoid;
      orphans: 3;
      widows: 3;
    }
    
    .section-content {
      border: 1px solid #d0d7de;
      border-top: none;
      border-radius: 0 0 4px 4px;
      padding: 10px 14px 14px;
      margin-bottom: 10px;
      background-color: #ffffff;
      page-break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    
    /* Groupe section-header + section-content pour éviter les coupures */
    .section-group {
      page-break-inside: avoid;
      margin-bottom: 16px;
    }
    
    .field-label {
      font-weight: bold;
      margin-top: 8px;
      margin-bottom: 2px;
      display: block;
    }
    
    .field-value {
      margin-bottom: 6px;
    }
    
    .checkbox-item {
      margin: 6px 0;
      page-break-inside: avoid;
    }
    
    /* Éviter les coupures dans les paragraphes */
    p {
      orphans: 3;
      widows: 3;
      page-break-inside: avoid;
    }
    
    .signature-block {
      text-align: right;
      margin-top: 24px;
      page-break-inside: avoid;
      page-break-before: auto;
    }
    
    .signature-block p {
      margin: 4px 0;
    }
    
    .signature-note {
      font-size: 8pt;
      font-style: italic;
      color: #4b5563;
    }
    
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 9pt;
      padding-top: 8px;
      border-top: 1px solid #d1d5db;
      color: #6b7280;
    }
    
    /* En-tête de page pour impression */
    .print-header {
      display: none;
    }
    
    /* Pied de page pour impression */
    .print-footer {
      display: none;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        orphans: 3;
        widows: 3;
      }

      .document {
        max-width: none;
        margin: 0;
      }
      
      /* Masquer les éléments non nécessaires */
      .header-logos {
        page-break-after: avoid;
      }
      
      .header {
        page-break-after: avoid;
        margin-bottom: 15px;
      }
      
      .title-table {
        page-break-after: avoid;
        margin-bottom: 15px;
      }
      
      .intro {
        page-break-after: avoid;
        margin-bottom: 20px;
      }

      /* Sections : éviter les coupures */
      .section-header {
        page-break-after: avoid;
        page-break-inside: avoid;
        margin-top: 20px;
      }

      .section-content {
        page-break-inside: avoid;
        page-break-before: avoid;
      }
      
      .section-group {
        page-break-inside: avoid;
      }
      
      /* Tableaux : éviter les coupures */
      table {
        page-break-inside: avoid;
      }
      
      tr {
        page-break-inside: avoid;
      }
      
      /* Paragraphes et listes */
      p {
        orphans: 3;
        widows: 3;
        page-break-inside: avoid;
      }
      
      .checkbox-item {
        page-break-inside: avoid;
      }
      
      /* Signature : toujours sur une nouvelle page si possible */
      .signature-block {
        page-break-inside: avoid;
        margin-top: 30px;
      }
      
      /* Footer fixe en bas de page */
      .footer {
        position: fixed;
        bottom: 0.5cm;
        left: 2cm;
        right: 2cm;
        text-align: center;
        font-size: 8pt;
        padding-top: 4px;
        border-top: 1px solid #d1d5db;
        color: #6b7280;
        background-color: #ffffff;
      }
      
      /* Éviter les pages presque vides */
      .section-content:first-child {
        page-break-before: auto;
      }
      
      /* Espacement optimal entre sections */
      .section-group + .section-group {
        margin-top: 20px;
      }
    }
  </style>
</head>
<body>
  <!-- En-tête -->
  <div class="header">
    ${logosHtml}
    <h1>MINISTÈRE DE L'ECONOMIE ET DES FINANCES</h1>
    <p>Direction des Affaires Juridiques</p>
  </div>
  
  <!-- Titre principal -->
  <table class="title-table">
    <tr>
      <td>
        <h2>MARCHÉS PUBLICS</h2>
        <h3>INFORMATION AU TITULAIRE PRESSENTI <sup>1</sup></h3>
      </td>
      <td>
        <div class="noti-code">NOTI1</div>
      </td>
    </tr>
  </table>
  
  <p class="intro">
    Le formulaire NOTI1 peut être utilisé par le pouvoir adjudicateur ou l'entité adjudicatrice pour informer le soumissionnaire auquel il est envisagé d'attribuer le marché public que son offre a été retenue.
    Il permet aussi de réclamer au titulaire pressenti l'ensemble des documents prouvant qu'il a satisfait à ses obligations fiscales et sociales et à ses obligations d'assurance décennale s'il y est soumis, dans le délai fixé par l'acheteur.
  </p>
  
  <!-- Section A -->
  <div class="section-group">
    <div class="section-header">A - Identification du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
    <div class="section-content">
      <p style="font-size: 8pt; font-style: italic; color: #6b7280; margin-bottom: 8px;">(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</p>
      <div class="field-label">AFPA</div>
      <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.nom)}</div>
      <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.adresseVoie)}</div>
      <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.codePostal)} ${escapeHtml(data.pouvoirAdjudicateur.ville)}</div>
    </div>
  </div>
  
  <!-- Section B -->
  <div class="section-group">
    <div class="section-header">B - Objet de la consultation</div>
    <div class="section-content">
      <p style="font-size: 8pt; font-style: italic; color: #6b7280; margin-bottom: 8px;">(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</p>
      <div class="field-value">${escapeHtml(data.objetConsultation)}</div>
      <div class="field-value" style="margin-top: 8px;">${escapeHtml(data.numeroProcedure)}</div>
    </div>
  </div>
  
  <!-- Section C -->
  <div class="section-group">
    <div class="section-header">C - Identification du titulaire pressenti</div>
    <div class="section-content">
      <p style="font-size: 8pt; font-style: italic; color: #6b7280; margin-bottom: 8px;">[Indiquer le nom commercial et la dénomination sociale du candidat individuel ou de chaque membre du groupement d'entreprises candidat, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de candidature groupée, identifier précisément le mandataire du groupement.]</p>
      <div class="field-value" style="font-weight: bold;">${escapeHtml(data.titulaire.denomination)}</div>
      <div class="field-value">${escapeHtml(data.titulaire.adresse1)}</div>
      ${data.titulaire.adresse2 ? `<div class="field-value">${escapeHtml(data.titulaire.adresse2)}</div>` : ''}
      <div class="field-value">${escapeHtml(data.titulaire.codePostal)} ${escapeHtml(data.titulaire.ville)}</div>
      <div class="field-value">SIRET : ${escapeHtml(data.titulaire.siret)}</div>
      <div class="field-value">${escapeHtml(data.titulaire.email)}</div>
    </div>
  </div>
  
  <!-- Section D -->
  <div class="section-group">
    <div class="section-header">D - Information au titulaire pressenti</div>
    <div class="section-content">
      <p>Je vous informe que l'offre que vous avez faite, au titre de la consultation désignée ci-dessus, a été retenue :</p>
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin: 8px 0;">(Cocher la case correspondante.)</p>
      
      <div class="checkbox-item">
        ${data.attribution.type === 'ensemble' ? '☑' : '☐'} pour l'ensemble du marché public (en cas de non allotissement).
      </div>
      
      ${data.attribution.type === 'lots' ? `
      <div class="checkbox-item">
        ☑ pour le(s) lot(s) n° ${data.attribution.lots.map(l => `${l.numero}`).join(', ')} de la procédure de passation du marché public (en cas d'allotissement.) :
      </div>
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin: 4px 0 8px 24px;">(Indiquer l'intitulé du ou des lots concernés tel qu'il figure dans les documents de la consultation.)</p>
      ${data.attribution.lots.map(l => `<div style="margin-left: 24px;">${escapeHtml(l.intitule)}</div>`).join('')}
      ` : `
      <div class="checkbox-item">
        ☐ pour le(s) lot(s) n° __________ de la procédure de passation du marché public (en cas d'allotissement.)
      </div>
      `}
    </div>
  </div>
  
  <!-- Section E -->
  <div class="section-group">
    <div class="section-header">E - Délai de transmission, par le titulaire pressenti, des attestations sociales et fiscales et, s'il y est soumis, de l'attestation d'assurance de responsabilité décennale</div>
    <div class="section-content">
      <p>Pour permettre la signature et la notification du marché public, vous devez me transmettre, avant le <strong>${escapeHtml(data.documents.dateSignature || '________')}</strong>, les documents figurant :</p>
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin: 8px 0;">(Cocher la ou les cases correspondantes.)</p>
      
      <div class="checkbox-item">
        ${data.documents.candidatFrance ? '☑' : '☐'} en rubrique F (candidat individuel ou membre du groupement établi en France) ;
      </div>
      
      <div class="checkbox-item">
        ${data.documents.candidatEtranger ? '☑' : '☐'} en rubrique G (candidat individuel ou membre du groupement établi ou domicilié à l'étranger).
      </div>
    </div>
  </div>

  <!-- Section F -->
  <div class="section-group">
    <div class="section-header">F - Candidat individuel ou membre du groupement établi en France</div>
    <div class="section-content">
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin-bottom: 8px;">Uniquement si les informations permettant d'accéder aux documents de preuve n'ont pas été fournis à l'occasion de la présentation des candidatures ou s'ils n'ont pas déjà été fournis par l'opérateur concerné :</p>
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin-bottom: 4px;">(Lister les documents de preuve exigés)</p>
      <div class="field-label">Les documents à produire sont :</div>
      <div class="field-value" style="white-space: pre-wrap;">${escapeHtml(data.documents.documentsPreuve || '• Attestation fiscale\n• Attestation URSSAF')}</div>
      <div class="field-label" style="margin-top: 12px;">Délai pour répondre à la demande, à défaut de quoi l'offre sera rejetée :</div>
      <div class="field-value">${(() => {
        if (!data.documents.delaiReponse) return '________';
        const jours = parseInt(data.documents.delaiReponse);
        if (isNaN(jours)) return escapeHtml(data.documents.delaiReponse);
        const today = new Date();
        const dateCalculee = new Date(today);
        dateCalculee.setDate(today.getDate() + jours);
        const dateStr = dateCalculee.toLocaleDateString('fr-FR');
        return `${dateStr} (${jours} jour${jours > 1 ? 's' : ''} à compter de la date d'export)`;
      })()}</div>
    </div>
  </div>

  <!-- Section G -->
  <div class="section-group">
    <div class="section-header">G - Candidat individuel ou membre du groupement établi ou domicilié à l'étranger</div>
    <div class="section-content">
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin-bottom: 8px;">Uniquement si les informations permettant d'accéder aux documents de preuve n'ont pas été fournis à l'occasion de la présentation des candidatures ou s'ils n'ont pas déjà été fournis par l'opérateur concerné :</p>
      <p style="font-size: 9pt; font-style: italic; color: #6b7280; margin-bottom: 4px;">(Lister les documents de preuve exigés)</p>
      <div class="field-value">Documents équivalents selon la législation du pays d'établissement</div>
      <div class="field-label" style="margin-top: 12px;">Délai pour répondre à la demande, à défaut de quoi l'offre sera rejetée :</div>
      <div class="field-value">________</div>
    </div>
  </div>
  
  <!-- Section H -->
  <div class="section-group">
    <div class="section-header">H - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
    <div class="section-content">
      <div class="signature-block">
        <p>À ${escapeHtml(data.signature.lieu)}, le ${escapeHtml(data.signature.date)}</p>
        <p><strong>Signature</strong></p>
        <p class="signature-note">(représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)</p>
        <p>${escapeHtml(data.signature.signataireTitre)}</p>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    NOTI1 – Information au titulaire pressenti | N° de procédure: ${escapeHtml(data.numeroProcedure)} | Page <span id="page-num">1</span>
  </div>
  
  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 7pt; color: #6b7280;">
    <sup>1</sup> Formulaire non obligatoire disponible, avec sa notice explicative, sur le site du ministère chargé de l'économie.
  </div>
  
  <script>
    // Simple page numbering (would need more complex logic for multi-page)
    window.onload = function() {
      // This is a simplified version - for real page numbering, you'd need a more complex solution
    };
  </script>
</body>
</html>
  `.trim();
  
  return html;
}

/**
 * Exporte le NOTI1 en HTML et télécharge le fichier
 */
export async function exportNoti1Html(data: Noti1Data): Promise<void> {
  const html = await generateNoti1Html(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const fileName = `NOTI1_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.titulaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  saveAs(blob, fileName);
}

/**
 * Exporte le NOTI1 directement en PDF
 */
export async function exportNoti1Pdf(data: Noti1Data): Promise<void> {
  const html = await generateNoti1Html(data);
  const fileName = `NOTI1_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.titulaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  await exportHtmlToPdf(html, fileName);
}

/**
 * Génère le HTML comme Blob pour utilisation dans ZIP
 */
export async function generateNoti1HtmlAsBlob(data: Noti1Data): Promise<Blob> {
  const html = await generateNoti1Html(data);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

/**
 * Génère un Blob PDF pour usage dans les ZIP multi-lots
 */
export async function generateNoti1PdfAsBlob(data: Noti1Data): Promise<Blob> {
  const html = await generateNoti1Html(data);
  const fileName = `NOTI1_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.titulaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  return htmlToPdfBlob(html, fileName);
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
