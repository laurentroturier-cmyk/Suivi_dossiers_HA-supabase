import { saveAs } from 'file-saver';
import type { Noti1Data } from '../types';
import { loadNotiLogos, generateHeaderWithLogos } from './logoLoader';

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
      margin: 2cm;
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
        <h3>INFORMATION DU TITULAIRE PRESSENTI</h3>
      </td>
      <td>
        <div class="noti-code">NOTI1</div>
      </td>
    </tr>
  </table>
  
  <p class="intro">
    Le formulaire NOTI1 est un modèle de lettre qui peut être utilisé, par le pouvoir adjudicateur ou l'entité adjudicatrice, pour informer le titulaire pressenti de son intention de lui attribuer le marché public.
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
  <div class="section-header">B - Objet de la consultation</div>
  <div class="section-content">
    <div class="field-label">Objet de la consultation</div>
    <div class="field-value">${escapeHtml(data.objetConsultation)}</div>
  </div>
  
  <!-- Section C -->
  <div class="section-header">C - Identification du titulaire pressenti</div>
  <div class="section-content">
    <div class="field-label">Entreprise</div>
    <div class="field-value">${escapeHtml(data.titulaire.denomination)}</div>
    
    <div class="field-label">Adresse 1</div>
    <div class="field-value">${escapeHtml(data.titulaire.adresse1)}</div>
    
    ${data.titulaire.adresse2 ? `
    <div class="field-label">Adresse 2</div>
    <div class="field-value">${escapeHtml(data.titulaire.adresse2)}</div>
    ` : ''}
    
    <div class="field-value">${escapeHtml(data.titulaire.codePostal)} ${escapeHtml(data.titulaire.ville)}</div>
    
    <div class="field-label">SIRET</div>
    <div class="field-value">${escapeHtml(data.titulaire.siret)}</div>
    
    <div class="field-label">Email</div>
    <div class="field-value">${escapeHtml(data.titulaire.email)}</div>
  </div>
  
  <!-- Section D -->
  <div class="section-header">D - Information sur l'attribution envisagée</div>
  <div class="section-content">
    <p>Je vous informe que je compte vous attribuer :</p>
    
    <div class="checkbox-item">
      ${data.attribution.type === 'ensemble' ? '☒' : '☐'} l'ensemble du marché public (en cas de non allotissement).
    </div>
    
    ${data.attribution.type === 'lots' ? `
    <div class="checkbox-item">
      ☒ le(s) lot(s) n° ${data.attribution.lots.map(l => `${l.numero}:${l.intitule}`).join(', ')}
    </div>
    ` : `
    <div class="checkbox-item">
      ☐ le(s) lot(s) n°
    </div>
    `}
    
    <p>de la procédure de passation du marché public ou de l'accord cadre (en cas d'allotissement).</p>
  </div>
  
  <!-- Section E -->
  <div class="section-header">E - Documents à fournir</div>
  <div class="section-content">
    <p>En application de l'article R. 2144-1 du code de la commande publique, je vous demande de me transmettre les pièces suivantes, datées et signées, avant le ${data.documents.dateSignature || '[DATE]'} :</p>
    
    <div class="checkbox-item">
      ${data.documents.candidatFrance ? '☒' : '☐'} <strong>Si vous êtes établi en France :</strong>
    </div>
    <div class="field-value">${escapeHtml(data.documents.documentsPreuve || 'Liste des documents à fournir selon le règlement de consultation')}</div>
    
    <div class="checkbox-item">
      ${data.documents.candidatEtranger ? '☒' : '☐'} <strong>Si vous êtes établi à l'étranger :</strong>
    </div>
    <div class="field-value">Documents équivalents selon la législation du pays d'établissement</div>
    
    <p>Vous disposez d'un délai de ${data.documents.delaiReponse || '[NOMBRE]'} jours pour me transmettre ces documents.</p>
    
    <p>Ce délai court à compter de :</p>
    
    <div class="checkbox-item">
      ${data.documents.decompteA === 'réception' ? '☒' : '☐'} la réception de la présente information.
    </div>
    
    <div class="checkbox-item">
      ${data.documents.decompteA === 'transmission' ? '☒' : '☐'} la transmission par mes soins des documents complémentaires.
    </div>
  </div>
  
  <!-- Section F -->
  <div class="section-header">F - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
  <div class="section-content">
    <div class="signature-block">
      <p>À ${escapeHtml(data.signature.lieu)}, le ${escapeHtml(data.signature.date)}</p>
      <p><strong>Signature</strong></p>
      <p class="signature-note">(représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)</p>
      <p>${escapeHtml(data.signature.signataireTitre)}</p>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    NOTI1 – Information au titulaire pressenti | N° de procédure: ${escapeHtml(data.numeroProcedure)} | Page <span id="page-num">1</span>
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
 * Génère le HTML comme Blob pour utilisation dans ZIP
 */
export async function generateNoti1HtmlAsBlob(data: Noti1Data): Promise<Blob> {
  const html = await generateNoti1Html(data);
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
