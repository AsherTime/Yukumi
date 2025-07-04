// supabase/functions/award-tracker-points/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Create a Supabase client with the service_role key
  // This bypasses RLS for trusted backend operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // Get the request payload
    const {
      user_id,
      activity_type,
      points_awarded,
      related_item_id,
      related_item_type,
    } = await req.json();

    if (
      !user_id || !activity_type || typeof points_awarded !== "number" ||
      points_awarded < 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid payload: Missing user_id, activity_type, or invalid points_awarded.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- Daily Task Logic ---
    const isDailyTask = ["daily_login", "comment_made", "quick_reviewer_task"]
      .includes(activity_type);

    if (isDailyTask) {
      // For daily tasks, related_item_id should ideally be the task_definition_id
      // We need to fetch the task definition ID based on activity_type if not provided
      let taskDefinitionId = null;
      if (!taskDefinitionId) {
        const { data: taskDef, error: taskDefError } = await supabaseClient
          .from("daily_tasks_definitions")
          .select("id")
          .eq(
            "task_name",
            activity_type === "daily_login"
              ? "Daily Check-In"
              : activity_type === "comment_made"
              ? "Comment Comrade"
              : activity_type === "quick_reviewer_task"
              ? "Quick Reviewer"
              : "",
          )
          .maybeSingle();
          console.log("Task Definition Data:", taskDef?.id);
          console.log("Task Definition Data ID:", taskDefinitionId);
        if (taskDefError) {
          console.error(
            `Error fetching daily task definition for ${activity_type}:`,
            taskDefError,
          );
          // If task definition isn't found, we can't properly track completion.
          // Decide if you want to abort or proceed without daily task unique check.
          // For now, we'll continue but log a warning.
        } else {
          taskDefinitionId = taskDef?.id;
        }
      }

      if (taskDefinitionId) {
        // Check if the user has already completed this specific daily task today
        const { data: existingCompletion, error: checkCompletionError } =
          await supabaseClient
            .from("user_daily_task_completions")
            .select("completed_date")
            .eq("user_id", user_id)
            .eq("task_definition_id", taskDefinitionId)
            .eq("completed_date", new Date().toISOString().split("T")[0]) // Check for today's date
            .maybeSingle();

        if (checkCompletionError && checkCompletionError.code !== "PGRST116") { // PGRST116 is 'No rows found'
          console.error(
            "Error checking daily task completion:",
            checkCompletionError,
          );
          return new Response(
            JSON.stringify({
              error: "Failed to check daily task completion status.",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        if (existingCompletion) {
          // Task already completed today, do not award points again
          console.log(
            `Daily task '${activity_type}' already completed by user ${user_id} today. No points awarded.`,
          );
          return new Response(
            JSON.stringify({
              message: `Daily task '${activity_type}' already completed today.`,
              new_xp: null,
              new_level: null,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }, // Return 200 as it's not an error, just no points awarded
          );
        }

        // Record daily task completion
        const { error: insertCompletionError } = await supabaseClient
          .from("user_daily_task_completions")
          .insert({
            user_id,
            task_definition_id: taskDefinitionId,
            completed_date: new Date().toISOString().split("T")[0], // Store only the date part
          });

        if (insertCompletionError) {
          console.error(
            "Error inserting daily task completion:",
            insertCompletionError,
          );
          return new Response(
            JSON.stringify({ error: "Failed to log daily task completion." }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }
    }
    // --- End Daily Task Logic ---

    // Get the current user's tracker data
    const { data: tracker, error: fetchError } = await supabaseClient
      .from("user_tracker")
      .select("xp, level")
      .eq("user_id", user_id)
      .maybeSingle(); // Use maybeSingle to get null if no row exists, instead of an error
    // PGRST116 'No rows found' is handled by this.

    if (
      fetchError && fetchError.code !== "PGRST116" &&
      fetchError.details !== "The result contains 0 rows"
    ) {
      console.error("Error fetching tracker:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user tracker" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Calculate new XP and level
    const currentXp = tracker?.xp || 0;
    const newXp = currentXp + points_awarded;
    const newLevel = Math.floor(newXp / 200) + 1; // Level up every 200 XP

    // Update or insert the tracker data (upsert)
    const { error: upsertError } = await supabaseClient
      .from("user_tracker")
      .upsert(
        {
          user_id,
          xp: newXp,
          level: newLevel,
          updated_at: new Date().toISOString(), // Use updated_at for consistency
        },
        { onConflict: "user_id" }, // If user_id exists, update; otherwise, insert
      );

    if (upsertError) {
      console.error("Error updating tracker:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to update user tracker" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Log the points award in user_activities_log (consistent naming)
    const { error: logError } = await supabaseClient
      .from("user_activities_log") // Changed from 'points_log'
      .insert({
        user_id,
        activity_type,
        points_awarded,
        related_item_id,
        related_item_type,
        created_at: new Date().toISOString(), // Use created_at for consistency
      });

    if (logError) {
      console.error("Error logging points to user_activities_log:", logError);
      // Don't return error here, as points were already awarded and tracker updated
    }

    // --- Badge Earning Logic Placeholder ---
    // This is where you would add calls to check for and award badges
    // based on activity_type or newXp/newLevel
    // Example: checkAndAwardBadges(supabaseClient, user_id, activity_type, newXp, newLevel);

    return new Response(
      JSON.stringify({
        message: "Points awarded successfully",
        new_xp: newXp,
        new_level: newLevel,
        points_awarded,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Function execution error:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
