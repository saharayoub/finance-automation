# EVALUATION_CRITERIA.md
## Critères d'Évaluation — Par Phase

> Ce document définit exactement comment Claude évalue le travail livré par l'agent de codage après chaque phase. Chaque critère est noté ✅ (OK), ⚠️ (À améliorer), ou ❌ (Bloquant — doit être corrigé avant d'avancer).

---

## GRILLE D'ÉVALUATION GLOBALE (Toutes Phases)

### A. Fonctionnalité (40 points)
| Critère | Points | Description |
|---------|--------|-------------|
| Fonctionnalités livrées | 20 | Tout ce qui était demandé est implémenté |
| Cas d'erreur gérés | 10 | Les erreurs sont gérées proprement (pas de crash) |
| Tests passent | 10 | Les tests unitaires et d'intégration passent |

### B. Sécurité (30 points)
| Critère | Points | Description |
|---------|--------|-------------|
| Pas de credentials hardcodés | 10 | Zéro clé API ou mot de passe dans le code |
| Auth implémentée correctement | 10 | Azure AD protège bien les endpoints |
| Validation des inputs | 10 | Toutes les entrées utilisateur sont validées |

### C. Qualité du Code (20 points)
| Critère | Points | Description |
|---------|--------|-------------|
| Standards respectés | 10 | PEP8 Python, ESLint TypeScript |
| Lisibilité | 5 | Code compréhensible, commenté si nécessaire |
| Architecture propre | 5 | Séparation des responsabilités respectée |

### D. Documentation & Pédagogie (10 points)
| Critère | Points | Description |
|---------|--------|-------------|
| Rapport de phase livré | 5 | Rapport complet et honnête |
| Explications fournies | 5 | Les choix techniques sont expliqués |

**Seuil de validation: 70/100**  
**En dessous de 70**: Corrections obligatoires avant de passer à la phase suivante.  
**Critère de sécurité à 0**: Phase automatiquement refusée, peu importe le score total.

---

## PHASE 1 — SETUP & FOUNDATION

### Critères Fonctionnels
- [ ] **[BLOQUANT]** `GET /health` retourne `{"status": "ok"}`
- [ ] **[BLOQUANT]** Application React démarre sans erreur
- [ ] **[BLOQUANT]** `docker-compose up` lance les 3 services
- [ ] **[BLOQUANT]** Frontend accessible sur `http://localhost`
- [ ] Page `/login` s'affiche
- [ ] Page `/dashboard` s'affiche
- [ ] Page 404 s'affiche pour routes inconnues
- [ ] Documentation API accessible sur `/docs`

### Critères Sécurité
- [ ] **[BLOQUANT]** `.env` dans `.gitignore`
- [ ] **[BLOQUANT]** Pas de valeurs réelles dans `.env.example`
- [ ] CORS configuré (pas de wildcard `*` côté liste d'origines)
- [ ] Pas de credentials dans le code source

### Critères Qualité
- [ ] TypeScript compile sans erreur
- [ ] Aucun `console.log` ou `print()` de debug restés dans le code
- [ ] Fichiers organisés selon la structure définie
- [ ] `requirements.txt` complet avec versions fixées
- [ ] `package.json` à jour

### Critères Documentation
- [ ] `README.md` explique comment démarrer le projet
- [ ] `.env.example` documenté (commentaires sur chaque variable)
- [ ] Rapport de phase livré

### Questions d'Évaluation
1. Le projet démarre-t-il en suivant uniquement le README?
2. Y a-t-il des secrets dans le code ou dans git?
3. La structure de fichiers correspond-elle exactement au plan?

---

## PHASE 2 — AUTHENTIFICATION AZURE AD

### Critères Fonctionnels
- [ ] **[BLOQUANT]** Login Microsoft fonctionne (redirect → retour avec token)
- [ ] **[BLOQUANT]** Endpoints protégés retournent 401 sans token
- [ ] **[BLOQUANT]** Endpoints protégés retournent 403 avec rôle insuffisant
- [ ] Nom et rôle de l'utilisateur affichés après connexion
- [ ] Déconnexion fonctionne (token invalidé)
- [ ] Redirection automatique vers `/login` si non authentifié
- [ ] Rôles implémentés selon définition utilisateur

### Critères Sécurité
- [ ] **[BLOQUANT]** Token NON stocké dans `localStorage` (utiliser `sessionStorage` ou mémoire)
- [ ] **[BLOQUANT]** Validation du token côté backend (pas juste côté frontend)
- [ ] **[BLOQUANT]** Vérification du rôle sur chaque endpoint backend
- [ ] Pas d'informations sensibles dans les messages d'erreur (ex: pas "Token expiré à 14h32")
- [ ] Logs d'audit pour chaque connexion/déconnexion

### Critères Qualité
- [ ] `auth_service.py` avec type hints et docstrings
- [ ] Composant `ProtectedRoute` réutilisable
- [ ] Tests: connexion valide, token invalide, token expiré, rôle insuffisant

### Tests Obligatoires
```
Scénario 1: Utilisateur non connecté
→ GET /api/reports → 401 Unauthorized ✅

Scénario 2: Token invalide
→ GET /api/reports avec token "faux123" → 401 ✅

Scénario 3: Token valide, rôle insuffisant
→ GET /api/admin/companies avec rôle "user" → 403 Forbidden ✅

Scénario 4: Token valide, bon rôle
→ GET /api/upload avec rôle "uploader" → 200 OK ✅
```

---

## PHASE 3 — UPLOAD & PARSING CSV

### Critères Fonctionnels
- [ ] **[BLOQUANT]** Fichier CSV peut être uploadé via l'interface
- [ ] **[BLOQUANT]** CSV est parsé correctement (toutes les colonnes lues)
- [ ] **[BLOQUANT]** Erreur claire si colonnes manquantes
- [ ] Barre de progression pendant upload
- [ ] Validation: seulement fichiers `.csv` acceptés
- [ ] Validation: fichier taille max respectée
- [ ] Séparateurs décimaux normalisés (`.` et `,` gérés)
- [ ] Rapport de validation basique retourné

### Critères Sécurité
- [ ] **[BLOQUANT]** Validation que la société dans le CSV appartient à l'utilisateur connecté
- [ ] Taille max fichier imposée côté backend (pas seulement frontend)
- [ ] Type de fichier vérifié côté backend (pas seulement l'extension)
- [ ] Fichier temporaire supprimé après traitement

### Critères Qualité
- [ ] `csv_parser.py` gère plusieurs encodages (UTF-8, Latin-1)
- [ ] `csv_parser.py` détecte automatiquement le séparateur (`,` ou `;`)
- [ ] Tests unitaires pour normalisation des décimaux
- [ ] Tests avec fichiers malformés

### Tests Obligatoires
```
Test 1: CSV valide CA → Parsé correctement
Test 2: CSV valide Engagement → Parsé correctement  
Test 3: CSV avec séparateur ";" → Parsé correctement
Test 4: CSV avec encoding Latin-1 → Parsé correctement
Test 5: CSV avec colonnes manquantes → Erreur claire retournée
Test 6: Fichier non-CSV uploadé → Refusé avec message clair
Test 7: Fichier trop grand → Refusé avec message clair
Test 8: "120.000,50" → normalisé en 120000.50
Test 9: "1,500,000.00" → normalisé en 1500000.00
```

---

## PHASE 4 — VALIDATION IA (DEEPSEEK)

### Critères Fonctionnels
- [ ] **[BLOQUANT]** DeepSeek appelé et retourne une réponse structurée
- [ ] **[BLOQUANT]** Rapport de validation retourné avec erreurs détaillées
- [ ] **[BLOQUANT]** Formule CA validée (LOCAL + Export = MontantCA)
- [ ] **[BLOQUANT]** Règles Engagement implémentées selon définition utilisateur
- [ ] Auto-corrections documentées dans le rapport
- [ ] Interface affiche clairement erreurs / corrections / avertissements
- [ ] Bouton "Approuver" et bouton "Rejeter" fonctionnels

### Critères Sécurité
- [ ] **[BLOQUANT]** Clé OpenRouter dans `.env` uniquement
- [ ] Gestion timeout API (pas de requête infinie)
- [ ] Données sensibles non envoyées dans les logs DeepSeek
- [ ] Rate limiting sur l'endpoint de validation

### Critères Qualité
- [ ] Prompt IA optimisé et documenté
- [ ] Gestion des erreurs API (timeout, rate limit, erreur 500)
- [ ] Réponse IA parsée en JSON (pas de texte libre non structuré)
- [ ] Tests avec données réelles (exemples dans DATASETS.md)

### Tests Obligatoires
```
Test CA 1: Données valides → Validation OK
Test CA 2: LOCAL + Export ≠ MontantCA → Erreur détectée avec ligne précise
Test CA 3: Séparateur décimal européen → Auto-corrigé + documenté
Test CA 4: Date invalide → Erreur détectée

Test Engagement 1: Données valides → Validation OK
Test Engagement 2: Title dupliqué → Erreur détectée
Test Engagement 3: Règles spécifiques banque → Appliquées correctement
```

---

## PHASE 5 — INTÉGRATION SHAREPOINT

### Critères Fonctionnels
- [ ] **[BLOQUANT]** Données CA insérées dans la SharePoint List correcte
- [ ] **[BLOQUANT]** Données Engagement insérées dans la SharePoint List correcte
- [ ] **[BLOQUANT]** Fichier CSV original sauvegardé dans Document Library
- [ ] Vérification doublons avant insertion
- [ ] Transaction complète (tout ou rien)
- [ ] Lien de téléchargement retourné après sauvegarde

### Critères Sécurité
- [ ] **[BLOQUANT]** Credentials Azure dans `.env` uniquement
- [ ] **[BLOQUANT]** Permissions SharePoint vérifiées avant écriture
- [ ] Logs d'audit pour chaque insertion
- [ ] Gestion des erreurs Graph API (403, 429, 500)

### Critères Qualité
- [ ] `sharepoint_service.py` avec type hints et gestion erreurs complète
- [ ] Retry automatique sur erreurs temporaires (429 rate limit)
- [ ] Tests avec mock Graph API

### Tests Obligatoires
```
Test 1: Insertion CA → Données visibles dans SharePoint List
Test 2: Insertion Engagement → Données visibles dans SharePoint List
Test 3: Upload CSV → Fichier visible dans Document Library
Test 4: Doublon détecté → Pas d'insertion double
Test 5: Erreur Graph API 429 → Retry automatique
Test 6: Erreur Graph API 500 → Message d'erreur clair, rollback
```

---

## PHASE 6 — GÉNÉRATION RAPPORT PPTX

### Critères Fonctionnels
- [ ] **[BLOQUANT]** Fichier PPTX généré sans erreur
- [ ] **[BLOQUANT]** PPTX contient données nouvelles + comparaison avec mois précédent
- [ ] **[BLOQUANT]** PPTX téléchargeable depuis le dashboard
- [ ] Structure du rapport selon définition utilisateur
- [ ] PPTX sauvegardé dans SharePoint
- [ ] Notification affichée quand rapport disponible

### Critères Qualité
- [ ] `pptx_service.py` avec type hints
- [ ] Lisible et bien formaté (pas de texte coupé, alignement correct)
- [ ] Génération < 30 secondes

---

## CRITÈRES TRANSVERSAUX (Toutes les Phases)

### Ce qui provoque un refus automatique (score 0):
1. Credentials hardcodés dans le code
2. `.env` committé dans git
3. Pas d'authentification sur des endpoints sensibles
4. Crash de l'application sur une erreur courante (ex: fichier vide uploadé)

### Ce qui déclenche une demande de correction:
1. Tests manquants pour les fonctionnalités principales
2. `print()` de debug restés dans le code livré
3. `any` TypeScript non justifié
4. Fonctionnalité demandée non implémentée sans explication

### Ce qui est acceptable avec une note:
1. Performance non optimale (acceptable en MVP)
2. UI basique sans design avancé (acceptable si fonctionnel)
3. Tests d'intégration partiels (acceptable si tests unitaires complets)

---

## FORMAT DE RETOUR D'ÉVALUATION DE CLAUDE

```markdown
## ÉVALUATION PHASE X

### Score: XX/100

### ✅ Points forts
- [Ce qui est bien fait]

### ⚠️ Points à améliorer
- [Ce qui peut être amélioré mais ne bloque pas]

### ❌ Corrections obligatoires (si score < 70 ou critère bloquant raté)
- [Ce qui DOIT être corrigé avant de passer à la phase suivante]
- [Instructions précises pour corriger]

### Décision: APPROUVÉ ✅ / CORRECTIONS NÉCESSAIRES ❌

### Prochaine étape
[Instructions pour la prochaine tâche ou correction à faire]
```
