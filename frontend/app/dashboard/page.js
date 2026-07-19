"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {

    const { user } = useUser();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

 useEffect(() => {
  if (!user) return;

  fetchHistory();

}, [user]);
const fetchHistory = async () => {
  if (!user) return;

  try {
    const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/history?user_id=${user.id}`
);

    const data = await response.json();

    console.log("Dashboard Data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Unable to load study history");
    }

    setHistory(data.history);

  } catch (error) {
    console.error(error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

  const calculatePercentage = (score, total) => {
    if (total === 0) {
      return 0;
    }

    return Math.round((score / total) * 100);
  };

  const totalSessions = history.length;

  const uniqueTopics = new Set(
    history.map((session) =>
      session.topic.toLowerCase()
    )
  ).size;

  const averageOriginalScore =
    history.length > 0
      ? Math.round(
          history.reduce((total, session) => {
            return (
              total +
              calculatePercentage(
                session.original_score,
                session.original_total
              )
            );
          }, 0) / history.length
        )
      : 0;

  const averageImprovement =
    history.length > 0
      ? Math.round(
          history.reduce((total, session) => {
            const originalPercentage =
              calculatePercentage(
                session.original_score,
                session.original_total
              );

            const practicePercentage =
              calculatePercentage(
                session.practice_score,
                session.practice_total
              );

            return (
              total +
              (practicePercentage -
                originalPercentage)
            );
          }, 0) / history.length
        )
      : 0;
const recentHistory = [...history].slice(0, 3);
 const chartData = [...history]
  .reverse()
  .map((session) => {
    return {
      topic: session.topic,

      original: calculatePercentage(
        session.original_score,
        session.original_total
      ),

      practice: calculatePercentage(
        session.practice_score,
        session.practice_total
      ),
    };
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold text-cyan-400">
              📊 Progress Dashboard
            </h1>

            <p className="text-gray-400 mt-4">
              Track your learning and improvement
            </p>
          </div>

          <Link
            href="/"
            className="bg-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            ← Back to Learning
          </Link>
        </div>

        {loading && (
          <div className="text-center mt-20">
            <p className="text-xl text-cyan-400">
              Loading study history...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-6">
            <p className="text-red-400">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          history.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">

              <h2 className="text-3xl font-bold mb-4">
                📚 No Study History Yet
              </h2>

              <p className="text-gray-400 mb-8">
                Complete a quiz and weak-area practice
                session to start tracking your progress.
              </p>

              <Link
                href="/"
                className="inline-block bg-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-700"
              >
                Start Learning
              </Link>

            </div>
          )}

        {!loading &&
          !error &&
          history.length > 0 && (
            <>

              <div className="grid md:grid-cols-4 gap-6 mb-10">

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <p className="text-gray-400">
                    Study Sessions
                  </p>

                  <p className="text-4xl font-bold text-cyan-400 mt-3">
                    {totalSessions}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <p className="text-gray-400">
                    Topics Studied
                  </p>

                  <p className="text-4xl font-bold text-purple-400 mt-3">
                    {uniqueTopics}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <p className="text-gray-400">
                    Avg Quiz Score
                  </p>

                  <p className="text-4xl font-bold text-orange-400 mt-3">
                    {averageOriginalScore}%
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <p className="text-gray-400">
                    Avg Improvement
                  </p>

                  <p className="text-4xl font-bold text-green-400 mt-3">
                    {averageImprovement > 0
                      ? "+"
                      : ""}

                    {averageImprovement}%
                  </p>
                </div>

              </div>


              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-10">

                <h2 className="text-3xl font-bold text-green-400 mb-3">
                  📈 Learning Progress
                </h2>

                <p className="text-gray-400 mb-8">
                  Compare your original quiz and focused
                  practice performance.
                </p>

                <div className="w-full h-96">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart data={chartData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="topic"
                        stroke="#94a3b8"
                        />

                      <YAxis
                        domain={[0, 100]}
                        stroke="#94a3b8"
                        unit="%"
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        labelStyle={{
                          color: "#ffffff",
                        }}
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="original"
                        name="Original Quiz"
                        stroke="#f97316"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="practice"
                        name="Practice Quiz"
                        stroke="#22c55e"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">

                    <h2 className="text-3xl font-bold text-green-400 mb-6">
                        🚀 Quick Actions
                    </h2>

                    <div className="grid grid-cols-2 gap-4">

                        <Link
                        href="/library"
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-lg py-5 text-center font-semibold transition"
                        >
                        📚 Learning Library
                        </Link>

                        <Link
                        href="/"
                        className="bg-cyan-600 hover:bg-cyan-700 rounded-lg py-5 text-center font-semibold transition"
                        >
                        ➕ New Lesson
                        </Link>

                    </div>

                    </div>

              

            </>
          )}

      </div>
    </main>
  );
}