import { saveAs } from 'file-saver';
import type { Noti3Data } from '../types';
import { loadNotiLogos, generateHeaderWithLogos } from './logoLoader';

/**
 * Génère un document HTML pour NOTI3
 */
export async function generateNoti3Html(data: Noti3Data): Promise<string> {
  // Charger les logos en base64
  const { logoAfpa, logoRepublique } = await loadNotiLogos();
  const logosHtml = generateHeaderWithLogos(logoAfpa, logoRepublique);
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOTI3 - Notification de rejet</title>
  <style>
    /* Mise en page A4 pour impression */
    @page {
      size: A4;
      margin: 2cm;
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
    }
    
    .section-content {
      border: 1px solid #d0d7de;
      border-top: none;
      border-radius: 0 0 4px 4px;
      padding: 10px 14px 14px;
      margin-bottom: 10px;
      background-color: #ffffff;
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
    }
    
    .signature-block {
      text-align: right;
      margin-top: 24px;
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
      }

      .document {
        max-width: none;
        margin: 0;
      }

      .section-header {
        page-break-after: avoid;
      }

      .section-content {
        page-break-inside: avoid;
      }

      .footer {
        position: fixed;
        bottom: 0.5cm;
        left: 0;
        right: 0;
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
        <h3>NOTIFICATION DE REJET DE CANDIDATURE OU D'OFFRE</h3>
      </td>
      <td>
        <div class="noti-code">NOTI3</div>
      </td>
    </tr>
  </table>
  
  <p class="intro">
    Le formulaire NOTI3 est un modèle de lettre qui peut être utilisé par le pouvoir adjudicateur ou l'entité adjudicatrice pour notifier au candidat non retenu, le rejet de sa candidature ou de son offre et l'attribution du marché public ou en cas d'abandon de la procédure.
  </p>
  
  <!-- Section A -->
  <div class="section-header">A - Identification du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
  <div class="section-content">
    <div class="field-label">AFPA</div>
    <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.nom)}</div>
    <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.adresseVoie)}</div>
    <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.codePostal)} ${escapeHtml(data.pouvoirAdjudicateur.ville)}</div>
  </div>
  
  <!-- Section B -->
  <div class="section-header">B - Objet de la notification</div>
  <div class="section-content">
    <div class="field-label">Objet de la consultation</div>
    <div class="field-value">${escapeHtml(data.objetConsultation)}</div>
    
    <p><strong>La présente notification correspond :</strong></p>
    
    <div class="checkbox-item">
      ${data.notification.type === 'ensemble' ? '☒' : '☐'} à l'ensemble du marché public
    </div>
    
    ${data.notification.type === 'lots' ? data.notification.lots.map(lot => `
    <div class="checkbox-item">
      ☒ au lot n° ${lot.numero} : ${escapeHtml(lot.intitule)}
    </div>
    `).join('') : ''}
  </div>
  
  <!-- Section C -->
  <div class="section-header">C - Identification du candidat ou du soumissionnaire</div>
  <div class="section-content">
    <div class="field-value"><strong>${escapeHtml(data.candidat.denomination)}</strong></div>
    <div class="field-value">${escapeHtml(data.candidat.adresse1)}</div>
    ${data.candidat.adresse2 ? `<div class="field-value">${escapeHtml(data.candidat.adresse2)}</div>` : ''}
    <div class="field-value">${escapeHtml(data.candidat.codePostal)} ${escapeHtml(data.candidat.ville)}</div>
    <div class="field-value">SIRET : ${escapeHtml(data.candidat.siret)}</div>
    <div class="field-value">Email : ${escapeHtml(data.candidat.email)}</div>
    <div class="field-value">Téléphone : ${escapeHtml(data.candidat.telephone)}</div>
  </div>
  
  <!-- Section D -->
  <div class="section-header">D - Notification de rejet de la candidature ou de l'offre</div>
  <div class="section-content">
    <p>J'ai le regret de vous faire connaître que, dans le cadre de la consultation rappelée ci-dessus :</p>
    
    <div class="checkbox-item">
      ${data.rejet.type === 'candidature' ? '☒' : '☐'} votre candidature n'a pas été retenue.
    </div>
    
    <div class="checkbox-item">
      ${data.rejet.type === 'offre' ? '☒' : '☐'} votre offre n'a pas été retenue.
    </div>
    
    <p><strong>pour les motifs suivants :</strong></p>
    <div class="field-value">${escapeHtml(data.rejet.motifs)}</div>
    
    <p>En considération des critères de choix définis dans le Règlement de la Consultation, votre offre a obtenu ${escapeHtml(data.rejet.total)} points sur un total de 100.</p>
    
    <div class="field-value">Note économique : ${escapeHtml(data.rejet.noteEco)} / ${escapeHtml(data.rejet.maxEco || '60')} points</div>
    <div class="field-value">Note technique : ${escapeHtml(data.rejet.noteTech)} / ${escapeHtml(data.rejet.maxTech || '40')} points</div>
    
    <p>Au classement final, votre offre se classe au rang ${escapeHtml(data.rejet.classement)}.</p>
  </div>
  
  <!-- Section E -->
  <div class="section-header">E - Identification de l'attributaire</div>
  <div class="section-content">
    <p>Le marché public ou l'accord-cadre est attribué à :</p>
    
    <div class="field-value"><strong>${escapeHtml(data.attributaire.denomination)}</strong></div>
    
    <p>En effet, en considération des critères de choix définis dans le Règlement de la Consultation, son offre a obtenu ${escapeHtml(data.attributaire.total)} points sur un total de 100.</p>
    
    <div class="field-value">Note économique : ${escapeHtml(data.attributaire.noteEco)} / ${escapeHtml(data.attributaire.maxEco || '60')} points</div>
    <div class="field-value">Note technique : ${escapeHtml(data.attributaire.noteTech)} / ${escapeHtml(data.attributaire.maxTech || '40')} points</div>
    
    <p><strong>Pour les motifs suivants :</strong></p>
    <div class="field-value">${escapeHtml(data.attributaire.motifs)}</div>
  </div>
  
  <!-- Section F -->
  <div class="section-header">F - Délais et voies de recours</div>
  <div class="section-content">
    <p>Le délai de suspension de la signature du marché public ou de l'accord-cadre est de ${escapeHtml(data.delaiStandstill)} jours, à compter de la date d'envoi de la présente notification.</p>
    
    <p><strong>Référé précontractuel :</strong> Le candidat peut, s'il le souhaite, exercer un référé précontractuel contre la présente procédure de passation, devant le président du tribunal administratif, avant la signature du marché public ou de l'accord-cadre.</p>
    
    <p><strong>Recours pour excès de pouvoir :</strong> Dans l'hypothèse d'une déclaration d'infructuosité de la procédure, le candidat peut, s'il le souhaite, exercer un recours pour excès de pouvoir contre cette décision, devant le tribunal administratif. Le juge doit être saisi dans un délai de deux mois à compter de la notification du présent courrier.</p>
  </div>
  
  <!-- Section G -->
  <div class="section-header">G - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
  <div class="section-content">
    <div class="signature-block">
      <p>À ${escapeHtml(data.signature.lieu)}, le ${escapeHtml(data.signature.date)}</p>
      <p><strong>Signature</strong></p>
      <p class="signature-note">(représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)</p>
      <p>${escapeHtml(data.signature.signataireTitre)}</p>
    </div>
    
    <p style="margin-top: 30px;"><strong>Pour la Direction Nationale des Achats</strong></p>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    NOTI3 – Notification de rejet de candidature ou d'offre | N° de procédure: ${escapeHtml(data.numeroProcedure)} | Page <span id="page-num">1</span>
  </div>
</body>
</html>
  `.trim();
  
  return html;
}

/**
 * Exporte le NOTI3 en HTML et télécharge le fichier
 */
export async function exportNoti3Html(data: Noti3Data): Promise<void> {
  const html = await generateNoti3Html(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const fileName = `NOTI3_${data.numeroProcedure.replace(/[^a-zA-Z0-9]/g, '_')}_${data.candidat.denomination.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  saveAs(blob, fileName);
}

/**
 * Génère le HTML comme Blob pour utilisation dans ZIP
 */
export async function generateNoti3HtmlAsBlob(data: Noti3Data): Promise<Blob> {
  const html = await generateNoti3Html(data);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
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
