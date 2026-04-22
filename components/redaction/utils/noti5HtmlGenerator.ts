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
      orphans: 4;
      widows: 4;
    }
    
    /* Groupe section-header + section-content pour éviter les coupures */
    .section-group {
      page-break-inside: avoid;
      margin-bottom: 16px;
      orphans: 4;
      widows: 4;
    }
    
    .field-label {
      font-weight: bold;
      margin-top: 8px;
      margin-bottom: 2px;
      display: block;
    }
    
    .field-value {
      margin-bottom: 6px;
      page-break-inside: avoid;
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
      orphans: 3;
      widows: 3;
    }
    
    .checkbox-item-indented {
      margin: 4px 0 4px 26px;
      page-break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    
    /* Éviter les coupures dans les paragraphes */
    p {
      orphans: 4;
      widows: 4;
      page-break-inside: avoid;
    }
    
    /* Conteneurs de texte long */
    .section-content > div,
    .section-content > p {
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
        orphans: 4;
        widows: 4;
      }

      .section-content {
        page-break-inside: avoid;
        page-break-before: avoid;
        orphans: 4;
        widows: 4;
      }
      
      .section-group {
        page-break-inside: avoid;
        orphans: 4;
        widows: 4;
      }
      
      /* Forcer la cohésion des sous-sections */
      .section-content > div {
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
        orphans: 4;
        widows: 4;
        page-break-inside: avoid;
      }
      
      .checkbox-item,
      .checkbox-item-indented {
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
      }
      
      .field-value {
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
      }
      
      /* Groupes de contenu texte */
      .section-content p + p,
      .section-content p + .field-value {
        margin-top: 8px;
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
      <div class="field-value"><strong>Agence nationale pour la formation professionnelle des adultes</strong></div>
      <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.adresseVoie)}</div>
      <div class="field-value">${escapeHtml(data.pouvoirAdjudicateur.codePostal)} ${escapeHtml(data.pouvoirAdjudicateur.ville)}</div>
    </div>
  </div>
  
  <!-- Section B -->
  <div class="section-group">
    <div class="section-header">B - Objet de la consultation</div>
    <div class="section-content">
      <p class="field-note">(Reprendre le contenu de la mention figurant dans les documents de la consultation.)</p>
      <div class="field-value" style="white-space: pre-line;">${escapeHtml(data.objetConsultation)}</div>
      <div class="field-value" style="margin-top: 8px;"><strong>${escapeHtml(data.numeroProcedure)}</strong></div>
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
  <div class="section-group" style="page-break-inside: avoid;">
    <div class="section-header">D - Notification de l'attribution</div>
    <div class="section-content">
      <p>Je vous informe que l'offre que vous avez faite au titre de la consultation désignée ci-dessus a été retenue :</p>
      
      <p class="field-note">(Cocher la case correspondante.)</p>
      
      <div class="checkbox-item">
        ${data.notification.type === 'ensemble' ? '🗹' : '☐'} pour l'ensemble du marché public (en cas de non allotissement).
      </div>
      
      <div class="checkbox-item">
        ${data.notification.type === 'lots' ? '🗹' : '☐'} pour le(s) lot(s) n° ${data.notification.type === 'lots' && data.notification.lots.length > 0 ? data.notification.lots.map(l => escapeHtml(l.numero)).join(', ') : '_____'}
      </div>
      
      <p style="margin-left: 24px; font-size: 9pt;">de la procédure de passation du marché public ou de l'accord-cadre (en cas d'allotissement.) :</p>
      
      ${data.notification.type === 'lots' && data.notification.lots.length > 0 ? data.notification.lots.map(lot => `
      <p style="margin-left: 24px; font-style: italic; font-size: 9pt;">(Indiquer l'intitulé du ou des lots concernés tel qu'il figure dans l'avis d'appel public à la concurrence ou la lettre de consultation.)</p>
      <p style="margin-left: 24px;">${escapeHtml(lot.intitule)}</p>
      `).join('') : ''}
      
      <p style="margin-top: 16px;">L'exécution des prestations commencera :</p>
      
      <p class="field-note">(Cocher la case correspondante.)</p>
      
      <div class="checkbox-item">
        ${(data.executionPrestations?.type ? data.executionPrestations.type === 'immediate' : (data.notification?.executionImmediateChecked || false)) ? '🗹' : '☐'} L'exécution commencera à compter de la date de notification et selon les modalités prévues aux documents de la consultation.
      </div>

      <div class="checkbox-item">
        ${(data.executionPrestations?.type ? data.executionPrestations.type === 'sur_commande' : (data.notification?.executionOrdreServiceChecked || false)) ? '🗹' : '☐'} L'exécution commencera à compter de la réception de l'ordre de service qui vous sera adressé dans les conditions prévues par les documents de la consultation.
      </div>
    </div>
  </div>
  
  <!-- Section E -->}
  <div class="section-group" style="page-break-inside: avoid;">
    <div class="section-header">E - Retenue de garantie ou garantie à première demande</div>
    <div class="section-content">
      <p class="field-note">[La retenue de garantie peut être remplacée, au choix du titulaire, soit par une garantie à première demande, soit par une caution personnelle et solidaire.
      Celle-ci ne s'applique pas en cas d'allotissement lorsque le montant du marché public est inférieur à 90 000 € HT.
      Les documents de la consultation précisent si elle a été prévue ou non ainsi que son éventuel taux et ses modalités.]</p>
      
      <div class="checkbox-item" style="page-break-inside: avoid;">
        ${data.garantie?.pasPrevue || data.garanties?.aucuneGarantie ? '🗹' : '☐'} Les documents de la consultation ne prévoient pas de retenue de garantie ou de garantie à première demande.
      </div>
      
      <div style="page-break-inside: avoid;">
        <div class="checkbox-item">
          ${data.garantie?.prevueSansAllotissement ? '🗹' : '☐'} En l'absence d'allotissement de ce marché public :
        </div>
        ${data.garantie?.prevueSansAllotissement ? `
        <div class="checkbox-item-indented">
          ${data.garantie?.retenueGarantieSansAllotissement ? '🗹' : '☐'} Une retenue de garantie est prévue par les documents de la consultation (préciser son taux et ses modalités).
        </div>
        <div class="checkbox-item-indented">
          ${data.garantie?.garantiePremiereDemandeOuCautionSansAllotissement ? '🗹' : '☐'} Une garantie à première demande ou une caution personnelle et solidaire est prévue par les documents de la consultation (préciser son taux et ses modalités).
        </div>
        ` : ''}
      </div>
      
      <div style="page-break-inside: avoid;">
        <div class="checkbox-item">
          ${data.garantie?.prevueAvecAllotissement ? '🗹' : '☐'} En cas d'allotissement de ce marché public :
        </div>
        ${data.garantie?.prevueAvecAllotissement ? `
        <div class="checkbox-item-indented">
          ${data.garantie?.montantInferieur90k ? '🗹' : '☐'} Le montant de votre offre est inférieur à 90 000 € HT. Aucune retenue de garantie ou garantie à première demande n'est exigée pour le(s) lot(s) dont vous êtes attributaire.
        </div>
        <div class="checkbox-item-indented">
          ${data.garantie?.montantSuperieur90kRetenue ? '🗹' : '☐'} Le montant de votre offre est supérieur ou égal à 90 000 € HT. Une retenue de garantie est prévue par les documents de la consultation pour le(s) lot(s) dont vous êtes attributaire (préciser son taux et ses modalités).
        </div>
        <div class="checkbox-item-indented">
          ${data.garantie?.montantSuperieur90kGarantie ? '🗹' : '☐'} Le montant de votre offre est supérieur ou égal à 90 000 € HT. Une garantie à première demande ou une caution personnelle et solidaire est prévue par les documents de la consultation pour le(s) lot(s) dont vous êtes attributaire (préciser son taux et ses modalités).
        </div>
        ` : ''}
      </div>
      
      ${data.garantie?.modalites ? `
      <div style="margin-top: 16px; padding: 12px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;">
        <p style="font-weight: bold; margin-bottom: 4px;">Modalités :</p>
        <p>${escapeHtml(data.garantie.modalites)}</p>
      </div>
      ` : ''}
      
      <!-- Rétro-compatibilité avec ancienne structure -->
      ${data.garanties?.retenue?.active ? `
      <div style="margin-top: 16px; padding: 12px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;">
        <p style="font-weight: bold; margin-bottom: 4px;">Retenue de garantie :</p>
        <p>${data.garanties.retenue.pourcentage}%</p>
        ${data.garanties.retenue.remplacablePar.garantiePremieredemande ? '<p>• Remplaçable par garantie à première demande</p>' : ''}
        ${data.garanties.retenue.remplacablePar.cautionPersonnelle ? '<p>• Remplaçable par caution personnelle et solidaire</p>' : ''}
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- Section F -->
  <div class="section-group" style="page-break-inside: avoid;">
    <div class="section-header">F - Pièces jointes à la présente notification</div>
    <div class="section-content">
      <p class="field-note">(En cas d'allotissement, cette rubrique est à renseigner pour chacun des lots de la procédure de passation du marché public ou de l'accord-cadre qui est notifié. Préciser pour chaque lot, son numéro et son intitulé tels qu'ils figurent dans les documents de la consultation.)</p>
      
      <p>Vous trouverez ci-joints :</p>
      
      <p class="field-note">(Cocher la case correspondante.)</p>
      
      <div class="checkbox-item" style="page-break-inside: avoid;">
        ${data.piecesJointes.actEngagementPapier ? '☐' : '☐'} deux photocopies de l'acte d'engagement avec ses annexes, dont l'une est revêtue de la formule dite « d'exemplaire unique ». Cet exemplaire est destiné à être remis à l'établissement de crédit en cas de cession ou de nantissement de toute ou partie de votre créance. J'attire votre attention sur le fait qu'il n'est pas possible, en cas de perte, de délivrer un duplicata de l'exemplaire unique.
      </div>
      
      <div class="checkbox-item">
        ${data.piecesJointes.actEngagementPDF ? '☐' : '☐'} une copie au format électronique Adobe PDF de l'acte d'engagement.
      </div>
    </div>
  </div>
  
  <!-- Section G -->
  <div class="section-group" style="page-break-inside: avoid;">
    <div class="section-header">G - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice</div>
    <div class="section-content">
      <div class="signature-block">
        <p>À ${escapeHtml(data.signature.lieu)}, le ${escapeHtml(data.signature.date)}</p>
        <p style="margin-top: 20px;"><strong>Signature</strong></p>
        <p class="signature-note" style="margin-top: 4px;">(représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)</p>
        ${data.signature.signataireNom ? `<p style="margin-top: 30px;"><strong>${escapeHtml(data.signature.signataireNom)}</strong></p>` : ''}
        ${data.signature.signataireTitre ? `<p style="margin-top: 8px;">${escapeHtml(data.signature.signataireTitre)}</p>` : ''}
      </div>
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
  const _prefix5 = data.numeroProcedure.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');
  const _lots5 = (data.notification?.lots || []).filter((l: any) => l.numero).map((l: any) => `Lot ${l.numero}`);
  const _lotStr5 = _lots5.length > 0 ? _lots5.join('-') : 'Lot 1';
  const _tit5 = (data.attributaire.denomination || '').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 25);
  const fileName = `${_prefix5}_${_lotStr5}_${_tit5}_NOTI 5.html`;
  saveAs(blob, fileName);
}

/**
 * Exporte le NOTI5 directement en PDF
 */
export async function exportNoti5Pdf(data: Noti5Data): Promise<void> {
  const html = await generateNoti5Html(data);
  const _p5a = data.numeroProcedure.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');
  const _l5a = (data.notification?.lots || []).filter((l: any) => l.numero).map((l: any) => `Lot ${l.numero}`);
  const _ls5a = _l5a.length > 0 ? `Lot${_l5a.join('-')}` : 'Lot';
  const _t5a = (data.attributaire.denomination || '').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 25);
  const fileName = `${_p5a}_${_ls5a}_${_t5a}_NOTI 5.pdf`;
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
  const _p5b = data.numeroProcedure.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');
  const _l5b = (data.notification?.lots || []).filter((l: any) => l.numero).map((l: any) => `Lot ${l.numero}`);
  const _ls5b = _l5b.length > 0 ? `Lot${_l5b.join('-')}` : 'Lot';
  const _t5b = (data.attributaire.denomination || '').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 25);
  const fileName = `${_p5b}_${_ls5b}_${_t5b}_NOTI 5.pdf`;
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
