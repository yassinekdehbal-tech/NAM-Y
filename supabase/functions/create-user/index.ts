import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Vérifier la méthode
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Méthode non autorisée" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les données du body
    const { email, password, role, prenom, nom, entreprise_id } = await req.json();

    // Validation des champs obligatoires
    if (!email || !password || !role || !prenom || !nom) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants : email, password, role, prenom, nom" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation du rôle
    const rolesAutorises = ["admin", "dirigeant", "exploitant", "vendeur", "chauffeur"];
    if (!rolesAutorises.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Rôle invalide. Rôles autorisés : ${rolesAutorises.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client Supabase Admin (avec la service_role key)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Vérifier que l'appelant est admin (via le token Authorization)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token d'authentification requis" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Token invalide ou expiré" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'appelant est admin ou dirigeant
    const { data: callerProfile } = await supabaseAdmin
      .from("utilisateurs")
      .select("role")
      .eq("auth_id", caller.id)
      .single();

    if (!callerProfile || !["admin", "dirigeant"].includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({ error: "Droits insuffisants. Seuls les admins et dirigeants peuvent créer des utilisateurs." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Erreur Auth : ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // 2. Créer le profil dans la table utilisateurs
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
      // Rollback : supprimer l'utilisateur Auth si le profil échoue
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Erreur profil : ${profilError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Succès
    return new Response(
      JSON.stringify({
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
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erreur serveur : ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
