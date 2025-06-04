export async function awardPoints({
  userId,
  activityType,
  points,
  itemId = null,
  itemType = null,
}: {
  userId: string,
  activityType: string,
  points: number,
  itemId?: string | null,
  itemType?: string | null,
}) {
  try {
    console.log('Awarding points with payload:', {
      user_id: userId,
      activity_type: activityType,
      points_awarded: points,
      related_item_id: itemId,
      related_item_type: itemType,
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/award-tracker-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        activity_type: activityType,
        points_awarded: points,
        related_item_id: itemId,
        related_item_type: itemType,
      }),
    });

    // Log the raw response for debugging
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Invalid response from server: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status} ${responseText}`);
    }

    return data;
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
} 