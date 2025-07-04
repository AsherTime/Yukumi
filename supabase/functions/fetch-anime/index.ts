// supabase/functions/fetch-anime/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnimeMedia = {
  id: number | string;
  title: { romaji: string };
  episodes?: number | null;
  description?: string | null;
  genres?: string[];
  coverImage?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
  };
  startDate?: {
    year: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year: number;
    month?: number;
    day?: number;
  };
  format?: string | null;
};


serve(async () => {
  const supabaseUrl = Deno.env.get("_SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("_SUPABASE_SERVICE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
          }
          episodes
          description(asHtml: false)
          genres
          coverImage {
            extraLarge
            large
            medium
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          format
        }
      }
    }
  `;

  const MAX_PAGES = 1000;
  let page = 1;
  let totalInserted = 0;
  const errors: string[] = [];

  const formatDate = (
    date: { year: number; month?: number; day?: number } | null | undefined,
  ) => {
    if (!date?.year) return null;
    return new Date(`${date.year}-${date.month || 1}-${date.day || 1}`);
  };

  try {
    while (page <= MAX_PAGES) {
      console.log(`Fetching page ${page}...`);
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { page } }),
      });

      const json = await res.json();
      const media = json?.data?.Page?.media;
      const pageInfo = json?.data?.Page?.pageInfo;

      if (!media || media.length === 0) break;

      const animeToInsert = media.map((anime: AnimeMedia) => ({
        anilist_id: anime.id,
        title: anime.title.romaji,
        episodes: anime.episodes || null,
        synopsis: anime.description || null,
        genres: anime.genres || [],
        image_url: anime.coverImage?.extraLarge || anime.coverImage?.large ||
          anime.coverImage?.medium || null,
        aired_from: formatDate(anime.startDate),
        aired_to: formatDate(anime.endDate),
        type: anime.format || null,
      }));

      const { error } = await supabase
        .from("Anime")
        .insert(animeToInsert)
        .select("*");

      if (error) {
        console.error(`Error on page ${page}:`, error);
        errors.push(`Page ${page}: ${error.message}`);
      } else {
        totalInserted += animeToInsert.length;
        console.log(`Page ${page}: Inserted ${animeToInsert.length} anime.`);
      }

      if (!pageInfo?.hasNextPage) break;
      page++;
    }

    return new Response(
      JSON.stringify({
        message: "Finished inserting anime from AniList",
        pagesProcessed: page - 1,
        totalInserted,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(
      JSON.stringify({
        error: String(err),
      }),
      {
        status: 500,
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-anime' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
