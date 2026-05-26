# CONTEXT.md
## Contexte du Projet — Automatisation Financière avec SharePoint

---

## 1. RÉSUMÉ DU PROJET (2 minutes de lecture)

### Le problème à résoudre
Un groupe d'entreprises demande à ses sociétés membres d'envoyer leurs données financières chaque mois. Aujourd'hui, un financier reçoit ces données par email/fichier, puis les insère **manuellement** dans SharePoint. Ce processus prend **3 à 5 jours**, génère des **erreurs humaines**, et représente un **risque de sécurité**.

### La solution
Une application web qui permet à chaque société d'uploader directement ses fichiers CSV via une interface sécurisée. Une IA valide et corrige automatiquement les données, puis les insère dans SharePoint sans intervention humaine. Un rapport PowerPoint est généré automatiquement.

### Ce que ça change
| Avant | Après |
|-------|-------|
| 3-5 jours de travail manuel | 5-10 minutes automatiques |
| Erreurs humaines fréquentes | Validation IA systématique |
| 1 financier dédié à cette tâche | 0 intervention manuelle |
| Risques de sécurité (email) | Accès sécurisé par Azure AD |
| Pas d'historique structuré | Audit trail complet dans SharePoint |

---

## 2. TECHNOLOGIES UTILISÉES

### Frontend (Interface Utilisateur)
| Technologie | Rôle | Pourquoi |
|-------------|------|----------|
| React 18 + TypeScript | Framework UI | Standard industrie, typage fort |
| Vite | Build tool | Rapide, moderne |
| TailwindCSS | Styling | Utilitaire, pas besoin de CSS custom |
| React Router | Navigation | Gestion des pages/routes |
| Axios | Appels API | Simple, gestion erreurs intégrée |
| MSAL | Auth Microsoft | Bibliothèque officielle Microsoft |

### Backend (Serveur)
| Technologie | Rôle | Pourquoi |
|-------------|------|----------|
| FastAPI + Python 3.10+ | API REST | Rapide, validation auto avec Pydantic |
| Pydantic | Validation données | Type-safe, intégré FastAPI |
| pandas | Traitement CSV | Standard data manipulation Python |
| python-dotenv | Gestion secrets | Variables d'environnement sécurisées |

### Base de Données & Stockage
| Technologie | Rôle | Pourquoi |
|-------------|------|----------|
| **Microsoft SharePoint** | Seule base de données | Déjà payé par l'entreprise, accès Microsoft |
| SharePoint Lists | Données structurées (CA, Engagement) | Comme des tables SQL |
| SharePoint Document Libraries | Fichiers (CSV, PPTX) | Stockage fichiers avec permissions |
| Microsoft Graph API | Interface pour accéder SharePoint | API officielle Microsoft |

### IA & Traitement
| Technologie | Rôle | Pourquoi |
|-------------|------|----------|
| DeepSeek v4 Flash (via OpenRouter) | Validation et correction IA | Gratuit et illimité |
| python-pptx | Génération rapport PowerPoint | Bibliothèque Python officielle |

### Infrastructure
| Technologie | Rôle | Pourquoi |
|-------------|------|----------|
| Docker + Docker Compose | Conteneurisation | Environnement reproductible |
| Nginx | Reverse proxy | Routage frontend/backend |
| Render.com ou Railway.app | Hébergement | Gratuit pour MVP |

---

## 3. ARCHITECTURE GÉNÉRALE

### Flux de données (de l'upload au rapport)
```
[Société] 
    → Upload CSV sur l'interface web
    → [React Frontend] → [FastAPI Backend]
    → [pandas] parse le CSV
    → [DeepSeek IA] valide et corrige
    → [Microsoft Graph API] insère dans SharePoint Lists
    → [Microsoft Graph API] sauvegarde CSV dans Document Library
    → [python-pptx] génère rapport PowerPoint
    → [SharePoint] stocke le rapport
    → [React Frontend] notifie: "Rapport disponible, cliquez pour télécharger"
```

### Structure des dossiers
```
projet-racine/
├── docker-compose.yml          ← Lance tout avec une commande
├── .env.example                ← Template des variables (sans valeurs réelles)
├── README.md                   ← Instructions pour démarrer
│
├── frontend/                   ← Application React
│   ├── src/
│   │   ├── components/         ← Composants réutilisables (boutons, formulaires...)
│   │   │   ├── Auth/           ← Login, bouton Microsoft
│   │   │   ├── Dashboard/      ← Page principale après login
│   │   │   ├── Upload/         ← Upload CSV, rapport validation
│   │   │   ├── Reports/        ← Liste et téléchargement rapports PPTX
│   │   │   └── Common/         ← Header, Footer, Loading...
│   │   ├── pages/              ← Pages complètes (Login, Dashboard, Upload)
│   │   ├── services/           ← Appels API (upload, auth, rapports)
│   │   ├── store/              ← État global de l'application
│   │   ├── types/              ← Types TypeScript partagés
│   │   └── utils/              ← Fonctions utilitaires
│   └── Dockerfile
│
├── backend/                    ← API FastAPI
│   ├── app/
│   │   ├── main.py             ← Point d'entrée, configuration globale
│   │   ├── config.py           ← Lit les variables .env
│   │   ├── models.py           ← Modèles de données Python
│   │   ├── schemas.py          ← Schémas Pydantic (validation requêtes)
│   │   ├── routers/            ← Endpoints API par domaine
│   │   │   ├── auth.py         ← /api/auth/*
│   │   │   ├── upload.py       ← /api/upload
│   │   │   ├── reports.py      ← /api/reports/*
│   │   │   └── companies.py    ← /api/companies/*
│   │   ├── services/           ← Logique métier
│   │   │   ├── auth_service.py         ← Validation Azure AD
│   │   │   ├── csv_parser.py           ← Parsing CSV avec pandas
│   │   │   ├── ai_service.py           ← Appels DeepSeek
│   │   │   ├── sharepoint_service.py   ← Microsoft Graph API
│   │   │   ├── pptx_service.py         ← Génération PowerPoint
│   │   │   └── validation_service.py   ← Règles de validation
│   │   ├── middleware/         ← Authentification, gestion erreurs
│   │   └── utils/              ← Helpers, logging
│   ├── tests/                  ← Tests unitaires et intégration
│   └── Dockerfile
│
└── nginx/
    └── nginx.conf              ← /api/* → backend, /* → frontend
```

---

## 4. ACCÈS SHAREPOINT — CE QUI EST NÉCESSAIRE

### Variables d'environnement (.env)
```env
# Azure AD / Microsoft
AZURE_CLIENT_ID=xxx         ← ID de l'application dans Azure Portal
AZURE_CLIENT_SECRET=xxx     ← Secret généré dans Azure Portal
AZURE_TENANT_ID=xxx         ← ID du tenant Microsoft de l'entreprise

# SharePoint
SHAREPOINT_SITE_URL=https://[entreprise].sharepoint.com/sites/[nom-site]
SHAREPOINT_CA_LIST_NAME=ChiffreAffaire      ← Nom exact de la liste
SHAREPOINT_ENGAGEMENT_LIST_NAME=Engagement  ← Nom exact de la liste
SHAREPOINT_DOCUMENTS_LIBRARY=Documents     ← Nom de la librairie

# IA
OPENROUTER_API_KEY=xxx      ← Clé API OpenRouter pour DeepSeek

# Application
SECRET_KEY=xxx              ← Clé pour signer les JWT internes
ENVIRONMENT=development     ← development ou production
```

### Étapes pour configurer Azure:
1. Aller sur portal.azure.com
2. Azure Active Directory → App Registrations → New Registration
3. Donner un nom à l'app (ex: "FinanceAutomation")
4. API Permissions → Add → Microsoft Graph → `User.Read`, `Sites.ReadWrite.All`
5. Certificates & Secrets → New client secret → Copier la valeur
6. Copier le Client ID et Tenant ID depuis "Overview"

### Structure SharePoint attendue:
```
SharePoint Site: [À confirmer avec l'utilisateur]
├── Lists/
│   ├── ChiffreAffaire   ← Colonnes: Société, Date, MontantCA, LOCAL, Export
│   └── Engagement       ← Colonnes: Title, DateEnga, Designation, Libelle, BanqueEnga, MontantEngagement
└── Document Libraries/
    └── Documents/
        └── [Company]/
            └── [Année]/
                └── [Mois]/
                    ├── CA_[company]_[date].csv
                    ├── Engagement_[company]_[date].csv
                    └── Rapport_[company]_[mois]_[année].pptx
```

> ⚠️ La structure exacte sera confirmée avec l'utilisateur avant d'implémenter.

---

## 5. POINTS CLÉS À RETENIR

### Pour l'agent de codage (DeepSeek):
1. **SharePoint = seule base de données**. Pas de PostgreSQL, pas de SQLite.
2. **Microsoft Graph API** est le seul moyen d'interagir avec SharePoint depuis Python.
3. **Azure AD** gère l'authentification. Pas de système custom.
4. **DeepSeek via OpenRouter** pour la validation IA. Gratuit et illimité.
5. **Deux types de fichiers** seulement: CA (Chiffre d'affaire) et Engagement.
6. **Règles de validation** → **JAMAIS assumer**, toujours demander à l'utilisateur.

### Pour l'utilisateur (stagiaire):
1. **Docker** permet de tout lancer avec une seule commande: `docker-compose up`
2. **Azure AD** est le système de login Microsoft de ton entreprise
3. **Microsoft Graph API** est comme une "télécommande" pour contrôler SharePoint depuis du code
4. **DeepSeek** est une IA qui lit les données CSV et les vérifie
5. **python-pptx** crée des fichiers PowerPoint automatiquement

---

## 6. ENDPOINTS API PRINCIPAUX

```
GET  /health                          → Vérifier que le serveur fonctionne
POST /api/auth/login                  → Login Azure AD
GET  /api/auth/me                     → Infos utilisateur connecté
POST /api/upload                      → Uploader un fichier CSV
GET  /api/reports                     → Liste des rapports disponibles
GET  /api/reports/{id}/download       → Télécharger un rapport PPTX
GET  /api/companies                   → Liste des sociétés (admin seulement)
```

---

## 7. LEXIQUE RAPIDE

| Terme | Explication simple |
|-------|-------------------|
| Azure AD | Système de gestion d'identités Microsoft (comme le "service de badges" de l'entreprise) |
| Microsoft Graph API | API officielle pour accéder à tous les services Microsoft (SharePoint, Outlook...) |
| SharePoint List | Tableau de données dans SharePoint, comme une feuille Excel en ligne |
| Document Library | Dossier SharePoint pour stocker des fichiers |
| JWT Token | Badge numérique qui prouve qu'un utilisateur est connecté |
| FastAPI | Framework Python pour créer des API REST rapidement |
| Pydantic | Outil Python qui vérifie que les données ont le bon format |
| pandas DataFrame | Tableau de données en Python (comme Excel en code) |
| OpenRouter | Service intermédiaire qui donne accès à DeepSeek gratuitement |
| CORS | Règle de sécurité qui contrôle quels sites peuvent appeler une API |
