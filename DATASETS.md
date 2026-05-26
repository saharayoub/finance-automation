# DATASETS.md
## Description Détaillée des Deux Datasets

---

## DATASET 1 — CHIFFRE D'AFFAIRE (CA)

### Objectif
Chaque société envoie un fichier CSV mensuel avec son chiffre d'affaires ventilé en ventes locales et ventes à l'export.

### Structure du fichier CSV

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| `Société` | Texte | ✅ Oui | Nom de la société |
| `Date` | Date | ✅ Oui | Date du relevé (format cible: YYYY-MM-DD) |
| `MontantCA` | Décimal | ✅ Oui | Chiffre d'affaires total |
| `LOCAL` | Décimal | ✅ Oui | Part des ventes locales (peut être 0) |
| `Export` | Décimal | ✅ Oui | Part des ventes à l'export (peut être 0) |

### Exemple de données réelles
```csv
Société,Date,MontantCA,LOCAL,Export
CompanyA,2024-01-15,150000.50,100000.50,50000
CompanyB,2024-01-15,80000,80000,0
CompanyA,2024-02-15,160000,100000,60000
CompanyC,2024-01-20,"120.000,50",120000.50,0
```

### Règle de validation principale
```
MontantCA = LOCAL + Export
```
- CompanyA: 150000.50 = 100000.50 + 50000 ✅
- CompanyB: 80000 = 80000 + 0 ✅
- CompanyC: Si "120.000,50" est normalisé en 120000.50 = 120000.50 + 0 ✅

### Cas légitimes
- ✅ Société avec **seulement LOCAL** (Export = 0): société qui vend uniquement en local
- ✅ Société avec **seulement Export** (LOCAL = 0): société qui exporte tout
- ✅ Société avec **LOCAL + Export** (les deux > 0): cas mixte

### ⚠️ PROBLÈME MAJEUR: Séparateurs Décimaux Incohérents

C'est le problème le plus fréquent dans ce dataset. Les sociétés utilisent des formats différents:

| Format reçu | Signification réelle | À normaliser vers |
|-------------|---------------------|-------------------|
| `150000.50` | 150 000,50 | `150000.50` ✅ déjà bon |
| `120.000,50` | 120 000,50 | `120000.50` à corriger |
| `120000` | 120 000 | `120000.00` à corriger |
| `1,500,000.50` | 1 500 000,50 | `1500000.50` à corriger |
| `1.500.000,50` | 1 500 000,50 | `1500000.50` à corriger |

**Logique de détection:**
```
Si le nombre contient une virgule ET un point:
    Si virgule AVANT point → format européen: "1.500,50" → 1500.50
    Si point AVANT virgule → format américain avec virgule comme séparateur des milliers: "1,500.50" → 1500.50
Si le nombre contient SEULEMENT une virgule:
    La virgule est probablement un séparateur décimal: "120,50" → 120.50
Si le nombre contient SEULEMENT des points:
    Ambiguïté: "120.000" est-ce 120 ou 120000? → L'IA doit analyser le contexte
```

> ⚠️ Les règles exactes de détection seront confirmées avec l'utilisateur.

### Autres validations (à confirmer avec l'utilisateur)
- **Dates**: Format valide? Dates futures acceptées? Limite dans le passé?
- **Valeurs nulles**: Que faire si LOCAL ou Export est vide (null) vs 0?
- **Tolérance formule**: 150000.50 ≈ 100000.50 + 50000? (arrondi acceptable?)
- **Doublons**: Même Société + même Date = doublon? Que faire?
- **Société inconnue**: Si le nom de société ne correspond à aucun compte, que faire?

---

## DATASET 2 — ENGAGEMENT

### Objectif
Chaque société envoie un fichier CSV avec ses engagements financiers (transactions, commandes, contrats) par banque.

### Structure du fichier CSV

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| `Title` | Texte | ✅ Oui | Identifiant unique de l'engagement |
| `DateEnga` | Date | ✅ Oui | Date de l'engagement (format cible: YYYY-MM-DD) |
| `Designation` | Texte | ✅ Oui | Type d'engagement (Marchandises, Services, etc.) |
| `Libelle` | Texte | ✅ Oui | Description libre de l'engagement |
| `BanqueEnga` | Texte | ✅ Oui | Nom de la banque concernée |
| `MontantEngagement` | Décimal | ✅ Oui | Montant de l'engagement |

### Exemple de données réelles
```csv
Title,DateEnga,Designation,Libelle,BanqueEnga,MontantEngagement
Engagement001,2024-01-10,Marchandises,Achat Stock,BanqueX,50000
Engagement002,2024-01-12,Services,Consulting,BanqueY,25000
Engagement003,2024-01-15,Marchandises,Achat Matière,BanqueX,75000
Engagement004,2024-01-20,Services,Formation,BanqueY,15000
Engagement005,2024-01-22,Marchandises,Achat Équipement,BanqueZ,120000
```

### ⚠️ CARACTÉRISTIQUE IMPORTANTE: Multi-Banques

Une même société peut travailler avec **plusieurs banques**. Chaque engagement est lié à UNE banque, mais la société peut avoir des engagements avec BanqueX, BanqueY, BanqueZ en même temps.

```
CompanyA
├── Engagements avec BanqueX: Engagement001, Engagement003
├── Engagements avec BanqueY: Engagement002, Engagement004
└── Engagements avec BanqueZ: Engagement005
```

**Conséquence pour la validation**: Les règles de validation peuvent être **différentes par banque**. Par exemple:
- BanqueX accepte des engagements de 0 à 200 000€
- BanqueY exige un Libelle d'au moins 10 caractères
- Les règles exactes seront définies par l'utilisateur

### Validations de base (avant règles spécifiques)
- **Title unique**: Deux engagements ne peuvent pas avoir le même Title
- **Date valide**: Format correct, pas de date dans le futur (à confirmer)
- **Montant positif**: MontantEngagement > 0
- **Désignation**: Valeur dans une liste prédéfinie? (à confirmer)

### Validations spécifiques (à définir avec l'utilisateur)
- Règles par `Designation` (Marchandises vs Services)
- Règles par `BanqueEnga`
- Règles par société (chaque company a ses propres règles?)
- Montants minimum/maximum par type
- Doublons: même Title = erreur? Ou mise à jour?

---

## COMPARAISON DES DEUX DATASETS

| Aspect | CA (Chiffre d'Affaire) | Engagement |
|--------|----------------------|------------|
| **Fréquence** | Mensuel | Mensuel |
| **Complexité** | Moyenne (formule à valider) | Élevée (règles multi-banques) |
| **Problème principal** | Séparateurs décimaux | Règles spécifiques par banque |
| **Validation clé** | LOCAL + Export = MontantCA | Title unique + règles banque |
| **Multi-entité** | Non (1 ligne = 1 société) | Oui (multi-banques) |

---

## PROCESSUS DE VALIDATION IA (LES DEUX DATASETS)

### Étape 1 — Validation basique (Python, sans IA)
```
1. Vérifier que le fichier est bien un CSV
2. Vérifier que toutes les colonnes obligatoires sont présentes
3. Vérifier les types de base (texte, date, nombre)
4. Normaliser les séparateurs décimaux (CA)
```

### Étape 2 — Validation avancée (DeepSeek)
```
1. Vérifier les formules (CA: LOCAL + Export = MontantCA)
2. Vérifier la cohérence des données
3. Appliquer les règles métier spécifiques
4. Générer rapport avec: erreurs, corrections, avertissements
```

### Résultat de validation
```json
{
  "status": "validated_with_corrections",
  "total_rows": 10,
  "valid_rows": 8,
  "corrected_rows": 1,
  "error_rows": 1,
  "details": [
    {
      "row": 4,
      "type": "correction",
      "field": "MontantCA",
      "original": "120.000,50",
      "corrected": 120000.50,
      "reason": "Séparateur décimal européen normalisé"
    },
    {
      "row": 7,
      "type": "error",
      "field": "MontantCA",
      "value": 150000,
      "reason": "LOCAL (100000) + Export (45000) = 145000 ≠ 150000. Écart de 5000."
    }
  ]
}
```

---

## NOTES IMPORTANTES POUR L'IMPLÉMENTATION

1. **Parser flexible**: Le parser doit gérer les variantes courantes (`;` au lieu de `,` comme séparateur CSV, encodage UTF-8 et Latin-1)

2. **Isolation par société**: Lors de l'upload, le backend vérifie que la société dans le CSV correspond bien à la société de l'utilisateur connecté

3. **Idempotence**: Si la même ligne est uploadée deux fois, le système doit détecter le doublon et ne pas insérer deux fois

4. **Traçabilité**: Chaque ligne insérée dans SharePoint doit avoir des métadonnées: qui a uploadé, quand, ID du fichier source

5. **Règles à confirmer**: Toutes les règles marquées "à confirmer" doivent être validées avec l'utilisateur **AVANT** de commencer le codage de la validation IA
