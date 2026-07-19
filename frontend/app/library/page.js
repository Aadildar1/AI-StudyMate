"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function LearningLibrary() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchLibrary();
  }, []);

  async function fetchLibrary() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/library"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load library"
        );
      }

      setTopics(data.topics || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const percentage = (score, total) => {
    if (!total) return 0;
    return Math.round((score / total) * 100);
  };

  const filteredTopics = useMemo(() => {
    let results = [...topics];

    if (search.trim()) {
      results = results.filter((topic) =>
        topic.topic
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (filter === "completed") {
      results = results.filter(
        (topic) =>
          percentage(
            topic.practice_score,
            topic.practice_total
          ) >=
          percentage(
            topic.original_score,
            topic.original_total
          )
      );
    }

    if (filter === "practice") {
      results = results.filter(
        (topic) =>
          percentage(
            topic.practice_score,
            topic.practice_total
          ) <
          percentage(
            topic.original_score,
            topic.original_total
          )
      );
    }

    switch (sortBy) {
      case "oldest":
        results.reverse();
        break;

      case "az":
        results.sort((a, b) =>
          a.topic.localeCompare(b.topic)
        );
        break;

      case "score":
        results.sort(
          (a, b) =>
            percentage(
              b.practice_score,
              b.practice_total
            ) -
            percentage(
              a.practice_score,
              a.practice_total
            )
        );
        break;

      default:
        break;
    }

    return results;
  }, [topics, search, filter, sortBy]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-white text-2xl">
        Loading Learning Library...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-400 text-xl">
        {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">

          <div>

            <h1 className="text-5xl font-bold">
              📚 Learning Library
            </h1>

            <p className="text-zinc-400 mt-3 text-lg">
              Your personal collection of AI learning sessions.
            </p>

          </div>

          <Link
            href="/"
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 px-6 py-3 rounded-2xl transition"
          >
            ← Back Home
          </Link>

        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">

          <input
            type="text"
            placeholder="🔍 Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-violet-500"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
            <option value="score">
              Best Practice Score
            </option>
          </select>

        </div>

        <div className="flex gap-3 mb-10">

          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2 rounded-full ${
              filter === "all"
                ? "bg-violet-600"
                : "bg-zinc-800"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`px-5 py-2 rounded-full ${
              filter === "completed"
                ? "bg-green-600"
                : "bg-zinc-800"
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => setFilter("practice")}
            className={`px-5 py-2 rounded-full ${
              filter === "practice"
                ? "bg-orange-600"
                : "bg-zinc-800"
            }`}
          >
            Needs Practice
          </button>

        </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

          {filteredTopics.length === 0 ? (

            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">

              <h2 className="text-3xl font-bold mb-3">
                📚 No Topics Found
              </h2>

              <p className="text-zinc-400">
                Try changing your search or filters.
              </p>

            </div>

          ) : (

            filteredTopics.map((topic, index) => {

              const originalPercentage = percentage(
                topic.original_score,
                topic.original_total
              );

              const practicePercentage = percentage(
                topic.practice_score,
                topic.practice_total
              );

              const improvement =
                practicePercentage - originalPercentage;

              return (

                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 hover:border-violet-500 transition duration-300"
                >

                  <div className="flex justify-between items-start mb-5">

                    <h2 className="text-2xl font-bold">
                      📘 {topic.topic}
                    </h2>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        improvement >= 0
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {improvement >= 0 ? "+" : ""}
                      {improvement}%
                    </span>

                  </div>

                  <p className="text-zinc-500 mb-6">
                    📅 {topic.studied_at}
                  </p>

                  <div className="mb-5">

                    <div className="flex justify-between mb-2">

                      <span>Original Quiz</span>

                      <span className="font-bold">
                        {originalPercentage}%
                      </span>

                    </div>

                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${originalPercentage}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="mb-6">

                    <div className="flex justify-between mb-2">

                      <span>Practice Quiz</span>

                      <span className="font-bold">
                        {practicePercentage}%
                      </span>

                    </div>

                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{
                          width: `${practicePercentage}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">

                    <div className="bg-zinc-800 rounded-2xl p-4 text-center">

                      <p className="text-zinc-400 text-sm">
                        Original
                      </p>

                      <p className="text-xl font-bold">
                        {topic.original_score} / {topic.original_total}
                      </p>

                    </div>

                    <div className="bg-zinc-800 rounded-2xl p-4 text-center">

                      <p className="text-zinc-400 text-sm">
                        Practice
                      </p>

                      <p className="text-xl font-bold">
                        {topic.practice_score} / {topic.practice_total}
                      </p>

                    </div>

                  </div>

                  

                </div>

              );

            })

          )}
                  </div>

      </div>

    </main>
  );
}
