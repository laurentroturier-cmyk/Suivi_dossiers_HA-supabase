/// <reference types="vite/client" />

// Déclaration pour html2canvas (chargé via CDN)
interface Window {
  html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
}
