"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import { createClient } from "@supabase/supabase-js";

export default function SettingsPage() {
    const [notifAll, setNotifAll] = useState(true);
    const [notifLikes, setNotifLikes] = useState(true);
    const [notifReplies, setNotifReplies] = useState(true);
    const [notifFollows, setNotifFollows] = useState(true);
    const router = useRouter();
    const { user } = useAuth();



    const fetchNotificationPrefs = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("Profiles")
            .select("notif_all, notif_likes, notif_replies, notif_follows")
            .eq("id", user.id)
            .single();

        if (error) console.error(error);
        else {
            setNotifAll(data.notif_all);
            setNotifLikes(data.notif_likes);
            setNotifReplies(data.notif_replies);
            setNotifFollows(data.notif_follows);
        }
    };

    useEffect(() => {
        fetchNotificationPrefs();
    }, [user]);

    const updateProfilePrefs = async (fields: Partial<{
        notif_all: boolean;
        notif_likes: boolean;
        notif_replies: boolean;
        notif_follows: boolean;
    }>) => {
        if (!user) return;
        const { error } = await supabase
            .from("Profiles")
            .update(fields)
            .eq("id", user.id);

        if (error) console.error(error);
    };

    const toggleAll = async () => {
        const newValue = !notifAll;
        setNotifAll(newValue);
        setNotifLikes(newValue);
        setNotifReplies(newValue);
        setNotifFollows(newValue);

        await updateProfilePrefs({
            notif_all: newValue,
            notif_likes: newValue,
            notif_replies: newValue,
            notif_follows: newValue,
        });
    };

    const toggleLikes = async () => {
        const newValue = !notifLikes;
        setNotifLikes(newValue);
        if (notifAll && !newValue) {
            setNotifAll(false);
            await updateProfilePrefs({
                notif_likes: newValue,
                notif_all: false,
            });
        }
        else if (!notifAll && newValue && notifReplies && notifFollows) {
            setNotifAll(true);
            await updateProfilePrefs({
                notif_likes: newValue,
                notif_all: true,
            });
        }
        else {
            await updateProfilePrefs({ notif_likes: newValue });
        }
    };

    const toggleReplies = async () => {
        const newValue = !notifReplies;
        setNotifReplies(newValue);
        if (notifAll && !newValue) {
            setNotifAll(false);
            await updateProfilePrefs({
                notif_replies: newValue,
                notif_all: false,
            });
        }
        else if (!notifAll && newValue && notifLikes && notifFollows) {
            setNotifAll(true);
            await updateProfilePrefs({
                notif_replies: newValue,
                notif_all: true,
            });
        }
        else {
            await updateProfilePrefs({ notif_replies: newValue });
        }
    };

    const toggleFollows = async () => {
        const newValue = !notifFollows;
        setNotifFollows(newValue);
        if (notifAll && !newValue) {
            setNotifAll(false);
            await updateProfilePrefs({
                notif_follows: newValue,
                notif_all: false,
            });
        }
        else if (!notifAll && newValue && notifReplies && notifLikes) {
            setNotifAll(true);
            await updateProfilePrefs({
                notif_follows: newValue,
                notif_all: true,
            });
        }
        else {
            await updateProfilePrefs({ notif_follows: newValue });
        }
    };


    const deleteAccount = async () => {
        if (!user) return;

        const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");
        if (!confirmed) return;

        // Optional: Delete user data
        await supabase.from('Profiles').delete().eq('id', user.id);

        try {
            const response = await fetch("/api/delete-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
            });

            if (response.ok) {
                await supabase.auth.signOut();
                alert("Account deleted successfully.");
                router.push("/");
            } else {
                const data = await response.json().catch(() => null);
                console.error("Delete account error:", data?.error || "Unexpected server error");
            }
        } catch (err) {
            console.error("Fetch failed:", err);
        }
    };




    return (
        <div className="min-h-screen bg-[#10101a] flex flex-col ">
            <TopNav />
            <div className="min-h-screen  p-8 mt-5"> {/* Changed from `flex items-center justify-center` */}
                <div className=" p-8 w-full min-w-[50vw]">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-10 text-left"> {/* Aligned left */}
                        Settings
                    </h1>

                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 ">
                            Notifications
                        </h2>
                        <div className="space-y-4">
                            {/* Toggle for all notifications */}
                            <label htmlFor="toggle-all" className="flex items-center justify-between cursor-pointer">
                                <span className="text-gray-700 dark:text-gray-300 text-lg">
                                    Turn {notifAll ? 'off' : 'on'} all notifications
                                </span>
                                <div className="relative inline-block w-16 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="toggle-all"
                                        checked={!notifAll}
                                        onChange={toggleAll}
                                        className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        // Tailwind classes for the track when checked and unchecked
                                        style={{
                                            top: '0', // Align to top of its relative parent
                                            left: notifAll ? 'calc(100% - 1.5rem)' : '0', // Adjust position based on state
                                            transition: 'left 0.2s ease-in-out',
                                            borderColor: notifAll ? '#4F46E5' : '#D1D5DB' // Indigo for checked, gray for unchecked
                                        }}
                                    />
                                    <label
                                        htmlFor="toggle-all"
                                        className={`toggle-label block overflow-hidden h-8 rounded-full cursor-pointer transition duration-200 ease-in ${notifAll ? 'bg-indigo-600' : 'bg-gray-300'
                                            }`}
                                    ></label>
                                </div>
                            </label>

                            {/* Individual notification toggles */}
                            <label htmlFor="toggle-likes" className="flex items-center justify-between cursor-pointer pl-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Like notifications are {notifLikes ? 'on' : 'off'}
                                </span>
                                <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="toggle-likes"
                                        checked={!notifLikes} // Inverted logic as before
                                        onChange={toggleLikes}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        style={{
                                            top: '0', // Align to top of its relative parent
                                            left: notifLikes ? 'calc(100% - 1.5rem)' : '0', // Adjust position based on state
                                            transition: 'left 0.2s ease-in-out',
                                            borderColor: notifLikes ? '#4F46E5' : '#D1D5DB' // Indigo for checked, gray for unchecked
                                        }}
                                    />
                                    <label
                                        htmlFor="toggle-likes"
                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition duration-200 ease-in ${notifLikes ? 'bg-indigo-600' : 'bg-gray-300'
                                            }`}
                                    ></label>
                                </div>
                            </label>

                            <label htmlFor="toggle-replies" className="flex items-center justify-between cursor-pointer pl-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Reply notifications are {notifReplies ? 'on' : 'off'}
                                </span>
                                <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="toggle-replies"
                                        checked={!notifReplies}
                                        onChange={toggleReplies}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        style={{
                                            top: '0',
                                            left: notifReplies ? 'calc(100% - 1.5rem)' : '0',
                                            transition: 'left 0.2s ease-in-out',
                                            borderColor: notifReplies ? '#4F46E5' : '#D1D5DB'
                                        }}
                                    />
                                    <label
                                        htmlFor="toggle-replies"
                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition duration-200 ease-in ${notifReplies ? 'bg-indigo-600' : 'bg-gray-300'
                                            }`}
                                    ></label>
                                </div>
                            </label>

                            <label htmlFor="toggle-follows" className="flex items-center justify-between cursor-pointer pl-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Follow notifications are {notifFollows ? 'on' : 'off'}
                                </span>
                                <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="toggle-follows"
                                        checked={!notifFollows}
                                        onChange={toggleFollows}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        style={{
                                            top: '0',
                                            left: notifFollows ? 'calc(100% - 1.5rem)' : '0',
                                            transition: 'left 0.2s ease-in-out',
                                            borderColor: notifFollows ? '#4F46E5' : '#D1D5DB'
                                        }}
                                    />
                                    <label
                                        htmlFor="toggle-follows"
                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition duration-200 ease-in ${notifFollows ? 'bg-indigo-600' : 'bg-gray-300'
                                            }`}
                                    ></label>
                                </div>
                            </label>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        Delete Account
                    </h2>

                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-600 dark:text-gray-400">
                            Delete your account
                        </span>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 whitespace-nowrap"
                            onClick={deleteAccount}
                        >
                            Delete Account
                        </button>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
}