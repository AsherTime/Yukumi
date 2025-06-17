import React from 'react';
import { ClockIcon, ChatBubbleOvalLeftEllipsisIcon, HandThumbUpIcon, StarIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from 'react';


const WeeklyStatsSidebar = ({
    timeSpent = '1hr 25 min',
    postsViewed = 56,
    interactions = 28,
}) => {
    const { user } = useAuth();
    const userId = user?.id;
    const [points, setPoints] = React.useState(0);

    useEffect(() => {
        if (!userId) {
            return;
        }
        const fetchWeeklyStats = async () => {
            const pointsGained = await getWeeklyPoints();
            setPoints(pointsGained);
        };
        fetchWeeklyStats();
    }, [userId]);

    const getWeeklyPoints = async () => {
        const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const toDate = new Date().toISOString(); 

        const { data, error } = await supabase
            .from('user_tracker')
            .select('xp')
            .eq('user_id', userId)
            .gte('updated_at', fromDate)
            .lte('updated_at', toDate);

        if (error) {
            console.error('Error fetching weekly points:', error.message);
            return 0;
        }

        // Sum all the points
        const totalPoints = data?.reduce((sum, row) => sum + row.xp, 0) || 0;
        return totalPoints;
    };

    return (
        <div className=" text-white rounded-xl p-6 w-full max-w-xs shadow-md">
            <h2 className="text-xl font-semibold mb-16 text-center tracking-wide">
                WEEKLY TRACKER STATS
            </h2>

            <div className="flex flex-col gap-14">
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 mr-1" />
                        TIME SPENT
                    </p>
                    <p className="text-lg font-medium">{timeSpent}</p>
                </div>
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5 mr-1" />
                        POSTS VIEWED
                    </p>
                    <p className="text-lg font-medium">{postsViewed}</p>
                </div>
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <HandThumbUpIcon className="h-5 w-5 mr-1" />
                        INTERACTIONS
                    </p>
                    <p className="text-lg font-medium">{interactions}</p>
                </div>
                <div className="text-center px-2 py-2 rounded-full bg-[#111]">
                    <p className="text-sm text-gray-300 mb-2 flex items-center justify-center">
                        <StarIcon className="h-5 w-5 mr-1" />
                        POINTS GAINED
                    </p>
                    <p className="text-lg font-medium">{points}</p>
                </div>
            </div>
        </div>
    );
};

export default WeeklyStatsSidebar;
