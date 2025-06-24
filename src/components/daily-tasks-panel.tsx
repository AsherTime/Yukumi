"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageSquare, Star, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { wasTaskCompletedToday } from "@/utils/dailyTasks";
import { motion, AnimatePresence } from "framer-motion";

export function DailyTasksPanel() {
  const { user } = useAuth();
  const [dailyTasks, setDailyTasks] = useState({
    dailyCheckIn: false,
    commentComrade: false,
    quickReviewer: false,
  });

  useEffect(() => {
    if (!user) return;

    // Check daily tasks status
    const checkDailyTasks = () => {
      const dailyCheckIn = wasTaskCompletedToday(`daily_check_in_${user.id}`);
      const commentComrade = wasTaskCompletedToday(`comment_comrade_${user.id}_${new Date().toDateString()}`);
      const quickReviewer = wasTaskCompletedToday(`quick_reviewer_${user.id}_${new Date().toDateString()}`);

      setDailyTasks({
        dailyCheckIn,
        commentComrade,
        quickReviewer,
      });
    };

    checkDailyTasks();
    // Check every minute to update the status
    const interval = setInterval(checkDailyTasks, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const tasks = [
    {
      id: 1,
      title: "Daily Check-In",
      icon: MessageSquare,
      value: dailyTasks.dailyCheckIn ? "Completed" : "5 XP",
      status: dailyTasks.dailyCheckIn ? "Completed" : "Available",
      completed: dailyTasks.dailyCheckIn,
    },
    {
      id: 2,
      title: "Comment Comrade",
      icon: MessageSquare,
      value: dailyTasks.commentComrade ? "Completed" : "15 XP",
      status: dailyTasks.commentComrade ? "Completed" : "Available",
      completed: dailyTasks.commentComrade,
    },
    {
      id: 3,
      title: "Quick Reviewer",
      icon: Star,
      value: dailyTasks.quickReviewer ? "Completed" : "25 XP",
      status: dailyTasks.quickReviewer ? "Completed" : "Available",
      completed: dailyTasks.quickReviewer,
    },
  ];

  const allTasksCompleted = Object.values(dailyTasks).every(task => task);
  const completedTasksCount = Object.values(dailyTasks).filter(task => task).length;

  return (
    <Card className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 shadow-lg">
      <CardHeader 
        className="p-0 mb-4 cursor-pointer"  
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-bold text-base">Your Daily Quests</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {completedTasksCount}/{tasks.length}
            </span>
            {allTasksCompleted &&
              <Sparkles className="w-5 h-5 text-yellow-400" />
            }
          </div>
        </div>
      </CardHeader>
      <AnimatePresence>
        
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40"
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm text-zinc-200">{task.title}</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    task.completed ? "text-emerald-500" : "text-zinc-400"
                  }`}>
                    {task.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
      </AnimatePresence>
    </Card>
  );
} 