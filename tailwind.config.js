/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        // Override des border-radius de base pour des coins plus arrondis
        'lg': '1.5rem',      // 24px au lieu de 8px
        'xl': '2rem',        // 32px au lieu de 12px
        '2xl': '2.5rem',     // 40px au lieu de 16px
        '3xl': '3rem',       // 48px au lieu de 24px
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      colors: {
        // Palette mode clair (Light)
        'light': {
          '50': '#fafafa',
          '100': '#f5f5f5',
          '200': '#e5e5e5',
          '300': '#d4d4d4',
          '400': '#a3a3a3',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '900': '#171717',
        },
        // Palette mode sombre (Dark) - Gris foncés élégants et doux
        'dark': {
          '50': '#f8f9fa',   // Quasi blanc pour les textes
          '100': '#e8eaed',  // Texte secondaire clair
          '200': '#d1d5db',  // Texte secondaire normal
          '300': '#b4bcc4',  // Bordures discrètes
          '400': '#8e99a8',  // Texte atténué
          '500': '#5f7185',  // Texte intermédiaire
          '600': '#4a5568',  // Texte secondaire foncé
          '700': '#2d3748',  // Cartes/panneaux
          '750': '#252f3f',  // Fond secondaire
          '800': '#1a202c',  // Fond principal (gris très foncé, légèrement bleuté)
          '850': '#0f1419',  // Fond principal alternatif
          '900': '#0a0e14',  // Très sombre (fond maximum)
        },
        // Accent couleur (cohérent et visible)
        'accent': {
          'primary': '#60a5fa', // Bleu ciel modéré
          'secondary': '#34d399', // Émeraude douce
          'warning': '#fbbf24', // Ambre modéré
          'error': '#f87171', // Rouge modéré
        }
      },
      backgroundColor: {
        // Faciliter la transition entre modes
        'primary': 'var(--color-bg-primary)',
        'secondary': 'var(--color-bg-secondary)',
        'tertiary': 'var(--color-bg-tertiary)',
      },
      textColor: {
        'primary': 'var(--color-text-primary)',
        'secondary': 'var(--color-text-secondary)',
        'tertiary': 'var(--color-text-tertiary)',
      },
    },
  },
  plugins: [],
};
