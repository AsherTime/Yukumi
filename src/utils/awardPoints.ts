import { supabase } from '@/lib/supabase';

export async function awardPoints(
  userId: string,
  activityType: string,
  pointsAwarded: number,
  relatedItemId?: string,
  relatedItemType?: string
): Promise<void> {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    // Construct the payload
    const payload = {
      user_id: userId,
      activity_type: activityType,
      points_awarded: pointsAwarded,
      related_item_id: relatedItemId,
      related_item_type: relatedItemType
    };

    // Build the full function URL for the award-tracker-points edge function
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL}/functions/v1/award-tracker-points`;
    if (!functionUrl) {
      throw new Error('Edge function URL not configured');
    }

    // Use the user's session token if available, otherwise fall back to anon key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authToken = session?.access_token || anonKey;

    // Debug: Print the authToken
    console.log('Auth token being sent:', authToken);

    if (!authToken || authToken === '') {
      throw new Error('No auth token available for awardPoints. Check session and anon key.');
    }

    console.log('Awarding points with payload:', payload);

    // Add retry logic for fetch
    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Points awarded successfully:', data);
        return;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        lastError = error;
        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Error in awardPoints:', error);
    throw error;
  }
} 