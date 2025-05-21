import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rhspkjpeyewjugifcvil.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc3BranBleWV3anVnaWZjdmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTk2MDgsImV4cCI6MjA2MTQzNTYwOH0.Hxx6bkuVRRqT4Uh4dngjT6fmdL1CVP_RlkS6sZucnbQ"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const fetchJoinedCommunities = async () => {
  if (!user) return;
  try {
    // Step 1: Get the list of community_ids the user follows
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('community_id')
      .eq('user_id', user.id)
      .limit(10);
    if (followsError) throw followsError;

    const communityIds = (follows || []).map((row: any) => row.community_id);
    if (communityIds.length === 0) {
      setJoinedCommunities([]);
      return;
    }

    // Step 2: Fetch the community details
    const { data: communities, error: communitiesError } = await supabase
      .from('community')
      .select('id, title, members, banner_url, avatar_url')
      .in('id', communityIds);

    if (communitiesError) throw communitiesError;
    setJoinedCommunities(communities || []);
  } catch (error) {
    console.error('Error fetching joined communities:', error);
  }
};
