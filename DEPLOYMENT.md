# 🚀 Guide de déploiement Vercel - Pas à pas

Ce guide vous accompagne dans le déploiement de l'application Bakery Forecast sur Vercel.

## Prérequis

- Un compte GitHub (gratuit)
- Un compte Vercel (gratuit) - créer sur [vercel.com](https://vercel.com)
- Git installé sur votre machine

## Étape 1 : Pousser le code sur GitHub

### 1.1 Initialiser Git (si pas déjà fait)
```bash
cd bakery-forecast-mvp
git init
```

### 1.2 Créer un nouveau repository sur GitHub

1. Aller sur [github.com](https://github.com)
2. Cliquer sur le "+" en haut à droite → "New repository"
3. Nommer le repository : `bakery-forecast-mvp`
4. Laisser en **Private** (recommandé)
5. Ne pas initialiser avec README, .gitignore ou licence
6. Cliquer sur "Create repository"

### 1.3 Pousser le code
```bash
git add .
git commit -m "Initial commit - Bakery Forecast MVP"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/bakery-forecast-mvp.git
git push -u origin main
```

## Étape 2 : Créer la base de données Vercel Postgres

### 2.1 Accéder au dashboard Vercel

1. Se connecter sur [vercel.com](https://vercel.com)
2. Aller dans l'onglet "Storage" dans la barre latérale

### 2.2 Créer la base de données

1. Cliquer sur "Create Database"
2. Choisir "Postgres"
3. Nommer la base : `bakery-forecast-db`
4. Choisir une région : **Paris (cdg1)** ou la plus proche de vous
5. Cliquer sur "Create"

⏱️ La création prend environ 1 minute.

### 2.3 Initialiser le schéma

1. Une fois la base créée, aller dans l'onglet **".sql"** ou **"Query"**
2. Ouvrir le fichier `schema.sql` de votre projet
3. Copier **tout le contenu**
4. Coller dans l'éditeur de requêtes Vercel
5. Cliquer sur "Run Query" ou "Execute"

✅ Vous devriez voir "Query executed successfully"

## Étape 3 : Déployer l'application

### 3.1 Importer le projet depuis GitHub

1. Dans le dashboard Vercel, cliquer sur "Add New..." → "Project"
2. Cliquer sur "Import Git Repository"
3. Autoriser l'accès à votre compte GitHub si demandé
4. Sélectionner le repository `bakery-forecast-mvp`
5. Cliquer sur "Import"

### 3.2 Configurer le projet

Vercel détecte automatiquement Next.js. Vérifier les paramètres :

- **Framework Preset** : Next.js
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build` (auto-détecté)
- **Output Directory** : `.next` (auto-détecté)

### 3.3 Connecter la base de données

1. Dans la section "Storage", cliquer sur "Connect Store"
2. Sélectionner la base de données `bakery-forecast-db`
3. Cliquer sur "Connect"

✅ Les variables d'environnement `POSTGRES_*` sont automatiquement ajoutées.

### 3.4 Ajouter les variables d'environnement

Cliquer sur "Environment Variables" et ajouter :

#### Variable 1 : NEXTAUTH_SECRET

**Name :** `NEXTAUTH_SECRET`

**Value :** Générer un secret aléatoire. 

Sur votre machine, exécuter :
```bash
openssl rand -base64 32
```

Copier le résultat et le coller comme valeur.

**Environments :** Cocher "Production", "Preview", et "Development"

#### Variable 2 : NEXTAUTH_URL

**Name :** `NEXTAUTH_URL`

**Value :** Pour l'instant, mettre `https://bakery-forecast.vercel.app` (on l'ajustera après le premier déploiement avec l'URL réelle)

**Environments :** Cocher "Production", "Preview", et "Development"

### 3.5 Déployer

1. Cliquer sur **"Deploy"**
2. ⏱️ Attendre 2-3 minutes pendant que Vercel :
   - Installe les dépendances
   - Compile l'application
   - Déploie sur son CDN

✅ Une fois terminé, vous verrez "Congratulations!"

## Étape 4 : Mettre à jour l'URL de production

### 4.1 Récupérer l'URL de production

Après le déploiement, Vercel affiche l'URL finale, par exemple :
```
https://bakery-forecast-mvp-xyz123.vercel.app
```

### 4.2 Mettre à jour la variable NEXTAUTH_URL

1. Dans le dashboard Vercel, aller dans "Settings" → "Environment Variables"
2. Trouver `NEXTAUTH_URL`
3. Cliquer sur les 3 points → "Edit"
4. Remplacer par votre vraie URL de production
5. **Important** : Cocher uniquement "Production" (décocher Preview et Development)
6. Sauvegarder

### 4.3 Redéployer

1. Aller dans "Deployments"
2. Cliquer sur les 3 points du dernier déploiement
3. Cliquer sur "Redeploy"
4. Confirmer

⏱️ Attendre 1-2 minutes pour le redéploiement.

## Étape 5 : Tester l'application

### 5.1 Accéder à l'application

Aller sur votre URL de production (ex: `https://bakery-forecast-mvp-xyz123.vercel.app`)

### 5.2 Créer un compte de test

1. Cliquer sur "Pas encore de compte ? Inscrivez-vous"
2. Remplir le formulaire :
   - Nom de la boutique : "Test Bakery"
   - Email : votre email
   - Mot de passe : au moins 6 caractères
   - **Adresse** : une vraie adresse (ex: "12 rue de Rivoli, 75001 Paris")
3. Cliquer sur "📍 Géolocaliser cette adresse"
4. Attendre la confirmation "✓ Adresse géolocalisée avec succès"
5. Cliquer sur "Créer mon compte"

### 5.3 Vérifier les fonctionnalités

1. **Ajouter des produits** :
   - Aller dans "Produits"
   - Ajouter quelques produits (Baguette, Croissant, etc.)

2. **Saisir des ventes** :
   - Aller dans "Saisie des ventes"
   - Saisir des quantités pour hier

3. **Générer des recommandations** :
   - Aller dans "Recommandations"
   - Cliquer sur "Générer les recommandations pour demain"

✅ Si tout fonctionne, le déploiement est réussi !

## 🔄 Mise à jour de l'application

Pour déployer une nouvelle version :

### Option 1 : Push sur GitHub (automatique)
```bash
git add .
git commit -m "Description des modifications"
git push
```

Vercel détecte automatiquement le push et redéploie.

### Option 2 : Redéploiement manuel

1. Dans Vercel, aller dans "Deployments"
2. Cliquer sur "Redeploy" sur le dernier déploiement

## 🐛 Résolution des problèmes courants

### Erreur : "Application error: a client-side exception has occurred"

**Cause :** Variables d'environnement manquantes

**Solution :**
1. Vérifier que `NEXTAUTH_URL` et `NEXTAUTH_SECRET` sont bien configurées
2. Vérifier que la base de données est bien connectée (variables `POSTGRES_*` présentes)
3. Redéployer

### Erreur : "Localisation non configurée"

**Cause :** L'adresse n'a pas été géolocalisée lors de l'inscription

**Solution :**
1. Aller dans "Paramètres"
2. Mettre à jour l'adresse
3. Géolocaliser à nouveau

### Erreur 500 sur /api/...

**Cause :** Problème de connexion à la base de données

**Solution :**
1. Vérifier que le schéma SQL a été exécuté correctement
2. Vérifier les logs Vercel : "Deployments" → dernier déploiement → "Functions" → cliquer sur la fonction en erreur
3. Vérifier que la base de données est dans la même région que l'application

### Les recommandations sont toujours à 0

**Cause :** Pas assez de données historiques

**Solution :**
- Il faut au moins 7 jours de ventes saisies
- Saisir des ventes pour les 7 derniers jours minimum

## 📊 Monitoring

### Voir les logs

1. Dans Vercel, aller dans "Deployments"
2. Cliquer sur le dernier déploiement
3. Onglet "Functions" pour voir les logs des API
4. Onglet "Build" pour voir les logs de compilation

### Voir les métriques

1. Aller dans "Analytics"
2. Voir les visiteurs, performances, erreurs

## 🔒 Sécurité

### Recommandations

- **Ne jamais** commit les fichiers `.env` ou `.env.local`
- Régénérer `NEXTAUTH_SECRET` régulièrement
- Activer l'authentification à 2 facteurs sur Vercel et GitHub
- Mettre le repository GitHub en **Private**

## 💰 Coûts

### Plan gratuit Vercel

- ✅ **100 GB de bande passante** / mois
- ✅ **100 déploiements** / jour
- ✅ **Base de données Postgres** : 256 MB (suffisant pour 1-2 ans de données)
- ✅ **Certificat SSL** automatique

Pour une boulangerie, le plan gratuit est **largement suffisant**.

### Mise à niveau (optionnelle)

Si vous dépassez les limites :
- **Pro** : 20$/mois → 1 TB bande passante, 512 MB base de données
- **Enterprise** : sur devis

## ✅ Checklist finale

Avant de considérer le déploiement comme terminé :

- [ ] L'application est accessible sur l'URL de production
- [ ] La création de compte fonctionne
- [ ] La géolocalisation fonctionne
- [ ] Les produits peuvent être ajoutés
- [ ] Les ventes peuvent être saisies
- [ ] Les recommandations sont générées correctement
- [ ] Les événements exceptionnels peuvent être ajoutés
- [ ] Les paramètres peuvent être modifiés
- [ ] Le logout fonctionne

---

🎉 **Félicitations !** Votre application Bakery Forecast est maintenant en production sur Vercel.