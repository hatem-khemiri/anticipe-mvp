# Anticipe MVP

Application de prévision de production pour commerces alimentaires.

## 📋 Description

Anticipe aide les directeurs de boutique à anticiper leurs besoins de production quotidiens en combinant :
- Données historiques de ventes (J-7, J-14, J-365)
- Prévisions météorologiques automatiques
- Calendriers culturels et événements exceptionnels
- Algorithme de pondération adaptatif

## 🚀 Stack technique

- **Frontend** : Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend** : API Routes Next.js (serverless)
- **Base de données** : PostgreSQL (Vercel Postgres)
- **Authentification** : NextAuth.js
- **Déploiement** : Vercel
- **API Météo** : Open-Meteo (gratuit, illimité)

## 📦 Installation locale

### Prérequis

- Node.js 18+ 
- npm ou yarn
- PostgreSQL (ou compte Vercel pour Vercel Postgres)

### Étapes

1. **Cloner le projet**
```bash
git clone 
cd bakery-forecast-mvp
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env.local` à la racine :
```env
# Base de données PostgreSQL
POSTGRES_URL="postgres://user:password@host:5432/database"
POSTGRES_PRISMA_URL="postgres://user:password@host:5432/database?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere"
```

Pour générer un secret NextAuth :
```bash
openssl rand -base64 32
```

4. **Initialiser la base de données**

Exécuter le schéma SQL :
```bash
psql -h  -U  -d  -f schema.sql
```

Ou avec un client PostgreSQL (DBeaver, pgAdmin, etc.), importer le fichier `schema.sql`.

5. **Lancer en développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🌐 Déploiement sur Vercel

### Étape 1 : Créer un compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Créer un compte (gratuit)
3. Installer la CLI Vercel (optionnel) :
```bash
npm i -g vercel
```

### Étape 2 : Créer une base de données Vercel Postgres

1. Dans le dashboard Vercel, aller dans l'onglet "Storage"
2. Cliquer sur "Create Database"
3. Choisir "Postgres"
4. Nommer la base (ex: `bakery-forecast-db`)
5. Choisir une région proche de votre localisation
6. Créer la base

### Étape 3 : Initialiser le schéma

1. Aller dans l'onglet "Query" de votre base Vercel Postgres
2. Copier-coller le contenu du fichier `schema.sql`
3. Exécuter la requête

### Étape 4 : Déployer l'application

#### Option A : Via GitHub (recommandé)

1. Pusher votre code sur GitHub :
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin 
git push -u origin main
```

2. Dans Vercel, cliquer sur "Add New Project"
3. Importer votre repository GitHub
4. Vercel détectera automatiquement Next.js
5. Configurer les variables d'environnement :
   - Dans "Environment Variables", ajouter `NEXTAUTH_URL` et `NEXTAUTH_SECRET`
   - Les variables `POSTGRES_*` seront automatiquement ajoutées si vous connectez la base Vercel
6. Cliquer sur "Deploy"

#### Option B : Via CLI Vercel
```bash
vercel
# Suivre les instructions
# Connecter la base Postgres quand demandé
vercel --prod
```

### Étape 5 : Configurer les variables d'environnement

Dans le dashboard Vercel, aller dans "Settings" > "Environment Variables" :

1. `NEXTAUTH_URL` : l'URL de votre application (ex: `https://bakery-forecast.vercel.app`)
2. `NEXTAUTH_SECRET` : généré avec `openssl rand -base64 32`
3. Les variables `POSTGRES_*` sont auto-configurées si vous avez connecté Vercel Postgres

### Étape 6 : Redéployer

Si vous avez ajouté des variables après le premier déploiement :
```bash
vercel --prod
```

Ou via l'interface Vercel : "Deployments" > "Redeploy"

## 📖 Utilisation

### 1. Inscription

- Créer un compte avec email/mot de passe
- Renseigner le nom de la boutique
- **Important** : Entrer l'adresse complète et la géolocaliser (nécessaire pour la météo)

### 2. Configurer les produits

- Aller dans "Produits"
- Ajouter vos produits un par un
- Renseigner :
  - Nom du produit
  - Catégorie (optionnel)
  - Importance business : "coeur", "secondaire", ou "opportuniste"

### 3. Saisir les ventes quotidiennes

**Option A : Saisie manuelle**
- Aller dans "Saisie des ventes"
- Sélectionner la date (par défaut : hier)
- Saisir les quantités vendues pour chaque produit
- Sauvegarder

**Option B : Import CSV**
- Préparer un fichier CSV au format :
```csv
Date,Produit,Quantité vendue,Quantité invendue
2025-02-03,Baguette,120,5
2025-02-03,Croissant,85,3
```
- Aller dans "Saisie des ventes"
- Cliquer sur "Importer CSV"
- Sélectionner le fichier

### 4. Générer les recommandations

- Aller dans "Recommandations"
- Cliquer sur "Générer les recommandations pour demain"
- L'application affiche :
  - **Quantité Standard** : recommandation optimale
  - **Quantité Prudente** : recommandation conservatrice (−10%)
  - **Niveau de confiance** : fiabilité de la prévision
  - **Hypothèses actives** : météo, calendriers, événements

### 5. Valider vos décisions

- Choisir entre Standard, Prudente, ou une quantité personnalisée
- Ajouter des notes si nécessaire
- Valider
- Les décisions sont conservées en historique

### 6. Configurer les calendriers culturels

- Aller dans "Paramètres"
- Activer/désactiver les calendriers pertinents :
  - Calendrier Catholique
  - Calendrier Musulman
  - Calendrier Commercial

### 7. Ajouter des événements exceptionnels

- Aller dans "Événements"
- Cliquer sur "Ajouter un événement"
- Renseigner :
  - Nom de l'événement
  - Date(s)
  - Impact estimé (en %)
  - Catégories affectées (optionnel)

## 🔧 Format CSV pour l'import des ventes

Le fichier CSV doit respecter ce format exact :
```csv
Date,Produit,Quantité vendue,Quantité invendue
2025-02-03,Baguette tradition,120,5
2025-02-03,Croissant,85,3
2025-02-03,Pain au chocolat,62,2
```

**Colonnes obligatoires :**
- `Date` : au format YYYY-MM-DD
- `Produit` : nom exact du produit (doit exister dans votre catalogue)
- `Quantité vendue` : nombre entier

**Colonne optionnelle :**
- `Quantité invendue` : nombre entier (défaut : 0)

## 📊 Logique de calcul des recommandations

### Base historique pondérée

- **J-7** : 40% (poids par défaut)
- **J-14** : 20% (poids par défaut)
- **J-365** : 40% (poids par défaut)

Si une donnée n'est pas disponible, les poids sont redistribués automatiquement.

### Ajustements contextuels

- **Météo** : ±10% max (calculé selon température, précipitations, conditions)
- **Événements culturels** : +10% max (plafonné même si plusieurs événements)
- **Événements exceptionnels** : +10% max (déclarés par l'utilisateur)
- **Total des ajustements** : plafonné à ±15%

### Scénarios

- **Standard** : base historique + ajustements
- **Prudente** : Standard × 0.9 (−10%)

### Niveau de confiance

- Base : 50%
- +20% si J-7 disponible
- +15% si J-14 disponible
- +15% si J-365 disponible
- Maximum : 100%

## 🗄️ Structure de la base de données

Voir le fichier `schema.sql` pour le schéma complet.

**Tables principales :**
- `users` : comptes boutiques
- `products` : catalogue produits
- `daily_sales` : ventes quotidiennes
- `recommendations` : recommandations générées
- `production_decisions` : décisions validées
- `cultural_calendars` : calendriers pré-configurés
- `cultural_events` : événements culturels
- `exceptional_events` : événements déclarés par l'utilisateur
- `weather_cache` : cache météo

## 🌤️ API Météo

L'application utilise **Open-Meteo** (gratuit, illimité, sans clé API) :
- Prévisions jusqu'à 16 jours
- Historique météo disponible
- Cache de 6h pour optimiser les performances

Fallback possible vers WeatherAPI si nécessaire (configuration dans `.env.local`).

## 🐛 Dépannage

### Erreur "Localisation non configurée"
→ Vérifiez que vous avez géolocalisé votre adresse lors de l'inscription

### Les recommandations sont à 0
→ Il faut au moins 7 jours d'historique de ventes

### Import CSV échoue
→ Vérifiez que les noms de produits correspondent exactement à votre catalogue

### Erreur de connexion à la base de données
→ Vérifiez vos variables d'environnement `POSTGRES_*`

## 📝 Licence

Ce projet est un MVP développé pour usage interne. Tous droits réservés.

## 🤝 Support

Pour toute question ou problème, ouvrir une issue sur GitHub.