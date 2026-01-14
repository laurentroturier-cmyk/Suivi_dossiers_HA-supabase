import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Charge le template Word depuis /public/templates/
 */
export async function loadTemplate(templateName: string): Promise<ArrayBuffer> {
  const response = await fetch(`/templates/${templateName}`);
  if (!response.ok) {
    throw new Error(`Impossible de charger le template: ${templateName}`);
  }
  return await response.arrayBuffer();
}

/**
 * Remplit le template Word avec les données fournies
 */
export function fillTemplate(templateBuffer: ArrayBuffer, data: Record<string, any>): Docxtemplater {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Remplir le template avec les données
  doc.render(data);
  
  return doc;
}

/**
 * Exporte le document rempli en fichier DOCX
 */
export function exportDocument(doc: Docxtemplater, filename: string): void {
  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  
  saveAs(blob, filename);
}

/**
 * Fonction complète : charge le template, le remplit et l'exporte
 */
export async function generateDocumentFromTemplate(
  templateName: string,
  data: Record<string, any>,
  outputFilename: string
): Promise<void> {
  try {
    // 1. Charger le template
    const templateBuffer = await loadTemplate(templateName);
    
    // 2. Remplir avec les données
    const doc = fillTemplate(templateBuffer, data);
    
    // 3. Exporter
    exportDocument(doc, outputFilename);
  } catch (error) {
    console.error('Erreur lors de la génération du document:', error);
    throw error;
  }
}

/**
 * Extrait le texte brut du template pour analyse
 */
export async function analyzeTemplate(templateName: string): Promise<string[]> {
  try {
    const templateBuffer = await loadTemplate(templateName);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip);
    
    // Extraire le XML brut
    const content = zip.files['word/document.xml'].asText();
    
    // Trouver tous les placeholders {VARIABLE}
    const placeholderRegex = /\{([A-Z_]+)\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(content)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }
    
    return placeholders.sort();
  } catch (error) {
    console.error('Erreur lors de l\'analyse du template:', error);
    return [];
  }
}
