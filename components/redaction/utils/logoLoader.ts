/**
 * Charge un logo depuis le dossier public et le convertit en base64
 * Pour utilisation dans les documents HTML autonomes
 */

/**
 * Charge une image et la convertit en base64
 */
export async function loadImageAsBase64(imagePath: string): Promise<string | null> {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) {
      console.warn(`Impossible de charger l'image: ${imagePath}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Erreur lors du chargement de l'image ${imagePath}:`, error);
    return null;
  }
}

/**
 * Charge les deux logos (AFPA et République Française) et les retourne en base64
 */
export async function loadNotiLogos(): Promise<{ logoAfpa: string | null; logoRepublique: string | null }> {
  const [logoAfpa, logoRepublique] = await Promise.all([
    loadImageAsBase64('/logo-afpa.png'),
    loadImageAsBase64('/logo-republique.png'),
  ]);
  
  return { logoAfpa, logoRepublique };
}

/**
 * Génère le HTML pour l'en-tête avec les deux logos (gauche/droite)
 */
export function generateHeaderWithLogos(logoAfpaBase64: string | null, logoRepubliqueBase64: string | null): string {
  const logoAfpaHtml = logoAfpaBase64 
    ? `<img src="${logoAfpaBase64}" alt="Logo AFPA" class="header-logo-left" />`
    : '';
  
  const logoRepubliqueHtml = logoRepubliqueBase64
    ? `<img src="${logoRepubliqueBase64}" alt="Logo République Française" class="header-logo-right" />`
    : '';

  if (!logoAfpaHtml && !logoRepubliqueHtml) {
    return '';
  }

  return `
    <div class="header-logos">
      ${logoAfpaHtml}
      ${logoRepubliqueHtml}
    </div>
  `;
}
