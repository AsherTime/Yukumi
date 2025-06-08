import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rhspkjpeyewjugifcvil.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc3BranBleWV3anVnaWZjdmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTk2MDgsImV4cCI6MjA2MTQzNTYwOH0.Hxx6bkuVRRqT4Uh4dngjT6fmdL1CVP_RlkS6sZucnbQ"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)