
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
| `dashboard.html` | Dashboard 3 profils (exploitant/magasin/dirigeant) | ⚠️ Partiellement |
| `dispatch.html` | Carte Leaflet + création tournées | ❌ Données statiques |
| `formulaire-vendeur.html` | Saisie expédition vendeur (3 étapes) | ✅ Branché |
| `grilles-tarifaires.html` | 3 types de grilles (poids/zone/colis) | ⚠️ Partiellement |
| `chauffeur.html` | App mobile PWA chauffeur | ❌ Données statiques |
| `admin.html` | Gestion utilisateurs + permissions | ✅ Branché |
| `index.html` | Liste expéditions principale | ❌ Données statiques |

---

## 🗄️ Base de données — Tables principales

```
expeditions        → commandes de livraison (table centrale)
utilisateurs       → profils étendus liés à auth.users
entreprises        → magasins clients (Truffaut × 5 + FISSA LIV)
tournees           → groupes de stops par chauffeur/jour
stops              → étapes d'une tournée (liées à expeditions)
checkins_chauffeurs → suivi horaires + immatriculation quotidien
positions_chauffeurs → GPS temps réel chauffeurs
grilles_tarifaires → 3 types : poids / zone / colis
lignes_tarifaires_poids → tranches poids × prix pied/lieu
lignes_tarifaires_zone  → zones A-E × véhicules T1/T2/T3
lignes_tarifaires_colis → catégories (LITERIE...) × nb colis
frais_annexes      → suppléments par grille
options_livraison  → options proposées au vendeur
evenements_expedition → historique / tracking
vehicules          → parc véhicules
```

**Statuts expédition** : `en_attente` → `planifie` → `en_cours` → `livre` / `echec` / `litige` / `devis_attente`

---

## 👥 Rôles utilisateurs

| Rôle | Accès | Redirect après login |
|---|---|---|
| `admin` | Tout — gestion comptes incluse | `dashboard.html` |
| `dirigeant` | Dashboard + stats + exploitation | `dashboard.html` |
| `exploitant` | Exploitation + magasin | `dashboard.html` |
| `vendeur` | Formulaire saisie uniquement | `formulaire-vendeur.html` |
| `chauffeur` | App mobile uniquement | `chauffeur.html` |

**Hiérarchie** : admin > dirigeant > exploitant > vendeur / chauffeur

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

- [ ] **Brancher dispatch sur Supabase** — vraies tournées + expéditions
- [ ] **Brancher dashboard temps réel** — KPIs et alertes depuis Supabase
- [ ] **Brancher app chauffeur** — check-in réel + stops depuis tournees
- [ ] **Module expéditions** — liste + filtres + suivi
- [ ] **Géolocalisation chauffeur** — positions_chauffeurs temps réel
- [ ] **Import base de données existante** — historique livraisons ancien NAMY
- [ ] **Nom de domaine nam-y.com** — DNS GitHub Pages ou migration Vercel
- [ ] **SMS automatique client** — Twilio ou Vonage à l'approche livraison
- [ ] **Vidéos démo** — une par profil (exploitant, vendeur, chauffeur, dirigeant)
- [ ] **Refonte design** — charte couleurs plus intuitive et contrastée

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

*Dernière mise à jour : 30 mars 2026*
