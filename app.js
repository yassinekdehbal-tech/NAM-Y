// ─── NAMY APP.JS ────────────────────────────────────────────

let currentPage = 'expeditions';
let selectedCreneau = null;
let filteredExpeditions = [];

// ─── NAVIGATION ─────────────────────────────────────────────
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  renderPage(page);
}

function renderPage(page) {
  switch(page) {
    case 'expeditions': renderExpeditions(); break;
    case 'dispatch': renderDispatch(); break;
    case 'planning': renderPlanning(); break;
    case 'statistiques': renderStats(); break;
    case 'administration': renderAdmin(); break;
  }
}

// ─── EXPÉDITIONS ─────────────────────────────────────────────
function renderExpeditions(data) {
  const exps = data || filteredExpeditions;
  const tbody = document.getElementById('expeditions-tbody');

  // Stats
  document.getElementById('stat-total').textContent = exps.length;
  document.getElementById('stat-attente').textContent = exps.filter(e => e.statut === 'en_attente').length;
  document.getElementById('stat-planifie').textContent = exps.filter(e => e.statut === 'planifie').length;
  document.getElementById('stat-livre').textContent = exps.filter(e => e.statut === 'livre').length;
  document.getElementById('stat-litige').textContent = exps.filter(e => e.statut === 'litige').length;

  tbody.innerHTML = exps.map(e => {
    const tournee = e.tournee ? TOURNEES.find(t => t.id === e.tournee) : null;
    return `
    <tr>
      <td><span style="font-family:'DM Mono',monospace;font-size:13px">${e.id}</span></td>
      <td>${tournee ? `<span class="tournee-badge" style="background:${tournee.couleur};font-size:11px;padding:3px 8px">${tournee.nom}</span>` : '<span style="color:#4b5563">—</span>'}</td>
      <td>${e.expediteur}<br><span style="color:#6b7280;font-size:12px">${e.expediteur_cp} ${e.expediteur_ville}</span></td>
      <td>${e.destinataire}<br><span style="color:#6b7280;font-size:12px">${e.dest_cp} ${e.dest_ville}</span></td>
      <td>
        <span class="badge badge-info" style="font-size:11px">📅 ${formatDate(e.date)}</span><br>
        <span style="color:#6b7280;font-size:12px;margin-top:2px;display:block">⏰ ${e.creneau}</span>
      </td>
      <td style="font-size:12px">
        ⚖️ ${e.poids} Kg<br>
        📦 ${e.poids_lourd} Kg<br>
        📏 ${e.taille} cm
      </td>
      <td style="font-size:12px">${e.lieu}<br><span class="badge badge-muted" style="font-size:10px">${e.type_prix}</span></td>
      <td style="font-family:'DM Mono',monospace;font-weight:600">${e.prix_ttc.toFixed(2)}€</td>
      <td>${renderStatutBadge(e.statut)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="openDetail(${e.id})" title="Voir">👁</button>
          <button class="btn-icon" onclick="dupliquerById(${e.id})" title="Dupliquer">⧉</button>
          <button class="btn-icon danger" onclick="supprimerExpedition(${e.id})" title="Supprimer">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderStatutBadge(statut) {
  const map = {
    'en_attente': ['badge-warning', '⏳ En attente'],
    'planifie':   ['badge-info',    '📋 Planifié'],
    'en_cours':   ['badge-primary', '🚚 En cours'],
    'livre':      ['badge-success', '✅ Livré'],
    'litige':     ['badge-danger',  '⚠️ Litige'],
  };
  const [cls, label] = map[statut] || ['badge-muted', statut];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

function filterExpeditions() {
  const id = document.getElementById('filter-id').value.trim();
  const exp = document.getElementById('filter-expediteur').value.toLowerCase().trim();
  const dest = document.getElementById('filter-destinataire').value.toLowerCase().trim();
  const statut = document.getElementById('filter-statut').value;

  filteredExpeditions = EXPEDITIONS.filter(e => {
    if (id && !String(e.id).includes(id)) return false;
    if (exp && !e.expediteur.toLowerCase().includes(exp) && !e.expediteur_ville.toLowerCase().includes(exp)) return false;
    if (dest && !e.destinataire.toLowerCase().includes(dest) && !e.dest_ville.toLowerCase().includes(dest)) return false;
    if (statut && e.statut !== statut) return false;
    return true;
  });
  renderExpeditions();
}

function resetFilters() {
  document.getElementById('filter-id').value = '';
  document.getElementById('filter-expediteur').value = '';
  document.getElementById('filter-destinataire').value = '';
  document.getElementById('filter-statut').value = '';
  document.getElementById('filter-chauffeur').value = '';
  filteredExpeditions = [...EXPEDITIONS];
  renderExpeditions();
}

// ─── DETAIL EXPÉDITION ──────────────────────────────────────
function openDetail(id) {
  const e = EXPEDITIONS.find(x => x.id === id);
  if (!e) return;
  const tournee = e.tournee ? TOURNEES.find(t => t.id === e.tournee) : null;
  document.getElementById('detail-id').textContent = `#${e.id}`;
  const body = document.getElementById('detail-body');

  body.innerHTML = `
    ${!tournee ? '<div class="no-tournee-banner">⚠️ Il n\'y a pas encore de tournée attribuée à cette commande.</div>' : ''}
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:4px">
      <div class="detail-info-row"><strong>Numéro de commande</strong> ${e.id}</div>
      <div class="detail-info-row"><strong>Date de saisie</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</div>
      <div class="detail-info-row"><strong>Date de livraison</strong> ${formatDate(e.date)}</div>
      <div class="detail-info-row"><strong>Heure de livraison</strong> ${e.creneau}</div>
      <div class="detail-info-row"><strong>Description</strong> ${e.description}</div>
      <div class="detail-info-row"><strong>Lieu de livraison</strong> ${e.lieu}</div>
      <div class="detail-info-row"><strong>Statut</strong> ${renderStatutBadge(e.statut)}</div>
    </div>
    <div class="detail-cards">
      <div class="detail-card">
        <h4>Enlèvement</h4>
        <p><strong>${e.expediteur}</strong></p>
        <p>${e.expediteur_adresse}</p>
        <p>${e.expediteur_cp} ${e.expediteur_ville}</p>
      </div>
      <div class="detail-card">
        <h4>Livraison</h4>
        <p><strong>${e.destinataire}</strong></p>
        <p>${e.dest_adresse}</p>
        <p>${e.dest_cp} ${e.dest_ville}</p>
        <p>${e.dest_tel}</p>
        <p>${e.dest_email}</p>
      </div>
      <div class="detail-card">
        <h4>Marchandises</h4>
        <p>⚖️ Poids total : <strong>${e.poids} kg</strong></p>
        <p>📦 Colis lourd : <strong>${e.poids_lourd} kg</strong></p>
        <p>📏 Taille max : <strong>${e.taille} cm</strong></p>
        <p>📋 Nb colis : <strong>${e.nb_colis}</strong></p>
        <p>📍 Lieu : <strong>${e.lieu}</strong></p>
      </div>
    </div>
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:4px">
      <h4 style="font-size:13px;font-weight:600;margin-bottom:10px">Tarification</h4>
      <table class="tarif-table">
        <tr><td>TOTAL HT</td><td style="text-align:right;font-family:'DM Mono',monospace">${e.prix_ht.toFixed(2)} €</td></tr>
        <tr style="color:var(--text-muted)"><td>TVA (20%)</td><td style="text-align:right;font-family:'DM Mono',monospace">${(e.prix_ht*0.2).toFixed(2)} €</td></tr>
        <tr style="background:rgba(59,130,246,0.08)"><td><strong>TOTAL TTC</strong></td><td style="text-align:right;font-family:'DM Mono',monospace;font-weight:700;color:var(--primary);font-size:15px">${e.prix_ttc.toFixed(2)} €</td></tr>
      </table>
    </div>
    ${e.historique ? `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
      <table class="history-table">
        <thead><tr><th>Évènement</th><th>Date</th><th>Commentaire</th><th>Utilisateur</th></tr></thead>
        <tbody>
          ${e.historique.map(h => `<tr><td>${renderEvenement(h.evenement)}</td><td style="font-family:'DM Mono',monospace;font-size:12px">${h.date}</td><td>${h.commentaire}</td><td style="color:var(--text-muted)">${h.utilisateur}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : '<div style="color:var(--text-muted);font-size:13px;padding:12px;text-align:center;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">Il n\'y a encore pas d\'évènement de suivi sur cette commande</div>'}
  `;
  openModal('modal-detail-expedition');
}

function renderEvenement(ev) {
  const map = { 'Collecté': '📦', 'Livré': '✅', 'SMS envoyé': '📱', 'En litige': '⚠️' };
  return `${map[ev] || '•'} ${ev}`;
}

// ─── CRÉATION EXPÉDITION ─────────────────────────────────────
function selectCreneau(btn, val) {
  document.querySelectorAll('.creneau-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedCreneau = val;
  recalculerPrix();
}

function updateClientForm() {
  const client = document.getElementById('new-client').value;
  const entreprise = ENTREPRISES.find(e => e.nom === client);
  if (entreprise) {
    document.getElementById('new-exp-nom').value = entreprise.nom;
    document.getElementById('new-exp-adresse').value = entreprise.adresse;
    document.getElementById('new-exp-cp').value = entreprise.cp;
    document.getElementById('new-exp-ville').value = entreprise.ville;
  }
}

function inverserAdresses() {
  const fields = ['nom','adresse','cp','ville','tel'];
  fields.forEach(f => {
    const exp = document.getElementById(`new-exp-${f}`);
    const dest = document.getElementById(`new-dest-${f === 'tel' ? 'tel' : f}`);
    if (exp && dest) {
      const tmp = exp.value;
      exp.value = dest.value;
      dest.value = tmp;
    }
  });
}

function recalculerPrix() {
  const poids = parseFloat(document.getElementById('new-poids-total')?.value) || 0;
  const taille = parseFloat(document.getElementById('new-taille')?.value) || 0;
  const nbLourds = parseFloat(document.getElementById('new-nb-lourds')?.value) || 0;

  if (!selectedCreneau || poids === 0) {
    document.getElementById('tarif-info').style.display = 'block';
    document.getElementById('tarif-result').style.display = 'none';
    return;
  }

  // Calcul selon grille tarifaire
  let tarif = GRILLES_TARIFAIRES.find(g => poids >= g.poids_dep && poids < g.poids_fin && taille <= g.dim_max);
  if (!tarif) tarif = GRILLES_TARIFAIRES[GRILLES_TARIFAIRES.length - 1];

  const base = tarif ? tarif.prix : 50;
  const supplement = nbLourds * 55;
  const ht = base + supplement;
  const tva = ht * 0.2;
  const ttc = ht + tva;

  document.getElementById('tarif-base').textContent = `${base.toFixed(2)} €`;
  document.getElementById('tarif-supplement').textContent = supplement > 0 ? `${supplement.toFixed(2)} €` : '—';
  document.getElementById('tarif-ht').textContent = `${ht.toFixed(2)} €`;
  document.getElementById('tarif-tva').textContent = `${tva.toFixed(2)} €`;
  document.getElementById('tarif-ttc').textContent = `${ttc.toFixed(2)} €`;

  document.getElementById('tarif-info').style.display = 'none';
  document.getElementById('tarif-result').style.display = 'block';
}

function createExpedition() {
  const client = document.getElementById('new-client').value;
  const destNom = document.getElementById('new-dest-nom').value;
  const destAdresse = document.getElementById('new-dest-adresse').value;
  const poids = document.getElementById('new-poids-total').value;
  const description = document.getElementById('new-description').value;

  if (!client || !destNom || !selectedCreneau || !poids) {
    showToast('⚠️ Veuillez remplir tous les champs obligatoires', 'warning');
    return;
  }

  const poids_ht = parseFloat(poids);
  const nbLourds = parseFloat(document.getElementById('new-nb-lourds').value) || 0;
  const taille = parseFloat(document.getElementById('new-taille').value) || 0;
  let tarif = GRILLES_TARIFAIRES.find(g => poids_ht >= g.poids_dep && poids_ht < g.poids_fin && taille <= g.dim_max);
  if (!tarif) tarif = { prix: 50 };
  const base = tarif.prix;
  const supplement = nbLourds * 55;
  const ht = base + supplement;
  const ttc = ht * 1.2;

  const newId = Math.max(...EXPEDITIONS.map(e => e.id)) + 1;
  const newExp = {
    id: newId,
    tournee: null,
    expediteur: document.getElementById('new-exp-nom').value || client,
    expediteur_adresse: document.getElementById('new-exp-adresse').value,
    expediteur_cp: document.getElementById('new-exp-cp').value,
    expediteur_ville: document.getElementById('new-exp-ville').value,
    destinataire: destNom,
    dest_adresse: destAdresse,
    dest_cp: document.getElementById('new-dest-cp').value,
    dest_ville: document.getElementById('new-dest-ville').value,
    dest_tel: document.getElementById('new-dest-tel').value,
    dest_email: document.getElementById('new-dest-email').value,
    date: document.getElementById('new-date').value,
    creneau: selectedCreneau,
    poids: parseFloat(poids),
    poids_lourd: parseFloat(document.getElementById('new-poids-lourd').value) || 0,
    taille: taille,
    nb_colis: parseInt(document.getElementById('new-nb-colis').value) || 1,
    lieu: document.getElementById('new-lieu').value,
    description: description,
    prix_ht: ht,
    prix_ttc: ttc,
    statut: 'en_attente',
    type_prix: 'Poids'
  };

  EXPEDITIONS.unshift(newExp);
  filteredExpeditions = [...EXPEDITIONS];
  closeModal('modal-create-expedition');
  renderExpeditions();
  showToast(`✅ Expédition #${newId} créée avec succès`);
}

function dupliquerById(id) {
  const e = EXPEDITIONS.find(x => x.id === id);
  if (!e) return;
  const newId = Math.max(...EXPEDITIONS.map(e => e.id)) + 1;
  const copy = { ...e, id: newId, tournee: null, statut: 'en_attente', historique: undefined };
  EXPEDITIONS.unshift(copy);
  filteredExpeditions = [...EXPEDITIONS];
  renderExpeditions();
  showToast(`⧉ Expédition #${newId} dupliquée depuis #${id}`);
}

function dupliquerExpedition() {
  const id = parseInt(document.getElementById('detail-id').textContent.replace('#',''));
  closeModal('modal-detail-expedition');
  dupliquerById(id);
}

function supprimerExpedition(id) {
  if (!confirm(`Supprimer l'expédition #${id} ?`)) return;
  const idx = EXPEDITIONS.findIndex(e => e.id === id);
  if (idx > -1) EXPEDITIONS.splice(idx, 1);
  filteredExpeditions = EXPEDITIONS.filter(e => filteredExpeditions.find(f => f.id === e.id));
  filteredExpeditions = [...EXPEDITIONS];
  renderExpeditions();
  showToast(`🗑 Expédition #${id} supprimée`);
}

// ─── DISPATCH ────────────────────────────────────────────────
function renderDispatch() {
  const unassigned = EXPEDITIONS.filter(e => !e.tournee && e.statut !== 'livre');
  const dispatchCount = document.getElementById('dispatch-count');
  if (dispatchCount) dispatchCount.textContent = unassigned.length;

  const listEl = document.getElementById('dispatch-unassigned');
  if (listEl) {
    listEl.innerHTML = unassigned.map(e => `
      <div class="dispatch-card" draggable="true" data-id="${e.id}">
        <div class="dc-header">
          <span class="dc-id">#${e.id}</span>
          <span style="font-size:11px;color:var(--warning)">${formatDate(e.date)}</span>
        </div>
        <div class="dc-dest">${e.destinataire}</div>
        <div class="dc-meta">📍 ${e.dest_cp} ${e.dest_ville} · ⏰ ${e.creneau}</div>
        <div class="dc-meta">⚖️ ${e.poids}kg · 📏 ${e.taille}cm</div>
      </div>
    `).join('');
  }

  const tourneesEl = document.getElementById('dispatch-tournees');
  if (tourneesEl) {
    const today = TOURNEES.filter(t => t.date === '2026-03-29');
    tourneesEl.innerHTML = today.map(t => `
      <div class="tournee-card">
        <div>
          <span class="tournee-name" style="background:${t.couleur}">${t.nom}</span>
          <div class="tournee-meta">📅 ${formatDate(t.date)} · ⏰ ${t.heure}</div>
          <div class="tournee-meta">📦 ${t.nb_courses} courses · ${t.vehicule || 'Véhicule non assigné'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          <span class="badge badge-success">${t.statut}</span>
          <button class="btn btn-secondary btn-sm" onclick="voirTournee(${t.id})">👁 Voir</button>
        </div>
      </div>
    `).join('') || '<div style="padding:16px;color:var(--text-muted);text-align:center;font-size:13px">Aucune tournée pour aujourd\'hui</div>';
  }
}

function autoDispatch() {
  showToast('🤖 Dispatch IA en cours... Regroupement géographique par zones', 'info');
  setTimeout(() => {
    // Simulation : on groupe les expéditions non assignées par zone
    const unassigned = EXPEDITIONS.filter(e => !e.tournee && e.statut !== 'livre');
    let assigned = 0;
    unassigned.forEach((e, i) => {
      if (i < TOURNEES.length) {
        e.tournee = TOURNEES[i % TOURNEES.length].id;
        e.statut = 'planifie';
        assigned++;
      }
    });
    renderDispatch();
    renderExpeditions();
    showToast(`✅ ${assigned} expéditions assignées automatiquement par l'IA`);
  }, 1500);
}

function createTournee() {
  const nom = document.getElementById('new-tournee-nom').value.trim();
  const date = document.getElementById('new-tournee-date').value;
  const heure = document.getElementById('new-tournee-heure').value;
  const chauffeur = document.getElementById('new-tournee-chauffeur').value;
  const couleur = document.getElementById('new-tournee-couleur').value;

  if (!nom) { showToast('⚠️ Veuillez saisir un nom de tournée', 'warning'); return; }

  const newId = Math.max(...TOURNEES.map(t => t.id)) + 1;
  TOURNEES.push({ id: newId, nom, couleur, date, heure, chauffeur, statut: 'Brouillon', nb_courses: 0 });
  closeModal('modal-create-tournee');
  renderDispatch();
  showToast(`✅ Tournée "${nom}" créée`);
}

function voirTournee(id) {
  const t = TOURNEES.find(x => x.id === id);
  if (!t) return;
  showToast(`👁 Tournée ${t.nom} — ${t.nb_courses} courses · Chauffeur: ${t.chauffeur}`);
}

// Mise à jour aperçu tournée en temps réel
document.addEventListener('DOMContentLoaded', () => {
  const nomInput = document.getElementById('new-tournee-nom');
  const couleurInput = document.getElementById('new-tournee-couleur');
  const couleurHex = document.getElementById('new-tournee-couleur-hex');
  const badge = document.getElementById('preview-badge');

  if (nomInput) nomInput.addEventListener('input', () => {
    if (badge) badge.textContent = nomInput.value || 'TOURNÉE';
  });

  if (couleurInput) couleurInput.addEventListener('input', () => {
    if (couleurHex) couleurHex.value = couleurInput.value;
    if (badge) badge.style.background = couleurInput.value;
  });

  if (couleurHex) couleurHex.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(couleurHex.value)) {
      if (couleurInput) couleurInput.value = couleurHex.value;
      if (badge) badge.style.background = couleurHex.value;
    }
  });
});

// ─── PLANNING ─────────────────────────────────────────────────
function renderPlanning() {
  const thead = document.getElementById('planning-thead');
  const tbody = document.getElementById('planning-tbody');
  const today = '2026-03-29';

  const days = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'];
  const months = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];

  // Header
  let headerHTML = '<tr><th style="text-align:left">Chauffeur</th>';
  PLANNING_DATES.forEach(d => {
    const date = new Date(d);
    const isToday = d === today;
    const dayName = days[date.getDay()];
    const dayNum = String(date.getDate()).padStart(2,'0');
    const mon = String(date.getMonth()+1).padStart(2,'0');
    headerHTML += `<th class="${isToday ? 'planning-today' : ''}">${dayName}<br>${dayNum}/${mon}</th>`;
  });
  headerHTML += '</tr>';
  thead.innerHTML = headerHTML;

  // Body
  const activeChauffeurs = CHAUFFEURS.filter(c => PLANNING_DISPO[c.id] !== undefined);
  tbody.innerHTML = activeChauffeurs.map(c => {
    const dispo = PLANNING_DISPO[c.id];
    let row = `<tr><td>${c.prenom} ${c.nom}</td>`;
    PLANNING_DATES.forEach((d, i) => {
      const isToday = d === today;
      const available = dispo[i];
      row += `<td class="${isToday ? 'planning-today' : ''}" onclick="toggleDispo(${c.id},${i})" style="cursor:pointer;text-align:center">
        ${available ? '<span class="planning-check">✓</span>' : '<span class="planning-dash">—</span>'}
      </td>`;
    });
    row += '</tr>';
    return row;
  }).join('');
}

function toggleDispo(chauffeurId, dayIndex) {
  if (!PLANNING_DISPO[chauffeurId]) return;
  PLANNING_DISPO[chauffeurId][dayIndex] = PLANNING_DISPO[chauffeurId][dayIndex] ? 0 : 1;
  renderPlanning();
}

function prevWeek() { showToast('← Semaine précédente'); }
function nextWeek() { showToast('→ Semaine suivante'); }

// ─── STATISTIQUES ────────────────────────────────────────────
function renderStats() {
  // KPIs
  const totalLivraisons = STATS_MAGASINS.reduce((s, m) => s + m.livraisons, 0);
  const totalCA = STATS_MAGASINS.reduce((s, m) => s + m.ca_ht, 0);
  const tauxMoyen = (STATS_MAGASINS.reduce((s, m) => s + m.taux_rcl, 0) / STATS_MAGASINS.length).toFixed(1);

  document.getElementById('kpi-row').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-value">${totalLivraisons.toLocaleString('fr-FR')}</div>
      <div class="kpi-label">Livraisons totales</div>
      <div class="kpi-change up">↑ +12% vs période préc.</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${totalCA.toLocaleString('fr-FR')} €</div>
      <div class="kpi-label">CA HT total</div>
      <div class="kpi-change up">↑ +8% vs période préc.</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${tauxMoyen}%</div>
      <div class="kpi-label">Taux RCL moyen</div>
      <div class="kpi-change down">↓ -0.3pt vs période préc.</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${EXPEDITIONS.filter(e=>e.statut==='en_attente').length}</div>
      <div class="kpi-label">En attente aujourd'hui</div>
      <div class="kpi-change" style="color:var(--warning)">⏳ À dispatcher</div>
    </div>
  `;

  document.getElementById('stats-magasins-tbody').innerHTML = STATS_MAGASINS.map(m => `
    <tr>
      <td style="font-weight:500">${m.nom}</td>
      <td style="font-family:'DM Mono',monospace">${m.livraisons}</td>
      <td style="font-family:'DM Mono',monospace">${m.devis}</td>
      <td style="font-family:'DM Mono',monospace">${m.ca_ht.toLocaleString('fr-FR')} €</td>
      <td><span class="badge ${m.taux_rcl > 2.5 ? 'badge-warning' : 'badge-success'}">${m.taux_rcl}%</span></td>
    </tr>
  `).join('');

  document.getElementById('stats-chauffeurs-tbody').innerHTML = STATS_CHAUFFEURS.map(c => `
    <tr>
      <td style="font-weight:500">${c.nom}</td>
      <td style="font-family:'DM Mono',monospace">${c.livraisons}</td>
      <td>—</td>
      <td style="font-family:'DM Mono',monospace">${c.ca_ht.toLocaleString('fr-FR')} €</td>
      <td><span class="badge ${c.taux_rcl > 2.5 ? 'badge-warning' : 'badge-success'}">${c.taux_rcl}%</span></td>
    </tr>
  `).join('');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById('stats-magasins').style.display = tab === 'magasins' ? 'flex' : 'none';
  document.getElementById('stats-chauffeurs').style.display = tab === 'chauffeurs' ? 'flex' : 'none';
  document.getElementById('stats-magasins').style.flexDirection = 'column';
  document.getElementById('stats-magasins').style.gap = '12px';
}

// ─── ADMINISTRATION ──────────────────────────────────────────
function renderAdmin() {
  // Chauffeurs
  document.getElementById('chauffeurs-tbody').innerHTML = CHAUFFEURS.map(c => `
    <tr>
      <td style="font-family:'DM Mono',monospace">${c.id}</td>
      <td>${c.prenom}</td>
      <td>${c.nom}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon">📋</button>
          <button class="btn-icon">✏️</button>
          <button class="btn-icon danger">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Entreprises
  document.getElementById('entreprises-tbody').innerHTML = ENTREPRISES.map(e => `
    <tr>
      <td style="font-family:'DM Mono',monospace">${e.id}</td>
      <td style="color:var(--primary);font-weight:500">${e.nom}</td>
      <td style="font-size:12px">${e.adresse}<br>${e.cp} ${e.ville}</td>
      <td><button class="btn-icon">✏️</button></td>
    </tr>
  `).join('');

  // Véhicules
  const vehTbody = document.getElementById('vehicules-tbody');
  if (vehTbody) {
    vehTbody.innerHTML = VEHICULES.map(v => `
      <tr>
        <td style="font-family:'DM Mono',monospace">${v.id}</td>
        <td>${v.nom}</td>
        <td style="font-family:'DM Mono',monospace">${v.plaque || '—'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon">✏️</button>
            <button class="btn-icon danger">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Grilles tarifaires
  document.getElementById('tarifs-tbody').innerHTML = GRILLES_TARIFAIRES.map(g => `
    <tr>
      <td style="font-family:'DM Mono',monospace">${g.poids_dep} Kgs</td>
      <td style="font-family:'DM Mono',monospace">${g.poids_fin} Kgs</td>
      <td style="font-family:'DM Mono',monospace">${g.colis_unique} Kgs</td>
      <td style="font-family:'DM Mono',monospace">${g.dim_max} cms</td>
      <td>${g.lieu}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600;color:var(--success)">${g.prix} €</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon">✏️</button>
          <button class="btn-icon danger">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showAdminSub(sub) {
  document.querySelectorAll('.admin-sub').forEach(el => el.style.display = 'none');
  const el = document.getElementById(`admin-${sub}`);
  if (el) el.style.display = 'block';
}

// ─── CRÉATION VÉHICULE ──────────────────────────────────────
async function createVehicule() {
  const nom = document.getElementById('new-veh-nom').value.trim();
  const plaque = document.getElementById('new-veh-plaque').value.trim().toUpperCase();

  if (!nom || !plaque) {
    showToast('Veuillez remplir le type et la plaque', 'warning');
    return;
  }

  try {
    const { data, error } = await db.from('vehicules').insert({ nom, plaque }).select().single();
    if (error) throw error;
    VEHICULES.push(data);
  } catch (err) {
    console.error('[NAMY] Erreur création véhicule:', err);
    const newId = VEHICULES.length ? Math.max(...VEHICULES.map(v => v.id)) + 1 : 1;
    VEHICULES.push({ id: newId, nom, plaque });
  }

  renderAdmin();
  closeModal('modal-create-vehicule');
  document.getElementById('new-veh-nom').value = '';
  document.getElementById('new-veh-plaque').value = '';
  showToast(`Véhicule "${nom}" ajouté avec succès`);
}

// ─── CRÉATION UTILISATEUR ───────────────────────────────────
async function createUtilisateur() {
  const prenom = document.getElementById('new-user-prenom').value.trim();
  const nom = document.getElementById('new-user-nom').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const password = document.getElementById('new-user-password').value;
  const role = document.getElementById('new-user-role').value;
  const entreprise_id = document.getElementById('new-user-entreprise').value || null;

  if (!prenom || !nom || !email || !password || !role) {
    showToast('Veuillez remplir tous les champs obligatoires', 'warning');
    return;
  }

  if (password.length < 8) {
    showToast('Le mot de passe doit contenir au moins 8 caractères', 'warning');
    return;
  }

  try {
    const { data, error } = await db.functions.invoke('create-user', {
      body: { email, password, role, prenom, nom, entreprise_id: entreprise_id ? parseInt(entreprise_id) : null }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    closeModal('modal-create-utilisateur');
    document.getElementById('new-user-prenom').value = '';
    document.getElementById('new-user-nom').value = '';
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-password').value = '';
    document.getElementById('new-user-role').value = '';
    document.getElementById('new-user-entreprise').value = '';
    showToast(`Utilisateur "${prenom} ${nom}" (${role}) créé avec succès`);
  } catch (err) {
    console.error('[NAMY] Erreur création utilisateur:', err);
    showToast(`Erreur : ${err.message || 'Impossible de créer l\'utilisateur'}`, 'warning');
  }
}

// ─── CRÉATION CHAUFFEUR ──────────────────────────────────────
async function createChauffeur() {
  const prenom = document.getElementById('new-chauff-prenom').value.trim();
  const nom = document.getElementById('new-chauff-nom').value.trim();
  const tel = document.getElementById('new-chauff-tel').value.trim();
  const entreprise_id = document.getElementById('new-chauff-entreprise').value || null;
  const actif = document.getElementById('new-chauff-actif').checked;

  if (!prenom || !nom) {
    showToast('Veuillez remplir le prénom et le nom', 'warning');
    return;
  }

  const newChauffeur = { prenom, nom, tel: tel || null, entreprise_id: entreprise_id ? parseInt(entreprise_id) : null, actif };

  try {
    const { data, error } = await db
      .from('chauffeurs')
      .insert(newChauffeur)
      .select()
      .single();

    if (error) throw error;

    CHAUFFEURS.push(data);
    populateDropdowns();
    renderAdmin();
    closeModal('modal-create-chauffeur');
    resetChauffeurForm();
    showToast(`Chauffeur "${prenom} ${nom}" ajouté avec succès`);
  } catch (err) {
    console.error('[NAMY] Erreur création chauffeur:', err);
    const newId = CHAUFFEURS.length ? Math.max(...CHAUFFEURS.map(c => c.id)) + 1 : 1;
    CHAUFFEURS.push({ id: newId, ...newChauffeur });
    populateDropdowns();
    renderAdmin();
    closeModal('modal-create-chauffeur');
    resetChauffeurForm();
    showToast(`Chauffeur "${prenom} ${nom}" ajouté localement (hors-ligne)`, 'info');
  }
}

function resetChauffeurForm() {
  document.getElementById('new-chauff-prenom').value = '';
  document.getElementById('new-chauff-nom').value = '';
  document.getElementById('new-chauff-tel').value = '';
  document.getElementById('new-chauff-entreprise').value = '';
  document.getElementById('new-chauff-actif').checked = true;
}

// ─── FILTRE DATES STATS ─────────────────────────────────────
function applyStatsDateFilter() {
  const from = document.getElementById('stats-date-from').value;
  const to = document.getElementById('stats-date-to').value;
  closeModal('modal-dates');
  renderStats();
  showToast(`Statistiques filtrées du ${new Date(from).toLocaleDateString('fr-FR')} au ${new Date(to).toLocaleDateString('fr-FR')}`);
}

// ─── CRÉATION ENTREPRISE ─────────────────────────────────────
async function createEntreprise() {
  const nom = document.getElementById('new-ent-nom').value.trim();
  const adresse = document.getElementById('new-ent-adresse').value.trim();
  const cp = document.getElementById('new-ent-cp').value.trim();
  const ville = document.getElementById('new-ent-ville').value.trim();
  const tel = document.getElementById('new-ent-tel').value.trim();
  const lat = parseFloat(document.getElementById('new-ent-lat').value) || null;
  const lng = parseFloat(document.getElementById('new-ent-lng').value) || null;

  if (!nom || !adresse || !cp || !ville) {
    showToast('Veuillez remplir les champs obligatoires (nom, adresse, CP, ville)', 'warning');
    return;
  }

  const newEntreprise = { nom, adresse, cp, ville, tel: tel || null, lat, lng };

  try {
    const { data, error } = await db
      .from('entreprises')
      .insert(newEntreprise)
      .select()
      .single();

    if (error) throw error;

    // Ajouter aux données locales
    ENTREPRISES.push(data);
    populateDropdowns();
    renderAdmin();
    closeModal('modal-create-entreprise');

    // Réinitialiser le formulaire
    document.getElementById('new-ent-nom').value = '';
    document.getElementById('new-ent-adresse').value = '';
    document.getElementById('new-ent-cp').value = '';
    document.getElementById('new-ent-ville').value = '';
    document.getElementById('new-ent-tel').value = '';
    document.getElementById('new-ent-lat').value = '';
    document.getElementById('new-ent-lng').value = '';

    showToast(`Entreprise "${nom}" ajoutée avec succès`);
  } catch (err) {
    console.error('[NAMY] Erreur création entreprise:', err);

    // Fallback local si Supabase échoue
    const newId = ENTREPRISES.length ? Math.max(...ENTREPRISES.map(e => e.id)) + 1 : 1;
    ENTREPRISES.push({ id: newId, ...newEntreprise });
    populateDropdowns();
    renderAdmin();
    closeModal('modal-create-entreprise');

    document.getElementById('new-ent-nom').value = '';
    document.getElementById('new-ent-adresse').value = '';
    document.getElementById('new-ent-cp').value = '';
    document.getElementById('new-ent-ville').value = '';
    document.getElementById('new-ent-tel').value = '';
    document.getElementById('new-ent-lat').value = '';
    document.getElementById('new-ent-lng').value = '';

    showToast(`Entreprise "${nom}" ajoutée localement (hors-ligne)`, 'info');
  }
}

// ─── EXTRACTION ──────────────────────────────────────────────
function generateExport(format) {
  const entreprise = document.getElementById('extract-entreprise').value || 'toutes les entreprises';
  const from = document.getElementById('extract-from').value;
  const to = document.getElementById('extract-to').value;
  showToast(`📥 Export ${format.toUpperCase()} généré pour ${entreprise} du ${from} au ${to}`);
}

// ─── MODALS ──────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Fermer en cliquant sur l'overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// ─── TOAST ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.borderLeft = `3px solid ${type === 'warning' ? 'var(--warning)' : type === 'info' ? 'var(--info)' : 'var(--success)'}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  filteredExpeditions = [...EXPEDITIONS];
  renderExpeditions();
});
