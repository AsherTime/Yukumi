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
    if (!session) throw new Error('No active session');

    // Construct the payload
    const payload = {
      user_id: userId,
      activity_type: activityType,
      points_awarded: pointsAwarded,
      related_item_id: relatedItemId,
      related_item_type: relatedItemType
    };

    // Get the function URL from environment variable
    const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    if (!functionUrl) {
      throw new Error('Edge function URL not configured');
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
            'Authorization': `Bearer ${session.access_token}`
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