-- Ajouter la colonne TODOlisteP à la table procédures
-- Cette colonne stockera les tâches TODO au format JSON

ALTER TABLE procédures 
ADD COLUMN IF NOT EXISTS "TODOlisteP" TEXT;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN procédures."TODOlisteP" IS 'Liste des tâches TODO pour cette procédure (format JSON)';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_procedures_todo ON procédures ("TODOlisteP") WHERE "TODOlisteP" IS NOT NULL;

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'procédures' 
AND column_name = 'TODOlisteP';
