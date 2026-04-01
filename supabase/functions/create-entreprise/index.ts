import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Méthode non autorisée" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { nom, type, adresse, cp, ville, telephone, email } = await req.json();

    if (!nom || !type) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants : nom, type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typesAutorises = ["client", "fournisseur", "plateforme"];
    if (!typesAutorises.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Type invalide. Types autorisés : ${typesAutorises.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Vérifier l'appelant
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

    const { data: callerProfile } = await supabaseAdmin
      .from("utilisateurs")
      .select("role")
      .eq("auth_id", caller.id)
      .single();

    if (!callerProfile || !["admin", "client", "fournisseur", "dirigeant"].includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({ error: "Droits insuffisants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer l'entreprise
    const { data: entreprise, error: entError } = await supabaseAdmin
      .from("entreprises")
      .insert({ nom, type, adresse: adresse || null, cp: cp || null, ville: ville || null, telephone: telephone || null, email: email || null })
      .select()
      .single();

    if (entError) {
      return new Response(
        JSON.stringify({ error: `Erreur création : ${entError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Si client, créer les paramètres avec onboarding
    if (type === "client") {
      await supabaseAdmin.from("parametres_entreprise").insert({
        entreprise_id: entreprise.id,
        onboarding: { horaires: false, grille: false, vendeur: false, test: false },
      });
    }

    return new Response(
      JSON.stringify({ message: `Entreprise ${nom} créée`, entreprise }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erreur serveur : ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
