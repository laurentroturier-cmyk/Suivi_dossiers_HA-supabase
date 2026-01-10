# 🎨 Intégration UI - Version Display

## Exemples d'intégration du composant AppVersion

### Option 1 : Header sombre (comme votre mockup)

```tsx
// Dans App.tsx ou votre Header component
import { AppVersion } from './components/AppVersion';

<header className="bg-[#1a1a1a] text-white px-6 py-3 border-b border-gray-800">
  <div className="container mx-auto">
    <AppVersion className="text-gray-400 text-xs" />
  </div>
</header>
```

**Rendu :** Fond noir avec texte gris clair
```
GestProjet v1.0.1 • Mise à jour : 10/01/2026
```

---

### Option 2 : Footer centré

```tsx
import { AppVersion } from './components/AppVersion';

<footer className="mt-auto p-4 surface-secondary border-t border-[var(--border-soft)]">
  <AppVersion className="text-center" />
</footer>
```

---

### Option 3 : Sidebar (Dashboard)

```tsx
import { AppVersion } from './components/AppVersion';

<aside className="w-64 surface-secondary border-r border-[var(--border-soft)]">
  {/* Navigation items */}
  
  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-soft)]">
    <AppVersion className="text-xs" />
  </div>
</aside>
```

---

### Option 4 : Page "À propos" complète

```tsx
import { useVersion } from './components/AppVersion';
import { Card } from './design-system';
import { Info, Calendar, Package } from 'lucide-react';

function AboutPage() {
  const { version, name, lastUpdate, build, changelog } = useVersion();
  
  return (
    <div className="p-8 space-y-6">
      <Card variant="elevated" rounded="2xl" padding="lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-[#0f8a6a] rounded-xl">
            <Package className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">{name}</h1>
            <p className="text-secondary">Application de gestion de marchés publics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 surface-tertiary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-[#0f8a6a]" />
              <span className="text-xs text-tertiary">Version</span>
            </div>
            <span className="text-xl font-bold text-primary">{version}</span>
          </div>
          
          <div className="p-4 surface-tertiary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-[#0f8a6a]" />
              <span className="text-xs text-tertiary">Dernière mise à jour</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {new Date(lastUpdate).toLocaleDateString('fr-FR')}
            </span>
          </div>
          
          <div className="p-4 surface-tertiary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-[#0f8a6a]" />
              <span className="text-xs text-tertiary">Build</span>
            </div>
            <span className="text-xl font-bold text-primary">#{build}</span>
          </div>
        </div>
      </Card>
      
      <Card variant="elevated" rounded="2xl" padding="lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Historique des versions</h2>
        <div className="space-y-4">
          {Object.entries(changelog)
            .reverse()
            .map(([v, info]) => (
              <div key={v} className="border-l-4 border-[#0f8a6a] pl-4 py-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-primary">v{v}</span>
                  <span className="text-sm text-tertiary">
                    {new Date(info.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className={`
                    px-2 py-1 rounded-md text-xs font-semibold
                    ${info.type === 'major' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                    ${info.type === 'minor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                    ${info.type === 'patch' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                    ${info.type === 'feature' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                  `}>
                    {info.type.toUpperCase()}
                  </span>
                </div>
                <ul className="space-y-1">
                  {info.changes.map((change, i) => (
                    <li key={i} className="text-secondary text-sm flex items-start gap-2">
                      <span className="text-[#0f8a6a] mt-1">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
```

---

### Option 5 : Badge version dans le menu

```tsx
import { useVersion } from './components/AppVersion';

function NavigationMenu() {
  const { version } = useVersion();
  
  return (
    <nav>
      {/* Menu items */}
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-tertiary">GestProjet</span>
        <span className="px-2 py-0.5 bg-[#0f8a6a] text-white text-xs rounded-full font-semibold">
          v{version}
        </span>
      </div>
    </nav>
  );
}
```

---

### Option 6 : Inline dans le titre

```tsx
import { useVersion } from './components/AppVersion';

function Header() {
  const { name, version } = useVersion();
  
  return (
    <h1 className="text-3xl font-bold">
      {name}
      <span className="text-sm text-tertiary ml-3">v{version}</span>
    </h1>
  );
}
```

---

## 🎨 Personnalisation CSS

### Style minimaliste

```tsx
<AppVersion className="text-xs text-gray-500 font-mono" />
```

### Style badge

```tsx
<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0f8a6a]/10 border border-[#0f8a6a]/30 rounded-full">
  <AppVersion className="text-xs text-[#0f8a6a] font-semibold" />
</div>
```

### Style carte

```tsx
<Card variant="outlined" padding="sm">
  <AppVersion className="text-sm" />
</Card>
```

---

## 💡 Recommandation pour votre mockup

Basé sur votre image, je suggère :

```tsx
// Dans votre composant principal (App.tsx)
import { AppVersion } from './components/AppVersion';

// Option A : Header fixe en haut
<div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] px-6 py-2 border-b border-gray-800">
  <AppVersion className="text-gray-400 text-xs" />
</div>

// Option B : Footer fixe en bas
<div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] px-6 py-2 border-t border-gray-800">
  <AppVersion className="text-gray-400 text-xs text-center" />
</div>

// Option C : Dans votre sidebar (si vous en avez une)
<aside className="w-64 h-screen surface-secondary">
  {/* Navigation */}
  
  <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1a1a1a]">
    <AppVersion className="text-gray-400 text-xs" />
  </div>
</aside>
```

---

## 🚀 Code prêt à copier-coller

Pour un header comme votre mockup :

```tsx
import { AppVersion } from './components/AppVersion';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header avec version */}
      <header className="bg-[#1a1a1a] text-white px-6 py-2.5 shadow-lg">
        <AppVersion className="text-gray-400 text-xs" />
      </header>
      
      {/* Reste de votre application */}
      <main className="flex-1">
        {/* Votre contenu */}
      </main>
    </div>
  );
}
```

**Résultat exact comme votre mockup :**
```
┌────────────────────────────────────────────┐
│ GestProjet v1.0.1 • Mise à jour : 10/01/2026 │
└────────────────────────────────────────────┘
```

Fond noir #1a1a1a, texte gris #9ca3af ! 🎨
