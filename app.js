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
  const attente = filteredExpeditions.filter(e => e.statut == 'en_attente').length;
  const planifie = filteredExpeditions.filter(e => e.statut == 'planifie').length;
  const encours = filteredExpeditions.filter(e => e.statut == 'en_cours').length;
  const livre = filteredExpeditions.filter(e => e.statut == 'livre').length;
  const litige = filteredExpeditions.filter(e => e.statut == 'litige' || e.statut == 'echec').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-attente').textContent = attente;
  document.getElementById('stat-planifie').textContent = planifie;
  document.getElementById('stat-encours').textContent = encours;
  document.getElementById('stat-livre').textContent = livre;
  document.getElementById('stat-litige').textContent = litige;

  document.getElementById('footer-info').textContent = total + ' expedition' + (total > 1 ? 's' : '') + ' (filtrees)';
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
    'en_attente': ['badge-warning', 'En attente'],
    'planifie':   ['badge-info',    'Planifie'],
    'en_cours':   ['badge-primary', 'En cours'],
    'livre':      ['badge-success', 'Livre'],
    'echec':      ['badge-danger',  'Echec'],
    'litige':     ['badge-danger',  'Litige'],
  };
  const [cls, label] = map[statut] || ['badge-muted', statut];
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
function openDetail(id) {
  const e = expeditions.find(x => String(x.id) == String(id));
  if (!e) return;

  document.getElementById('detail-id').textContent = '#' + e.id;
  const body = document.getElementById('detail-body');
  const tourName = getChauffeurName(e);

  let html = '';

  // Warning if no tournee
  if (!e.tournee) {
    html += '<div class="no-tournee-banner">Aucune tournee attribuee a cette commande.</div>';
  }

  // General info
  html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:4px">';
  html += '<div class="detail-info-row"><strong>Numero</strong> ' + e.id + '</div>';
  html += '<div class="detail-info-row"><strong>Date de livraison</strong> ' + formatDateFR(e.date_livraison || e.date) + '</div>';
  html += '<div class="detail-info-row"><strong>Creneau</strong> ' + (e.creneau || '—') + '</div>';
  html += '<div class="detail-info-row"><strong>Description</strong> ' + (e.description || '—') + '</div>';
  html += '<div class="detail-info-row"><strong>Lieu de livraison</strong> ' + (e.lieu || '—') + '</div>';
  html += '<div class="detail-info-row"><strong>Statut</strong> ' + renderStatutBadge(e.statut) + '</div>';
  html += '<div class="detail-info-row"><strong>Chauffeur</strong> ' + (tourName || '—') + '</div>';
  html += '</div>';

  // Cards: expediteur / destinataire / marchandises
  html += '<div class="detail-cards">';

  html += '<div class="detail-card"><h4>Enlevement</h4>';
  html += '<p><strong>' + (e.exp_nom || '') + '</strong></p>';
  html += '<p>' + (e.exp_nom_adresse || '') + '</p>';
  html += '<p>' + (e.exp_nom_cp || '') + ' ' + (e.exp_nom_ville || '') + '</p>';
  html += '</div>';

  html += '<div class="detail-card"><h4>Livraison</h4>';
  html += '<p><strong>' + (e.dest_nom || '') + '</strong></p>';
  html += '<p>' + (e.dest_adresse || '') + '</p>';
  html += '<p>' + (e.dest_cp || '') + ' ' + (e.dest_ville || '') + '</p>';
  html += '<p>' + (e.dest_tel || '') + '</p>';
  html += '<p>' + (e.dest_email || '') + '</p>';
  html += '</div>';

  html += '<div class="detail-card"><h4>Marchandises</h4>';
  html += '<p>Poids total : <strong>' + (e.poids || 0) + ' kg</strong></p>';
  html += '<p>Colis lourd : <strong>' + (e.poids_lourd || 0) + ' kg</strong></p>';
  html += '<p>Taille max : <strong>' + (e.taille || 0) + ' cm</strong></p>';
  html += '<p>Nb colis : <strong>' + (e.nb_colis || 0) + '</strong></p>';
  html += '<p>Lieu : <strong>' + (e.lieu || '—') + '</strong></p>';
  html += '</div>';

  html += '</div>';

  // Tarification
  const prixHT = e.prix_ht != null ? Number(e.prix_ht) : (e.prix_ttc ? e.prix_ttc / 1.2 : 0);
  const tva = prixHT * 0.2;
  const ttc = e.prix_ttc != null ? Number(e.prix_ttc) : prixHT * 1.2;

  html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:4px">';
  html += '<h4 style="font-size:13px;font-weight:600;margin-bottom:10px">Tarification</h4>';
  html += '<table class="tarif-table">';
  html += '<tr><td>TOTAL HT</td><td style="text-align:right;font-family:\'DM Mono\',monospace">' + prixHT.toFixed(2) + ' \u20ac</td></tr>';
  html += '<tr style="color:var(--text-muted)"><td>TVA (20%)</td><td style="text-align:right;font-family:\'DM Mono\',monospace">' + tva.toFixed(2) + ' \u20ac</td></tr>';
  html += '<tr style="background:rgba(59,130,246,0.08)"><td><strong>TOTAL TTC</strong></td><td style="text-align:right;font-family:\'DM Mono\',monospace;font-weight:700;color:var(--primary);font-size:15px">' + ttc.toFixed(2) + ' \u20ac</td></tr>';
  html += '</table></div>';

  // Historique
  if (e.historique && e.historique.length > 0) {
    html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">';
    html += '<table class="history-table"><thead><tr><th>Evenement</th><th>Date</th><th>Commentaire</th><th>Utilisateur</th></tr></thead><tbody>';
    e.historique.forEach(h => {
      html += '<tr>';
      html += '<td>' + (h.evenement || '') + '</td>';
      html += '<td style="font-family:\'DM Mono\',monospace;font-size:12px">' + (h.date || '') + '</td>';
      html += '<td>' + (h.commentaire || '') + '</td>';
      html += '<td style="color:var(--text-muted)">' + (h.utilisateur || '') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<div style="color:var(--text-muted);font-size:13px;padding:12px;text-align:center;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">Aucun evenement de suivi</div>';
  }

  body.innerHTML = html;
  openModal('modal-detail');
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
