import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VIEW_MILESTONES = [
  { threshold: 1000, points: 25, identifier: '1k_views' },
  { threshold: 10000, points: 50, identifier: '10k_views' },
  { threshold: 100000, points: 100, identifier: '100k_views' },
  { threshold: 1000000, points: 200, identifier: '1m_views' },
];

serve(async (req: Request) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    let awardedCount = 0;

    for (const milestone of VIEW_MILESTONES) {
      const { data: posts, error: fetchPostsError } = await supabaseClient
        .from('posts')
        .select('id, user_id, views, awarded_milestones')
        .gte('views', milestone.threshold)
        .or('awarded_milestones.is.null,not.awarded_milestones.cs.[\"' + milestone.identifier + '\"]');

      if (fetchPostsError) {
        console.error(`Error fetching posts for ${milestone.identifier} check:`, fetchPostsError);
        continue;
      }

      if (!posts || posts.length === 0) {
        console.log(`No new posts found exceeding ${milestone.identifier} or already awarded.`);
        continue;
      }

      for (const post of posts) {
        const awardPointsFunctionUrl = Deno.env.get('AWARD_TRACKER_POINTS_FUNCTION_URL') || 'YOUR_AWARD_TRACKER_POINTS_FUNCTION_URL';

        if (awardPointsFunctionUrl === 'YOUR_AWARD_TRACKER_POINTS_FUNCTION_URL') {
          console.error("AWARD_TRACKER_POINTS_FUNCTION_URL environment variable not set or is placeholder. Cannot award points.");
          continue;
        }

        const awardPayload = {
          user_id: post.user_id,
          activity_type: `post_reach_milestone_${milestone.identifier}`,
          points_awarded: milestone.points,
          related_item_id: post.id,
          related_item_type: 'post',
        };

        const awardResponse = await fetch(awardPointsFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(awardPayload),
        });

        if (!awardResponse.ok) {
          const errorData = await awardResponse.json();
          console.error(`Failed to award points for post ${post.id} (${milestone.identifier}):`, errorData.error);
        } else {
          awardedCount++;
          const prevMilestones = Array.isArray(post.awarded_milestones) ? post.awarded_milestones : [];
          const updatedMilestones = [...prevMilestones, milestone.identifier];
          const { error: updatePostError } = await supabaseClient
            .from('posts')
            .update({ awarded_milestones: updatedMilestones })
            .eq('id', post.id);

          if (updatePostError) {
            console.error(`Error updating awarded_milestones for post ${post.id}:`, updatePostError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: `Post reach check completed. Awarded points for ${awardedCount} milestones.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Function execution error:', error);
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error && "message" in error) {
      message = (error as any).message;
    } else if (typeof error === "string") {
      message = error;
    }
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});