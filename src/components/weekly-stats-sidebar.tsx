import React from 'react';
import { ClockIcon, ChatBubbleOvalLeftEllipsisIcon, HandThumbUpIcon, StarIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from 'react';

const WeeklyStatsSidebar = () => {
    const { user } = useAuth();
    const userId = user?.id
    const [streak, setStreak] = useState('0 days');
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
                return 0;
            }
            // Extract unique login dates from created_at timestamps
            const uniqueLoginDates = Array.from(
                new Set(data.map(entry =>
                    new Date(entry.created_at).toISOString().split('T')[0]
                ))
            ).sort((a, b) => (a < b ? 1 : -1)); // Sort descending (most recent first)

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
            setStreak(`${streak} day${streak !== 1 ? 's' : ''}`);
        } catch (error: any) {
            console.error('Error fetching login data:', error.message);
            return 0;
        }
    }


    async function countInteractions() {

        const { count: likeCount, error: likesError } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', oneWeekAgo);

        const { count: commentCount, error: commentsError } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', oneWeekAgo);

        console.log('Likes :', likeCount);
        console.log('Comments :', commentCount);
        setTotalInteractions((likeCount || 0) + (commentCount || 0));

    }

    async function pointsGained() {

        const activityWeights: Record<string, number> = {
            'daily_login': 5,
            'post_liked': 5,
            'quick_reviewer_task': 25,
            'comment_made': 15,
            'comment_post': 10,
            'post_created': 25,
        };

        const { data, error } = await supabase
            .from('user_activities_log')
            .select('activity_type')
            .eq('user_id', userId)
            .gte('created_at', oneWeekAgo);

        if (error) {
            console.error('Error fetching activity types:', error);
            return {};
        }

        let totalScore = 0;
        data?.forEach(({ activity_type }) => {
            const weight = activityWeights[activity_type] || 0;
            totalScore += weight;
        });

        setCountActivities(data?.length || 0);
        setPoints(totalScore);

    }


    return (
        <div className=" text-white rounded-xl p-6 w-full max-w-xs shadow-md">
            <h2 className="text-xl font-semibold mb-16 text-center tracking-wide">
                WEEKLY TRACKER STATS
            </h2>

            <div className="flex flex-col gap-14">
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        CHECK-IN STREAK
                    </p>
                    <p className="text-lg font-medium">{streak}</p>
                </div>
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <HandThumbUpIcon className="h-5 w-5 mr-1" />
                        POST REACTIONS
                    </p>
                    <p className="text-lg font-medium">{totalInteractions}</p>
                </div>
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5 mr-1" />
                        NET ACTIVITIES
                    </p>
                    <p className="text-lg font-medium">{countActivities}</p>
                </div>
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <StarIcon className="h-5 w-5 mr-1" />
                        XP GAINED
                    </p>
                    <p className="text-lg font-medium">{points}</p>
                </div>
            </div>
        </div>
    );
};

export default WeeklyStatsSidebar;
