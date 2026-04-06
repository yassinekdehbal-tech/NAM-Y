// ─── SUPABASE CLIENT (source unique) ────────────────────────
// Ce fichier DOIT être chargé APRÈS le CDN Supabase dans chaque HTML :
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="supabase-client.js"></script>

(function() {
  var SUPA_URL = 'https://gwbvfohizdxwhmcoqvgh.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YnZmb2hpemR4d2htY29xdmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ2MDksImV4cCI6MjA5MDQ0MDYwOX0.gOt8J2k7OV5W4SPtKrEV1sL6-C9eLE2hG3DuMzuaMKg';

  // Le CDN expose window.supabase avec la méthode createClient
  var lib = window.supabase;
  if (!lib || typeof lib.createClient !== 'function') {
    console.error('[supabase-client.js] SDK Supabase non chargé. Vérifiez que le CDN est inclus AVANT ce script.');
    // Créer un stub pour éviter les crashes en cascade
    window.db = { from: function() { return { select: function() { return { eq: function() { return { order: function() { return { limit: function() { return Promise.resolve({ data: [], error: 'SDK not loaded' }); } }; } }; } }; } }; }, auth: { getSession: function() { return Promise.resolve({ data: { session: null } }); }, signOut: function() { return Promise.resolve(); } }, channel: function() { return { on: function() { return this; }, subscribe: function() { return this; } }; }, functions: { invoke: function() { return Promise.resolve({ data: null, error: 'SDK not loaded' }); } }, storage: { from: function() { return { upload: function() { return Promise.resolve({ error: 'SDK not loaded' }); }, getPublicUrl: function() { return { data: { publicUrl: '' } }; } }; } } };
    return;
  }

  window.db = lib.createClient(SUPA_URL, SUPA_KEY);
})();
