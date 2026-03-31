
# NAMY — Fichier de contexte projet
> À lire au démarrage de chaque session Claude / Claude Code

---

## 🏢 Contexte métier

**Entreprise** : FISSA LIV  
**Activité** : Commissionnaire de transport · Last-mile delivery  
**Client principal** : Truffaut (99% du volume) — livraisons à domicile depuis les magasins  
**Flux** : FISSA LIV → Magasins Truffaut → Clients finaux (particuliers)  
**Dirigeant** : Yassine Dehbal  
**Exploitant principal** : Nizar Khalil  

---

## 🛠️ Stack technique

| Élément | Valeur |
|---|---|
| Frontend | HTML / CSS / JS vanilla (pas de framework) |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Hébergement | GitHub Pages |
| Repo GitHub | `github.com/yassinekdehbal-tech/NAM-Y` |
| URL live | `https://yassinekdehbal-tech.github.io/NAM-Y` |
| Domaine cible | `nam-y.com` (à configurer) |

---

## 🔑 Credentials Supabase

| Clé | Valeur |
|---|---|
| Project URL | `https://gwbvfohizdxwhmcoqvgh.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YnZmb2hpemR4d2htY29xdmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ2MDksImV4cCI6MjA5MDQ0MDYwOX0.gOt8J2k7OV5W4SPtKrEV1sL6-C9eLE2hG3DuMzuaMKg` |
| Project Ref | `gwbvfohizdxwhmcoqvgh` |
| Region | Central EU (Frankfurt) |

---

## 📁 Fichiers du projet

| Fichier | Description | Statut Supabase |
|---|---|---|
| `login.html` | Authentification — redirige selon rôle | ✅ Branché |
| `dashboard.html` | Dashboard 3 profils (dispatcher/magasin/client) | ✅ Branché |
| `dispatch.html` | Carte Leaflet + création tournées | ✅ Branché |
| `formulaire-vendeur.html` | Saisie expédition vendeur (3 étapes) | ✅ Branché |
| `grilles-tarifaires.html` | 3 types de grilles (poids/zone/colis) | ✅ Branché |
| `chauffeur.html` | App mobile PWA livreur | ✅ Branché |
| `supabase-client.js` | Init Supabase centralisée (source unique) | — |
| `utils.js` | Fonctions partagées (showToast, openModal, formatDate) | — |
| `data.js` | Chargement données Supabase + fallback local | — |
| `app.js` | Logique métier index.html | — |
| `styles.css` | Styles globaux index.html | — |
| `index.html` | Liste expéditions principale | ✅ Branché |

---

## 🗄️ Base de données — Tables principales

```
entreprises             → Magasins, plateforme, fournisseurs (type enum)
utilisateurs            → Profils liés à auth.users (rôle + permissions JSONB)
parametres_entreprise   → Config par entreprise (jours ouvrés, rayon max, fermetures)
vehicules               → Parc véhicules
chauffeurs              → Livreurs (liés à un utilisateur)
expeditions             → Commandes de livraison (table centrale)
tournees                → Regroupement livraisons par livreur/jour
tournee_stops           → Étapes d'une tournée (statut, signature, photo)
checkins                → Pointages livreurs (début/fin journée)
historique_expeditions  → Journal événements par expédition
grilles_tarifaires      → 3 types : poids / zone / colis
lignes_tarifaires_poids → Tranches poids × prix pied/lieu
lignes_tarifaires_zone  → Zones A-E × véhicules T1/T2/T3
lignes_tarifaires_colis → Catégories (LITERIE...) × nb colis
frais_annexes           → Suppléments par grille
options_livraison       → Options proposées au vendeur
clients_grilles         → Assignation grille ↔ entreprise + mode devis
```

**Statuts expédition** : `en_attente` → `planifie` → `en_cours` → `livre` / `litige` / `annule`
**Statuts tournée** : `brouillon` → `publie` → `en_cours` → `termine` / `annule`
**Statuts stop** : `en_attente` → `collecte` → `en_route` → `livre` / `echec`

---

## 👥 Rôles utilisateurs

| Rôle | Ancien nom | Accès | Redirect après login |
|---|---|---|---|
| `admin` | admin | Tout — gestion comptes incluse | `dashboard.html` |
| `client` | dirigeant | Expéditions, stats, extraction | `dashboard.html` |
| `dispatcher` | exploitant | Dispatch, tournées, expéditions, stats | `dashboard.html` |
| `vendeur` | vendeur | Création expéditions (son magasin) | `formulaire-vendeur.html` |
| `livreur` | chauffeur | Tournées assignées, statuts, photos, signatures | `chauffeur.html` |

**Hiérarchie** : admin > client > dispatcher > vendeur / livreur

### Permissions (JSONB dans table `utilisateurs`)

```json
// admin
{ "dispatch": true, "tournees": true, "expeditions": true, "grilles": true,
  "entreprises": true, "utilisateurs": true, "statistiques": true, "extraction": true, "configuration": true }

// client
{ "expeditions": true, "statistiques": true, "extraction": true }

// dispatcher
{ "dispatch": true, "tournees": true, "expeditions": true, "statistiques": true, "extraction": true }

// vendeur
{ "expeditions": { "create": true, "read_own": true } }

// livreur
{ "tournees": { "read_assigned": true },
  "stops": { "update_status": true, "upload_photo": true, "upload_signature": true } }
```

---

## 🏪 Entreprises Supabase (données de base)

| Nom | Ville |
|---|---|
| FISSA LIV | Drancy (93) |
| TRUFFAUT LE CHESNAY | Le Chesnay (78) |
| TRUFFAUT PLAISIR | Plaisir (78) |
| TRUFFAUT DOMUS | Rosny-sous-Bois (93) |
| TRUFFAUT PARIS RIVE GAUCHE | Paris 13ème (75) |
| TRUFFAUT FOURQUEUX | Saint-Germain-en-Laye (78) |

---

## ⚡ Edge Functions déployées

| Fonction | Description | Statut |
|---|---|---|
| `create-user` | Crée un compte Auth + profil utilisateurs | ✅ Déployée |

**Appel** :
```javascript
const { data } = await db.functions.invoke('create-user', {
  body: { email, password, prenom, nom, role, entreprise_id }
});
```

---

## 🚗 Grilles tarifaires configurées

**1. TRUFFAUT STANDARD (poids)**
- 7 tranches : 0→5kg jusqu'à 800→1200kg
- 2 options : Pied de camion / Lieu du choix
- Rayon inclus : 30km · Majoration fériés : +20%

**2. EXPRESS ZONE (zone × véhicule)**
- Zones A (<15km) → D (<45km) : prix fixes
- Zone E (>45km) : au km A+R
- Véhicules : Break T1 3m³ / Fourgon T2 12m³ / Hayon T3 20m³
- Majoration fériés : +30%

**3. COLIS LITERIE (nb colis × catégorie)**
- Par catégorie de produit (LITERIE...)
- Seuil devis automatique configurable
- Tarification distance au km en supplément

---

## 📱 App chauffeur — Fonctionnalités

- **Check-in quotidien** : plaque immatriculation + heure début/fin + véhicule
- **Tournée** : liste stops ordonnés avec ETA
- **Par stop** : infos marchandise, option livraison, appel client, GPS, photo, signature canvas
- **Statuts** : collecté → livré / échec (avec raison)
- **Planning** : tournées à venir
- **PWA** : compatible iOS + Android

---

## 🔐 Sécurité — RLS activé

- Vendeur : voit uniquement les expéditions de son entreprise
- Chauffeur : voit uniquement ses tournées et stops
- Exploitant/Dirigeant : voient tout
- Admin : accès total

---

## 📋 Prochaines étapes (par priorité)

- [x] **Brancher dispatch sur Supabase** — tournées + expéditions persistées
- [x] **Brancher app chauffeur** — check-in, statuts, photos, signatures
- [x] **Grilles tarifaires CRUD** — poids/zone/colis + assignation clients
- [x] **Fichiers partagés** — supabase-client.js, utils.js (supprimé 8 doublons)
- [x] **Nouveaux rôles** — client, dispatcher, livreur + permissions JSONB
- [x] **Migrations SQL** — 4 fichiers dans supabase/migrations/
- [ ] **Appliquer les migrations** — `supabase db push` sur le projet
- [ ] **Redéployer Edge Function** — create-user avec les nouveaux rôles
- [ ] **Dashboard temps réel** — KPIs et alertes depuis Supabase
- [ ] **Géolocalisation livreur** — GPS temps réel
- [ ] **SMS automatique client** — Twilio ou Vonage
- [ ] **Import historique** — ancien NAMY vers Supabase
- [ ] **Nom de domaine** — nam-y.com

---

## 💡 Conventions de code

- **Pas de framework** — HTML/CSS/JS vanilla uniquement
- **Supabase client** : toujours chargé via CDN `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- **Fallback** : si Supabase inaccessible, afficher données statiques (ne jamais bloquer l'UI)
- **Styles** : CSS variables dans `:root`, dark theme par défaut (`--bg: #0d0f14`)
- **Fonts** : Syne (titres) + DM Sans (corps) + DM Mono (chiffres/codes)
- **Session** : toujours vérifier `db.auth.getSession()` au chargement des pages protégées
- **Redirect** : si pas de session → `window.location.href = 'login.html'`

---

## 🗣️ Pour démarrer une session Claude

Copie-colle ce bloc en début de conversation :

```
Je travaille sur NAMY, un TMS (Transport Management System) pour FISSA LIV.
Stack : HTML/CSS/JS + Supabase + GitHub Pages
Repo : github.com/yassinekdehbal-tech/NAM-Y
Supabase : gwbvfohizdxwhmcoqvgh.supabase.co
Contexte complet : voir NAMY-CONTEXT.md dans le repo
```

---

## 📦 Migrations SQL

Les fichiers sont dans `supabase/migrations/` :
1. `001_schema_base.sql` — Types enum, entreprises (type), utilisateurs (permissions JSONB), parametres_entreprise
2. `002_tables_operations.sql` — Véhicules, chauffeurs, expéditions, tournées, stops, checkins, historique
3. `003_tables_grilles_tarifaires.sql` — Grilles, lignes poids/zone/colis, frais, options, clients_grilles
4. `004_rls_policies.sql` — RLS + fonctions helper + storage buckets (delivery-photos, signatures)

Pour appliquer : `supabase db push` ou copier le SQL dans l'éditeur SQL du dashboard Supabase.

---

*Dernière mise à jour : 31 mars 2026*
