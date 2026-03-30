// ─── SUPABASE INIT ──────────────────────────────────────────
const SUPA_URL = 'https://gwbvfohizdxwhmcoqvgh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YnZmb2hpemR4d2htY29xdmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ2MDksImV4cCI6MjA5MDQ0MDYwOX0.gOt8J2k7OV5W4SPtKrEV1sL6-C9eLE2hG3DuMzuaMKg';
const { createClient } = supabase;
const db = createClient(SUPA_URL, SUPA_KEY);

// ─── DONNÉES (chargées depuis Supabase) ─────────────────────
let CHAUFFEURS = [];
let ENTREPRISES = [];
let GRILLES_TARIFAIRES = [];
let TOURNEES = [];
let EXPEDITIONS = [];
let VEHICULES = [];
let PLANNING_DATES = [];
let PLANNING_DISPO = {};
let STATS_MAGASINS = [];
let STATS_CHAUFFEURS = [];

// ─── FALLBACK (données locales si Supabase échoue) ──────────
const FALLBACK_CHAUFFEURS = [
  { id: 4,  prenom: 'LIVRAISONS EN ATTENTE', nom: '.', actif: true },
  { id: 6,  prenom: 'Amine',   nom: 'EXCEL LIV',       actif: true },
  { id: 7,  prenom: 'Said',    nom: '.',                actif: false },
  { id: 8,  prenom: 'Goré',    nom: 'GREENCHARGEUR',   actif: true },
  { id: 9,  prenom: 'Bilaly',  nom: 'Doucoure',        actif: false },
  { id: 11, prenom: 'Salif',   nom: 'CEESAY',          actif: true },
  { id: 12, prenom: 'Dama',    nom: 'TRAORE',          actif: true },
  { id: 13, prenom: 'Rachid',  nom: 'SANOU',           actif: true },
  { id: 14, prenom: 'Tarek',   nom: 'MAKNI',           actif: true },
  { id: 15, prenom: 'Mohamed', nom: 'KLILA',           actif: true },
  { id: 16, prenom: 'Yassine', nom: 'DEHBAL',          actif: true },
  { id: 17, prenom: 'Farouk',  nom: 'FASTTRACK',       actif: true },
  { id: 18, prenom: 'COURSE ANNULATION', nom: '',      actif: true },
];

const FALLBACK_ENTREPRISES = [
  { id: 2,  nom: 'TRUFFAUT LE CHESNAY',       adresse: 'Centre commercial Parly 2', cp: '78150', ville: 'Le Chesnay',         lat: 48.838, lng: 2.105 },
  { id: 4,  nom: 'FISSA LIV',                 adresse: '125 rue diderot',           cp: '93700', ville: 'Drancy',             lat: 48.921, lng: 2.435 },
  { id: 6,  nom: 'TRUFFAUT PLAISIR',          adresse: 'Avenue de Sainte-Apolline', cp: '78370', ville: 'Plaisir',            lat: 48.819, lng: 1.957 },
  { id: 8,  nom: 'TRUFFAUT DOMUS',            adresse: '16 Rue de Lisbonne',        cp: '93110', ville: 'Rosny-sous-Bois',    lat: 48.874, lng: 2.488 },
  { id: 9,  nom: 'TRUFFAUT PARIS RIVE GAUCHE',adresse: '85 Quai de la Gare',        cp: '75013', ville: 'Paris',              lat: 48.832, lng: 2.372 },
  { id: 10, nom: 'TRUFFAUT FOURQUEUX',        adresse: 'Zone d\'activité du Pincé Loup', cp: '78112', ville: 'Saint-Germain-en-Laye', lat: 48.898, lng: 2.082 },
];

const FALLBACK_VEHICULES = [
  { id: 1, nom: 'Fourgon 12m³', plaque: 'AB456CD' },
  { id: 2, nom: 'Grand fourgon 20m³', plaque: 'ES105XL' },
  { id: 3, nom: 'Camion 30m³', plaque: 'GH789IJ' },
];

const FALLBACK_GRILLES_TARIFAIRES = [
  { id: 1, poids_dep: 0, poids_fin: 150, colis_unique: 30,  dim_max: 140, lieu: 'Pièce du choix', prix: 25 },
  { id: 2, poids_dep: 0, poids_fin: 150, colis_unique: 131, dim_max: 240, lieu: 'Pièce du choix', prix: 50 },
  { id: 3, poids_dep: 0, poids_fin: 350, colis_unique: 131, dim_max: 320, lieu: 'Pièce du choix', prix: 86 },
  { id: 4, poids_dep: 0, poids_fin: 1200, colis_unique: 131, dim_max: 400, lieu: 'Pièce du choix', prix: 160 },
  { id: 5, poids_dep: 0, poids_fin: 2,   colis_unique: 2,   dim_max: 2,   lieu: 'Pièce du choix', prix: 11.58 },
];

const FALLBACK_TOURNEES = [
  { id: 104, nom: 'TAREK',      couleur: '#076460', date: '2026-03-29', heure: '08:00', chauffeur: 'TAREK MAKNI',        statut: 'Planifiée', nb_courses: 10 },
  { id: 123, nom: 'GORE 29/03', couleur: '#dc2626', date: '2026-03-29', heure: '08:00', chauffeur: 'Goré GREENCHARGEUR', statut: 'Planifiée', nb_courses: 7, vehicule: 'ES105XL' },
];

const FALLBACK_EXPEDITIONS = [
  {
    id: 12125, tournee: null, expediteur: 'TRUFFAUT PLAISIR', expediteur_adresse: 'Avenue de Sainte-Apolline', expediteur_cp: '78370', expediteur_ville: 'Plaisir',
    destinataire: 'Pochet Caroline', dest_adresse: '33 Rue Louis Siou', dest_cp: '78890', dest_ville: 'Garancières', dest_tel: '0786979772', dest_email: 'pochet.c@orange.fr',
    date: '2026-04-20', creneau: '15:00-18:00', poids: 250, poids_lourd: 40, taille: 180, nb_colis: 34, lieu: 'Pièce du choix',
    description: 'plantes et 4 sacs tereaux', prix_ht: 103.20/1.2, prix_ttc: 103.20, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12124, tournee: null, expediteur: 'TRUFFAUT CHATENAY', expediteur_adresse: 'Route de Paris', expediteur_cp: '92290', expediteur_ville: 'Châtenay-Malabry',
    destinataire: 'MAGRANS', dest_adresse: '12 Rue des Fleurs', dest_cp: '91440', dest_ville: 'Bures-sur-Yvette', dest_tel: '0612345678', dest_email: 'magrans@mail.fr',
    date: '2026-04-11', creneau: '10:00-13:00', poids: 70, poids_lourd: 40, taille: 220, nb_colis: 5, lieu: 'Pièce du choix',
    description: 'mobilier jardin', prix_ht: 60/1.2, prix_ttc: 60, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12158, tournee: null, expediteur: 'TRUFFAUT LE CHESNAY', expediteur_adresse: 'Centre commercial Parly 2', expediteur_cp: '78150', expediteur_ville: 'Le Chesnay',
    destinataire: 'REEB Frederique', dest_adresse: '5 Allée des Roses', dest_cp: '78160', dest_ville: 'Marly-le-Roi', dest_tel: '0698765432', dest_email: 'reeb.f@gmail.com',
    date: '2026-04-11', creneau: '09:00-13:00', poids: 200, poids_lourd: 90, taille: 310, nb_colis: 12, lieu: 'Pièce du choix',
    description: 'canapé + table basse', prix_ht: 169.20/1.2, prix_ttc: 169.20, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12094, tournee: null, expediteur: 'TRUFFAUT PLAISIR', expediteur_adresse: 'Avenue de Sainte-Apolline', expediteur_cp: '78370', expediteur_ville: 'Plaisir',
    destinataire: 'Brigant', dest_adresse: '14 Rue du Moulin', dest_cp: '78960', dest_ville: 'Voisins-le-Bretonneux', dest_tel: '0677889900', dest_email: 'brigant@wanadoo.fr',
    date: '2026-04-07', creneau: '09:00-13:00', poids: 30, poids_lourd: 10, taille: 120, nb_colis: 3, lieu: 'Pièce du choix',
    description: 'bacs à fleurs', prix_ht: 60/1.2, prix_ttc: 60, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12035, tournee: null, expediteur: 'TRUFFAUT PARIS RIVE GAUCHE', expediteur_adresse: '85 Quai de la Gare', expediteur_cp: '75013', expediteur_ville: 'Paris',
    destinataire: 'M. VIALAY François', dest_adresse: '8 Impasse des Lilas', dest_cp: '94120', dest_ville: 'Fontenay-sous-Bois', dest_tel: '0655443322', dest_email: 'vialay.f@free.fr',
    date: '2026-04-04', creneau: '13:00-17:00', poids: 139, poids_lourd: 70, taille: 220, nb_colis: 8, lieu: 'Pièce du choix',
    description: 'étagères bois', prix_ht: 60/1.2, prix_ttc: 60, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12074, tournee: null, expediteur: 'TRUFFAUT PARIS RIVE GAUCHE', expediteur_adresse: '85 Quai de la Gare', expediteur_cp: '75013', expediteur_ville: 'Paris',
    destinataire: 'Houist Anne-Laure', dest_adresse: '22 Rue Volta', dest_cp: '75003', dest_ville: 'Paris', dest_tel: '0611223344', dest_email: 'houist.al@gmail.com',
    date: '2026-04-04', creneau: '13:00-16:00', poids: 64, poids_lourd: 8, taille: 180, nb_colis: 4, lieu: 'Pièce du choix',
    description: 'jardinières', prix_ht: 60/1.2, prix_ttc: 60, statut: 'planifie', type_prix: 'Poids'
  },
  {
    id: 12080, tournee: 104, expediteur: 'TRUFFAUT PARIS RIVE GAUCHE', expediteur_adresse: '85 Quai de la Gare', expediteur_cp: '75013', expediteur_ville: 'Paris',
    destinataire: 'Almorin', dest_adresse: '3 Avenue Foch', dest_cp: '75116', dest_ville: 'Paris', dest_tel: '0699887766', dest_email: 'almorin@gmail.com',
    date: '2026-04-04', creneau: '13:00-17:00', poids: 70, poids_lourd: 20, taille: 139, nb_colis: 5, lieu: 'Pièce du choix',
    description: 'mobilier salon', prix_ht: 30/1.2, prix_ttc: 30, statut: 'planifie', type_prix: 'Poids'
  },
  {
    id: 12156, tournee: null, expediteur: 'TRUFFAUT PARIS RIVE GAUCHE', expediteur_adresse: '85 Quai de la Gare', expediteur_cp: '75013', expediteur_ville: 'Paris',
    destinataire: 'MAKAROFF', dest_adresse: '45 Rue de la Paix', dest_cp: '93200', dest_ville: 'Saint-Denis', dest_tel: '0677665544', dest_email: 'makaroff@orange.fr',
    date: '2026-04-04', creneau: '09:00-13:00', poids: 105, poids_lourd: 18, taille: 100, nb_colis: 6, lieu: 'Pièce du choix',
    description: 'table + chaises', prix_ht: 30/1.2, prix_ttc: 30, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12141, tournee: null, expediteur: 'TRUFFAUT PARIS RIVE GAUCHE', expediteur_adresse: '85 Quai de la Gare', expediteur_cp: '75013', expediteur_ville: 'Paris',
    destinataire: 'Pinsac Denis', dest_adresse: '10 Rue des Écoles', dest_cp: '94100', dest_ville: 'Saint-Maur-des-Fossés', dest_tel: '0644332211', dest_email: 'pinsac.d@yahoo.fr',
    date: '2026-04-03', creneau: '13:00-16:00', poids: 30, poids_lourd: 7, taille: 100, nb_colis: 2, lieu: 'Pièce du choix',
    description: 'chaises pliantes', prix_ht: 30/1.2, prix_ttc: 30, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 12143, tournee: null, expediteur: 'TRUFFAUT CHATENAY', expediteur_adresse: 'Route de Paris', expediteur_cp: '92290', expediteur_ville: 'Châtenay-Malabry',
    destinataire: 'KARA', dest_adresse: '7 Rue Victor Hugo', dest_cp: '92140', dest_ville: 'Clamart', dest_tel: '0633221100', dest_email: 'kara@hotmail.fr',
    date: '2026-04-03', creneau: '10:00-13:00', poids: 128, poids_lourd: 128, taille: 120, nb_colis: 8, lieu: 'Pièce du choix',
    description: 'dalle terrasse', prix_ht: 126/1.2, prix_ttc: 126, statut: 'en_attente', type_prix: 'Poids'
  },
  {
    id: 11784, tournee: 123, expediteur: 'TRUFFAUT GRIGNY', expediteur_adresse: 'N7', expediteur_cp: '91350', expediteur_ville: 'Grigny',
    destinataire: 'DARONA Geoffrey', dest_adresse: '36 Rue de Lozère', dest_cp: '91400', dest_ville: 'Orsay', dest_tel: '0688050188', dest_email: 'g.darona@gmail.com',
    date: '2026-03-18', creneau: '09:00-14:00', poids: 60, poids_lourd: 30, taille: 220, nb_colis: 2, lieu: 'Pièce du choix',
    description: 'fruitier', prix_ht: 63/1.2, prix_ttc: 63, statut: 'livre', type_prix: 'Poids',
    historique: [
      { evenement: 'Collecté', date: '18/03/2026 10:14', commentaire: '', utilisateur: 'Walid' },
      { evenement: 'Livré', date: '18/03/2026 13:59', commentaire: '', utilisateur: 'Walid' },
      { evenement: 'SMS envoyé', date: '18/03/2026 13:59', commentaire: 'SMS envoyé au numéro +33688050188 (notation)', utilisateur: 'SYSTEM' },
    ]
  },
  {
    id: 12119, tournee: 104, expediteur: 'TRUFFAUT PARIS RIVE GAUCHE', expediteur_adresse: '85 Quai de la Gare', expediteur_cp: '75013', expediteur_ville: 'Paris',
    destinataire: 'Pluntz Sophie', dest_adresse: '15 Rue des Roses', dest_cp: '94200', dest_ville: 'Ivry-sur-Seine', dest_tel: '0678901234', dest_email: 'pluntz.s@gmail.com',
    date: '2026-03-29', creneau: '09:00-13:00', poids: 80, poids_lourd: 30, taille: 200, nb_colis: 5, lieu: 'Pièce du choix',
    description: 'arbustes', prix_ht: 86/1.2, prix_ttc: 86, statut: 'en_cours', type_prix: 'Poids'
  },
];

const FALLBACK_PLANNING_DATES = [
  '2026-03-23','2026-03-24','2026-03-25','2026-03-26','2026-03-27','2026-03-28','2026-03-29',
  '2026-03-30','2026-03-31','2026-04-01','2026-04-02','2026-04-03','2026-04-04','2026-04-05'
];

const FALLBACK_PLANNING_DISPO = {
  6:  [1,1,1,1,1,1,0, 0,0,0,0,0,0,0],
  8:  [1,1,1,0,1,1,1, 0,0,0,0,0,0,0],
  11: [0,0,0,0,0,0,0, 0,0,0,0,0,0,0],
  12: [1,1,0,1,1,1,1, 0,0,0,0,0,0,0],
  13: [1,1,1,1,1,1,0, 0,0,0,0,0,0,0],
  14: [1,1,1,1,1,1,1, 0,0,0,0,0,0,0],
  15: [1,1,1,1,1,1,0, 0,0,0,0,0,0,0],
};

const FALLBACK_STATS_MAGASINS = [
  { nom: 'TRUFFAUT LE CHESNAY',        livraisons: 312, devis: 288, ca_ht: 28450, taux_rcl: 2.1 },
  { nom: 'TRUFFAUT PLAISIR',           livraisons: 287, devis: 264, ca_ht: 24890, taux_rcl: 1.8 },
  { nom: 'TRUFFAUT PARIS RIVE GAUCHE', livraisons: 401, devis: 378, ca_ht: 38120, taux_rcl: 3.2 },
  { nom: 'TRUFFAUT DOMUS',             livraisons: 198, devis: 187, ca_ht: 17640, taux_rcl: 1.5 },
  { nom: 'TRUFFAUT FOURQUEUX',         livraisons: 156, devis: 141, ca_ht: 13200, taux_rcl: 2.8 },
  { nom: 'FISSA LIV',                  livraisons: 89,  devis: 82,  ca_ht: 7890,  taux_rcl: 1.1 },
];

const FALLBACK_STATS_CHAUFFEURS = [
  { nom: 'TAREK MAKNI',        livraisons: 189, devis: 0, ca_ht: 17890, taux_rcl: 1.8 },
  { nom: 'Goré GREENCHARGEUR', livraisons: 201, devis: 0, ca_ht: 19450, taux_rcl: 2.1 },
  { nom: 'Dama TRAORE',        livraisons: 167, devis: 0, ca_ht: 15640, taux_rcl: 1.5 },
  { nom: 'Rachid SANOU',       livraisons: 178, devis: 0, ca_ht: 16780, taux_rcl: 2.3 },
  { nom: 'Amine EXCEL LIV',    livraisons: 145, devis: 0, ca_ht: 13200, taux_rcl: 1.2 },
  { nom: 'Mohamed KLILA',      livraisons: 133, devis: 0, ca_ht: 12300, taux_rcl: 1.9 },
];

// ─── CHARGEMENT DEPUIS SUPABASE ─────────────────────────────
async function loadFromSupabase() {
  try {
    const [
      chauffeursRes,
      entreprisesRes,
      vehiculesRes,
      grillesRes,
      tourneesRes,
      expeditionsRes,
      planningRes,
      statsMagRes,
      statsChaufRes,
    ] = await Promise.allSettled([
      db.from('chauffeurs').select('*').order('id'),
      db.from('entreprises').select('*').order('nom'),
      db.from('vehicules').select('*').order('nom'),
      db.from('grilles_tarifaires').select('*').order('id'),
      db.from('tournees').select('*').order('date', { ascending: false }),
      db.from('expeditions').select('*').order('id', { ascending: false }),
      db.from('planning_dispo').select('*'),
      db.from('stats_magasins').select('*'),
      db.from('stats_chauffeurs').select('*'),
    ]);

    CHAUFFEURS = (chauffeursRes.status === 'fulfilled' && chauffeursRes.value.data?.length)
      ? chauffeursRes.value.data : FALLBACK_CHAUFFEURS;

    ENTREPRISES = (entreprisesRes.status === 'fulfilled' && entreprisesRes.value.data?.length)
      ? entreprisesRes.value.data : FALLBACK_ENTREPRISES;

    VEHICULES = (vehiculesRes.status === 'fulfilled' && vehiculesRes.value.data?.length)
      ? vehiculesRes.value.data : FALLBACK_VEHICULES;

    GRILLES_TARIFAIRES = (grillesRes.status === 'fulfilled' && grillesRes.value.data?.length)
      ? grillesRes.value.data : FALLBACK_GRILLES_TARIFAIRES;

    TOURNEES = (tourneesRes.status === 'fulfilled' && tourneesRes.value.data?.length)
      ? tourneesRes.value.data : FALLBACK_TOURNEES;

    EXPEDITIONS = (expeditionsRes.status === 'fulfilled' && expeditionsRes.value.data?.length)
      ? expeditionsRes.value.data : FALLBACK_EXPEDITIONS;

    STATS_MAGASINS = (statsMagRes.status === 'fulfilled' && statsMagRes.value.data?.length)
      ? statsMagRes.value.data : FALLBACK_STATS_MAGASINS;

    STATS_CHAUFFEURS = (statsChaufRes.status === 'fulfilled' && statsChaufRes.value.data?.length)
      ? statsChaufRes.value.data : FALLBACK_STATS_CHAUFFEURS;

    // Planning
    if (planningRes.status === 'fulfilled' && planningRes.value.data?.length) {
      const planData = planningRes.value.data;
      const dates = [...new Set(planData.map(p => p.date))].sort();
      PLANNING_DATES = dates;
      PLANNING_DISPO = {};
      planData.forEach(p => {
        if (!PLANNING_DISPO[p.chauffeur_id]) PLANNING_DISPO[p.chauffeur_id] = [];
        const idx = dates.indexOf(p.date);
        if (idx >= 0) PLANNING_DISPO[p.chauffeur_id][idx] = p.disponible ? 1 : 0;
      });
    } else {
      PLANNING_DATES = FALLBACK_PLANNING_DATES;
      PLANNING_DISPO = FALLBACK_PLANNING_DISPO;
    }

    console.log('[NAMY] Données chargées depuis Supabase');
  } catch (err) {
    console.warn('[NAMY] Erreur Supabase, utilisation des données locales:', err);
    CHAUFFEURS = FALLBACK_CHAUFFEURS;
    ENTREPRISES = FALLBACK_ENTREPRISES;
    VEHICULES = FALLBACK_VEHICULES;
    GRILLES_TARIFAIRES = FALLBACK_GRILLES_TARIFAIRES;
    TOURNEES = FALLBACK_TOURNEES;
    EXPEDITIONS = FALLBACK_EXPEDITIONS;
    PLANNING_DATES = FALLBACK_PLANNING_DATES;
    PLANNING_DISPO = FALLBACK_PLANNING_DISPO;
    STATS_MAGASINS = FALLBACK_STATS_MAGASINS;
    STATS_CHAUFFEURS = FALLBACK_STATS_CHAUFFEURS;
  }
}

// ─── PEUPLEMENT DES DROPDOWNS ───────────────────────────────
function populateDropdowns() {
  // Chauffeurs
  const chauffeurSelects = [
    document.getElementById('filter-chauffeur'),
    document.getElementById('new-tournee-chauffeur'),
  ];
  const activeChauffeurs = CHAUFFEURS.filter(c => c.actif && c.prenom !== 'LIVRAISONS EN ATTENTE' && c.prenom !== 'COURSE ANNULATION');

  chauffeurSelects.forEach(sel => {
    if (!sel) return;
    const firstOpt = sel.querySelector('option');
    sel.innerHTML = '';
    if (firstOpt) sel.appendChild(firstOpt);
    activeChauffeurs.forEach(c => {
      const opt = document.createElement('option');
      const fullName = `${c.prenom} ${c.nom}`.trim();
      opt.value = fullName.toLowerCase().split(' ')[0];
      opt.textContent = fullName;
      sel.appendChild(opt);
    });
  });

  // Entreprises
  const entrepriseSelects = [
    document.getElementById('extract-entreprise'),
    document.getElementById('new-client'),
  ];

  entrepriseSelects.forEach(sel => {
    if (!sel) return;
    const firstOpt = sel.querySelector('option');
    sel.innerHTML = '';
    if (firstOpt) sel.appendChild(firstOpt);
    ENTREPRISES.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.nom;
      opt.textContent = e.nom;
      sel.appendChild(opt);
    });
  });
}

// ─── INIT ───────────────────────────────────────────────────
let dataReady = false;

async function initData() {
  await loadFromSupabase();
  populateDropdowns();
  dataReady = true;
  document.dispatchEvent(new Event('namy-data-ready'));
}
