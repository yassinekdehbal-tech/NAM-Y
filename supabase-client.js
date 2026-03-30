// ─── SUPABASE CLIENT (source unique) ────────────────────────
const SUPA_URL = 'https://gwbvfohizdxwhmcoqvgh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YnZmb2hpemR4d2htY29xdmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ2MDksImV4cCI6MjA5MDQ0MDYwOX0.gOt8J2k7OV5W4SPtKrEV1sL6-C9eLE2hG3DuMzuaMKg';
const db = supabase.createClient(SUPA_URL, SUPA_KEY);
