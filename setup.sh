#!/bin/bash

# Script de démarrage rapide pour Bakery Forecast MVP

echo "🥖 Bakery Forecast MVP - Installation"
echo "======================================"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "Installer Node.js depuis https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

echo "✅ Dépendances installées"
echo ""

# Vérifier si .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  Fichier .env.local non trouvé"
    echo ""
    echo "Créez un fichier .env.local avec les variables suivantes :"
    echo ""
    cat .env.example
    echo ""
    echo "Puis relancez ce script."
    exit 1
fi

echo "✅ Fichier .env.local trouvé"
echo ""

# Demander si on veut initialiser la base de données
read -p "Voulez-vous initialiser la base de données ? (o/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "📊 Initialisation de la base de données..."
    echo ""
    echo "Assurez-vous d'avoir PostgreSQL installé et accessible."
    echo "Commande à exécuter manuellement :"
    echo ""
    echo "psql -h <host> -U <user> -d <database> -f schema.sql"
    echo ""
    echo "Ou importez schema.sql via votre client PostgreSQL préféré."
    echo ""
fi

# Générer un secret NextAuth si nécessaire
if ! grep -q "NEXTAUTH_SECRET=" .env.local || grep -q "votre-secret-genere" .env.local; then
    echo "🔑 Génération d'un secret NextAuth..."
    SECRET=$(openssl rand -base64 32)
    
    if grep -q "NEXTAUTH_SECRET=" .env.local; then
        # Remplacer le secret existant
        sed -i.bak "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$SECRET\"/" .env.local
    else
        # Ajouter le secret
        echo "NEXTAUTH_SECRET=\"$SECRET\"" >> .env.local
    fi
    
    echo "✅ Secret NextAuth généré et ajouté à .env.local"
    echo ""
fi

echo "✅ Configuration terminée"
echo ""
echo "🚀 Pour démarrer l'application en développement :"
echo ""
echo "   npm run dev"
echo ""
echo "L'application sera accessible sur http://localhost:3000"
echo ""
echo "📚 Documentation complète : README.md"
echo "🌐 Guide de déploiement : DEPLOYMENT.md"