"use client";

import { useEffect, useState } from "react";
import { BarChart, Settings, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // ✅ Ensure this path matches your shadcn setup
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  BarChart as BarChartComponent,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type SubjectPerformance = {
  subject: string;
  total_xp: number;
  attempts: number;
  avg_xp: number;
};

type SubjectAttempts = {
  subject: string;
  attempts: number;
};

function SubjectStrengthChart({ data }: { data: SubjectPerformance[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChartComponent
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="subject" type="category" />
        <Tooltip />
        <Bar dataKey="avg_xp" fill="#10b981" />
      </BarChartComponent>
    </ResponsiveContainer>
  );
}

function AttemptVolumeChart({ data }: { data: SubjectAttempts[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChartComponent
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="subject" type="category" />
        <Tooltip />
        <Bar dataKey="attempts" fill="#6366f1" />
      </BarChartComponent>
    </ResponsiveContainer>
  );
}


function XpOverTimeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Math" stroke="#8884d8" />
        <Line type="monotone" dataKey="Reading" stroke="#82ca9d" />
        <Line type="monotone" dataKey="Spelling" stroke="#ffc658" />
        <Line type="monotone" dataKey="Exploration" stroke="#ff7f50" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function XpBySubjectChart({
  data,
}: {
  data: { subject: string; xp: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChartComponent
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="subject" type="category" />
        <Tooltip />
        <Bar dataKey="xp" fill="#8b5cf6" />
      </BarChartComponent>
    </ResponsiveContainer>
  );
}

function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.15));
}

function getTotalXpEarned(
  currentLevel: number,
  currentLevelXp: number
): number {
  let xp = 0;
  for (let lvl = 1; lvl < currentLevel; lvl++) {
    xp += getRequiredXpForLevel(lvl);
  }
  return xp + currentLevelXp;
}


// ✅ Define a type for student progress entries
type ProgressEntry = {
  subject_id: number;
  xp: number;
  level: number;
};

export default function ParentDashboard() {
  const [studentData, setStudentData] = useState<ProgressEntry[]>([]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"progress" | "rules" | "limits">(
    "progress"
  );
   const [performanceData, setPerformanceData] = useState<SubjectPerformance[]>(
     []
   );
   const [attemptVolumeData, setAttemptVolumeData] = useState<
     SubjectAttempts[]
   >([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("user_progress")
        .select("subject_id, xp, level");

      if (error) console.error("❌ Failed to fetch progress data:", error);
      else setStudentData(data || []);
    };

    fetchData();
  }, []);

  type XpHistoryEntry = {
    date: string;
    [subject: string]: number | string;
  };

  const [xpHistory, setXpHistory] = useState<XpHistoryEntry[]>([]);

  useEffect(() => {
    const fetchSubjectStats = async () => {
      const supabase = createClientComponentClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_challenge_attempts")
        .select("subject_id, xp_earned")
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Failed to fetch challenge attempts:", error);
        return;
      }

      const subjectMap: Record<number, string> = {
        1: "Math",
        2: "Reading",
        3: "Spelling",
        4: "Exploration",
      };

      const totals: Record<string, { xp: number; count: number }> = {};

      data.forEach((entry) => {
        const subject = subjectMap[entry.subject_id] || "Unknown";
        if (!totals[subject]) totals[subject] = { xp: 0, count: 0 };
        totals[subject].xp += Number(entry.xp_earned) || 0;
        totals[subject].count += 1;
      });

      const performanceResults: SubjectPerformance[] = Object.entries(
        totals
      ).map(([subject, { xp, count }]) => ({
        subject,
        total_xp: xp,
        attempts: count,
        avg_xp: count > 0 ? Math.round(xp / count) : 0,
      }));

      const volumeResults: SubjectAttempts[] = Object.entries(totals).map(
        ([subject, { count }]) => ({
          subject,
          attempts: count,
        })
      );

      setPerformanceData(performanceResults);
      setAttemptVolumeData(volumeResults);
    };

    fetchSubjectStats();
  }, []);

  useEffect(() => {
    const fetchXpHistory = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("user_prompt_attempts")
        .select("subject_id, xp_earned, timestamp")
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("❌ Failed to fetch XP history:", error);
        return;
      }

      const subjectMap: Record<number, string> = {
        1: "Math",
        2: "Reading",
        3: "Spelling",
        4: "Exploration",
      };

      // Group XP per date per subject
      const grouped: Record<string, Record<string, number>> = {};

      data.forEach((entry) => {
        const date = new Date(entry.timestamp).toISOString().split("T")[0];
        const subject = subjectMap[entry.subject_id] || "Unknown";
        if (!grouped[date]) grouped[date] = {};
        if (!grouped[date][subject]) grouped[date][subject] = 0;
        grouped[date][subject] += Number(entry.xp_earned) || 0;
      });

      // Convert to cumulative format
      const sortedDates = Object.keys(grouped).sort();
      const subjects = Object.values(subjectMap);
      type CumulativeXpEntry = {
        date: string;
        [subject: string]: number | string;
      };

      const cumulative: CumulativeXpEntry[] = [];


      const totals: Record<string, number> = {};
      for (const subject of subjects) totals[subject] = 0;

      for (const date of sortedDates) {
        for (const subject of subjects) {
          totals[subject] += grouped[date][subject] || 0;
        }
        cumulative.push({ date, ...totals });
      }

      setXpHistory(cumulative);
    };

    fetchXpHistory();
  }, []);

  const subjectMap: Record<number, string> = {
    1: "Math",
    2: "Reading",
    3: "Spelling",
    4: "Exploration",
  };

  const chartData = studentData.map((entry) => ({
    subject: subjectMap[entry.subject_id] || "Unknown",
    xp: getTotalXpEarned(entry.level, entry.xp),
  }));



  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-100 p-6 space-y-4 shadow-md">
        <h2 className="text-xl font-bold text-purple-800 mb-4">Admin Panel</h2>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/")}
        >
          🏠 Back to Learning Assistant
        </Button>

        <div className="space-y-2 text-sm mt-6">
          <button
            onClick={() => setActiveTab("progress")}
            className={`w-full text-left px-3 py-2 rounded ${
              activeTab === "progress"
                ? "bg-white font-semibold"
                : "text-gray-700 hover:bg-purple-200"
            }`}
          >
            📊 Student Progress
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`w-full text-left px-3 py-2 rounded ${
              activeTab === "rules"
                ? "bg-white font-semibold"
                : "text-gray-700 hover:bg-purple-200"
            }`}
          >
            ⚙️ Customize Rules
          </button>

          <button
            onClick={() => setActiveTab("limits")}
            className={`w-full text-left px-3 py-2 rounded ${
              activeTab === "limits"
                ? "bg-white font-semibold"
                : "text-gray-700 hover:bg-purple-200"
            }`}
          >
            🔒 Limitations
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-3xl font-bold text-purple-800">
          📊 Admin Dashboard
        </h1>

        {activeTab === "progress" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-purple-600" />
                Student Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentData.map((entry, idx) => (
                  <li key={idx} className="p-3 border rounded bg-purple-50">
                    <p className="text-sm text-gray-600">
                      {subjectMap[entry.subject_id] || "Unknown Subject"}
                    </p>
                    <p className="font-semibold">
                      Level {entry.level} — {entry.xp} XP
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Current XP by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <XpBySubjectChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 Subject Strengths (Avg XP per Attempt)</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectStrengthChart data={performanceData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Attempt Volume by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <AttemptVolumeChart data={attemptVolumeData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>XP Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <XpOverTimeChart data={xpHistory} />
          </CardContent>
        </Card>

        {activeTab === "rules" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Settings className="w-5 h-5" />
                Customize Rules (Coming Soon)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">
                You'll be able to restrict topics, enforce Common Core, and add
                guidance rules for the AI here.
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === "limits" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Shield className="w-5 h-5" />
                Limitations & Access Control (Coming Soon)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">
                This section will allow you to set session limits, enforce focus
                time, or lock out subjects.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
