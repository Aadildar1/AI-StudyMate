"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { apiFetch, formatDate, topicLabel, truncate } from "@/lib/api";

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

    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

  // The middleware redirects signed-out visitors, so this is a fallback.
  const signedOut = isLoaded && !isSignedIn;

  useEffect(() => {
    // Wait until Clerk knows whether there is a session.
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch("/history", {
          token: await getToken(),
        });

        if (!cancelled) setHistory(data.history || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const calculatePercentage = (score, total) => {
    if (total === 0) {
      return 0;
    }

    return Math.round((score / total) * 100);
  };

  const totalSessions = history.length;

  const uniqueTopics = new Set(
    history.map((session) =>
      topicLabel(session.topic).toLowerCase()
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
      topic: truncate(session.topic),
      fullTopic: topicLabel(session.topic),

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
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 pt-4 pb-16">
      <NavBar />
      <div className="max-w-6xl mx-auto pt-10">

        <div className="flex flex-wrap justify-between items-center gap-4 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">
              📊 Progress Dashboard
            </h1>

            <p className="text-gray-400 mt-4">
              Track your learning and improvement
            </p>
          </div>

          <Link
            href="/"
            className="bg-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            ← Back to Learning
          </Link>
        </div>

        {signedOut && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">🔐 Sign in required</h2>
            <p className="text-gray-400 mb-8">
              Sign in to see your study history and progress.
            </p>
            <Link
              href="/sign-in"
              className="inline-block bg-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-700"
            >
              Sign In
            </Link>
          </div>
        )}

        {!signedOut && loading && (
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
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.fullTopic ?? label
                        }
                        formatter={(value) => [`${value}%`]}
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-10">

                  <h2 className="text-3xl font-bold text-cyan-400 mb-2">
                    🕒 Recent Sessions
                  </h2>

                  <p className="text-gray-400 mb-6">
                    Your latest study sessions. Open one to study the topic again.
                  </p>

                  <div className="space-y-3">
                    {recentHistory.map((session) => {
                      const original = calculatePercentage(session.original_score, session.original_total);
                      const practice = calculatePercentage(session.practice_score, session.practice_total);
                      const change = practice - original;

                      return (
                        <div
                          key={session.id ?? `${session.topic}-${session.studied_at}`}
                          className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-5 py-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">
                              {topicLabel(session.topic)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(session.studied_at)} · Quiz {original}% · Practice {practice}%
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                change >= 0 ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                              }`}
                            >
                              {change >= 0 ? "+" : ""}{change}%
                            </span>

                            <Link
                              href={`/?topic=${encodeURIComponent(topicLabel(session.topic))}`}
                              className="text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg whitespace-nowrap"
                            >
                              Study again
                            </Link>
                          </div>
                        </div>
                      );
                    })}
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