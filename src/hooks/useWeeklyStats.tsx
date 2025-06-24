// hooks/useWeeklyStats.ts
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from "@/contexts/AuthContext";

export function useWeeklyStats() {
  const { user } = useAuth();
  const userId = user?.id;
  const [streak, setStreak] = useState('0');
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [countActivities, setCountActivities] = useState(0);
  const [points, setPoints] = useState(0);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  useEffect(() => {
    if (userId) {
      loginStreak();
      countInteractions();
      pointsGained();
    }
  }, [userId]);

  async function loginStreak() {
    const { data, error } = await supabase
      .from('user_activities_log')
      .select('created_at')
      .eq('user_id', userId)
      .eq('activity_type', 'daily_login')
      .lte('created_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const uniqueLoginDates = Array.from(
      new Set(data.map(entry =>
        new Date(entry.created_at).toISOString().split('T')[0]
      ))
    ).sort((a, b) => (a < b ? 1 : -1));

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < uniqueLoginDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(today.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      if (uniqueLoginDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }
    setStreak(`${streak}`);
  }

  async function countInteractions() {
    const { count: likeCount } = await supabase
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo);

    const { count: commentCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo);

    setTotalInteractions((likeCount || 0) + (commentCount || 0));
  }

  async function pointsGained() {
    const activityWeights: Record<string, number> = {
      'daily_login': 5, 'post_liked': 5, 'quick_reviewer_task': 25,
      'comment_made': 15, 'comment_post': 10, 'post_created': 25,
    };
    const { data, error } = await supabase
      .from('user_activities_log')
      .select('activity_type')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo);

    if (error || !data) return;

    let totalScore = 0;
    data.forEach(({ activity_type }) => {
      totalScore += activityWeights[activity_type] || 0;
    });

    setCountActivities(data.length);
    setPoints(totalScore);
  }

  return { streak, totalInteractions, countActivities, points };
}
