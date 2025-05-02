
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.0";
const supUrl = Deno.env.get("_SUPABASE_URL") as string;
const supKey = Deno.env.get("_SUPABASE_SERVICE_KEY") as string;
const supabase = createClient(supUrl, supKey);
console.log("Hello from Functions!")
serve(async (req) => {
const {name} = await req.json() 
const data = {
message: `Hello ${name}!`,
}

let { data: Profiles, error } = await supabase
  .from('Profiles')
  .select('display_name')

return new Response(
JSON.stringify({data, Profiles}),
{ headers: { "Content-Type": "application/json" } },
)
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
