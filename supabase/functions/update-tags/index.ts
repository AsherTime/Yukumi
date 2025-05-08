import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. Fetch all anilist_ids from Supabase
    const { data: animeData, error: fetchError } = await supabase
      .from("Anime")
      .select("anilist_id");

    if (fetchError) throw new Error(`Failed to fetch Anime IDs: ${fetchError.message}`);
    if (!animeData || animeData.length === 0) {
      return new Response(JSON.stringify({ message: "No anime found" }), { status: 200 });
    }

    const allIds = animeData.map(a => a.anilist_id).filter(Boolean);

    // 2. Split IDs into chunks of 50
    const chunkSize = 50;
    const chunkedIds = [];
    for (let i = 0; i < allIds.length; i += chunkSize) {
      chunkedIds.push(allIds.slice(i, i + chunkSize));
    }

    let totalUpdated = 0;
    let errors: string[] = [];

    for (const ids of chunkedIds) {
      const query = `
        query ($ids: [Int]) {
          Page(perPage: 50) {
            media(id_in: $ids, type: ANIME) {
              id
              title {
                romaji
              }
              tags {
                name
              }
            }
          }
        }
      `;

      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { ids } }),
      });

      const json = await res.json();
      const animeList = json?.data?.Page?.media || [];

      for (const anime of animeList) {
        const tags = anime.tags.map((t: any) => t.name);

        const { error } = await supabase
          .from("Anime")
          .update({ tags })
          .eq("anilist_id", anime.id);

        if (error) {
          console.error(`Error updating ${anime.title.romaji}:`, error);
          errors.push(`${anime.title.romaji}: ${error.message}`);
        } else {
          console.log(`✅ Tags updated for ${anime.title.romaji}`);
          totalUpdated++;
        }
      }
    }

    return new Response(JSON.stringify({
      message: `Tags updated for ${totalUpdated} anime.`,
      errors: errors.length > 0 ? errors : undefined,
    }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-tags' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
