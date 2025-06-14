// If a score was provided, try to award points for the Quick Reviewer task
      if (score > 0) {
        try {
          const wasAwarded = await handleQuickReviewer(
            user.id,
            id,
            'anime'
          );

          if (wasAwarded) {
            toast.success('Review submitted and daily task completed! +25 XP');
          } else {
            // Award points for review submission even if daily task is already completed
            await awardPoints(
              user.id,
              'review_submitted',
              15,
              id,
              'anime'
            );
            toast.success('Review submitted successfully! +15 XP');
          }
        } catch (pointsError) {
          console.error('Failed to award points for review:', pointsError);
          toast.warning('Review submitted, but points system is temporarily unavailable');
        }
      } else {
        toast.success('Watchlist updated successfully!');
      }


 useEffect(() => {
    const upsertUserAnime = async () => {
      if (!user?.id || !shouldUpdate || !watchlistStatus || watchlistStatus === "Add to My List") return;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Error retrieving session:", sessionError);
        setError("Please sign in to update your anime list.");
        return;
      }

      try {
        const response = await fetch(
          "https://rhspkjpeyewjugifcvil.supabase.co/functions/v1/upsert-user-anime",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_id: user.id,
              anime_id: id,
              status: watchlistStatus,
              progress,
              score,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to call edge function:", errorText);
          setError("Failed to update your anime list. Please try again later.");
          return;
        }

        const result = await response.json();
        console.log("Edge function result:", result);
      } catch (error) {
        console.error("Error calling edge function:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setShouldUpdate(false);
      }
    };

    upsertUserAnime();
  }, [shouldUpdate, user, id, watchlistStatus, progress, score]);