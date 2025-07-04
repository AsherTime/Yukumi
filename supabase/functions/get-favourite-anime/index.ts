import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("_SUPABASE_URL")!,
    Deno.env.get("_SUPABASE_SERVICE_KEY")!
  );

  const { user_id } = await req.json();

  if (!user_id) {
    return new Response(JSON.stringify({ error: "Missing user_id" }), { status: 400 });
  }

  // Step 1: Get favorites array from Profiles
  const { data: profile, error: profileError } = await supabaseClient
    .from("Profiles")
    .select("favourites")
    .eq("id", user_id)
    .maybeSingle();

  if (profileError || !profile?.favourites || profile.favourites.length === 0) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  // Step 2: Get anime data based on UUIDs
  const { data: animeList, error: animeError } = await supabaseClient
    .from("Anime")
    .select("id, title, image_url")
    .in("id", profile.favourites);

  if (animeError) {
    return new Response(JSON.stringify({ error: animeError.message }), { status: 500 });
  }

  return new Response(JSON.stringify(animeList), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
  
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-favourite-anime' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
