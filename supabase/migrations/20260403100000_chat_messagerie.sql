-- ============================================================
-- NAMY TMS — Module Chat / Messagerie interne
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID REFERENCES entreprises(id),
  entreprise_nom TEXT,
  dernier_message TEXT,
  dernier_message_at TIMESTAMPTZ,
  non_lus_namy INTEGER DEFAULT 0,
  non_lus_client INTEGER DEFAULT 0,
  canal TEXT DEFAULT 'namy' CHECK (canal IN ('namy','whatsapp')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  auteur_id UUID,
  auteur_nom TEXT,
  auteur_role TEXT,
  contenu TEXT NOT NULL,
  type TEXT DEFAULT 'texte' CHECK (type IN ('texte','photo','systeme','ia')),
  canal TEXT DEFAULT 'namy' CHECK (canal IN ('namy','whatsapp')),
  lu_par_client BOOLEAN DEFAULT false,
  lu_par_namy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_all ON conversations FOR ALL USING (true);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY msg_all ON messages FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Index
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_entreprise ON conversations(entreprise_id);
