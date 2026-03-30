// ─── NAMY UTILS (fonctions partagées) ────────────────────────

// ─── TOAST ──────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast') || document.getElementById('notif');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  const colors = { warning: 'var(--warning, #f59e0b)', info: 'var(--info, #3b82f6)', success: 'var(--success, #10b981)', danger: 'var(--danger, #ef4444)' };
  toast.style.borderLeft = `3px solid ${colors[type] || colors.success}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── MODALS ─────────────────────────────────────────────────
function openModal(id, callback) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
  if (callback) setTimeout(callback, 100);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Fermer en cliquant sur l'overlay
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });
});

// ─── DATE ───────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

// ─── SESSION ────────────────────────────────────────────────
function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('namy_user') || 'null');
  } catch { return null; }
}

function getSessionRole() {
  return sessionStorage.getItem('namy_role') || null;
}
