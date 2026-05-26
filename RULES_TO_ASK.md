# RULES_TO_ASK.md
## Questions à Poser à l'Utilisateur — Avant de Coder

> Ce document liste toutes les questions que Claude DOIT poser à l'utilisateur avant d'implémenter certaines fonctionnalités. Ne jamais assumer les réponses.

---

## 🔴 AVANT PHASE 2 — SYSTÈME DE RÔLES

```
Bonjour! Avant d'implémenter le système d'authentification et de rôles,
j'ai besoin de comprendre exactement comment votre organisation fonctionne.

QUESTIONS SUR LES RÔLES:

1. Quels sont les types d'utilisateurs dans votre système?
   - Par exemple: Super Admin, Admin Company, Utilisateur simple?
   - Y a-t-il d'autres rôles?

2. Qui peut faire quoi? Pour chaque rôle, dites-moi:
   a) Peut uploader des fichiers CSV? (CA? Engagement? Les deux?)
   b) Peut voir les données de son entreprise seulement, ou de toutes?
   c) Peut générer/télécharger les rapports PPTX?
   d) Peut voir l'historique des uploads?
   e) Peut créer/gérer d'autres utilisateurs?
   f) Peut voir le dashboard avec les statistiques?

3. Structure hiérarchique:
   - Y a-t-il un "Super Admin" du groupe qui peut voir TOUTES les sociétés?
   - Chaque société a-t-elle son propre administrateur?
   - Un utilisateur peut-il appartenir à plusieurs sociétés?

4. Cas pratiques (donnez des exemples concrets):
   - Exemple: "Mohamed est responsable financier de CompanyA. Il peut uploader 
     les fichiers de CompanyA et voir ses rapports. Il ne peut pas voir CompanyB."
   - Exemple: "Fatima est admin groupe. Elle voit toutes les sociétés et tous 
     les rapports."

5. Que se passe-t-il si quelqu'un essaie d'accéder à ce qu'il n'a pas le droit?
   - Message d'erreur et redirection? Ou contenu caché silencieusement?

RÉPONDEZ avec autant de détail que possible. Je documenterai exactement
et implémenterai selon votre description.
```

### Template pour documenter la réponse:
```
## Rôles Confirmés

### Rôle 1: [Nom]
- Description: 
- Peut uploader CA: OUI / NON
- Peut uploader Engagement: OUI / NON
- Voit les données de: [sa société seulement / toutes les sociétés]
- Peut télécharger rapports: OUI / NON
- Peut gérer utilisateurs: OUI / NON

### Rôle 2: [Nom]
[...]
```

---

## 🔴 AVANT PHASE 4A — RÈGLES VALIDATION CA (CHIFFRE D'AFFAIRE)

```
Avant de coder la validation IA pour le dataset Chiffre d'Affaire,
j'ai besoin de connaître les règles exactes.

QUESTIONS SUR LA VALIDATION CA:

1. Formule MontantCA = LOCAL + Export:
   - Si LOCAL + Export ≠ MontantCA, c'est une ERREUR ou un AVERTISSEMENT?
   - Y a-t-il une tolérance d'arrondi acceptable? (ex: ±0.01€ acceptable?)
   - Que faire: rejeter la ligne, la corriger si possible, ou signaler seulement?

2. Valeurs nulles/manquantes:
   - Si LOCAL est vide (pas 0, mais vraiment absent): erreur ou mettre 0?
   - Si Export est vide: erreur ou mettre 0?
   - Si MontantCA est vide: erreur bloquante?

3. Validation des dates:
   - Les dates futures sont-elles acceptées? (ex: upload en janvier pour mars?)
   - Quelle est la date la plus ancienne acceptable? (ex: pas avant 2020?)
   - Si le format de date est différent (15/01/2024 au lieu de 2024-01-15): 
     corriger automatiquement ou signaler comme erreur?

4. Doublons:
   - Si une même ligne (même Société + même Date) existe déjà dans SharePoint:
     remplacer? rejeter? signaler pour validation manuelle?
   - Si la même ligne apparaît deux fois DANS le fichier uploadé: erreur?

5. Nom de société:
   - Les noms de sociétés doivent-ils correspondre exactement à une liste connue?
   - Les espaces/majuscules font-ils une différence? ("Company A" vs "companyA")

6. Valeurs négatives:
   - MontantCA négatif: possible (avoir?) ou toujours erreur?
   - LOCAL négatif: possible ou toujours erreur?

7. Autres validations spécifiques:
   - Y a-t-il des montants minimum ou maximum acceptables?
   - D'autres règles que je n'ai pas mentionnées?

Donnez-moi des exemples concrets de cas d'erreurs réels que vous avez 
rencontrés avec l'ancien processus manuel. Ça m'aidera à bien configurer la validation.
```

### Template pour documenter la réponse:
```
## Règles Validation CA — Confirmées le [DATE]

### Formule MontantCA
- Tolérance: [ex: ±0.01€]
- Si erreur: [BLOQUER / AVERTISSEMENT / AUTO-CORRIGER]

### Valeurs nulles
- LOCAL absent: [METTRE 0 / ERREUR]
- Export absent: [METTRE 0 / ERREUR]
- MontantCA absent: [BLOQUER TOUJOURS]

### Dates
- Dates futures: [ACCEPTÉES / REFUSÉES]
- Date minimale: [ex: 2020-01-01]
- Format alternatif: [CORRIGER AUTO / ERREUR]

### Doublons
- Doublon dans SharePoint: [REMPLACER / REJETER / SIGNALER]
- Doublon dans le fichier: [ERREUR]

### Autres règles
[...]
```

---

## 🔴 AVANT PHASE 4B — RÈGLES VALIDATION ENGAGEMENT

```
Avant de coder la validation IA pour le dataset Engagement,
j'ai besoin de connaître les règles exactes.

QUESTIONS SUR LA VALIDATION ENGAGEMENT:

1. Title (identifiant unique):
   - Le Title doit-il être unique globalement (toutes sociétés confondues)?
     Ou unique seulement par société?
   - Si Title existant: mise à jour ou erreur?
   - Y a-t-il un format obligatoire? (ex: "Engagement" + chiffres?)

2. Désignation:
   - Quels sont les types de Désignation valides? (Marchandises, Services, ...?)
   - Liste fermée (seulement ces valeurs) ou ouverte (n'importe quelle valeur)?
   - Si valeur inconnue: erreur ou avertissement?

3. Banques:
   - Y a-t-il une liste des banques autorisées?
   - Une société peut-elle travailler avec une nouvelle banque sans validation préalable?
   - Les règles de validation sont-elles différentes selon la banque? Si oui, lesquelles?

4. Montants:
   - Y a-t-il des montants minimum/maximum par type de désignation?
   - Y a-t-il des montants minimum/maximum par banque?
   - Les montants négatifs sont-ils possibles?
   - Même problème de séparateurs décimaux que le CA?

5. Dates:
   - Mêmes règles que le CA? (pas de dates futures, limite dans le passé?)
   - Un engagement peut-il avoir une date future? (engagement pour le mois prochain?)

6. Libelle:
   - Y a-t-il une longueur minimum pour le libelle?
   - Y a-t-il des mots-clés obligatoires ou interdits?

7. Règles spécifiques par société:
   - Chaque société a-t-elle ses propres règles particulières?
   - Si oui, listez-les pour chaque société.

8. Règles par banque:
   - Y a-t-il des règles différentes selon la banque?
   - Exemple: "BanqueX n'accepte que des engagements Marchandises"?

Donnez-moi les règles réelles utilisées dans l'ancien processus manuel.
Si vous avez un document de règles existant, partagez-le.
```

### Template pour documenter la réponse:
```
## Règles Validation Engagement — Confirmées le [DATE]

### Title
- Unicité: [GLOBALE / PAR SOCIÉTÉ]
- Format obligatoire: [OUI: format | NON]
- Si doublon: [MISE À JOUR / ERREUR]

### Désignation
- Valeurs valides: [liste: Marchandises, Services, ...]
- Liste: [FERMÉE / OUVERTE]

### Banques autorisées
- [BanqueX]: règles spécifiques: [...]
- [BanqueY]: règles spécifiques: [...]

### Montants
- Min: [valeur ou NON]
- Max: [valeur ou NON]
- Séparateurs: [Mêmes règles que CA]

### Autres règles
[...]
```

---

## 🔴 AVANT PHASE 5 — STRUCTURE SHAREPOINT

```
Avant d'implémenter l'intégration SharePoint, j'ai besoin de connaître
la structure exacte de votre site SharePoint.

QUESTIONS SUR SHAREPOINT:

1. Le site SharePoint:
   - Quelle est l'URL de votre site SharePoint?
     (ex: https://monentreprise.sharepoint.com/sites/Finance)
   - Le site existe déjà ou doit-on le créer?

2. Les SharePoint Lists:
   - Comment s'appellent exactement les listes pour CA et Engagement?
   - Ces listes existent déjà? Si oui, quelles colonnes ont-elles déjà?
   - Si elles n'existent pas, doit-on les créer automatiquement?

3. Les Document Libraries:
   - Quelle librairie pour stocker les fichiers? ("Documents" par défaut?)
   - Quelle organisation de dossiers voulez-vous?
     (ex: /[Société]/[Année]/[Mois]/ ou /[Année]-[Mois]/[Société]/)

4. Données historiques:
   - Y a-t-il déjà des données dans SharePoint qu'il faudra lire pour 
     les comparer dans le rapport PPTX?
   - Si oui, dans quel format sont-elles?

5. Permissions:
   - Chaque société doit-elle voir SEULEMENT ses propres données SharePoint?
   - Ou les permissions sont gérées uniquement dans notre application?
```

---

## 🔴 AVANT PHASE 6 — FORMAT RAPPORT PPTX

```
Avant de créer le générateur de rapport PowerPoint, j'ai besoin de savoir
exactement quel rapport vous voulez.

QUESTIONS SUR LE RAPPORT PPTX:

1. Structure générale:
   - Quels slides voulez-vous? Dans quel ordre?
   - Exemple proposé:
     Slide 1: Titre + date + nom société
     Slide 2: Résumé exécutif (total CA, total engagements)
     Slide 3: Détail Chiffre d'Affaire (nouveau mois)
     Slide 4: Comparaison CA (mois en cours vs mois précédent)
     Slide 5: Détail Engagements (nouveau mois)
     Slide 6: Comparaison Engagements
   - C'est bien ça, ou vous voulez quelque chose de différent?

2. Style visuel:
   - Y a-t-il une charte graphique (couleurs, police) de l'entreprise?
   - Avez-vous un template PowerPoint existant à utiliser?

3. Données affichées:
   - Voulez-vous des graphiques ou juste des tableaux?
   - Quelle période de comparaison? (mois précédent? même mois année précédente?)
   - Voulez-vous les données détaillées ligne par ligne, ou seulement les totaux?

4. Un rapport par société ou un rapport global?
   - Un PPTX par société (chaque company télécharge le sien)?
   - Un PPTX global consolidé (visible pour admin seulement)?
   - Les deux?

5. Fréquence de génération:
   - Généré automatiquement après chaque upload?
   - Généré manuellement à la demande?
   - Généré une fois par mois (même si plusieurs uploads dans le mois)?
```

---

## 🟡 QUESTIONS GÉNÉRALES (À poser au début si possible)

```
QUESTIONS GÉNÉRALES SUR LE PROJET:

1. Combien de sociétés vont utiliser le système au lancement?
   (Ça aide à anticiper les volumes de données)

2. Quelle est la taille typique d'un fichier CSV? 
   (Quelques lignes? Des centaines? Des milliers?)

3. À quelle fréquence les sociétés uploadent-elles?
   (1 fois par mois? Plusieurs fois?)

4. Y a-t-il un calendrier? (Deadline mensuelle pour uploader?)

5. Que se passe-t-il si une société oublie d'uploader? Y a-t-il des relances?

6. En cas d'erreur dans le fichier:
   - L'utilisateur reçoit-il le fichier corrigé pour téléchargement?
   - Ou doit-il corriger lui-même et re-uploader?

7. Des données de test sont-elles disponibles?
   (Fichiers CSV réels anonymisés pour tester l'application)
```

---

## SUIVI DES RÉPONSES

| Question | Posée le | Répondue le | Statut |
|----------|----------|-------------|--------|
| Système de rôles | - | - | ⏳ En attente |
| Règles validation CA | - | - | ⏳ En attente |
| Règles validation Engagement | - | - | ⏳ En attente |
| Structure SharePoint | - | - | ⏳ En attente |
| Format rapport PPTX | - | - | ⏳ En attente |
| Questions générales | - | - | ⏳ En attente |
