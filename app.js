// ─── NAMY APP.JS — Expeditions List ─────────────────────────

// ─── STATE ──────────────────────────────────────────────────
let expeditions = [];
let filteredExpeditions = [];
let currentPage = 1;
const PAGE_SIZE = 20;
let sortColumn = 'date';
let sortDir = 'desc';
let chauffeurs = [];
let entreprises = [];
let tournees = [];
let activePeriod = '30d';
let activeStatuts = [];

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  await loadData();
  loadSession();
  populateFilters();
  applyFilters();
});

// ─── SESSION ────────────────────────────────────────────────
function loadSession() {
  const user = getSessionUser();
  const role = getSessionRole();

  // Redirect si pas de session
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Afficher nom + rôle
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  if (nameEl) nameEl.textContent = user.prenom ? (user.prenom + ' ' + (user.nom || '')) : (user.email || '—');
  if (roleEl) roleEl.textContent = role || 'user';

  // Bouton "+ Créer une expédition" visible pour admin, dispatcher, client, vendeur
  const btnNew = document.getElementById('btn-new-expedition');
  if (btnNew && ['admin','dispatcher','client','dirigeant','vendeur'].includes(role)) {
    btnNew.style.display = 'inline-flex';
  }

  // Masquer filtres Magasin et Chauffeur pour client/vendeur
  if (['client','dirigeant','vendeur'].includes(role)) {
    const magasinFilter = document.getElementById('filter-magasin');
    const chauffeurFilter = document.getElementById('filter-chauffeur');
    if (magasinFilter) magasinFilter.closest('.filter-group').style.display = 'none';
    if (chauffeurFilter) chauffeurFilter.closest('.filter-group').style.display = 'none';
  }
}

async function logout() {
  try { if (typeof db !== 'undefined' && db.auth) await db.auth.signOut(); } catch(e) {}
  sessionStorage.removeItem('namy_user');
  sessionStorage.removeItem('namy_role');
  window.location.href = 'login.html';
}

// ─── DATA LOADING ───────────────────────────────────────────
async function loadData() {
  // Use global data loaded by initData() in data.js
  expeditions = EXPEDITIONS || [];
  chauffeurs = CHAUFFEURS || [];
  entreprises = ENTREPRISES || [];
  tournees = TOURNEES || [];

  // Filtrage par rôle
  const user = getSessionUser();
  if (user && user.entreprise_id) {
    const role = user.role;
    if (role === 'client' || role === 'vendeur' || role === 'dirigeant') {
      // Voit uniquement les expéditions de son entreprise
      expeditions = expeditions.filter(e => e.entreprise_id === user.entreprise_id);
    } else if (role === 'fournisseur' || role === 'exploitant') {
      // Voit les expéditions/tournées assignées à ses livreurs
      // Ses livreurs = chauffeurs de son entreprise
      const mesLivreurs = chauffeurs.filter(c => c.entreprise_id === user.entreprise_id);
      const mesLivreurIds = new Set(mesLivreurs.map(c => c.id));
      const mesTourneeIds = new Set(
        tournees.filter(t => mesLivreurIds.has(t.chauffeur_id)).map(t => t.id)
      );
      expeditions = expeditions.filter(e => e.tournee_id && mesTourneeIds.has(e.tournee_id));
    }
    // admin / dispatcher → pas de filtre, voit tout
  }
}

// ─── POPULATE FILTER DROPDOWNS ──────────────────────────────
function populateFilters() {
  // Magasin select
  const magasinSel = document.getElementById('filter-magasin');
  if (magasinSel) {
    const noms = [...new Set(expeditions.map(e => e.exp_nom))].sort();
    noms.forEach(nom => {
      const opt = document.createElement('option');
      opt.value = nom;
      opt.textContent = nom;
      magasinSel.appendChild(opt);
    });
  }

  // Chauffeur select
  const chauffeurSel = document.getElementById('filter-chauffeur');
  if (chauffeurSel) {
    const activeChauffeurs = chauffeurs.filter(c =>
      c.actif && c.prenom !== 'LIVRAISONS EN ATTENTE' && c.prenom !== 'COURSE ANNULATION'
    );
    activeChauffeurs.forEach(c => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = (c.prenom + ' ' + c.nom).trim();
      chauffeurSel.appendChild(opt);
    });
  }
}

// ─── PERIOD ─────────────────────────────────────────────────
function setPeriod(period, btn) {
  activePeriod = period;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const customDates = document.getElementById('custom-dates');
  if (period == 'custom') {
    if (customDates) customDates.style.display = 'flex';
  } else {
    if (customDates) customDates.style.display = 'none';
  }

  applyFilters();
}

// ─── STATUT TOGGLE ──────────────────────────────────────────
function toggleStatut(btn) {
  const statut = btn.dataset.statut;
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    if (!activeStatuts.includes(statut)) activeStatuts.push(statut);
  } else {
    activeStatuts = activeStatuts.filter(s => s !== statut);
  }
  applyFilters();
}

// ─── FILTERS ────────────────────────────────────────────────
function applyFilters() {
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const magasin = document.getElementById('filter-magasin')?.value || '';
  const chauffeurId = document.getElementById('filter-chauffeur')?.value || '';

  // Period date range
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (activePeriod == 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (activePeriod == '7d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (activePeriod == '30d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60, 23, 59, 59);
  } else if (activePeriod == 'custom') {
    const ds = document.getElementById('filter-date-start')?.value;
    const de = document.getElementById('filter-date-end')?.value;
    if (ds) startDate = new Date(ds);
    if (de) endDate = new Date(de + 'T23:59:59');
  }

  filteredExpeditions = expeditions.filter(e => {
    // Date filter
    if (startDate || endDate) {
      const eDate = new Date(e.date_livraison || e.date);
      if (startDate && eDate < startDate) return false;
      if (endDate && eDate > endDate) return false;
    }

    // Statut filter
    if (activeStatuts.length > 0 && !activeStatuts.includes(e.statut)) return false;

    // Magasin filter
    if (magasin && e.exp_nom != magasin) return false;

    // Chauffeur filter
    if (chauffeurId) {
      const tour = tournees.find(t => t.id == e.tournee);
      if (!tour) return false;
      const chauffeur = chauffeurs.find(c => c.id == chauffeurId);
      if (!chauffeur) return false;
      const chauffeurName = (chauffeur.prenom + ' ' + chauffeur.nom).trim().toUpperCase();
      if (!tour.chauffeur || tour.chauffeur.toUpperCase() != chauffeurName) return false;
    }

    // Search filter
    if (search) {
      const haystack = [
        String(e.id),
        e.dest_nom || '',
        e.dest_adresse || '',
        e.dest_ville || '',
        e.exp_nom || ''
      ].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  // Sort
  doSort();

  // Reset to page 1
  currentPage = 1;

  // Update stats
  updateStats();

  // Render
  renderTable();
}

function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-magasin').value = '';
  document.getElementById('filter-chauffeur').value = '';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';

  activeStatuts = [];
  document.querySelectorAll('.statut-btn').forEach(b => b.classList.remove('active'));

  activePeriod = '30d';
  document.querySelectorAll('.period-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.period == '30d');
  });
  document.getElementById('custom-dates').style.display = 'none';

  applyFilters();
}

// ─── STATS ──────────────────────────────────────────────────
function updateStats() {
  const total = filteredExpeditions.length;
  const accepte = filteredExpeditions.filter(e => e.statut === 'accepte').length;
  const attente = filteredExpeditions.filter(e => e.statut === 'en_attente').length;
  const retire = filteredExpeditions.filter(e => e.statut === 'retire').length;
  const livre = filteredExpeditions.filter(e => e.statut === 'livre').length;
  const echec = filteredExpeditions.filter(e => ['echec_retrait','echec_livraison','echec','litige'].includes(e.statut)).length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('stat-total', total);
  set('stat-accepte', accepte);
  set('stat-attente', attente);
  set('stat-retire', retire);
  set('stat-livre', livre);
  set('stat-echec', echec);

  document.getElementById('footer-info').textContent = total + ' expédition' + (total > 1 ? 's' : '');
}

// ─── SORTING ────────────────────────────────────────────────
function sortBy(column) {
  if (sortColumn == column) {
    sortDir = sortDir == 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDir = 'asc';
  }

  // Update sort icons
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.innerHTML = '&#8597;';
  });
  const activeIcon = document.getElementById('sort-' + column);
  if (activeIcon) {
    activeIcon.innerHTML = sortDir == 'asc' ? '&#8593;' : '&#8595;';
  }

  doSort();
  renderTable();
}

function doSort() {
  filteredExpeditions.sort((a, b) => {
    let valA, valB;

    if (sortColumn == 'date') {
      valA = new Date(a.date).getTime();
      valB = new Date(b.date).getTime();
    } else if (sortColumn == 'id') {
      valA = a.id;
      valB = b.id;
    } else if (sortColumn == 'expediteur') {
      valA = (a.expediteur || '').toLowerCase();
      valB = (b.expediteur || '').toLowerCase();
    } else if (sortColumn == 'destinataire') {
      valA = (a.destinataire || '').toLowerCase();
      valB = (b.destinataire || '').toLowerCase();
    } else if (sortColumn == 'prix_ttc') {
      valA = a.prix_ttc || 0;
      valB = b.prix_ttc || 0;
    } else if (sortColumn == 'chauffeur') {
      valA = getChauffeurName(a) || 'zzz';
      valB = getChauffeurName(b) || 'zzz';
    } else {
      valA = a[sortColumn];
      valB = b[sortColumn];
    }

    if (valA < valB) return sortDir == 'asc' ? -1 : 1;
    if (valA > valB) return sortDir == 'asc' ? 1 : -1;
    return 0;
  });
}

// ─── HELPERS ────────────────────────────────────────────────
function getChauffeurName(exp) {
  if (!exp.tournee) return null;
  const tour = tournees.find(t => t.id == exp.tournee);
  return tour ? tour.chauffeur : null;
}

function renderStatutBadge(statut) {
  const map = {
    'accepte':         ['badge-success', 'Accepté'],
    'en_attente':      ['badge-warning', 'En attente'],
    'retire':          ['badge-info',    'Retiré'],
    'echec_retrait':   ['badge-danger',  'Échec retrait'],
    'livre':           ['badge-success', 'Livré'],
    'echec_livraison': ['badge-danger',  'Échec livraison'],
    'retourne':        ['badge-muted',   'Retourné'],
    // Legacy support
    'planifie':        ['badge-info',    'Planifié'],
    'en_cours':        ['badge-primary', 'En cours'],
    'echec':           ['badge-danger',  'Échec'],
    'litige':          ['badge-danger',  'Litige'],
  };
  const [cls, label] = map[statut] || ['badge-muted', statut || '—'];
  return '<span class="badge ' + cls + '"><span class="status-dot"></span> ' + label + '</span>';
}

function formatDateFR(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length == 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
  return formatDate(dateStr);
}

// ─── RENDER TABLE ───────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('expeditions-tbody');
  if (!tbody) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = filteredExpeditions.slice(start, end);

  if (pageData.length == 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Aucune expedition trouvee</td></tr>';
    renderPagination();
    return;
  }

  tbody.innerHTML = pageData.map(e => {
    const chauffeurName = getChauffeurName(e);
    const canDelete = e.statut == 'en_attente';

    return '<tr>' +
      '<td style="white-space:nowrap">' + formatDateFR(e.date_livraison || e.date) + '</td>' +
      '<td><span style="font-family:\'DM Mono\',monospace;font-size:13px">' + e.id + '</span></td>' +
      '<td>' + (e.exp_nom || '—') + '</td>' +
      '<td>' + (e.dest_nom || '—') + '<br><span style="color:var(--text-muted);font-size:12px">' + (e.dest_ville || '') + '</span></td>' +
      '<td>' + renderStatutBadge(e.statut) + '</td>' +
      '<td>' + (chauffeurName ? chauffeurName : '<span style="color:var(--text-muted)">—</span>') + '</td>' +
      '<td style="font-family:\'DM Mono\',monospace;font-weight:600;white-space:nowrap">' + (e.prix_ttc != null ? Number(e.prix_ttc).toFixed(2) + ' \u20ac' : '—') + '</td>' +
      '<td><div class="table-actions">' +
        '<button class="btn-icon" onclick="openDetail(\'' + e.id + '\')" title="Voir">&#128065;</button>' +
        '<button class="btn-icon" onclick="openStatusModal(\'' + e.id + '\')" title="Modifier statut">&#9998;</button>' +
        (canDelete ? '<button class="btn-icon danger" onclick="deleteExpedition(\'' + e.id + '\')" title="Supprimer">&#128465;</button>' : '') +
      '</div></td>' +
    '</tr>';
  }).join('');

  renderPagination();
}

// ─── PAGINATION ─────────────────────────────────────────────
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(filteredExpeditions.length / PAGE_SIZE));
  let html = '';

  // Previous
  html += '<button class="page-btn" onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? 'disabled' : '') + '>&larr;</button>';

  // Page numbers
  const maxVisible = 7;
  let pages = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');

    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  pages.forEach(p => {
    if (p == '...') {
      html += '<span class="page-info">...</span>';
    } else {
      html += '<button class="page-btn' + (p == currentPage ? ' active' : '') + '" onclick="goToPage(' + p + ')">' + p + '</button>';
    }
  });

  // Next
  html += '<button class="page-btn" onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + '>&rarr;</button>';

  // Info
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filteredExpeditions.length);
  html += '<span class="page-info">' + start + '-' + end + ' sur ' + filteredExpeditions.length + '</span>';

  container.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.max(1, Math.ceil(filteredExpeditions.length / PAGE_SIZE));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
  // Scroll table into view
  document.getElementById('expeditions-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── DETAIL MODAL ───────────────────────────────────────────
async function openDetail(id) {
  const e = expeditions.find(x => String(x.id) == String(id));
  if (!e) return;
  const user = getSessionUser();
  const role = user?.role || '';
  const isMagasin = ['client','dirigeant','vendeur'].includes(role);

  document.getElementById('detail-id').textContent = '#' + e.id;
  const body = document.getElementById('detail-body');
  const tourName = isMagasin ? null : getChauffeurName(e);

  let html = '';

  // General info
  html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:8px">';
  html += '<div class="detail-info-row"><strong>Numéro</strong> #' + e.id + '</div>';
  html += '<div class="detail-info-row"><strong>Date</strong> ' + formatDateFR(e.date_livraison || e.date) + '</div>';
  html += '<div class="detail-info-row"><strong>Créneau</strong> ' + (e.creneau || '—') + '</div>';
  html += '<div class="detail-info-row"><strong>Option</strong> ' + (e.option_livraison || e.lieu || '—') + '</div>';
  html += '<div class="detail-info-row"><strong>Statut</strong> ' + renderStatutBadge(e.statut) + '</div>';
  if (!isMagasin && tourName) html += '<div class="detail-info-row"><strong>Livreur</strong> ' + tourName + '</div>';
  html += '</div>';

  // Cards
  html += '<div class="detail-cards">';
  html += '<div class="detail-card"><h4>Enlèvement</h4>';
  html += '<p><strong>' + (e.exp_nom || '') + '</strong></p>';
  html += '<p>' + (e.exp_adresse || '') + '</p>';
  html += '<p>' + (e.exp_cp || '') + ' ' + (e.exp_ville || '') + '</p>';
  html += '</div>';
  html += '<div class="detail-card"><h4>Livraison</h4>';
  html += '<p><strong>' + (e.dest_nom || '') + '</strong></p>';
  html += '<p>' + (e.dest_adresse || '') + '</p>';
  html += '<p>' + (e.dest_cp || '') + ' ' + (e.dest_ville || '') + '</p>';
  html += '<p>' + (e.dest_telephone || '') + '</p>';
  html += '</div>';
  html += '<div class="detail-card"><h4>Marchandises</h4>';
  html += '<p>Poids : <strong>' + (e.poids_total || e.poids || 0) + ' kg</strong></p>';
  html += '<p>Nb colis : <strong>' + (e.nb_colis || 0) + '</strong></p>';
  if (e.poids_max_colis) html += '<p>Colis max : <strong>' + e.poids_max_colis + ' kg</strong></p>';
  if (e.distance_km) html += '<p>Distance : <strong>' + e.distance_km + ' km</strong></p>';
  html += '<p>' + (e.description || '—') + '</p>';
  html += '</div></div>';

  // Tarification
  const prixHT = e.prix_ht != null ? Number(e.prix_ht) : (e.prix_ttc ? e.prix_ttc / 1.2 : 0);
  const ttc = e.prix_ttc != null ? Number(e.prix_ttc) : prixHT * 1.2;
  html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:8px">';
  html += '<h4 style="font-size:13px;font-weight:600;margin-bottom:8px">Tarification</h4>';
  html += '<div style="display:flex;justify-content:space-between;font-size:13px"><span>HT</span><span style="font-family:\'DM Mono\',monospace">' + prixHT.toFixed(2) + ' €</span></div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted)"><span>TVA 20%</span><span style="font-family:\'DM Mono\',monospace">' + (prixHT * 0.2).toFixed(2) + ' €</span></div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-top:6px;padding-top:6px;border-top:1px solid var(--border)"><span>TTC</span><span style="font-family:\'DM Mono\',monospace;color:var(--primary)">' + ttc.toFixed(2) + ' €</span></div>';
  html += '</div>';

  // Photos
  const photosRetrait = e.photos_retrait || [];
  const photosLivraison = e.photos_livraison || [];
  html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:8px">';
  html += '<h4 style="font-size:13px;font-weight:600;margin-bottom:8px">Photos</h4>';
  html += '<div style="margin-bottom:8px"><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Retrait</span>';
  if (photosRetrait.length) {
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px">' + photosRetrait.map(u => '<img src="' + u + '" style="width:100%;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--border)" onclick="window.open(\'' + u + '\')">').join('') + '</div>';
  } else { html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Aucune photo</div>'; }
  html += '</div>';
  html += '<div><span style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Livraison</span>';
  if (photosLivraison.length) {
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px">' + photosLivraison.map(u => '<img src="' + u + '" style="width:100%;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--border)" onclick="window.open(\'' + u + '\')">').join('') + '</div>';
  } else { html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Aucune photo</div>'; }
  html += '</div></div>';

  // Commentaires
  html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:8px">';
  html += '<h4 style="font-size:13px;font-weight:600;margin-bottom:8px">Commentaires</h4>';
  html += '<div id="detail-comments-list" style="margin-bottom:8px"><div style="font-size:12px;color:var(--text-muted)">Chargement...</div></div>';
  html += '<div style="display:flex;gap:6px"><input type="text" id="detail-comment-input" placeholder="Ajouter un commentaire..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-family:\'DM Sans\',sans-serif;font-size:12px;outline:none"><button onclick="addComment(' + e.id + ')" style="padding:8px 14px;background:var(--primary);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Envoyer</button></div>';
  html += '</div>';

  // Bouton litige
  const litigeStatuts = ['livre','echec_livraison','retourne'];
  const litigeRoles = ['admin','dispatcher','client','dirigeant','vendeur'];
  if (litigeStatuts.includes(e.statut) && litigeRoles.includes(role)) {
    const livDate = e.date_livraison ? new Date(e.date_livraison) : null;
    const expired = livDate && (new Date() - livDate) / 86400000 > 7;
    html += '<div style="margin-top:8px;text-align:center">';
    if (expired) {
      html += '<button disabled style="padding:10px 20px;background:var(--bg-hover);color:var(--text-muted);border:none;border-radius:8px;font-size:13px;cursor:not-allowed" title="Délai de déclaration dépassé (7 jours)">⚠️ Délai litige dépassé</button>';
    } else {
      html += '<a href="litige-nouveau.html?expedition_id=' + e.id + '" style="display:inline-block;padding:10px 20px;background:rgba(239,68,68,.08);color:#EF4444;border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">⚠️ Ouvrir un litige</a>';
    }
    html += '</div>';
  }

  body.innerHTML = html;
  openModal('modal-detail');

  // Load comments async
  loadDetailComments(e.id);
}

async function loadDetailComments(expId) {
  const el = document.getElementById('detail-comments-list');
  if (!el) return;
  try {
    const { data } = await db.from('expedition_commentaires').select('*').eq('expedition_id', expId).order('created_at');
    if (!data || !data.length) { el.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">Aucun commentaire</div>'; return; }
    el.innerHTML = data.map(c => '<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12px"><strong>' + (c.auteur_nom || '—') + '</strong> <span style="color:var(--text-muted);font-size:10px">' + (c.created_at ? new Date(c.created_at).toLocaleString('fr-FR') : '') + '</span><div style="margin-top:2px">' + (c.commentaire || '') + '</div></div>').join('');
  } catch(e) { el.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">Erreur chargement</div>'; }
}

async function addComment(expId) {
  const input = document.getElementById('detail-comment-input');
  const text = input?.value.trim();
  if (!text) return;
  const user = getSessionUser();
  try {
    await db.from('expedition_commentaires').insert({
      expedition_id: expId,
      auteur_id: user?.id,
      auteur_nom: (user?.prenom || '') + ' ' + (user?.nom || ''),
      auteur_role: user?.role,
      commentaire: text,
    });
    input.value = '';
    await loadDetailComments(expId);
  } catch(e) { console.error('Comment error:', e); }
}

// ─── STATUS CHANGE ──────────────────────────────────────────
function openStatusModal(id) {
  const e = expeditions.find(x => String(x.id) == String(id));
  if (!e) return;
  document.getElementById('status-exp-id').value = id;
  document.getElementById('status-new').value = e.statut;
  document.getElementById('status-comment').value = '';
  openModal('modal-status');
}

async function confirmStatusChange() {
  const id = document.getElementById('status-exp-id').value;
  const newStatus = document.getElementById('status-new').value;
  const comment = document.getElementById('status-comment').value.trim();

  const e = expeditions.find(x => String(x.id) == String(id));
  if (!e) return;

  const oldStatus = e.statut;
  if (newStatus == oldStatus && !comment) {
    showToast('Aucun changement', 'warning');
    return;
  }

  // Try Supabase update
  try {
    const { error } = await db.from('expeditions').update({ statut: newStatus }).eq('id', id);
    if (error) throw error;

    // Insert historique
    const user = getSessionUser();
    await db.from('historique_expeditions').insert({
      expedition_id: id,
      evenement: 'Statut: ' + oldStatus + ' -> ' + newStatus,
      commentaire: comment,
      utilisateur: user ? (user.prenom || user.email || 'Utilisateur') : 'Utilisateur',
      date: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[NAMY] Supabase update failed, updating locally:', err);
  }

  // Update local data
  e.statut = newStatus;
  if (!e.historique) e.historique = [];
  const user = getSessionUser();
  e.historique.push({
    evenement: 'Statut: ' + oldStatus + ' -> ' + newStatus,
    date: new Date().toLocaleString('fr-FR'),
    commentaire: comment,
    utilisateur: user ? (user.prenom || 'Utilisateur') : 'Utilisateur'
  });

  closeModal('modal-status');
  showToast('Statut mis a jour', 'success');
  applyFilters();
}

// ─── DELETE ─────────────────────────────────────────────────
async function deleteExpedition(id) {
  const e = expeditions.find(x => String(x.id) == String(id));
  if (!e) return;
  if (e.statut != 'en_attente') {
    showToast('Seules les expeditions en attente peuvent etre supprimees', 'warning');
    return;
  }
  if (!confirm('Supprimer l\'expedition #' + id + ' ?')) return;

  try {
    await db.from('expeditions').delete().eq('id', id);
  } catch (err) {
    console.warn('[NAMY] Supabase delete failed:', err);
  }

  expeditions = expeditions.filter(x => String(x.id) != String(id));
  EXPEDITIONS = expeditions;
  showToast('Expedition supprimee', 'success');
  applyFilters();
}

// ─── EXPORT CSV ─────────────────────────────────────────────
function exportCSV() {
  if (filteredExpeditions.length == 0) {
    showToast('Aucune donnee a exporter', 'warning');
    return;
  }

  const headers = ['ID', 'Date', 'Expediteur', 'Destinataire', 'Ville', 'Adresse', 'CP', 'Statut', 'Chauffeur', 'Poids', 'Nb Colis', 'Prix HT', 'Prix TTC'];

  const rows = filteredExpeditions.map(e => {
    const chauffeur = getChauffeurName(e) || '';
    const prixHT = e.prix_ht != null ? Number(e.prix_ht).toFixed(2) : '';
    const prixTTC = e.prix_ttc != null ? Number(e.prix_ttc).toFixed(2) : '';
    return [
      e.id,
      e.date_livraison || e.date || '',
      e.exp_nom || '',
      e.dest_nom || '',
      e.dest_ville || '',
      e.dest_adresse || '',
      e.dest_cp || '',
      e.statut || '',
      chauffeur,
      e.poids || '',
      e.nb_colis || '',
      prixHT,
      prixTTC
    ];
  });

  let csv = '\uFEFF'; // BOM for Excel
  csv += headers.join(';') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => {
      const val = String(cell).replace(/"/g, '""');
      return '"' + val + '"';
    }).join(';') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expeditions_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV exporte (' + filteredExpeditions.length + ' lignes)', 'success');
}
