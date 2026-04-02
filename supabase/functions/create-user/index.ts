import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Méthode non autorisée" });
    }

    const { email, password, role, prenom, nom, entreprise_id } = await req.json();

    // Validation
    if (!email || !password || !role || !prenom || !nom) {
      return json({ error: "Champs obligatoires manquants : email, password, role, prenom, nom" });
    }

    const rolesAutorises = ["admin", "client", "fournisseur", "dispatcher", "vendeur", "livreur"];
    if (!rolesAutorises.includes(role)) {
      return json({ error: `Rôle invalide. Autorisés : ${rolesAutorises.join(", ")}` });
    }

    if (password.length < 8) {
      return json({ error: "Mot de passe : 8 caractères minimum" });
    }

    // Client Admin (service_role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Vérifier l'appelant
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Token d'authentification requis" });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();
    if (callerError || !caller) {
      return json({ error: "Token invalide ou expiré" });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("utilisateurs")
      .select("role")
      .eq("auth_id", caller.id)
      .single();

    if (!callerProfile || !["admin", "client", "fournisseur", "dispatcher"].includes(callerProfile.role)) {
      return json({ error: `Droits insuffisants (rôle: ${callerProfile?.role || 'inconnu'})` });
    }

    // 1. Créer dans Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return json({ error: `Auth : ${authError.message}` });
    }

    const userId = authData.user.id;

    // 2. Créer le profil
    const { data: profil, error: profilError } = await supabaseAdmin
      .from("utilisateurs")
      .insert({
        auth_id: userId,
        email,
        role,
        prenom,
        nom,
        entreprise_id: entreprise_id || null,
      })
      .select()
      .single();

    if (profilError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return json({ error: `Profil : ${profilError.message}` });
    }

    // Succès
    return json({
      message: `Utilisateur ${prenom} ${nom} créé avec succès`,
      user: {
        id: profil.id,
        auth_id: userId,
        email,
        role,
        prenom,
        nom,
        entreprise_id: entreprise_id || null,
      },
    }, 201);

  } catch (err) {
    return json({ error: `Erreur serveur : ${err.message}` });
  }
});
