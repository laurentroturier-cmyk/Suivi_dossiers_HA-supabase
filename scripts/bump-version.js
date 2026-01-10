#!/usr/bin/env node

/**
 * Script de gestion de version automatique pour GestProjet
 * Usage: npm run version:bump [major|minor|patch]
 * Par défaut: patch
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Lire la version actuelle
const versionPath = path.join(__dirname, '../version.json');
const packagePath = path.join(__dirname, '../package.json');

const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const currentVersion = versionData.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Déterminer le type de bump (argument ou par défaut patch)
const bumpType = process.argv[2] || 'patch';
let newVersion;

switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Date actuelle au format ISO
const today = new Date().toISOString().split('T')[0];

// Incrémenter le build number
const newBuild = String(parseInt(versionData.build || 0) + 1);

log('\n🔄 Mise à jour de version...', 'bright');
log(`   ${currentVersion} → ${newVersion}`, 'cyan');
log(`   Build: ${versionData.build} → ${newBuild}`, 'blue');

// Demander un message de changelog
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n📝 Décrivez les changements (séparés par des virgules):\n> ', (changes) => {
  rl.close();

  const changesList = changes
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  if (changesList.length === 0) {
    log('\n⚠️  Aucun changement spécifié, abandon.', 'yellow');
    process.exit(1);
  }

  // Mettre à jour version.json
  versionData.version = newVersion;
  versionData.lastUpdate = today;
  versionData.build = newBuild;

  // Ajouter au changelog
  if (!versionData.changelog) {
    versionData.changelog = {};
  }

  versionData.changelog[newVersion] = {
    date: today,
    type: bumpType,
    changes: changesList
  };

  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  log('\n✅ version.json mis à jour', 'green');

  // Mettre à jour package.json
  packageData.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
  log('✅ package.json mis à jour', 'green');

  // Générer CHANGELOG.md
  generateChangelog(versionData);
  log('✅ CHANGELOG.md généré', 'green');

  // Git commit et tag
  try {
    execSync(`git add version.json package.json CHANGELOG.md`, { stdio: 'inherit' });
    execSync(`git commit -m "chore: Version ${newVersion}"`, { stdio: 'inherit' });
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
    
    log('\n✅ Commit et tag créés', 'green');
    log(`\n📦 Version ${newVersion} prête !`, 'bright');
    log('\n💡 Pour pousser sur GitHub:', 'yellow');
    log(`   git push origin main`, 'cyan');
    log(`   git push origin v${newVersion}`, 'cyan');
  } catch (error) {
    log('\n⚠️  Erreur Git (peut-être pas de changements à committer)', 'yellow');
  }
});

function generateChangelog(versionData) {
  const changelogPath = path.join(__dirname, '../CHANGELOG.md');
  
  let content = `# 📝 Changelog - ${versionData.name}\n\n`;
  content += `Toutes les modifications notables de ce projet sont documentées ici.\n\n`;
  content += `Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),\n`;
  content += `et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).\n\n`;
  content += `---\n\n`;

  // Trier les versions par ordre décroissant
  const versions = Object.keys(versionData.changelog).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  versions.forEach(version => {
    const entry = versionData.changelog[version];
    const typeEmoji = {
      major: '🚀',
      minor: '✨',
      patch: '🐛',
      feature: '✨',
      initial: '🎉'
    };

    content += `## [${version}] - ${entry.date}\n\n`;
    content += `${typeEmoji[entry.type] || '📦'} **${entry.type.toUpperCase()}**\n\n`;
    
    entry.changes.forEach(change => {
      content += `- ${change}\n`;
    });
    
    content += `\n---\n\n`;
  });

  // Légende
  content += `## 📖 Légende\n\n`;
  content += `- 🚀 **MAJOR** - Changements incompatibles avec les versions précédentes\n`;
  content += `- ✨ **MINOR** - Nouvelles fonctionnalités rétrocompatibles\n`;
  content += `- 🐛 **PATCH** - Corrections de bugs rétrocompatibles\n`;
  content += `- 🎉 **INITIAL** - Version initiale du projet\n`;

  fs.writeFileSync(changelogPath, content);
}
