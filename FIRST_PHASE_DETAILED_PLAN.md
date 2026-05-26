# FIRST_PHASE_DETAILED_PLAN.md
## Plan Détaillé — Phase 1: Setup & Foundation

**Objectif**: Créer l'infrastructure de base. À la fin de cette phase, les deux applications (frontend et backend) démarrent sans erreur, communiquent entre elles, et sont conteneurisées avec Docker.

**Durée estimée**: 3-5 jours  
**Prérequis**: Docker Desktop installé sur votre machine, Node.js 18+, Python 3.10+

---

## VUE D'ENSEMBLE DES TÂCHES

```
1.1 Structure projet    → Créer les dossiers et fichiers vides
        ↓
1.2 Backend FastAPI      → Serveur Python qui démarre
        ↓
1.3 Frontend React       → Application React qui démarre
        ↓
1.4 Docker Compose       → Tout fonctionne ensemble
        ↓
✅ PHASE 1 TERMINÉE
```

---

## TÂCHE 1.1 — STRUCTURE DU PROJET

**TÂCHE**: Créer la structure de fichiers et dossiers  
**OBJECTIF**: Avoir une architecture propre dès le départ, facile à naviguer  
**LOGIQUE**: On crée d'abord la structure vide. C'est comme construire les fondations d'une maison avant de poser les murs. Ça évite de devoir tout réorganiser plus tard.

**ÉTAPES**:
1. Créer le dossier racine du projet (ex: `finance-automation/`)
2. Créer la structure suivante:

```bash
finance-automation/
├── .gitignore
├── .env.example
├── docker-compose.yml          ← vide pour l'instant
├── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Upload/
│   │   │   ├── Reports/
│   │   │   └── Common/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   └── (fichiers Vite générés par npm create vite)
└── backend/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py             ← vide pour l'instant
    │   ├── config.py           ← vide pour l'instant
    │   ├── models.py
    │   ├── schemas.py
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   ├── auth.py
    │   │   ├── upload.py
    │   │   ├── reports.py
    │   │   └── companies.py
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── auth_service.py
    │   │   ├── csv_parser.py
    │   │   ├── ai_service.py
    │   │   ├── sharepoint_service.py
    │   │   ├── pptx_service.py
    │   │   └── validation_service.py
    │   ├── middleware/
    │   │   └── __init__.py
    │   └── utils/
    │       └── __init__.py
    ├── tests/
    │   └── __init__.py
    ├── requirements.txt
    └── .env.example
```

3. Créer le `.gitignore`:
```
# Python
__pycache__/
*.pyc
.env
venv/
.venv/

# Node
node_modules/
dist/
.env.local

# Docker
*.log

# IDE
.vscode/
.idea/
```

4. Créer le `.env.example` (valeurs vides, jamais les vraies):
```env
# Azure AD
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=

# SharePoint
SHAREPOINT_SITE_URL=
SHAREPOINT_CA_LIST_NAME=ChiffreAffaire
SHAREPOINT_ENGAGEMENT_LIST_NAME=Engagement
SHAREPOINT_DOCUMENTS_LIBRARY=Documents

# IA
OPENROUTER_API_KEY=

# App
SECRET_KEY=
ENVIRONMENT=development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**À TESTER**:
- [ ] Les dossiers sont créés correctement
- [ ] `.gitignore` contient bien `*.env` et `node_modules/`
- [ ] `.env.example` liste toutes les variables sans valeurs réelles

**POINTS CLÉS**: 
- Ne JAMAIS mettre de vraies valeurs dans `.env.example`
- Mettre `.env` dans `.gitignore` AVANT de créer `.env` avec les vraies valeurs

**PIÈGES**:
- Oublier les fichiers `__init__.py` dans les dossiers Python (obligatoire pour que Python reconnaisse les modules)

---

## TÂCHE 1.2 — BACKEND FASTAPI

**TÂCHE**: Créer le serveur FastAPI de base  
**OBJECTIF**: Un serveur Python qui démarre, répond aux requêtes HTTP, et est bien configuré  
**LOGIQUE**: FastAPI est notre "chef d'orchestre" côté serveur. Il reçoit les requêtes du frontend, les traite, et retourne des réponses. On commence par le minimum: un serveur qui dit "je suis en vie" quand on lui demande.

**ÉTAPES**:

**Étape 1**: Créer `requirements.txt`
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-dotenv==1.0.1
pydantic==2.7.1
pydantic-settings==2.2.1
httpx==0.27.0
pandas==2.2.2
python-multipart==0.0.9
python-jose[cryptography]==3.3.0
pytest==8.2.0
pytest-asyncio==0.23.6
```

**Étape 2**: Créer `backend/app/config.py`
```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Configuration de l'application.
    Les valeurs sont lues depuis les variables d'environnement (.env).
    """
    # Azure AD
    azure_client_id: str = ""
    azure_client_secret: str = ""
    azure_tenant_id: str = ""
    
    # SharePoint
    sharepoint_site_url: str = ""
    sharepoint_ca_list_name: str = "ChiffreAffaire"
    sharepoint_engagement_list_name: str = "Engagement"
    sharepoint_documents_library: str = "Documents"
    
    # IA
    openrouter_api_key: str = ""
    
    # App
    secret_key: str = "dev-secret-change-in-prod"
    environment: str = "development"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Retourne les paramètres de configuration (mis en cache)."""
    return Settings()
```

**Étape 3**: Créer `backend/app/main.py`
```python
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Création de l'application FastAPI
app = FastAPI(
    title="Finance Automation API",
    description="API pour l'automatisation des données financières",
    version="1.0.0"
)

# Configuration CORS (permet au frontend d'appeler l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Vérifie que le serveur fonctionne."""
    logger.info("Health check appelé")
    return {"status": "ok", "environment": settings.environment}


@app.on_event("startup")
async def startup_event():
    logger.info("Serveur démarré en mode %s", settings.environment)
```

**Étape 4**: Créer `backend/Dockerfile`
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**À TESTER**:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Ouvrir http://localhost:8000/health → doit retourner {"status": "ok"}
# Ouvrir http://localhost:8000/docs → documentation API automatique FastAPI
```

- [ ] `http://localhost:8000/health` retourne `{"status": "ok"}`
- [ ] `http://localhost:8000/docs` affiche la documentation API
- [ ] Aucun `print()` dans le code (seulement `logging`)
- [ ] `.env` n'est PAS dans le repository

**POINTS CLÉS**:
- `@lru_cache()` sur `get_settings()` évite de relire le `.env` à chaque requête
- CORS doit lister **exactement** l'URL du frontend (pas de `*` en production)
- `logging` permet de retrouver les erreurs en production, `print()` ne laisse pas de trace

**PIÈGES**:
- Oublier `python-multipart` → l'upload de fichiers ne fonctionnera pas
- CORS mal configuré → le frontend ne pourra pas appeler l'API (erreur mystérieuse dans le navigateur)

---

## TÂCHE 1.3 — FRONTEND REACT

**TÂCHE**: Créer l'application React de base  
**OBJECTIF**: Une interface web qui démarre, affiche des pages, et peut appeler le backend  
**LOGIQUE**: React est notre "façade visuelle". L'utilisateur voit React, React parle au backend FastAPI. On commence par la structure de base: une app qui navigue entre les pages.

**ÉTAPES**:

**Étape 1**: Initialiser le projet Vite + React
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install axios react-router-dom @types/react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Étape 2**: Configurer TailwindCSS dans `tailwind.config.js`
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**Étape 3**: `src/index.css` — ajouter les directives Tailwind:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Étape 4**: Créer `src/services/api.ts` (configuration Axios)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Ajouter le token d'auth automatiquement
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers login si non authentifié
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Étape 5**: Créer les pages de base dans `src/pages/`:

`LoginPage.tsx` — Page de connexion (placeholder pour l'instant)
```typescript
export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">
          Finance Automation
        </h1>
        <p className="text-center text-gray-600 mb-4">
          Connectez-vous avec votre compte Microsoft
        </p>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Se connecter avec Microsoft
        </button>
      </div>
    </div>
  );
};
```

`DashboardPage.tsx` — Dashboard principal (placeholder)
```typescript
export const DashboardPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Bienvenue dans Finance Automation</p>
    </div>
  );
};
```

**Étape 6**: Configurer le routing dans `src/App.tsx`
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div className="p-8">Page non trouvée (404)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Étape 7**: Créer `frontend/.env`
```
VITE_API_URL=http://localhost:8000
```

**Étape 8**: Créer `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**À TESTER**:
```bash
cd frontend
npm run dev
# Ouvrir http://localhost:5173 → page de login s'affiche
# Naviguer vers /dashboard → page dashboard s'affiche
# Naviguer vers /test-404 → page 404 s'affiche
```

- [ ] `http://localhost:5173` affiche la page login avec le bouton Microsoft
- [ ] Navigation vers `/dashboard` fonctionne
- [ ] Page 404 s'affiche pour les routes inconnues
- [ ] Aucune erreur TypeScript
- [ ] TailwindCSS fonctionne (bouton bleu visible)

**POINTS CLÉS**:
- `sessionStorage` (pas `localStorage`) pour le token: plus sécurisé car effacé quand l'onglet se ferme
- `VITE_API_URL` dans `.env` (préfixe VITE_ obligatoire pour Vite)
- Les interceptors Axios centralisent la gestion du token et des erreurs 401

---

## TÂCHE 1.4 — DOCKER COMPOSE

**TÂCHE**: Orchestrer les deux applications avec Docker Compose  
**OBJECTIF**: Une seule commande `docker-compose up` lance tout  
**LOGIQUE**: Docker permet d'emballer chaque application dans un "conteneur" portable. Docker Compose gère plusieurs conteneurs ensemble. C'est comme avoir des boîtes séparées qui communiquent entre elles de façon contrôlée.

**ÉTAPES**:

**Étape 1**: Créer `nginx/nginx.conf`
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    
    # Routes API → Backend FastAPI
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Route santé backend
    location /health {
        proxy_pass http://backend;
    }
    
    # Tout le reste → Frontend React
    location / {
        proxy_pass http://frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

**Étape 2**: Créer `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: finance_backend
    env_file:
      - .env
    volumes:
      - ./backend:/app  # Pour le hot-reload en développement
    ports:
      - "8000:8000"
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    
  frontend:
    build: ./frontend
    container_name: finance_frontend
    env_file:
      - ./frontend/.env
    ports:
      - "3000:80"
      
  nginx:
    image: nginx:alpine
    container_name: finance_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend
```

**Étape 3**: Créer le `.env` réel à la racine (avec les VRAIES valeurs, ce fichier ne va PAS sur git)
```bash
cp .env.example .env
# Puis éditer .env avec les vraies valeurs
```

**À TESTER**:
```bash
# Lancer tout
docker-compose up --build

# Dans un autre terminal:
curl http://localhost/health
# → {"status": "ok"}

curl http://localhost:8000/health
# → {"status": "ok"}

# Ouvrir http://localhost dans le navigateur
# → Page login React s'affiche

# Vérifier que le frontend peut appeler le backend:
# Ouvrir les DevTools → Network → Recharger la page
# Chercher un appel vers /api/ ou /health
```

- [ ] `docker-compose up` démarre sans erreur
- [ ] `http://localhost/health` répond `{"status": "ok"}`
- [ ] `http://localhost` affiche la page login React
- [ ] Les 3 conteneurs sont visibles dans `docker ps`
- [ ] `.env` n'est PAS committé dans git

**POINTS CLÉS**:
- `depends_on` assure que nginx démarre après frontend et backend
- `volumes` sur le backend permet le hot-reload (modifications visibles sans rebuild)
- En production, on enlèverait `--reload` et les volumes de développement

**PIÈGES**:
- Le `.env` à la racine ≠ `.env` dans `frontend/`. Les deux existent mais contiennent des variables différentes.
- Si Nginx démarre avant que backend soit prêt → erreur 502. Ajouter `healthcheck` en production.

---

## LIVRABLE PHASE 1 — CHECKLIST COMPLÈTE

Avant de dire que la Phase 1 est terminée, vérifier:

### Infrastructure
- [ ] Structure de fichiers créée et organisée
- [ ] `.gitignore` correct
- [ ] `.env.example` complet sans valeurs réelles
- [ ] `.env` créé localement avec vraies valeurs (non committé)

### Backend
- [ ] `GET /health` retourne `{"status": "ok"}`
- [ ] `GET /docs` affiche la documentation Swagger
- [ ] Logs configurés (pas de print())
- [ ] CORS configuré pour le frontend

### Frontend
- [ ] Application démarre sans erreur
- [ ] Page `/login` s'affiche
- [ ] Page `/dashboard` s'affiche
- [ ] Page 404 s'affiche pour routes inconnues
- [ ] TypeScript compile sans erreur

### Docker
- [ ] `docker-compose up --build` fonctionne
- [ ] Les 3 services démarrent: backend, frontend, nginx
- [ ] `http://localhost` → frontend visible
- [ ] `http://localhost/health` → backend répond

---

## RAPPORT À LIVRER EN FIN DE PHASE 1

```markdown
# RAPPORT PHASE 1 — Setup & Foundation

## Tâches Complétées
- ✅ 1.1 Structure projet
- ✅ 1.2 Backend FastAPI  
- ✅ 1.3 Frontend React
- ✅ 1.4 Docker Compose

## Tests Effectués
- Test /health: ✅
- Test navigation React: ✅
- Test docker-compose up: ✅

## Prêt pour Phase 2? 
✅ OUI — Infrastructure opérationnelle, prêt pour implémenter l'authentification Azure AD.

## Questions pour la Phase 2
- [Questions sur les rôles si pas encore posées]
```
