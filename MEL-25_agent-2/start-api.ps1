# Script de démarrage rapide de l'API
Write-Host "🚀 Démarrage de l'API MEL-25 Agent-2..." -ForegroundColor Green

# Vérifier si Node.js est installé
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Vérifier si npm est installé
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm n'est pas installé." -ForegroundColor Red
    exit 1
}

# Aller dans le répertoire de l'API
Set-Location "api"

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Créer les répertoires nécessaires
Write-Host "📁 Création des répertoires..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "../data"
New-Item -ItemType Directory -Force -Path "../latex"
New-Item -ItemType Directory -Force -Path "logs"

# Démarrer l'API
Write-Host "🔥 Démarrage de l'API sur http://localhost:8000..." -ForegroundColor Green
Write-Host "📊 Interface n8n: http://localhost:5678 (admin/secure_password)" -ForegroundColor Cyan
Write-Host "🗄️  Base de données PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "⚡ Cache Redis: localhost:6379" -ForegroundColor Cyan
Write-Host "🤖 Ollama LLM: http://localhost:11434" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter l'API" -ForegroundColor Yellow

npm start 