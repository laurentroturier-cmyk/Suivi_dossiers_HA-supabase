import React, { useState } from 'react';
import { Button, Card, Input, Modal } from '../design-system';
import { CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';

/**
 * Composant de démonstration du Design System
 * À utiliser comme référence pour l'implémentation dans les autres composants
 */
export const ExampleDesignSystem: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length < 3 && e.target.value.length > 0) {
      setInputError('Au moins 3 caractères requis');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">Design System</h1>
        <p className="text-secondary">Composants réutilisables avec esthétique moderne</p>
      </div>

      {/* Buttons Section */}
      <Card rounded="2xl" padding="lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Boutons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primaire</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="ghost">Fantôme</Button>
            <Button variant="danger">Danger</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="sm">Petit</Button>
            <Button size="md">Moyen</Button>
            <Button size="lg">Grand</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button rounded="md">Arrondi MD</Button>
            <Button rounded="lg">Arrondi LG</Button>
            <Button rounded="pill">Pilule</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button icon={<CheckCircle size={18} />}>Avec icône</Button>
            <Button icon={<AlertCircle size={18} />} iconPosition="right">
              Icône droite
            </Button>
            <Button loading>Chargement...</Button>
            <Button disabled>Désactivé</Button>
          </div>
        </div>
      </Card>

      {/* Cards Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Cartes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="elevated" rounded="xl" hover>
            <h3 className="font-bold text-primary mb-2">Carte élevée</h3>
            <p className="text-secondary text-sm">
              Carte avec ombre pour mettre en valeur le contenu.
            </p>
          </Card>

          <Card variant="outlined" rounded="xl" hover>
            <h3 className="font-bold text-primary mb-2">Carte contour</h3>
            <p className="text-secondary text-sm">
              Carte avec bordure subtile et hover élégant.
            </p>
          </Card>

          <Card variant="filled" rounded="xl" hover>
            <h3 className="font-bold text-primary mb-2">Carte remplie</h3>
            <p className="text-secondary text-sm">
              Carte avec fond coloré pour différencier les sections.
            </p>
          </Card>
        </div>
      </div>

      {/* Inputs Section */}
      <Card rounded="2xl" padding="lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Champs de saisie</h2>
        <div className="space-y-4 max-w-md">
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            helperText="Nous ne partagerons jamais votre email"
          />

          <Input
            label="Nom d'utilisateur"
            value={inputValue}
            onChange={handleInputChange}
            error={inputError}
            placeholder="Entrez au moins 3 caractères"
          />

          <Input
            label="Recherche"
            placeholder="Rechercher..."
            icon={<Info size={18} />}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            icon={<AlertCircle size={18} />}
            iconPosition="right"
          />
        </div>
      </Card>

      {/* Modal Section */}
      <Card rounded="2xl" padding="lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Modales</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Ouvrir une modale
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirmation"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-secondary">
              Êtes-vous sûr de vouloir effectuer cette action ? Cette opération ne peut pas être annulée.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 size={18} />}
                onClick={() => setIsModalOpen(false)}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </Modal>
      </Card>

      {/* Color Palette */}
      <Card rounded="2xl" padding="lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Palette de couleurs</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-primary mb-3">Primaire (Vert)</h3>
            <div className="flex gap-2">
              <div className="h-16 w-16 rounded-lg bg-[#0f8a6a] shadow-md" />
              <div className="h-16 w-16 rounded-lg bg-[#0c6f56] shadow-md" />
              <div className="h-16 w-16 rounded-lg bg-[#004d3d] shadow-md" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-primary mb-3">Accents</h3>
            <div className="flex gap-2">
              <div className="h-16 w-16 rounded-lg bg-[#40E0D0] shadow-md" />
              <div className="h-16 w-16 rounded-lg bg-[#FFA500] shadow-md" />
              <div className="h-16 w-16 rounded-lg bg-[#A020F0] shadow-md" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-primary mb-3">Surfaces (adaptatif mode clair/sombre)</h3>
            <div className="flex gap-2">
              <div className="h-16 w-24 rounded-lg surface-primary shadow-md border border-[var(--border-soft)]" />
              <div className="h-16 w-24 rounded-lg surface-secondary shadow-md border border-[var(--border-soft)]" />
              <div className="h-16 w-24 rounded-lg surface-tertiary shadow-md border border-[var(--border-soft)]" />
            </div>
          </div>
        </div>
      </Card>

      {/* Border Radius */}
      <Card rounded="2xl" padding="lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Arrondis (Border Radius)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 bg-[#0f8a6a] rounded-sm" />
            <p className="text-sm text-center text-secondary">SM (8px)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-[#0f8a6a] rounded-md" />
            <p className="text-sm text-center text-secondary">MD (12px)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-[#0f8a6a] rounded-lg" />
            <p className="text-sm text-center text-secondary">LG (16px)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-[#0f8a6a] rounded-xl" />
            <p className="text-sm text-center text-secondary">XL (24px)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-[#0f8a6a] rounded-2xl" />
            <p className="text-sm text-center text-secondary">2XL (32px)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-[#0f8a6a] rounded-3xl" />
            <p className="text-sm text-center text-secondary">3XL (40px)</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
