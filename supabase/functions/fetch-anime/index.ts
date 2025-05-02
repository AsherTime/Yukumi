// supabase/functions/fetch-anime/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseUrl = Deno.env.get('_SUPABASE_URL')!
  const supabaseKey = Deno.env.get('_SUPABASE_SERVICE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Fetch top anime from Jikan API
    const response = await fetch('https://api.jikan.moe/v4/anime?order_by=popularity&page=1')
    const data = await response.json()

    if (!data.data) {
      return new Response(JSON.stringify({ error: 'Invalid response from Jikan' }), {
        status: 500,
      })
    }

    // Transform and insert anime data into Supabase
    const animeToInsert = data.data.map((anime: any) => ({
      image_url: anime.images?.jpg?.image_url || null,
      title: anime.title,
      type: anime.type || null,
      episodes: anime.episodes || null,
      aired_from: anime.aired?.from ? new Date(anime.aired.from) : null,
      aired_to: anime.aired?.to ? new Date(anime.aired.to) : null,
      synopsis: anime.synopsis || null,
      genres: anime.genres.map(g => g.name)
    }))

    const { error } = await supabase.from('Anime').insert(animeToInsert)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify({ message: 'Anime data inserted successfully' }), {
      status: 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    })
  }
})


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-anime' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
