# PROJECT_PLAN.md
## Projet d'Automatisation Financière — Plan Complet

---

## VUE D'ENSEMBLE

**Objectif**: Remplacer la saisie manuelle de données financières dans SharePoint par une application web automatisée.  
**Durée estimée**: 6-8 semaines (MVP)  
**Stack**: React 18 + FastAPI + SharePoint (Microsoft Graph API) + DeepSeek + python-pptx  
**Équipe**: 1 stagiaire développeur + Claude (planification/évaluation) + DeepSeek (codage)

---

## PHASES DU PROJET

```
PHASE 1 → PHASE 2 → PHASE 3 → PHASE 4 → PHASE 5 → PHASE 6
Setup      Auth      Upload     IA Valid.  SharePt   PPTX +
Foundation Azure AD  CSV        DeepSeek   Lists     Rapport
```

---

## PHASE 1 — SETUP & FOUNDATION
**Durée**: 3-5 jours  
**Objectif**: Infrastructure de base fonctionnelle, les deux applications démarrent sans erreur.

### Tâche 1.1 — Structure du projet
**Description**: Créer l'arborescence complète des fichiers et dossiers.  
**Résultat attendu**: Dossiers `frontend/`, `backend/`, `nginx/` créés avec fichiers de base.  
**Critères d'acceptation**:
- [ ] `docker-compose.yml` présent à la racine
- [ ] `frontend/` avec structure React (src/components, pages, services, store, types, utils)
- [ ] `backend/app/` avec structure FastAPI (routers, services, middleware, utils)
- [ ] `.env.example` avec toutes les variables nécessaires (sans valeurs réelles)
- [ ] `.gitignore` qui exclut `.env`, `node_modules`, `__pycache__`

**Dépendances**: Aucune (première tâche)

---

### Tâche 1.2 — Backend FastAPI — Initialisation
**Description**: Créer le serveur FastAPI de base qui démarre et répond.  
**Résultat attendu**: `GET /health` retourne `{"status": "ok"}`.  
**Critères d'acceptation**:
- [ ] `main.py` avec FastAPI app initialisée
- [ ] `config.py` qui lit les variables `.env` avec python-dotenv
- [ ] Route `/health` fonctionnelle
- [ ] CORS configuré (accepte requêtes depuis le frontend)
- [ ] Logger configuré (pas de print(), uniquement logging)
- [ ] Serveur démarre avec `uvicorn app.main:app --reload`

**Dépendances**: Tâche 1.1

---

### Tâche 1.3 — Frontend React — Initialisation
**Description**: Créer l'application React de base avec routing et layout principal.  
**Résultat attendu**: Application React démarre, affiche une page d'accueil simple.  
**Critères d'acceptation**:
- [ ] Vite + React 18 + TypeScript configuré
- [ ] TailwindCSS installé et fonctionnel
- [ ] React Router configuré (routes: `/login`, `/dashboard`, `/upload`)
- [ ] Layout principal avec navigation placeholder
- [ ] Axios configuré avec base URL du backend
- [ ] Page 404 si route non trouvée
- [ ] Compile sans erreurs TypeScript

**Dépendances**: Tâche 1.1

---

### Tâche 1.4 — Docker Compose — Orchestration
**Description**: Conteneuriser les deux applications et les lancer ensemble.  
**Résultat attendu**: `docker-compose up` lance frontend + backend + nginx.  
**Critères d'acceptation**:
- [ ] `Dockerfile` backend fonctionnel
- [ ] `Dockerfile` frontend fonctionnel
- [ ] `nginx.conf` route `/api/*` vers backend, `/` vers frontend
- [ ] `docker-compose.yml` avec les 3 services
- [ ] Les services communiquent entre eux (frontend peut appeler `/api/health`)
- [ ] Variables d'environnement passées via `.env`

**Dépendances**: Tâches 1.2 et 1.3

---

**✅ LIVRABLE PHASE 1**: Application démarre, frontend affiche page d'accueil, backend répond `/health`, Docker fonctionne.

---

## PHASE 2 — AUTHENTIFICATION AZURE AD
**Durée**: 4-6 jours  
**Objectif**: Authentification sécurisée via Azure AD (Microsoft) avec gestion des rôles.

> ⚠️ **AVANT DE COMMENCER**: Claude demandera à l'utilisateur de définir le système de rôles complet (voir RULES_TO_ASK.md)

### Tâche 2.1 — Configuration Azure AD
**Description**: Enregistrer l'application dans Azure Portal et configurer les permissions.  
**Résultat attendu**: Application enregistrée dans Azure AD avec les bons scopes.  
**Critères d'acceptation**:
- [ ] Application enregistrée dans Azure Portal
- [ ] Client ID et Tenant ID disponibles
- [ ] Scopes Microsoft Graph configurés: `User.Read`, `Sites.ReadWrite.All`
- [ ] Redirect URIs configurées (localhost + production)
- [ ] Variables Azure ajoutées au `.env`

**Dépendances**: Tâche 1.4

---

### Tâche 2.2 — Backend — Authentification Azure AD
**Description**: Valider les tokens JWT Azure AD dans le backend FastAPI.  
**Résultat attendu**: Endpoints protégés refusent les requêtes sans token valide.  
**Critères d'acceptation**:
- [ ] `auth_service.py` qui valide les tokens JWT Azure AD
- [ ] Middleware qui protège les routes (sauf `/health` et `/login`)
- [ ] Extraction du rôle utilisateur depuis le token
- [ ] Retourne 401 si token absent, 403 si permissions insuffisantes
- [ ] Logs de chaque tentative d'accès (audit trail)

**Dépendances**: Tâche 2.1

---

### Tâche 2.3 — Frontend — Page Login & Flux Auth
**Description**: Page de connexion qui redirige vers Microsoft Login.  
**Résultat attendu**: Utilisateur peut se connecter avec son compte Microsoft.  
**Critères d'acceptation**:
- [ ] Page `/login` avec bouton "Se connecter avec Microsoft"
- [ ] Intégration MSAL (Microsoft Authentication Library)
- [ ] Token stocké de façon sécurisée (mémoire, pas localStorage)
- [ ] Redirection vers `/dashboard` après connexion réussie
- [ ] Redirection vers `/login` si non authentifié
- [ ] Affichage nom et rôle de l'utilisateur connecté

**Dépendances**: Tâche 2.2

---

### Tâche 2.4 — Gestion des Rôles
**Description**: Implémenter le système de rôles défini par l'utilisateur.  
**Résultat attendu**: Chaque rôle voit uniquement ce qu'il doit voir.  
**Critères d'acceptation**:
- [ ] Rôles mappés depuis Azure AD Groups
- [ ] Composant `ProtectedRoute` dans React
- [ ] Backend vérifie le rôle avant chaque action sensible
- [ ] Tests de chaque scénario d'accès (voir RULES_TO_ASK.md)

> ⚠️ Les rôles exacts seront définis par l'utilisateur avant cette tâche.

**Dépendances**: Tâches 2.2 et 2.3

---

**✅ LIVRABLE PHASE 2**: Login Microsoft fonctionnel, rôles implémentés, accès protégé par rôle.

---

## PHASE 3 — UPLOAD & TRAITEMENT CSV
**Durée**: 4-5 jours  
**Objectif**: Interface d'upload de fichiers CSV avec parsing et validation basique.

### Tâche 3.1 — Interface d'Upload Frontend
**Description**: Page d'upload avec drag & drop, sélection du type de fichier.  
**Résultat attendu**: L'utilisateur peut uploader un fichier CSV.  
**Critères d'acceptation**:
- [ ] Composant `FileUpload` avec drag & drop
- [ ] Sélection du type: "Chiffre d'affaire" ou "Engagement"
- [ ] Validation côté client: format `.csv` uniquement, taille max 10MB
- [ ] Barre de progression pendant upload
- [ ] Affichage du résultat (succès / erreur)
- [ ] Désactivé si l'utilisateur n'a pas le rôle upload

**Dépendances**: Phase 2 complète

---

### Tâche 3.2 — Backend — Réception et Parsing CSV
**Description**: Endpoint qui reçoit le CSV et le parse avec pandas.  
**Résultat attendu**: Backend reçoit fichier, le parse, retourne les données structurées.  
**Critères d'acceptation**:
- [ ] `POST /api/upload` qui accepte multipart/form-data
- [ ] `csv_parser.py` qui parse selon le type (CA ou Engagement)
- [ ] Gestion des encodages (UTF-8, Latin-1)
- [ ] Détection automatique du séparateur (`,` ou `;`)
- [ ] Retourne erreur claire si colonnes manquantes
- [ ] Fichier original stocké temporairement de façon sécurisée
- [ ] Validation du nom de l'entreprise (appartient bien à l'utilisateur connecté)

**Dépendances**: Tâche 3.1

---

### Tâche 3.3 — Validation Basique des Données
**Description**: Vérifications simples sans IA: colonnes présentes, types de données, valeurs nulles.  
**Résultat attendu**: Rapport de validation basique avant d'appeler l'IA.  
**Critères d'acceptation**:
- [ ] `validation_service.py` avec validations basiques
- [ ] Vérification colonnes obligatoires présentes
- [ ] Vérification types de données (date, nombre, texte)
- [ ] Normalisation des séparateurs décimaux (`.` et `,` → format standard)
- [ ] Rapport JSON avec liste d'erreurs et avertissements
- [ ] Tests unitaires pour les cas courants

**Dépendances**: Tâche 3.2

---

**✅ LIVRABLE PHASE 3**: Upload fonctionnel, CSV parsé et validé basiquement, rapport d'erreurs retourné.

---

## PHASE 4 — VALIDATION IA (DEEPSEEK)
**Durée**: 5-7 jours  
**Objectif**: L'IA valide, corrige et explique les problèmes dans les données.

> ⚠️ **AVANT DE COMMENCER**: Claude demandera les règles exactes de validation pour CA et Engagement (voir RULES_TO_ASK.md)

### Tâche 4.1 — Intégration DeepSeek via OpenRouter
**Description**: Configurer l'appel API vers DeepSeek pour la validation.  
**Résultat attendu**: Backend peut appeler DeepSeek et recevoir une réponse structurée.  
**Critères d'acceptation**:
- [ ] `ai_service.py` avec client OpenRouter/DeepSeek
- [ ] Clé API dans `.env` (jamais hardcodée)
- [ ] Gestion des erreurs API (timeout, rate limit)
- [ ] Réponse parsée en JSON structuré
- [ ] Logs des appels IA (sans les données sensibles)

**Dépendances**: Phase 3 complète

---

### Tâche 4.2 — Validation IA pour Chiffre d'Affaire
**Description**: Prompt et logique de validation spécifique au dataset CA.  
**Résultat attendu**: IA valide les formules, normalise les nombres, signale les erreurs.  
**Critères d'acceptation**:
- [ ] Prompt optimisé pour validation CA
- [ ] Vérification: LOCAL + Export = MontantCA (selon règles utilisateur)
- [ ] Normalisation séparateurs décimaux
- [ ] Validation des dates
- [ ] Rapport détaillé: erreurs, corrections, avertissements
- [ ] Auto-correction si possible, signalement si non

> ⚠️ Règles exactes à définir avec l'utilisateur avant codage.

**Dépendances**: Tâche 4.1

---

### Tâche 4.3 — Validation IA pour Engagement
**Description**: Prompt et logique de validation spécifique au dataset Engagement.  
**Résultat attendu**: IA valide les engagements selon les règles par banque/company.  
**Critères d'acceptation**:
- [ ] Prompt optimisé pour validation Engagement
- [ ] Gestion multi-banques par company
- [ ] Validation des doublons (Title unique)
- [ ] Validation des montants selon règles définies
- [ ] Rapport structuré avec explications claires

> ⚠️ Règles exactes à définir avec l'utilisateur avant codage.

**Dépendances**: Tâche 4.1

---

### Tâche 4.4 — Interface Rapport de Validation Frontend
**Description**: Afficher le résultat de la validation IA à l'utilisateur.  
**Résultat attendu**: L'utilisateur voit clairement les erreurs, corrections, et peut approuver ou rejeter.  
**Critères d'acceptation**:
- [ ] Composant `ValidationReport` qui affiche résultats
- [ ] Code couleur: vert (OK), orange (avertissement), rouge (erreur)
- [ ] Bouton "Approuver et insérer dans SharePoint"
- [ ] Bouton "Rejeter et re-uploader"
- [ ] Téléchargement du rapport de validation

**Dépendances**: Tâches 4.2 et 4.3

---

**✅ LIVRABLE PHASE 4**: Validation IA fonctionnelle, rapport affiché, utilisateur peut approuver ou rejeter.

---

## PHASE 5 — INTÉGRATION SHAREPOINT
**Durée**: 5-7 jours  
**Objectif**: Insérer les données validées dans SharePoint (Lists + Document Library).

> ⚠️ **AVANT DE COMMENCER**: Clarifier la structure SharePoint attendue (noms des listes, colonnes, etc.)

### Tâche 5.1 — Configuration Microsoft Graph API
**Description**: Connecter le backend à SharePoint via Microsoft Graph API.  
**Résultat attendu**: Backend peut lire et écrire dans SharePoint.  
**Critères d'acceptation**:
- [ ] `sharepoint_service.py` avec client Graph API
- [ ] Authentification avec les permissions correctes
- [ ] Test de connexion: lire un élément existant
- [ ] Gestion des erreurs Graph API (403, 429, 500)
- [ ] Retry automatique en cas d'erreur temporaire

**Dépendances**: Phase 4 complète

---

### Tâche 5.2 — Insertion dans SharePoint Lists
**Description**: Insérer les données CA et Engagement validées dans les listes SharePoint.  
**Résultat attendu**: Données visibles dans SharePoint après upload et validation.  
**Critères d'acceptation**:
- [ ] Insertion dans la liste "ChiffreAffaire"
- [ ] Insertion dans la liste "Engagement"
- [ ] Vérification des doublons avant insertion
- [ ] Transaction: tout ou rien (pas d'insertion partielle)
- [ ] Logs d'audit pour chaque insertion

**Dépendances**: Tâche 5.1

---

### Tâche 5.3 — Sauvegarde dans Document Library
**Description**: Sauvegarder le fichier CSV original dans la Document Library SharePoint.  
**Résultat attendu**: Fichier CSV original accessible dans SharePoint pour archivage.  
**Critères d'acceptation**:
- [ ] Upload fichier CSV dans folder company/mois/année
- [ ] Métadonnées ajoutées: company, date upload, validé par IA
- [ ] Lien de téléchargement retourné dans la réponse API
- [ ] Permissions: company voit seulement ses fichiers

**Dépendances**: Tâche 5.2

---

**✅ LIVRABLE PHASE 5**: Données insérées dans SharePoint, fichiers archivés, audit trail complet.

---

## PHASE 6 — GÉNÉRATION RAPPORT PPTX
**Durée**: 4-5 jours  
**Objectif**: Générer automatiquement un rapport PowerPoint avec anciennes + nouvelles données.

> ⚠️ **AVANT DE COMMENCER**: Clarifier format/contenu rapport avec l'utilisateur.

### Tâche 6.1 — Service de Génération PPTX
**Description**: Créer le service qui génère le PPTX avec python-pptx.  
**Résultat attendu**: Fichier PPTX généré avec données formatées.  
**Critères d'acceptation**:
- [ ] `pptx_service.py` avec logique de génération
- [ ] Template PPTX de base (couleurs entreprise si disponibles)
- [ ] Slides: titre, résumé, données CA, données Engagement
- [ ] Comparaison avec données du mois précédent (depuis SharePoint)
- [ ] Graphiques simples si applicable (Recharts ou matplotlib)
- [ ] Fichier PPTX sauvegardé dans SharePoint

> ⚠️ Structure détaillée du rapport à définir avec l'utilisateur.

**Dépendances**: Phase 5 complète

---

### Tâche 6.2 — Téléchargement du Rapport via Dashboard
**Description**: L'utilisateur peut télécharger le rapport PPTX depuis son dashboard.  
**Résultat attendu**: Bouton de téléchargement dans le dashboard.  
**Critères d'acceptation**:
- [ ] Composant `ReportsList` dans le dashboard
- [ ] Historique des rapports générés (par mois)
- [ ] Bouton télécharger
- [ ] Accès limité au rôle approprié

**Dépendances**: Tâche 6.1

---

### Tâche 6.3 — Notification de Fin de Traitement
**Description**: Notifier l'utilisateur quand son fichier est traité et le rapport disponible.  
**Résultat attendu**: Notification dans l'application (ou email si configuré).  
**Critères d'acceptation**:
- [ ] Notification in-app quand traitement terminé
- [ ] Statut visible dans le dashboard: "En cours", "Validé", "Erreur"
- [ ] Email optionnel si configuré

**Dépendances**: Tâches 6.1 et 6.2

---

**✅ LIVRABLE PHASE 6**: Rapport PPTX généré, accessible depuis dashboard, notifications fonctionnelles.

---

## PHASE 7 — TESTS FINAUX & DÉPLOIEMENT
**Durée**: 3-4 jours  
**Objectif**: Tester le flux complet de bout en bout et préparer la démonstration.

### Tâche 7.1 — Tests End-to-End
**Description**: Tester le flux complet avec des données réelles.  
**Critères d'acceptation**:
- [ ] Upload CA → Validation → SharePoint → PPTX → Téléchargement
- [ ] Upload Engagement → Validation → SharePoint → PPTX
- [ ] Test de chaque rôle utilisateur
- [ ] Test des cas d'erreur (fichier malformé, connexion perdue, etc.)

### Tâche 7.2 — Préparation Démonstration
**Description**: Préparer la démo pour l'entreprise.  
**Critères d'acceptation**:
- [ ] Données de démonstration préparées
- [ ] Script de démo écrit
- [ ] README complet et clair
- [ ] Application déployée sur Render.com ou Railway.app

---

## RÉSUMÉ DES LIVRABLES

| Phase | Durée | Livrable Principal |
|-------|-------|-------------------|
| 1. Setup | 3-5j | Infrastructure Docker, apps démarrent |
| 2. Auth | 4-6j | Login Azure AD, rôles fonctionnels |
| 3. Upload CSV | 4-5j | Upload + parsing + validation basique |
| 4. Validation IA | 5-7j | DeepSeek valide et corrige données |
| 5. SharePoint | 5-7j | Données insérées dans SharePoint |
| 6. Rapport PPTX | 4-5j | Rapport généré et téléchargeable |
| 7. Tests & Démo | 3-4j | Démo fonctionnelle pour l'entreprise |
| **TOTAL** | **~6-7 sem** | **MVP complet** |

---

## POINTS D'ARRÊT OBLIGATOIRES (Avant de coder)

1. **Phase 2** → Demander définition des rôles utilisateurs
2. **Phase 4** → Demander règles de validation CA et Engagement
3. **Phase 5** → Clarifier structure SharePoint (noms listes, colonnes)
4. **Phase 6** → Clarifier format et contenu du rapport PPTX
