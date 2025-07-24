"use client";
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type VisitData = {
  visit_date: string;
  count: number;
};

type SummaryData = {
  totalToday: number;
  totalThisWeek: number;
  uniqueToday: number;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-900 p-4 rounded shadow text-center">
      <div className="text-pink-400 text-sm font-semibold">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function BarChart({
  data,
  color,
}: {
  data: { visit_date: string; count: number }[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="visit_date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill={color} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}


export default function VisitsAnalytics() {
  const [dailyVisits, setDailyVisits] = useState<VisitData[]>([]);
  const [dailyUnique, setDailyUnique] = useState<VisitData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("created_at, ip_address")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching visits:", error);
        return;
      }

      const visitsPerDay: Record<string, number> = {};
      const uniquePerDay: Record<string, Set<string>> = {};

      let totalToday = 0;
      let uniqueToday = new Set<string>();
      let totalThisWeek = 0;

      const today = new Date();
      const startOfToday = today.toISOString().slice(0, 10);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 6);
      const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

      data?.forEach((visit) => {
        const date = new Date(visit.created_at).toISOString().slice(0, 10);
        const ip = visit.ip_address;

        // Daily total
        visitsPerDay[date] = (visitsPerDay[date] || 0) + 1;

        // Daily unique
        if (!uniquePerDay[date]) uniquePerDay[date] = new Set();
        uniquePerDay[date].add(ip);

        // Summary: total today
        if (date === startOfToday) {
          totalToday += 1;
          uniqueToday.add(ip);
        }

        // Summary: total this week
        if (date >= startOfWeekStr) {
          totalThisWeek += 1;
        }
      });

      const visitsFormatted: VisitData[] = Object.entries(visitsPerDay).map(
        ([date, count]) => ({ visit_date: date, count })
      );

      const uniqueFormatted: VisitData[] = Object.entries(uniquePerDay).map(
        ([date, ipSet]) => ({ visit_date: date, count: ipSet.size })
      );

      setDailyVisits(visitsFormatted.reverse());
      setDailyUnique(uniqueFormatted.reverse());

      setSummary({
        totalToday,
        uniqueToday: uniqueToday.size,
        totalThisWeek,
      });
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 p-6">
      {summary && (
        <div className="bg-zinc-800 p-4 rounded-lg shadow text-white grid grid-cols-3 gap-4">
          <StatCard label="Today's Visits" value={summary.totalToday} />
          <StatCard label="Unique Visitors Today" value={summary.uniqueToday} />
          <StatCard label="Visits This Week" value={summary.totalThisWeek} />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Visits Per Day</h2>
        <BarChart data={dailyVisits} color="#ec4899" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">
          Unique Visitors Per Day
        </h2>
        <BarChart data={dailyUnique} color="#22d3ee" />
      </div>
    </div>
  );
}
