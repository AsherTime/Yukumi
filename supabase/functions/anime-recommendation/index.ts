import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  console.log("Function started - Request received");
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Supabase client initialized");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { user_id, mood } = requestBody as { user_id: string; mood?: string };
    console.log("Extracted user_id:", user_id);

    if (!user_id) {
      console.log("Error: Missing user_id");
      return new Response(JSON.stringify({ error: "user_id is required" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      });
    }

    // First, let's check if the user exists in the quiz_results table at all
    const { data: userQuizCount, error: countError } = await supabase
      .from("quiz_results")
      .select("id", { count: 'exact' })
      .eq("user_id", user_id);

    console.log("Quiz count check:", { userQuizCount, countError });

    // Get the latest quiz with detailed error logging
    const { data: latestQuiz, error: quizError } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("user_id", user_id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("Latest quiz query result:", {
      success: !!latestQuiz,
      error: quizError,
      quizData: latestQuiz,
      query: {
        table: "quiz_results",
        user_id: user_id,
        orderBy: "taken_at DESC",
        limit: 1
      }
    });

    if (quizError || !latestQuiz) {
      console.log("Quiz fetch failed:", { quizError, latestQuiz });
      return new Response(JSON.stringify({ 
        error: "No quiz found for this user",
        details: { 
          quizError,
          userId: user_id,
          quizCount: userQuizCount,
          timestamp: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Successfully found quiz:", {
      quizId: latestQuiz.id,
      takenAt: latestQuiz.taken_at,
      preferences: {
        genres: latestQuiz.genre_preferences,
        tags: latestQuiz.tags,
        lengthPref: latestQuiz.length_preference
      }
    });

    const {
      genre_preferences,
      tags,
      length_preference,
      country_preference,
    } = latestQuiz;

    // Step 2: Query Anime table for matches
    let query = supabase
      .from("Anime")
      .select("*")
      .order("popularity", { ascending: false })
      .limit(10);

    // Only apply filters if they exist and are valid
    if (genre_preferences && Array.isArray(genre_preferences) && genre_preferences.length > 0) {
      query = query.contains("genres", genre_preferences);
    }
    if (tags && Array.isArray(tags) && tags.length > 0) {
      query = query.contains("tags", tags);
    }
    if (length_preference && typeof length_preference === 'string') {
      const maxEpisodes = length_preference === 'Short' ? 12 : 999;
      query = query.lte("episodes", maxEpisodes);
    }
    if (country_preference && country_preference !== "any") {
      query = query.eq("country", country_preference);
    }

    // Mood mapping to tags
    if (mood) {
      const moodMap: Record<string, string[]> = {
        "Happy": ["Comedy", "Slice of Life"],
        "Sad": ["Tragedy", "Emotional"],
        "Hype": ["Action", "Shounen"],
        "Relaxed": ["Slice of Life", "Slow-Paced"],
        "Romantic": ["Romance", "Drama"]
      };

      const moodTags = moodMap[mood];
      if (moodTags) {
        query = query.or(moodTags.map((tag: string) => `tags.cs.{${tag}}`).join(","));
      }
    }

    const { data: animeList, error: animeError } = await query;
    console.log('Anime query result:', { 
      success: !!animeList,
      count: animeList?.length || 0,
      error: animeError,
      firstResult: animeList?.[0]
    });

    // If no anime found with filters, try without filters
    if (!animeList || animeList.length === 0) {
      console.log("No anime found with filters, trying without filters");
      const { data: fallbackAnime, error: fallbackError } = await supabase
        .from("Anime")
        .select("*")
        .order("popularity", { ascending: false })
        .limit(10);

      if (fallbackError) {
        console.log("Error fetching fallback anime:", fallbackError);
        return new Response(JSON.stringify({ 
          error: "Failed to fetch fallback anime recommendations",
          details: fallbackError
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      if (!fallbackAnime || fallbackAnime.length === 0) {
        console.log("No anime found even without filters");
        return new Response(JSON.stringify({ 
          error: "No anime found in the database"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      console.log("Using fallback anime results:", {
        count: fallbackAnime.length,
        firstResult: fallbackAnime[0]
      });

      const suggestions = fallbackAnime.map(anime => ({
        quiz_id: latestQuiz.id,
        anime_id: anime.id,
      }));

      await supabase.from("quiz_suggestions").upsert(suggestions);

      return new Response(JSON.stringify({ recommendations: fallbackAnime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const suggestions = animeList.map(anime => ({
      quiz_id: latestQuiz.id,
      anime_id: anime.id,
    }));

    await supabase.from("quiz_suggestions").upsert(suggestions);

    return new Response(JSON.stringify({ recommendations: animeList }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.log("Unexpected error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
