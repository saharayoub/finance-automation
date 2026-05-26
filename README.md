# Finance Automation

Application web pour l'automatisation des données financières avec SharePoint.

## Stack Technique

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: FastAPI + Python 3.10+
- **Base de données**: Microsoft SharePoint (via Graph API)
- **IA**: DeepSeek via OpenRouter
- **Infrastructure**: Docker + Docker Compose + Nginx

## Prérequis

- Docker Desktop
- Node.js 18+
- Python 3.10+

## Démarrage Rapide

```bash
# 1. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec les vraies valeurs

# 2. Lancer l'application
docker-compose up --build

# 3. Accéder à l'application
# Frontend: http://localhost
# API: http://localhost/health
# Documentation API: http://localhost/docs
```

## Développement Local

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Phases du Projet

1. **Setup & Foundation** — Infrastructure Docker, apps démarrent
2. **Authentification Azure AD** — Login Microsoft, rôles utilisateurs
3. **Upload & Traitement CSV** — Parsing, validation basique
4. **Validation IA (DeepSeek)** — Validation et correction automatique
5. **Intégration SharePoint** — Insertion dans Lists + Document Library
6. **Génération Rapport PPTX** — PowerPoint automatique
7. **Tests & Déploiement** — Tests E2E, démo, déploiement
