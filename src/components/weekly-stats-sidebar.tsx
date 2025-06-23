import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from "@/contexts/AuthContext";

const StatItem = ({ title, value }: { title: string; value: string | number }) => (
    <div className="flex justify-between items-center text-sm transition-all duration-300 hover:bg-white/5 px-2 py-1 rounded-md">
        <p className="font-semibold text-slate-300">{title}</p>
        <p className="font-bold text-white tracking-wider">{value}</p>
    </div>
);


const WeeklyStatsSidebar = () => {
    const { user } = useAuth();
    const userId = user?.id
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
        try {
            const { data, error } = await supabase
                .from('user_activities_log')
                .select('created_at')
                .eq('user_id', userId)
                .eq('activity_type', 'daily_login')
                .lte('created_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                setStreak('0');
                return;
            }
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
        } catch (error: any) {
            console.error('Error fetching login data:', error.message);
        }
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

        if (error) {
            console.error('Error fetching activity types:', error);
            return;
        }

        let totalScore = 0;
        data?.forEach(({ activity_type }) => {
            totalScore += activityWeights[activity_type] || 0;
        });

        setCountActivities(data?.length || 0);
        setPoints(totalScore);
    }


    return (
        <div className="w-full max-w-[280px] rounded-lg border border-gray-700 bg-gray-900/60 p-4 shadow-lg backdrop-blur-md">
            <h2 className="mb-3 text-base font-bold tracking-wider text-white">
                Weekly Stats
            </h2>

            <div className="flex flex-col gap-2">
                <StatItem 
                    title="Check-in Streak" 
                    value={`${streak} ${streak === '1' ? 'day' : 'days'}`} 
                />
                <StatItem 
                    title="Post Reactions" 
                    value={totalInteractions} 
                />
                <StatItem 
                    title="Net Activities" 
                    value={countActivities} 
                />
                <StatItem 
                    title="XP Gained" 
                    value={points} 
                />
            </div>
        </div>
    );
};

export default WeeklyStatsSidebar;
