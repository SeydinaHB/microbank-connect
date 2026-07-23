# MicroBank Connect

Plateforme de gestion bancaire et de microfinance — projet de fin de module Développement Frontend Angular v20 (MIAGE 1, ISI Keur Massar).

## Stack technique

- **Frontend** : Angular v20 (composants standalone, signals, routing avec lazy loading et guards)
- **Style** : Tailwind CSS v4
- **Données** : json-server (API REST fictive) avec données mockées réalistes
- **Formulaires** : ReactiveFormsModule avec validateurs personnalisés (ex : plafond de retrait)

## Prérequis

- Node.js v22+
- Angular CLI v20 (`npm install -g @angular/cli@20`)

## Installation

```bash
git clone https://github.com/SeydinaHB/microbank-connect.git
cd microbank-connect
npm install
```

## Lancement en local

Le projet nécessite **2 processus en parallèle**, dans 2 terminaux séparés :

**Terminal 1 — API fictive (json-server)**
```bash
npm run api
```
Démarre sur `http://localhost:3001`

**Terminal 2 — Application Angular**
```bash
ng serve
```
Démarre sur `http://localhost:4200`

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Gestionnaire | awa.diop@microbank.sn | password123 |
| Agent | moussa.ndiaye@microbank.sn | password123 |
| Client | fatou.fall@client.sn | password123 |

## Architecture du projet
src/app/
├── core/ # Services globaux, guards, intercepteur, modèles TypeScript
│ ├── guards/ # authGuard, roleGuard
│ ├── interceptors/ # Ajout automatique du token + gestion centralisée des erreurs
│ ├── services/ # Un service par entité (Client, Compte, Transaction, Credit, Auth, Notification)
│ └── models/ # Interfaces TypeScript
├── features/ # Un dossier par module fonctionnel, chargé en lazy loading
│ ├── auth/
│ ├── dashboard/
│ ├── clients/
│ ├── comptes/
│ ├── operations/
│ ├── credits/
│ └── rapports/
├── shared/ # Composants réutilisables (ex: notification-bell)
└── layout/ # Layout général (sidebar + navbar responsive)
## Rôles et permissions

| Module | Client | Agent | Gestionnaire |
|---|---|---|---|
| Consultation de ses comptes/crédits | ✅ | ✅ (tous) | ✅ (tous) |
| Gestion des clients | ❌ | ✅ | ✅ |
| Opérations bancaires (dépôt/retrait/virement) | ❌ | ✅ | ✅ |
| Demande de crédit | ❌ | ✅ | ✅ |
| Approbation/refus de crédit | ❌ | ✅ | ✅ |
| Rapports | ❌ | ❌ | ✅ |

## Fonctionnalités principales

- Authentification avec gestion de rôles (signals, guards, intercepteur HTTP)
- Gestion des clients (CRUD, recherche, fiche détaillée)
- Comptes bancaires (ouverture, consultation, historique des transactions)
- Opérations bancaires avec validateur personnalisé de plafond de retrait
- Crédits : simulation avec calcul de mensualité en temps réel, demande, échéancier, workflow d'approbation
- Notifications in-app (solde bas, échéances de crédit proches/dépassées)
- Rapports agrégés pour le Gestionnaire
- Interface responsive (sidebar en tiroir sur mobile)

## Note technique

Voir `NOTE_TECHNIQUE.docx` pour le détail des choix d'architecture, difficultés rencontrées et pistes d'amélioration.

## Auteur

Mohamed NDIAYE — MIAGE 1, ISI Keur Massar