
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
| `dashboard.html` | Dashboard Admin NAMY (8 KPIs + 5 graphiques Chart.js) | ✅ Branché |
| `dashboard-client.html` | Dashboard Client/Enseigne (7 KPIs + 5 graphiques, filtré RLS) | ✅ Branché |
| `dashboard-transporteur.html` | Dashboard Transporteur (8 KPIs + 6 graphiques + avis, filtré RLS) | ✅ Branché |
| `admin.html` | Gestion comptes + entreprises + paramètres contractuels | ✅ Branché |
| `dispatch.html` | Dispatch : carte Leaflet + tournées + assignation + nav dates | ✅ Branché |
| `formulaire-vendeur.html` | Saisie expédition vendeur (3 étapes) | ✅ Branché |
| `grilles-tarifaires.html` | 3 types de grilles (poids/zone/colis) | ✅ Branché |
| `chauffeur.html` | App mobile PWA livreur | ✅ Branché |
| `supabase-client.js` | Init Supabase centralisée (source unique) | — |
| `utils.js` | Fonctions partagées (showToast, openModal, formatDate) | — |
| `data.js` | Chargement données Supabase + fallback local | — |
| `app.js` | Logique métier index.html | — |
| `styles.css` | Styles globaux index.html | — |
| `index.html` | Liste expéditions paginée + filtres + export CSV | ✅ Branché |

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
| `client` | dirigeant | Stats enseigne, expéditions, extraction | `dashboard-client.html` |
| `fournisseur` | — (nouveau) | Stats transport, chauffeurs, performance | `dashboard-transporteur.html` |
| `dispatcher` | exploitant | Dispatch, tournées, expéditions, stats | `dashboard.html` |
| `vendeur` | vendeur | Création expéditions (son magasin) | `formulaire-vendeur.html` |
| `livreur` | chauffeur | Tournées assignées, statuts, photos, signatures | `chauffeur.html` |

**Hiérarchie** : admin > client / fournisseur > dispatcher > vendeur / livreur

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
- Livreur : voit uniquement ses tournées et stops
- Client/Fournisseur : voient les données de leur entreprise
- Admin/Dispatcher : voient tout

---

## 📋 Avancement

### Terminé
- [x] Dispatch Supabase complet (tournées, assignation, publication, auto-dispatch IA)
- [x] App chauffeur Supabase (check-in, statuts, photos, signatures, GPS)
- [x] Grilles tarifaires CRUD (poids/zone/colis + options calculées + assignation clients)
- [x] Module admin (comptes, entreprises, paramètres contractuels, permissions)
- [x] 3 dashboards Chart.js (admin, client, transporteur) avec filtres période
- [x] Liste expéditions paginée + filtres + export CSV + changement statut
- [x] Formulaire vendeur : auto-complétion destinataires + prix temps réel
- [x] Dispatch : vue urgences "À assigner" + assignation en masse
- [x] Migrations SQL appliquées (schéma complet + RLS + storage)
- [x] Edge Function create-user déployée (6 rôles)
- [x] Arctic Design System (thème light) sur toutes les pages
- [x] Fichiers partagés : supabase-client.js, utils.js, arctic.css

### À faire
- [ ] Géolocalisation livreur temps réel
- [ ] SMS automatique client (Twilio/Vonage)
- [ ] Import historique ancien NAMY
- [ ] Nom de domaine nam-y.com
- [ ] PWA manifest + service worker chauffeur
- [ ] Notifications push (tournée publiée → livreur)
- [ ] Module facturation (devis → facture)

---

## 💡 Conventions de code

- **Pas de framework** — HTML/CSS/JS vanilla uniquement
- **Supabase client** : toujours chargé via CDN `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- **Fallback** : si Supabase inaccessible, afficher données statiques (ne jamais bloquer l'UI)
- **Styles** : Arctic Design System (arctic.css) — thème light, accent #00C9A7
- **Fonts** : DM Sans (corps) + DM Mono (chiffres/codes)
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
- `20260331120000_schema_complet.sql` — Tables, colonnes, RLS, storage buckets
- `20260331140000_options_livraison_calcul.sql` — Colonnes calcul options
- `20260331160000_utilisateurs_statut.sql` — Colonne statut utilisateurs
- `20260331170000_parametres_contractuels.sql` — Paramètres contractuels entreprise

Toutes les migrations sont **appliquées** sur le projet Supabase gwbvfohizdxwhmcoqvgh.

---

*Dernière mise à jour : 31 mars 2026 — session nuit*
