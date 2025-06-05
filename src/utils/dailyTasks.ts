import { awardPoints } from './awardPoints';

// Constants for daily tasks
const DAILY_CHECK_IN_POINTS = 5;
const COMMENT_COMRADE_POINTS = 15;
const QUICK_REVIEWER_POINTS = 25;

// Helper function to check if a task was completed today
export const wasTaskCompletedToday = (taskKey: string): boolean => {
  const lastCompletion = localStorage.getItem(taskKey);
  if (!lastCompletion) return false;

  const lastDate = new Date(lastCompletion);
  const today = new Date();
  
  return lastDate.toDateString() === today.toDateString();
};

// Mark a task as completed for today
export const markTaskCompleted = (taskKey: string) => {
  localStorage.setItem(taskKey, new Date().toISOString());
};

// Daily Check-In Task
export const handleDailyCheckIn = async (userId: string): Promise<boolean> => {
  const taskKey = `daily_check_in_${userId}`;
  
  if (wasTaskCompletedToday(taskKey)) {
    return false;
  }

  try {
    await awardPoints(userId, 'daily_login', DAILY_CHECK_IN_POINTS);
    markTaskCompleted(taskKey);
    return true;
  } catch (error) {
    console.error('Error awarding daily check-in points:', error);
    return false;
  }
};

// Comment Comrade Task
export const handleCommentComrade = async (
  userId: string,
  commentedItemId: string,
  commentedItemType: string
): Promise<boolean> => {
  const taskKey = `comment_comrade_${userId}_${new Date().toDateString()}`;
  
  if (wasTaskCompletedToday(taskKey)) {
    return false;
  }

  try {
    await awardPoints(userId, 'comment_made', COMMENT_COMRADE_POINTS, commentedItemId, commentedItemType);
    markTaskCompleted(taskKey);
    return true;
  } catch (error) {
    console.error('Error awarding comment comrade points:', error);
    return false;
  }
};

// Quick Reviewer Task
export const handleQuickReviewer = async (
  userId: string,
  reviewedItemId: string,
  reviewedItemType: string
): Promise<boolean> => {
  const taskKey = `quick_reviewer_${userId}_${new Date().toDateString()}`;
  
  if (wasTaskCompletedToday(taskKey)) {
    return false;
  }

  try {
    await awardPoints(userId, 'quick_reviewer_task', QUICK_REVIEWER_POINTS, reviewedItemId, reviewedItemType);
    markTaskCompleted(taskKey);
    return true;
  } catch (error) {
    console.error('Error awarding quick reviewer points:', error);
    return false;
  }
}; 