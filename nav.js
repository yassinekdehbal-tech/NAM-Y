// ─── NAMY NAV.JS — Navigation universelle ───────────────────
// Inclure sur toutes les pages : <script src="nav.js"></script>
// Doit être chargé APRÈS supabase-client.js et utils.js

(function() {
  const ROLE_LABELS = {
    admin:'Admin', client:'Client', fournisseur:'Fournisseur',
    dispatcher:'Dispatcher', vendeur:'Vendeur', livreur:'Livreur',
    dirigeant:'Client', exploitant:'Fournisseur'
  };

  const NAV_LINKS = {
    admin:       [
      { href:'index.html',               label:'Expéditions' },
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
      { href:'dispatch.html',            label:'Dispatch' },
      { href:'grilles-tarifaires.html',  label:'Grilles' },
      { href:'admin.html',               label:'Admin' },
      { href:'dashboard.html',           label:'Dashboard' },
    ],
    dispatcher:  [
      { href:'index.html',               label:'Expéditions' },
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
      { href:'dispatch.html',            label:'Dispatch' },
      { href:'dashboard.html',           label:'Dashboard' },
    ],
    client:      [
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
      { href:'dashboard-client.html',    label:'Mon espace' },
    ],
    dirigeant:   [
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
      { href:'dashboard-client.html',    label:'Mon espace' },
    ],
    vendeur:     [
      { href:'index.html',               label:'Expéditions' },
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
    ],
    fournisseur: [
      { href:'index.html',                    label:'Expéditions' },
      { href:'dashboard-transporteur.html',   label:'Mon espace' },
    ],
    exploitant:  [
      { href:'index.html',                    label:'Expéditions' },
      { href:'dashboard-transporteur.html',   label:'Mon espace' },
    ],
  };

  function getCurrentPage() {
    const path = window.location.pathname;
    const file = path.split('/').pop() || 'index.html';
    return file;
  }

  function buildNav() {
    const user = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const role = user ? user.role : null;
    const links = NAV_LINKS[role] || [{ href:'login.html', label:'Connexion' }];
    const currentPage = getCurrentPage();
    const prenom = user ? (user.prenom || user.email || '') : '';
    const roleLabel = ROLE_LABELS[role] || role || '';

    // Remove existing nav if re-rendered
    const existing = document.getElementById('namy-topnav');
    if (existing) existing.remove();

    const nav = document.createElement('header');
    nav.id = 'namy-topnav';
    nav.innerHTML = `
      <div style="background:#fff;border-bottom:1px solid #E8EDF3;height:52px;display:flex;align-items:center;padding:0 20px;gap:16px;position:sticky;top:0;z-index:1000;font-family:'DM Sans',sans-serif">
        <a href="index.html" style="font-size:14px;font-weight:800;letter-spacing:6px;color:#1A2332;text-decoration:none">NAMY</a>
        <div style="width:1px;height:24px;background:#E8EDF3"></div>
        <nav style="display:flex;gap:2px">
          ${links.map(l => {
            const active = currentPage === l.href;
            return `<a href="${l.href}" style="padding:6px 14px;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;${active ? 'background:#00C9A7;color:#fff' : 'color:#6B7F99'}">${l.label}</a>`;
          }).join('')}
        </nav>
        <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
          ${prenom ? `<span style="font-size:13px;color:#6B7F99">${prenom}</span>` : ''}
          ${roleLabel ? `<span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;background:rgba(0,201,167,.12);color:#00A389">${roleLabel}</span>` : ''}
          <button id="namy-logout-btn" style="background:none;border:1px solid #E8EDF3;border-radius:6px;color:#EF4444;font-size:12px;padding:5px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s">Déconnexion</button>
        </div>
      </div>
    `;

    document.body.insertBefore(nav, document.body.firstChild);

    // Logout handler — appelle db.auth.signOut() puis redirige
    document.getElementById('namy-logout-btn').addEventListener('click', async () => {
      try {
        if (typeof db !== 'undefined' && db.auth) {
          await db.auth.signOut();
        }
      } catch(e) { /* ignore signOut errors */ }
      sessionStorage.removeItem('namy_user');
      sessionStorage.removeItem('namy_role');
      window.location.href = 'login.html';
    });
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildNav);
  } else {
    buildNav();
  }

  // Expose for manual refresh
  window.buildNav = buildNav;
})();
