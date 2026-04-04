// ─── NAMY NAV.JS — Navigation universelle + Widget Chat ──────
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
      { href:'litiges.html',             label:'Litiges' },
      { href:'grilles-tarifaires.html',  label:'Grilles' },
      { href:'admin.html',               label:'Admin' },
      { href:'dashboard.html',           label:'Dashboard' },
    ],
    dispatcher:  [
      { href:'index.html',               label:'Expéditions' },
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
      { href:'dispatch.html',            label:'Dispatch' },
      { href:'litiges.html',             label:'Litiges' },
      { href:'dashboard.html',           label:'Dashboard' },
    ],
    client:      [
      { href:'index.html',               label:'Expéditions' },
      { href:'litiges.html',             label:'Litiges' },
      { href:'dashboard.html',           label:'Mon espace' },
    ],
    dirigeant:   [
      { href:'index.html',               label:'Expéditions' },
      { href:'litiges.html',             label:'Litiges' },
      { href:'dashboard.html',           label:'Mon espace' },
    ],
    vendeur:     [
      { href:'index.html',               label:'Expéditions' },
      { href:'formulaire-vendeur.html',  label:'+ Expédition' },
    ],
    fournisseur: [
      { href:'index.html',               label:'Expéditions' },
      { href:'litiges.html',             label:'Litiges' },
      { href:'dashboard.html',           label:'Mon espace' },
    ],
    exploitant:  [
      { href:'index.html',               label:'Expéditions' },
      { href:'litiges.html',             label:'Litiges' },
      { href:'dashboard.html',           label:'Mon espace' },
    ],
  };

  // Rôles qui voient toutes les conversations
  const CHAT_ADMIN_ROLES = ['admin','dispatcher'];
  // Rôles qui voient uniquement leur conversation
  const CHAT_CLIENT_ROLES = ['client','dirigeant','vendeur'];
  // Rôles sans chat
  const CHAT_HIDDEN_ROLES = ['fournisseur','exploitant','livreur'];

  function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
  }

  // ─── TOPBAR ───────────────────────────────────────────────
  function buildNav() {
    const user = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const role = user ? user.role : null;
    const links = NAV_LINKS[role] || [{ href:'login.html', label:'Connexion' }];
    const currentPage = getCurrentPage();
    const prenom = user ? (user.prenom || user.email || '') : '';
    const roleLabel = ROLE_LABELS[role] || role || '';

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

    document.getElementById('namy-logout-btn').addEventListener('click', async () => {
      try { if (typeof db !== 'undefined' && db.auth) await db.auth.signOut(); } catch(e) {}
      sessionStorage.removeItem('namy_user');
      sessionStorage.removeItem('namy_role');
      window.location.href = 'login.html';
    });

    // Injecter le widget chat si rôle autorisé
    if (role && !CHAT_HIDDEN_ROLES.includes(role)) {
      buildChatWidget(user, role);
    }
  }

  // ─── WIDGET CHAT ──────────────────────────────────────────
  let chatState = 'bubble'; // bubble | list | thread | expanded
  let chatConversations = [];
  let chatMessages = [];
  let chatActiveConvId = null;
  let chatRealtimeChannel = null;

  function buildChatWidget(user, role) {
    if (document.getElementById('namy-chat-widget')) return;

    const isAdmin = CHAT_ADMIN_ROLES.includes(role);

    // CSS
    const style = document.createElement('style');
    style.textContent = `
      #namy-chat-widget{position:fixed;bottom:20px;right:20px;z-index:9990;font-family:'DM Sans',sans-serif}
      .chat-bubble{width:56px;height:56px;border-radius:50%;background:#00C9A7;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,201,167,.35);font-size:22px;transition:transform .15s;position:relative}
      .chat-bubble:hover{transform:scale(1.08)}
      .chat-badge{position:absolute;top:-4px;right:-4px;background:#991B1B;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;display:none}
      .chat-panel{width:350px;height:500px;background:#fff;border:1px solid #E8EDF3;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);display:none;flex-direction:column;overflow:hidden}
      .chat-panel.expanded{position:fixed;top:5vh;left:10vw;right:10vw;bottom:5vh;width:auto;height:auto;border-radius:20px;z-index:9999}
      .chat-hdr{height:48px;background:#fff;border-bottom:1px solid #E8EDF3;display:flex;align-items:center;padding:0 14px;gap:8px;flex-shrink:0}
      .chat-hdr-title{font-size:14px;font-weight:600;color:#0F1923;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .chat-hdr-btn{background:none;border:none;color:#8A9BAE;cursor:pointer;font-size:16px;padding:4px 6px;border-radius:4px;transition:background .1s}
      .chat-hdr-btn:hover{background:#F0F4F9;color:#0F1923}
      .chat-conv-list{flex:1;overflow-y:auto}
      .chat-conv-item{padding:12px 14px;border-bottom:1px solid #E8EDF3;cursor:pointer;transition:background .1s;display:flex;gap:10px;align-items:center}
      .chat-conv-item:hover{background:#F0F4F9}
      .chat-conv-item.active{background:#E6FAF6;border-left:3px solid #00C9A7}
      .chat-conv-av{width:36px;height:36px;border-radius:50%;background:#E8EDF5;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#4A5568;flex-shrink:0}
      .chat-conv-info{flex:1;min-width:0}
      .chat-conv-name{font-size:13px;font-weight:600;color:#0F1923}
      .chat-conv-preview{font-size:12px;color:#8A9BAE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .chat-conv-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
      .chat-conv-time{font-size:10px;color:#B8C4CE;font-family:'DM Mono',monospace}
      .chat-conv-badge{background:#991B1B;color:#fff;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px}
      .chat-msg-area{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#F7F9FC}
      .chat-msg{max-width:78%;padding:9px 13px;border-radius:14px;font-size:13px;line-height:1.5}
      .chat-msg-left{align-self:flex-start;background:#fff;color:#0F1923;border:1px solid #E8EDF3;border-bottom-left-radius:4px}
      .chat-msg-right{align-self:flex-end;background:#00C9A7;color:#fff;border-bottom-right-radius:4px}
      .chat-msg-ia{align-self:flex-end;background:linear-gradient(135deg,#7C3AED,#00C9A7);color:#fff;border-bottom-right-radius:4px}
      .chat-msg-meta{font-size:10px;opacity:.6;margin-top:3px}
      .chat-msg-badge-ia{background:#7C3AED;color:#fff;font-size:8px;padding:1px 5px;border-radius:8px;margin-right:4px}
      .chat-input-bar{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #E8EDF3;background:#fff;flex-shrink:0}
      .chat-input{flex:1;border:1px solid #CDD5DF;border-radius:8px;padding:8px 12px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;resize:none;min-height:36px;max-height:80px}
      .chat-input:focus{border-color:#00C9A7;box-shadow:0 0 0 2px rgba(0,201,167,.12)}
      .chat-send-btn{background:#00C9A7;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;transition:background .15s;white-space:nowrap}
      .chat-send-btn:hover{background:#009E85}
      .chat-ai-btn{background:#7C3AED;color:#fff;border:none;border-radius:8px;padding:8px;cursor:pointer;font-size:14px;transition:background .15s}
      .chat-ai-btn:hover{background:#6D28D9}
      .chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#8A9BAE;font-size:13px;gap:8px}
      .chat-new-btn{display:block;padding:10px;text-align:center;border-top:1px solid #E8EDF3;color:#00C9A7;font-size:13px;font-weight:600;cursor:pointer;background:#fff;transition:background .1s}
      .chat-new-btn:hover{background:#E6FAF6}
    `;
    document.head.appendChild(style);

    // HTML
    const widget = document.createElement('div');
    widget.id = 'namy-chat-widget';
    widget.innerHTML = `
      <div class="chat-bubble" id="chat-bubble" onclick="window._namyChat.toggle()">
        💬
        <div class="chat-badge" id="chat-total-badge"></div>
      </div>
      <div class="chat-panel" id="chat-panel">
        <!-- STATE: LIST -->
        <div id="chat-view-list" style="display:flex;flex-direction:column;height:100%">
          <div class="chat-hdr">
            <div class="chat-hdr-title">Messages</div>
            <button class="chat-hdr-btn" onclick="window._namyChat.expand()" title="Agrandir">⛶</button>
            <button class="chat-hdr-btn" onclick="window._namyChat.close()">✕</button>
          </div>
          <div class="chat-conv-list" id="chat-conv-list"></div>
          ${isAdmin ? '<div class="chat-new-btn" onclick="window._namyChat.newConv()">+ Nouvelle conversation</div>' : ''}
        </div>
        <!-- STATE: THREAD -->
        <div id="chat-view-thread" style="display:none;flex-direction:column;height:100%">
          <div class="chat-hdr">
            <button class="chat-hdr-btn" onclick="window._namyChat.backToList()">←</button>
            <div class="chat-hdr-title" id="chat-thread-title">...</div>
            <button class="chat-hdr-btn chat-ai-btn" onclick="window._namyChat.generateAI()" title="Réponse IA" style="font-size:12px;padding:4px 8px">🤖</button>
            <button class="chat-hdr-btn" onclick="window._namyChat.expand()" title="Agrandir">⛶</button>
            <button class="chat-hdr-btn" onclick="window._namyChat.close()">✕</button>
          </div>
          <div class="chat-msg-area" id="chat-msg-area"></div>
          <div class="chat-input-bar">
            <textarea class="chat-input" id="chat-msg-input" placeholder="Message..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window._namyChat.send()}"></textarea>
            <button class="chat-send-btn" onclick="window._namyChat.send()">Envoyer</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // Expose API
    window._namyChat = {
      toggle: function() {
        const panel = document.getElementById('chat-panel');
        const bubble = document.getElementById('chat-bubble');
        if (panel.style.display === 'flex') { panel.style.display = 'none'; bubble.style.display = 'flex'; chatState = 'bubble'; }
        else { panel.style.display = 'flex'; bubble.style.display = 'none'; chatState = 'list'; showView('list'); loadConversations(); }
      },
      close: function() {
        document.getElementById('chat-panel').style.display = 'none';
        document.getElementById('chat-bubble').style.display = 'flex';
        document.getElementById('chat-panel').classList.remove('expanded');
        chatState = 'bubble';
      },
      expand: function() {
        document.getElementById('chat-panel').classList.toggle('expanded');
        chatState = document.getElementById('chat-panel').classList.contains('expanded') ? 'expanded' : (chatActiveConvId ? 'thread' : 'list');
      },
      backToList: function() { chatActiveConvId = null; showView('list'); loadConversations(); },
      send: sendMessage,
      generateAI: generateAIResponse,
      newConv: newConversation,
    };

    // Init realtime
    initChatRealtime(user, role);
    // Check unread on load
    checkUnread(user, role);
  }

  function showView(view) {
    document.getElementById('chat-view-list').style.display = view === 'list' ? 'flex' : 'none';
    document.getElementById('chat-view-thread').style.display = view === 'thread' ? 'flex' : 'none';
  }

  // ─── CONVERSATIONS ────────────────────────────────────────
  async function loadConversations() {
    const user = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const role = user?.role;
    const isAdmin = CHAT_ADMIN_ROLES.includes(role);

    try {
      let query = db.from('conversations').select('*').order('dernier_message_at', { ascending: false });
      if (!isAdmin && user?.entreprise_id) query = query.eq('entreprise_id', user.entreprise_id);
      const { data } = await query;
      chatConversations = data || [];
    } catch(e) { chatConversations = []; }

    renderConversations();
  }

  function renderConversations() {
    const list = document.getElementById('chat-conv-list');
    if (!list) return;
    if (!chatConversations.length) {
      list.innerHTML = '<div class="chat-empty"><span style="font-size:28px">💬</span>Aucune conversation</div>';
      return;
    }
    list.innerHTML = chatConversations.map(c => {
      const initials = (c.entreprise_nom || '??').substring(0, 2).toUpperCase();
      const unread = c.non_lus_namy || c.non_lus_client || 0;
      const time = c.dernier_message_at ? timeAgo(c.dernier_message_at) : '';
      const preview = (c.dernier_message || '').substring(0, 40);
      return `<div class="chat-conv-item${c.id == chatActiveConvId ? ' active' : ''}" onclick="window._namyChat._selectConv('${c.id}')">
        <div class="chat-conv-av">${initials}</div>
        <div class="chat-conv-info">
          <div class="chat-conv-name">${c.entreprise_nom || 'Sans nom'}</div>
          <div class="chat-conv-preview">${preview || 'Nouvelle conversation'}</div>
        </div>
        <div class="chat-conv-meta">
          <div class="chat-conv-time">${time}</div>
          ${unread > 0 ? '<div class="chat-conv-badge">' + unread + '</div>' : ''}
        </div>
      </div>`;
    }).join('');
  }

  window._namyChat = window._namyChat || {};
  window._namyChat._selectConv = async function(id) {
    chatActiveConvId = id;
    const conv = chatConversations.find(c => c.id == id);
    document.getElementById('chat-thread-title').textContent = conv?.entreprise_nom || 'Conversation';

    // Mark as read
    const user = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const isAdmin = CHAT_ADMIN_ROLES.includes(user?.role);
    const field = isAdmin ? 'non_lus_namy' : 'non_lus_client';
    try { await db.from('conversations').update({ [field]: 0 }).eq('id', id); } catch(e) {}

    // Load messages
    try {
      const { data } = await db.from('messages').select('*').eq('conversation_id', id).order('created_at');
      chatMessages = data || [];
    } catch(e) { chatMessages = []; }

    showView('thread');
    renderMessages();
    checkUnread(user, user?.role);
  };

  function renderMessages() {
    const area = document.getElementById('chat-msg-area');
    if (!area) return;
    const user = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const isAdmin = CHAT_ADMIN_ROLES.includes(user?.role);

    area.innerHTML = chatMessages.map(m => {
      const isMe = isAdmin
        ? ['admin','dispatcher'].includes(m.auteur_role)
        : ['client','dirigeant','vendeur'].includes(m.auteur_role);
      const isIA = m.type === 'ia';
      const cls = isMe ? (isIA ? 'chat-msg chat-msg-ia' : 'chat-msg chat-msg-right') : 'chat-msg chat-msg-left';
      const time = m.created_at ? new Date(m.created_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '';
      const content = m.type === 'photo' ? '<img src="' + m.contenu + '" style="max-width:180px;border-radius:8px">' : escapeHtml(m.contenu);
      return `<div class="${cls}">
        ${isIA ? '<span class="chat-msg-badge-ia">IA</span>' : ''}
        ${content}
        <div class="chat-msg-meta">${m.auteur_nom || ''} · ${time}</div>
      </div>`;
    }).join('');
    area.scrollTop = area.scrollHeight;
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  // ─── SEND MESSAGE ─────────────────────────────────────────
  async function sendMessage() {
    const input = document.getElementById('chat-msg-input');
    const text = (input?.value || '').trim();
    if (!text || !chatActiveConvId) return;
    input.value = '';
    input.style.height = 'auto';

    const user = typeof getSessionUser === 'function' ? getSessionUser() : null;
    const isAdmin = CHAT_ADMIN_ROLES.includes(user?.role);
    const msg = {
      conversation_id: chatActiveConvId,
      auteur_id: user?.auth_id,
      auteur_nom: user ? ((user.prenom || '') + ' ' + (user.nom || '')).trim() : 'Utilisateur',
      auteur_role: user?.role || 'admin',
      contenu: text,
      type: 'texte',
      lu_par_namy: isAdmin,
      lu_par_client: !isAdmin,
    };

    try {
      await db.from('messages').insert(msg);
      const updateField = isAdmin ? 'non_lus_client' : 'non_lus_namy';
      // Increment unread for the other side
      const conv = chatConversations.find(c => c.id == chatActiveConvId);
      const currentCount = conv ? (conv[updateField] || 0) : 0;
      await db.from('conversations').update({
        dernier_message: text,
        dernier_message_at: new Date().toISOString(),
        [updateField]: currentCount + 1,
      }).eq('id', chatActiveConvId);
    } catch(e) { console.warn('Chat send error:', e); }
  }

  // ─── AI RESPONSE ──────────────────────────────────────────
  async function generateAIResponse() {
    if (!chatActiveConvId) return;
    const conv = chatConversations.find(c => c.id == chatActiveConvId);
    let expeditions = [];
    if (conv?.entreprise_id) {
      try {
        const { data } = await db.from('expeditions').select('id, destinataire, statut, date, creneau')
          .eq('entreprise_id', conv.entreprise_id).order('created_at', { ascending: false }).limit(5);
        expeditions = data || [];
      } catch(e) {}
    }

    const lastMsgs = chatMessages.slice(-5).map(m => '[' + m.auteur_role + '] ' + m.contenu).join('\n');
    const aiText = 'Bonjour ! Je suis l\'assistant NAMY. '
      + (expeditions.length ? 'Je vois ' + expeditions.length + ' expédition(s) récente(s) pour ' + (conv?.entreprise_nom || 'votre magasin') + '. ' : '')
      + 'Comment puis-je vous aider ?';

    const input = document.getElementById('chat-msg-input');
    if (input) { input.value = aiText; input.focus(); }
    if (typeof showToast === 'function') showToast('Réponse IA générée — modifiez avant d\'envoyer');
  }

  // ─── NEW CONVERSATION ─────────────────────────────────────
  async function newConversation() {
    let entreprises = [];
    try { const { data } = await db.from('entreprises').select('id, nom').order('nom'); entreprises = data || []; } catch(e) {}

    const name = prompt('Nom du magasin :\n' + entreprises.map((e, i) => (i + 1) + '. ' + e.nom).join('\n'));
    if (!name) return;

    const match = entreprises.find(e => e.nom.toLowerCase().includes(name.toLowerCase()));
    try {
      const { data } = await db.from('conversations').insert({
        entreprise_id: match?.id || null,
        entreprise_nom: match?.nom || name,
        canal: 'namy',
      }).select().single();
      if (data) {
        chatConversations.unshift(data);
        window._namyChat._selectConv(data.id);
      }
    } catch(e) { console.warn('New conv error:', e); }
  }

  // ─── REALTIME ─────────────────────────────────────────────
  function initChatRealtime(user, role) {
    if (typeof db === 'undefined' || !db.channel) return;
    try {
      db.channel('nav-chat-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.new.conversation_id == chatActiveConvId) {
            chatMessages.push(payload.new);
            renderMessages();
          }
          loadConversations();
          checkUnread(user, role);
        })
        .subscribe();

      db.channel('nav-chat-conversations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          loadConversations();
          checkUnread(user, role);
        })
        .subscribe();
    } catch(e) {}
  }

  async function checkUnread(user, role) {
    const badge = document.getElementById('chat-total-badge');
    if (!badge) return;
    const isAdmin = CHAT_ADMIN_ROLES.includes(role);
    const field = isAdmin ? 'non_lus_namy' : 'non_lus_client';

    try {
      let query = db.from('conversations').select(field);
      if (!isAdmin && user?.entreprise_id) query = query.eq('entreprise_id', user.entreprise_id);
      const { data } = await query;
      const total = (data || []).reduce((s, c) => s + (c[field] || 0), 0);
      if (total > 0) { badge.textContent = total; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    } catch(e) { badge.style.display = 'none'; }
  }

  // ─── UTILS ────────────────────────────────────────────────
  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'maintenant';
    if (diff < 3600) return Math.floor(diff / 60) + 'min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    return Math.floor(diff / 86400) + 'j';
  }

  // ─── INIT ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildNav);
  } else {
    buildNav();
  }

  window.buildNav = buildNav;
})();
