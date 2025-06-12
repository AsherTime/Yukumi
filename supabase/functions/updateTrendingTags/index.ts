// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// File: supabase/functions/updateTrendingTags/index.ts

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Constants for easier modification
const REQUIRED_UNIQUE_TAGS = 6;
const POSTS_FETCH_LIMIT = 20;
const INITIAL_TIME_WINDOW_HOURS = 24;
const MAX_TIME_WINDOW_HOURS = 24 * 30; // Max 30 days history for "trending"
const MAX_ATTEMPTS = 8; // Max attempts to widen the time window

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
      return new Response("Environment variables not set", { status: 500 });
    }

    console.log("🔑 Supabase URL exists.");
    console.log("🔑 Supabase Service Role Key exists.");

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: communities, error: communityError } = await supabase
      .from("community")
      .select("id, title");

    if (communityError || !communities) {
      console.error("❌ Community fetch failed", communityError);
      return new Response("Community fetch failed", { status: 500 });
    }

    for (const community of communities) {
      let uniqueTags = new Set<string>();
      let timeWindowHours = INITIAL_TIME_WINDOW_HOURS;
      let attempt = 0;

      while (
        uniqueTags.size < REQUIRED_UNIQUE_TAGS && attempt < MAX_ATTEMPTS &&
        timeWindowHours <= MAX_TIME_WINDOW_HOURS
      ) {
        const fromDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)
          .toISOString();

        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select(`
            id,
            created_at,
            animetitle_post,
            likes_count,
            post_tags (
              tags (
                name
              )
            )
          `)
          .eq("animetitle_post", community.title)
          .gte("created_at", fromDate)
          .order("likes_count", { ascending: false })
          .limit(POSTS_FETCH_LIMIT);

        if (postsError) { // Removed !posts check as it should be handled by postsError for now
          console.error(
            `❌ Posts fetch failed for community ${community.id} with title "${community.title}":`,
            postsError,
          );
          // Don't stop the entire function, just skip this community's tag update for this cycle
          break; // Exit the while loop for this community, move to next community
        }

        for (const post of posts || []) {
          for (const tagEntry of post.post_tags || []) {
            // tagEntry is likely an object like: { tags: { name: "TagName" } }
            const tag = tagEntry.tags; // This 'tag' variable will be the { name: "TagName" } object

            // Now, check if 'tag' is an object and has a 'name' property
            if (tag && typeof tag === "object" && "name" in tag) {
              const tagName = (tag as { name: string }).name; // Type assertion if needed, or rely on narrowing
              if (tagName && !uniqueTags.has(tagName)) {
                uniqueTags.add(tagName);
              }
              if (uniqueTags.size >= REQUIRED_UNIQUE_TAGS) break;
            }
            if (uniqueTags.size >= REQUIRED_UNIQUE_TAGS) break;
          }
          if (uniqueTags.size >= REQUIRED_UNIQUE_TAGS) break;
        }

        if (uniqueTags.size < REQUIRED_UNIQUE_TAGS) {
          attempt++;
          timeWindowHours *= 2;
        }
      }

      console.log(
        `🔄 Updating community ${community.id} with tags:`,
        Array.from(uniqueTags).slice(0, REQUIRED_UNIQUE_TAGS),
      );

      

      // Update the trending_tags
      const { error: updateError } = await supabase
        .from("community")
        .update({
          trending_tags: Array.from(uniqueTags).slice(0, REQUIRED_UNIQUE_TAGS),
        })
        .eq("id", community.id);

      if (updateError) {
        console.error(
          `❌ Failed to update trending tags for community ${community.id}:`,
          updateError,
        );
        // Log and continue to the next community
      }
    }

    return new Response("Trending tags updated", { status: 200 });
  } catch (e: any) {
    console.error("🔥 Full crash:", e);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: e?.message,
        stack: e?.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }, // Add content type for JSON response
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/updateTrendingTags' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

