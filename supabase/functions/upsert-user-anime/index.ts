import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Change to your frontend domain for stricter security
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("_SUPABASE_URL")!,
    Deno.env.get("_SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { user_id, anime_id, status, progress, score } = await req.json();

  if (!user_id || !anime_id) {
    return new Response(JSON.stringify({ error: "Missing user_id or anime_id" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("UserAnime")
    .select("id")
    .eq("user_id", user_id)
    .eq("anime_id", anime_id)
    .maybeSingle();

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("UserAnime")
      .update({ status, progress, score })
      .eq("id", existing.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ message: "Anime updated successfully" }), {
      status: 200,
      headers: corsHeaders,
    });
  }
  

  const { error: insertError } = await supabase.from("UserAnime").insert({
    user_id,
    anime_id,
    status,
    progress,
    score,
  });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ message: "Anime added successfully" }), {
    status: 200,
    headers: corsHeaders,
  });
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upsert-user-anime' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
