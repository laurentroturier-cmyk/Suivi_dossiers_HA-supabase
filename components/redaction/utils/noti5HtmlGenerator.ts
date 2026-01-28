import { saveAs } from 'file-saver';
import type { Noti5Data } from '../types';
import { loadNotiLogos, generateHeaderWithLogos } from './logoLoader';
import { exportHtmlToPdf, htmlToPdfBlob } from './pdfExport';

/**
 * Génère un document HTML pour NOTI5
 */
export async function generateNoti5Html(data: Noti5Data): Promise<string> {
  // Charger les logos en base64
  const { logoAfpa, logoRepublique } = await loadNotiLogos();
  const logosHtml = generateHeaderWithLogos(logoAfpa, logoRepublique);
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOTI5 - Notification du marché public</title>
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
      color: #111827;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }

    .document {
      max-width: 18cm;
      margin: 0 auto;
    }
    
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
      background-color: #e5f0fb;
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
    
    .section-header {
      background-color: #e5e7eb;
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
    
    .field-note {
      font-size: 8pt;
      font-style: italic;
      margin-bottom: 8px;
      color: #4b5563;
    }
    
    .checkbox-item {
      margin: 6px 0;
      page-break-inside: avoid;
    }
    
    .checkbox-item-indented {
      margin: 4px 0 4px 26px;
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
      
      .checkbox-item,
      .checkbox-item-indented {
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
        <h3>NOTIFICATION DU MARCHÉ PUBLIC</h3>
      </td>
      <td>
        <div class="noti-code">NOTI5</div>
      </td>
    </tr>
  </table>
  
  <p class="intro">
    Le formulaire NOTI5 est un modèle de lettre qui peut être utilisé, par le pouvoir adjudicateur ou l'entité adjudicatrice, après qu'il ou elle ait signé le marché public, pour le notifier à l'attributaire.
  </p>
  
  <!-- Section A -->
  <div class="section-group">
    <div class="section-header">A - Identification du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
    <div class="section-content">
      <p class="field-note">(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</p>
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
      <p class="field-note">(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</p>
      <div class="field-label">Objet de la consultation</div>
      <div class="field-value">${escapeHtml(data.objetConsultation)}</div>
    </div>
  </div>
  
  <!-- Section C -->
  <div class="section-group">
    <div class="section-header">C - Identification de l'attributaire</div>
    <div class="section-content">
      <p class="field-note">[Indiquer le nom commercial et la dénomination sociale de l'attributaire individuel ou de chaque membre du groupement d'entreprises attributaire, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de groupement d'entreprises attributaire, identifier précisément le mandataire du groupement.]</p>
      
      <div class="field-label">Entreprise</div>
      <div class="field-value">${escapeHtml(data.attributaire.denomination)}</div>
      
      <div class="field-label">Adresse 1</div>
      <div class="field-value">${escapeHtml(data.attributaire.adresse1)}</div>
      
      ${data.attributaire.adresse2 ? `
      <div class="field-label">Adresse 2</div>
      <div class="field-value">${escapeHtml(data.attributaire.adresse2)}</div>
      ` : ''}
      
      <div class="field-value">${escapeHtml(data.attributaire.codePostal)} ${escapeHtml(data.attributaire.ville)}</div>
      
      <div class="field-label">SIRET</div>
      <div class="field-value">${escapeHtml(data.attributaire.siret)}</div>
      
      <div class="field-label">Email</div>
      <div class="field-value">${escapeHtml(data.attributaire.email)}</div>
    </div>
  </div>
  
  <!-- Section D -->
  <div class="section-group">
    <div class="section-header">D - Notification de l'attribution</div>
    <div class="section-content">
      <p>Je vous informe que l'offre que vous avez faite au titre de la consultation désignée ci-dessus a été retenue :</p>
      
      <p class="field-note">(Cocher la case correspondante.)</p>
      
      <div class="checkbox-item">
        ${data.notification.type === 'ensemble' ? '☒' : '☐'} pour l'ensemble du marché public (en cas de non allotissement).
      </div>
      
      ${data.notification.type === 'lots' ? `
      <div class="checkbox-item">
        ☒ pour le(s) lot(s) n° ${data.notification.lots.map(l => `${l.numero}:${l.intitule}`).join(', ')}
      </div>
      ` : `
      <div class="checkbox-item">
        ☐ pour le(s) lot(s) n°
      </div>
      `}
      
      <p>de la procédure de passation du marché public ou de l'accord cadre (en cas d'allotissement.)</p>
      
      <p>L'exécution des prestations commencera :</p>
      
      <p class="field-note">(Cocher la case correspondante.)</p>
      
      <div class="checkbox-item">
        ${data.executionPrestations.type === 'immediate' ? '☒' : '☐'} dès réception de la présente notification.
      </div>
      
      <div class="checkbox-item">
        ${data.executionPrestations.type === 'sur_commande' ? '☒' : '☐'} à réception d'un bon de commande ou d'un ordre de service que j'émettrai ultérieurement.
      </div>
    </div>
  </div>
  
  <!-- Section E -->
  <div class="section-group">
    <div class="section-header">E - Retenue de garantie ou garantie à première demande</div>
    <div class="section-content">
      <p>Le marché public qui vous est notifié comporte :</p>
      
      <div class="checkbox-item">
        ${data.garanties.aucuneGarantie ? '☒' : '☐'} aucune retenue de garantie ou garantie à première demande.
      </div>
      
      <div class="checkbox-item">
        ${data.garanties.retenue.active ? '☒' : '☐'} une retenue de garantie d'un montant de ${data.garanties.retenue.pourcentage} % du montant initial du marché public ou de l'accord-cadre, que vous pouvez remplacer par :
      </div>
      
      ${data.garanties.retenue.active ? `
      <div class="checkbox-item-indented">
        ${data.garanties.retenue.remplacablePar.garantiePremieredemande ? '☒' : '☐'} une garantie à première demande.
      </div>
      <div class="checkbox-item-indented">
        ${data.garanties.retenue.remplacablePar.cautionPersonnelle ? '☒' : '☐'} une caution personnelle et solidaire.
      </div>
      ` : ''}
      
      <div class="checkbox-item">
        ${data.garanties.garantieAvanceSuperieure30 ? '☒' : '☐'} une garantie à première demande en garantie du remboursement d'une avance supérieure à 30%. Vous ne pourrez recevoir cette avance qu'après avoir constitué cette garantie.
      </div>
      
      <div class="checkbox-item">
        ${data.garanties.garantieAvanceInferieure30.active ? '☒' : '☐'} (pour les collectivités territoriales uniquement.) une garantie à première demande en garantie du remboursement de toute ou partie d'une avance inférieure ou égale à 30%.
      </div>
      
      ${data.garanties.garantieAvanceInferieure30.active ? `
      <div class="checkbox-item-indented">
        ${data.garanties.garantieAvanceInferieure30.remplacableParCaution ? '☒' : '☐'} vous pouvez remplacer cette garantie à première demande par une caution personnelle et solidaire.
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- Section F -->
  <div class="section-group">
    <div class="section-header">F - Pièces jointes à la présente notification</div>
    <div class="section-content">
      <p>Vous trouverez ci-joints :</p>
      
      <div class="checkbox-item">
        ${data.piecesJointes.actEngagementPapier ? '☒' : '☐'} deux photocopies de l'acte d'engagement avec ses annexes, dont l'une est revêtue de la formule dite « d'exemplaire unique ». Cet exemplaire est destiné à être remis à l'établissement de crédit en cas de cession ou de nantissement de toute ou partie de votre créance. J'attire votre attention sur le fait qu'il n'est pas possible, en cas de perte, de délivrer un duplicata de l'exemplaire unique.
      </div>
      
      <div class="checkbox-item">
        ${data.piecesJointes.actEngagementPDF ? '☒' : '☐'} une copie au format électronique Adobe PDF de l'acte d'engagement.
      </div>
    </div>
  </div>
  
  <!-- Section G -->
  <div class="section-group">
    <div class="section-header">G - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
    <div class="section-content">
      <div class="signature-block">
        <p>À ${escapeHtml(data.signature.lieu)}, le ${escapeHtml(data.signature.date)}</p>
        <p><strong>Signature</strong></p>
        <p class="signature-note">(représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)</p>
        <p>${escapeHtml(data.signature.signataireTitre)}</p>
      </div>
    </div>
  </div>
  
  <!-- Section H -->
  <div class="section-group">
    <div class="section-header">H - Notification du marché public au titulaire</div>
    <div class="section-content">
      <p class="field-note">Cette rubrique comprend tous les éléments relatifs à la réception de la notification du marché public, que cette notification soit remise contre récépissé, ou qu'elle soit transmise par courrier (lettre recommandée avec accusé de réception) ou par voie électronique (profil d'acheteur).</p>
      
      <p><strong>La date d'effet du marché public court à compter de la réception de cette notification par l'attributaire, qui devient alors le titulaire du marché public et responsable de sa bonne exécution.</strong></p>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    NOTI5 – Notification du marché public | N° de procédure: ${escapeHtml(data.numeroProcedure)} | Page <span id="page-num">1</span>
  </div>
</body>
</html>
  `.trim();
  
  return html;
}

/**
 * Exporte le NOTI5 en HTML et télécharge le fichier
 */
export async function exportNoti5Html(data: Noti5Data): Promise<void> {
  const html = await generateNoti5Html(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const fileName = `NOTI5_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.attributaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  saveAs(blob, fileName);
}

/**
 * Exporte le NOTI5 directement en PDF
 */
export async function exportNoti5Pdf(data: Noti5Data): Promise<void> {
  const html = await generateNoti5Html(data);
  const fileName = `NOTI5_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.attributaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  await exportHtmlToPdf(html, fileName);
}

/**
 * Génère le HTML comme Blob pour utilisation dans ZIP
 */
export async function generateNoti5HtmlAsBlob(data: Noti5Data): Promise<Blob> {
  const html = await generateNoti5Html(data);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

/**
 * Génère un Blob PDF pour usage dans les ZIP multi-lots
 */
export async function generateNoti5PdfAsBlob(data: Noti5Data): Promise<Blob> {
  const html = await generateNoti5Html(data);
  const fileName = `NOTI5_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.attributaire.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
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
