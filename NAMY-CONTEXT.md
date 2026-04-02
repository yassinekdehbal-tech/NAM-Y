
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
| `admin.html` | Administration : Fiche entreprise (point d'entrée), calendrier NAMY, grilles, comptes internes | ✅ Branché |
| `dispatch.html` | Dispatch 3 vues : Timeline (axe temps) + Éditeur tournées (drag&drop) + Carte temps réel | ✅ Branché |
| `nav.js` | Navigation universelle partagée (topbar dynamique par rôle) | — |
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
positions_chauffeurs    → GPS temps réel chauffeurs (Realtime activé)

**Colonnes B2C ajoutées à expeditions** :
- `exp_lat` float, `exp_lng` float — coordonnées enlèvement
- `type_prestation` text — meuble/demenagement/marketplace/urgent
- `stripe_payment_intent_id` text — ID paiement Stripe
- `photos_urls` jsonb — photos de la commande B2C
- `source` text default 'namy' — namy | fissalivraison
creneaux_livraison      → Créneaux horaires par entreprise (heure_debut, heure_fin, limite)
fermetures_namy         → Fermetures globales plateforme (date, raison)
```

**Colonnes ajoutées à parametres_entreprise** :
- `fermetures_exceptionnelles` date[] — fermetures spécifiques entreprise
- `suspendu` boolean — suspension du compte
- `raison_suspension` text — motif de suspension
- `suspendu_le` timestamptz — date de suspension
- `suspendu_par` uuid — admin qui a suspendu
- `historique_suspensions` jsonb — journal suspension/réactivation

**Statuts expédition** : `en_attente` → `planifie` → `en_cours` → `livre` / `litige` / `annule`
**Statuts tournée** : `brouillon` → `publie` → `en_cours` → `termine` / `annule`
**Statuts stop** : `en_attente` → `collecte` → `en_route` → `livre` / `echec`

---

## 👥 Rôles utilisateurs

| Rôle | Ancien nom | Accès | Redirect après login |
|---|---|---|---|
| `admin` | admin | Tout — gestion comptes incluse | `dashboard.html` |
| `client` | dirigeant | Stats enseigne, expéditions, gestion vendeurs | `dashboard-client.html` |
| `fournisseur` | — (nouveau) | Stats transport, gestion livreurs, tournées | `dashboard-transporteur.html` |
| `dispatcher` | exploitant | Dispatch, tournées, carte chauffeurs | `dispatch.html` |
| `vendeur` | vendeur | Création expéditions (son magasin) | `formulaire-vendeur.html` |
| `livreur` | chauffeur | Tournées assignées, statuts, photos, signatures | `chauffeur.html` |

**Hiérarchie** : admin > client / fournisseur > dispatcher > vendeur / livreur

### Permissions (JSONB dans table `utilisateurs`)

```json
// admin
{ "dispatch": true, "tournees": true, "expeditions": true, "grilles": true,
  "entreprises": true, "utilisateurs": true, "statistiques": true, "extraction": true, "configuration": true }

// client (+ permissions vendeur granulaires)
{ "expeditions": true, "statistiques": true, "extraction": true }
// permissions vendeur (gérées par le client) :
// voir_prix, mode_devis, annuler_expedition, voir_historique

// dispatcher
{ "dispatch": true, "tournees": true, "expeditions": true, "statistiques": true, "extraction": true }

// vendeur
{ "expeditions": { "create": true, "read_own": true } }

// livreur (+ permissions livreur granulaires)
{ "tournees": { "read_assigned": true },
  "stops": { "update_status": true, "upload_photo": true, "upload_signature": true } }
// permissions livreur (gérées par le fournisseur) :
// voir_prix, voir_contact_client, signaler_litige, modifier_ordre_stops
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
| `create-entreprise` | Crée une entreprise (bypass RLS) + paramètres onboarding | ⬜ À déployer |

**Appel create-user** :
```javascript
const { data } = await db.functions.invoke('create-user', {
  body: { email, password, prenom, nom, role, entreprise_id }
});
```

**Appel create-entreprise** :
```javascript
const { data } = await db.functions.invoke('create-entreprise', {
  body: { nom, type, adresse, cp, ville, telephone, email }
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
- [x] Optimisation ordre stops (nearest neighbor + haversine)
- [x] Alertes proactives dashboard client (taux échec, récurrence, limite, devis)
- [x] Géolocalisation temps réel chauffeurs (GPS 30s + Supabase Realtime)
- [x] Suivi simplifié vendeur (onglet "Mes livraisons" + Realtime)
- [x] Mode hors-ligne app chauffeur (localStorage buffer + sync auto)
- [x] Onboarding guidé nouveaux clients (checklist 4 étapes)
- [x] Migrations SQL appliquées (schéma complet + RLS + storage + positions + onboarding)
- [x] Edge Function create-user déployée (6 rôles)
- [x] Arctic Design System (thème light) sur toutes les pages
- [x] Fichiers partagés : supabase-client.js, utils.js, arctic.css
- [x] Hiérarchie rôles complète (admin/dispatcher/client/vendeur/fournisseur/livreur)
- [x] Login : redirections par rôle (dispatcher → dispatch.html)
- [x] Dashboard client : onglets Tableau de bord / Expéditions / Mon équipe
- [x] Dashboard transporteur : onglets Tableau de bord / Aujourd'hui / À venir / Historique / Mon équipe
- [x] Gestion vendeurs par le client (création via Edge Function + toggle actif/suspendu + permissions)
- [x] Gestion livreurs par le fournisseur (création via Edge Function + toggle actif/suspendu + permissions)
- [x] Edge Function create-entreprise (bypass RLS, onboarding auto)
- [x] Données de test : 3 entreprises, 5 expéditions, 1 tournée, 5 comptes utilisateurs
- [x] Calendrier NAMY : vue mensuelle + gestion fermetures globales (admin.html)
- [x] Fiche entreprise enrichie : créneaux livraison, fermetures exceptionnelles, suspension/réactivation
- [x] Suspension cascade : blocage login pour comptes suspendus + sous-comptes
- [x] Dashboard client : onglet Paramètres (créneaux, limite, fermetures, historique suspensions)
- [x] Formulaire vendeur : validation dates (fermetures NAMY + magasin + jours ouvrés + limite jour)
- [x] Formulaire vendeur : créneaux dynamiques (chargés depuis creneaux_livraison, limites en temps réel)
- [x] Dashboard admin : KPI "Magasins proches limite" (≥80% limite journalière)
- [x] Migration SQL : tables creneaux_livraison, fermetures_namy + colonnes suspension
- [x] Refonte admin.html : entreprise = point d'entrée unique (fiche complète avec onglets)
- [x] Admin : fiche entreprise avec sections Infos / Comptes / Grille / Planning
- [x] Admin : comptes internes NAMY (admin + dispatcher uniquement)
- [x] Admin : onglet Grilles tarifaires (lien vers gestionnaire)
- [x] Login : tous rôles → index.html (sauf livreur → chauffeur.html)
- [x] index.html : filtrage expéditions par rôle (entreprise_id / livreurs)
- [x] index.html : nav dynamique masquée selon le rôle
- [x] nav.js : navigation universelle partagée sur 8 pages (liens dynamiques par rôle)
- [x] RLS entreprises corrigé (policies SELECT/INSERT/UPDATE/DELETE ajoutées)
- [x] Dispatch refonte 3 vues : Timeline (axe 6h-20h), Éditeur (drag&drop SortableJS), Carte temps réel
- [x] Timeline : blocs stops colorés (vert/bleu/orange/rouge/gris), ligne heure actuelle
- [x] Panneau latéral tournée (KPIs, ETA, stops, contact livreur)
- [x] Éditeur : colonne gauche tournées + non-assignées, droite détail avec drag&drop
- [x] Carte : filtres par tournée, positions livreurs Realtime
- [x] ETA calculé automatiquement (35 min/stop, haversine × 1.3)
- [x] Supabase Realtime sur tournees + tournee_stops

### Session 01/04/2026 soir
- [x] Refonte dispatch.html : 3 vues (Timeline axe 6h-20h, Éditeur drag&drop SortableJS, Carte Leaflet temps réel)
- [x] Dispatch Supabase Realtime sur tournees + tournee_stops + positions_chauffeurs
- [x] ETA haversine × 1.3 ÷ 30km/h, panneau latéral tournée, alertes retard
- [x] nav.js : topbar universelle sur 8 pages, liens dynamiques par rôle
- [x] nav.js : lien "+ Expédition" visible pour admin/dispatcher/client/vendeur, masqué fournisseur/livreur
- [x] nav.js : "Grilles" masqué pour client
- [x] Fix RLS entreprises : policies SELECT/INSERT/UPDATE/DELETE sur entreprises, chauffeurs, vehicules, tournees, utilisateurs
- [x] Fix bug jours livraison admin.html : double toggle label+checkbox → div avec data-jour
- [x] Autocomplétion adresse via api-adresse.data.gouv.fr (BAN) dans formulaire-vendeur.html (debounce 250ms, lat/lng)
- [x] admin.html : édition utilisateur (modal pré-rempli + UPDATE Supabase)
- [x] admin.html : édition entreprise (modal pré-rempli + UPDATE Supabase)
- [x] admin.html : grille tarifaire dans fiche entreprise (dropdown + upsert clients_grilles)
- [x] grilles-tarifaires.html : bouton supprimer grille avec protection si clients assignés
- [x] grilles-tarifaires.html : multi-sélection clients dans "Associer un client" (cases à cocher + upsert masse)
- [x] dashboard-client.html : fix header masqué (display:none supprimé)
- [x] dashboard-client.html : checklist onboarding vérifie dynamiquement les vraies tables
- [x] dashboard-client.html : création vendeur avec entreprise_id dynamique + messages d'erreur explicites
- [x] dashboard-client.html : fix colonnes date_livraison/dest_nom → date/destinataire

### Session 02/04/2026
- [x] Migration B2C : colonnes expeditions (exp_lat/lng, type_prestation, stripe_payment_intent_id, photos_urls, source)
- [x] RLS B2C : INSERT/SELECT anonyme pour source='fissalivraison'
- [x] Dispatch : section "Commandes B2C à valider" dans l'éditeur (accepter/refuser)
- [x] Dispatch : badge rouge B2C dans la barre de filtres
- [x] Dispatch : acceptB2C → statut en_attente + placeholder Stripe capture
- [x] Dispatch : refuseB2C → statut annulé + motif historique + placeholder Stripe cancel

### Bugs ouverts
- [ ] Client : double "Expéditions" dans topbar sur index.html (nav.js + nav locale)
- [ ] Client : nav admin affichée sur index.html au lieu de nav client
- [ ] Client : redirection forcée depuis index.html si rôle non admin/dispatcher
- [ ] Création vendeur depuis dashboard-client : entreprise_id parfois null (récupération dynamique ajoutée, à confirmer)

### À faire
- [ ] fissalivraison.fr : site B2C frontend (formulaire + paiement Stripe)
- [ ] Edge Functions Stripe : capture / cancel / webhook
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
- `20260401080000_positions_chauffeurs.sql` — Table positions_chauffeurs (GPS temps réel)
- `20260401090000_onboarding_checklist.sql` — Onboarding checklist
- `seed_test_data.sql` — Données de test (3 entreprises, 5 expéditions, 1 tournée)

Toutes les migrations sont **appliquées** sur le projet Supabase gwbvfohizdxwhmcoqvgh.

**Schéma réel vérifié** (colonnes diffèrent des migrations locales) :
- `entreprises` : id(UUID), nom, type, adresse, cp, ville, **telephone**, email, actif
- `vehicules` : id(UUID), immatriculation, type, libelle, actif, capacite_m3
- `tournees` : id(UUID), nom, **date_tournee**, **heure_depart**, chauffeur_id, vehicule_id, statut, couleur
- `expeditions` : id(SERIAL), entreprise_id, **exp_nom**, exp_adresse, exp_cp, exp_ville, **dest_nom**, dest_adresse, dest_cp, dest_ville, **dest_telephone**, dest_email, **date_livraison**, creneau, **option_livraison**, **poids_total**, nb_colis, description, prix_ht, prix_ttc, statut, tournee_id(UUID), lat, lng
- `grilles_tarifaires` : id(UUID), nom, type, **rayon_km**, **majoration_ferie**, actif
- `lignes_tarifaires_poids` : grille_id(UUID), poids_min, poids_max, **colis_max_kg**, **dim_max_cm**, **prix_pied**, **prix_lieu**, ordre

---

*Dernière mise à jour : 01 avril 2026 — session soir (refonte dispatch 3 vues + nav universelle)*
