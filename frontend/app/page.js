"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/nextjs";

import Link from "next/link";

export default function Home() {

  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [videos, setVideos] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [generatedWeakQuiz, setGeneratedWeakQuiz] = useState([]);

  const [weakQuiz, setWeakQuiz] = useState([]);
  const [weakAnswers, setWeakAnswers] = useState({});
  const [weakQuizSubmitted, setWeakQuizSubmitted] = useState(false);
  const [weakScore, setWeakScore] = useState(0);
  const [progressAnalysis, setProgressAnalysis] = useState("");
  const [progressLoading, setProgressLoading] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const summaryRef = useRef(null);
  const feedbackRef = useRef(null);
  const progressRef = useRef(null);

  const handleSubmit = async () => {
    
    if (topic.trim() === "") {
      setError("Please enter a topic");
      return;
    }

    const currentTopic = topic;

    setTopic("");

    setLoading(true);
    setError("");
    setSummary("");
    setVideos([]);
    setQuiz([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(0);
    setFeedback("");
    setMistakes([]);
    setGeneratedWeakQuiz([]);
    setWeakQuiz([]);
    setWeakAnswers({});
    setWeakQuizSubmitted(false);
    setWeakScore(0);
    setProgressAnalysis("");
    setProgressLoading(false);

    try {
      const token = await getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },

          body: JSON.stringify({
            topic: currentTopic,
          }),
        }
      );

      const data = await response.json();

if (!response.ok) {
    throw new Error(
        data.detail || data.message || "Backend request failed"
    );
}

      setSummary(data.summary);
      setVideos(data.videos);
      setQuiz(data.quiz);
    } catch (error) {
  console.error(error);
  setError(error.message);
} finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex, option) => {
    if (quizSubmitted) {
      return;
    }

    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: option,
    });
  };

  const handleQuizSubmit = async () => {
    if (Object.keys(selectedAnswers).length !== quiz.length) {
      setError(
        "Please answer all quiz questions before submitting"
      );

      return;
    }

    setError("");

    let calculatedScore = 0;

    const studentMistakes = [];

    quiz.forEach((question, index) => {
      const studentAnswer = selectedAnswers[index];

      if (studentAnswer === question.answer) {
        calculatedScore++;
      } else {
        studentMistakes.push({
          question: question.question,
          student_answer: studentAnswer,
          correct_answer: question.answer,
        });
      }
    });

    setScore(calculatedScore);
    setMistakes(studentMistakes);
    setQuizSubmitted(true);
    setFeedbackLoading(true);
    setFeedback("");
    setGeneratedWeakQuiz([]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            topic: topic,
            score: calculatedScore,
            total: quiz.length,
            mistakes: studentMistakes,
          }),
        }
      );

      const data = await response.json();

if (!response.ok) {
    throw new Error(
        data.detail || data.message || "Backend request failed"
    );
}

      setFeedback(data.feedback);

      setGeneratedWeakQuiz(
        data.weak_quiz || []
      );
    } catch (error) {
      console.error(error);

      setFeedbackLoading(false);

      setError(error.message);

      return;
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleWeakAnswer = (
    questionIndex,
    option
  ) => {
    if (weakQuizSubmitted) {
      return;
    }

    setWeakAnswers({
      ...weakAnswers,
      [questionIndex]: option,
    });
  };

  const handleWeakAreaPractice = () => {
    setError("");

    setWeakQuiz(generatedWeakQuiz);

    setWeakAnswers({});

    setWeakQuizSubmitted(false);

    setWeakScore(0);

    setProgressAnalysis("");
  };

  const handleWeakQuizSubmit = async () => {
    if (
      Object.keys(weakAnswers).length !==
      weakQuiz.length
    ) {
      setError(
        "Please answer all practice questions before submitting"
      );

      return;
    }

    setError("");

    let calculatedScore = 0;

    const practiceMistakes = [];

    weakQuiz.forEach((question, index) => {
      const studentAnswer = weakAnswers[index];

      if (studentAnswer === question.answer) {
        calculatedScore++;
      } else {
        practiceMistakes.push({
          question: question.question,
          student_answer: studentAnswer,
          correct_answer: question.answer,
        });
      }
    });

    setWeakScore(calculatedScore);

    setWeakQuizSubmitted(true);

    setProgressLoading(true);

    setProgressAnalysis("");

    try {
      const response = await fetch(
       `${process.env.NEXT_PUBLIC_API_URL}/progress-analysis`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

         body: JSON.stringify({
          topic: topic,
          original_score: score,
          original_total: quiz.length,
          practice_score: calculatedScore,
          practice_total: weakQuiz.length,
          original_mistakes: mistakes,
          practice_mistakes: practiceMistakes,
      }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Progress Analysis Error:", data);
        throw new Error("Progress analysis request failed");
    }

      setProgressAnalysis(data.analysis);

      const saveResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/save-history`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            user_id: user?.id,
            topic: topic,
            original_score: score,
            original_total: quiz.length,
            practice_score: calculatedScore,
            practice_total: weakQuiz.length,
            progress_analysis: data.analysis,
        }),
        }
      );

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          saveData.message ||
            "Unable to save study history"
        );
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setProgressLoading(false);
    }
  };
const handleChat = async () => {
  if (chatQuestion.trim() === "") return;

  setChatLoading(true);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          question: chatQuestion,
        }),
      }
    );

    const data = await response.json();

    setChatMessages((previous) => [
      ...previous,
      {
        role: "user",
        message: chatQuestion,
      },
      {
        role: "assistant",
        message: data.answer,
      },
    ]);

    setChatQuestion("");

  } catch (error) {
    setChatMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        message: "Something went wrong.",
      },
    ]);
  }

  setChatLoading(false);
};
useEffect(() => {
  if (summary && summaryRef.current) {
    summaryRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [summary]);
useEffect(() => {
  if (feedback && feedbackRef.current) {
    feedbackRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [feedback]);
useEffect(() => {
  if (progressAnalysis) {
    setTimeout(() => {
      progressRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }
}, [progressAnalysis]);
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-16 pb-40">
      <nav className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

          <h1 className="text-2xl font-bold text-white">
             AI StudyMate
          </h1>

          <div className="flex items-center gap-4">

            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition"
            >
              📊 Dashboard
            </Link>

            <Link
              href="/library"
              className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition"
            >
              📚 Library
            </Link>

            <Show when="signed-out">
              <SignInButton>
                <button className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton>
                <button className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  Register
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <span className="text-gray-300 font-medium">
                  My Account
                </span>

                <UserButton />
              </div>
            </Show>

          </div>

        </div>
      </nav>
      <div className="max-w-6xl mx-auto pt-6">
      
        <div className="min-h-[70vh] flex flex-col justify-center">

          <div className="text-center">

            <h1 className="text-6xl font-bold text-white mb-5">
              Learn Anything with AI
            </h1>

            <p className="text-zinc-400 text-xl">
              Personalized lessons • AI Tutor • Quizzes • Progress Tracking
            </p>

          </div>

</div>

        {summary && (
          <section
            ref={summaryRef}
            className="mt-16"
          >

            <div className="flex items-center gap-4 mb-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-3xl">
                📖
              </div>

              <div>
                <h2 className="text-4xl font-bold text-white">
                  AI Summary
                </h2>

                <p className="text-zinc-400 mt-1">
                  Understand the topic before diving deeper.
                </p>
              </div>

            </div>

            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl">

              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"></div>

              <div className="p-10">

                <div className="prose prose-invert max-w-none
                                prose-headings:text-white
                                prose-p:text-gray-300
                                prose-strong:text-cyan-300
                                prose-li:text-gray-300
                                prose-code:text-cyan-300
                                prose-a:text-cyan-400
                                leading-8">

                  <ReactMarkdown>
                    {summary}
                  </ReactMarkdown>

                </div>

              </div>

            </div>

          </section>
        )}

        {videos.length > 0 && (
          <section className="mt-16">

            <div className="flex items-center gap-4 mb-8">

              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl">
                🎥
              </div>

              <div>
                <h2 className="text-4xl font-bold text-white">
                  Recommended Videos
                </h2>

                <p className="text-zinc-400 mt-1">
                  Reinforce your understanding with carefully selected YouTube videos.
                </p>
              </div>

            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

              {videos.map((video, index) => (

                <div
                  key={index}
                  className="group overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >

                  <div className="overflow-hidden">

                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                    />

                  </div>

                  <div className="p-6">

                    <h3 className="text-xl font-semibold text-white line-clamp-2 min-h-[60px]">
                      {video.title}
                    </h3>

                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-semibold transition"
                    >
                      ▶ Watch on YouTube
                    </a>

                  </div>

                </div>

              ))}

            </div>

          </section>
        )}
          {summary && (
            <section className="mt-16">

              <div className="flex items-center gap-4 mb-8">

                <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl">
                  💬
                </div>

                <div>
                  <h2 className="text-4xl font-bold text-white">
                    AI Tutor
                  </h2>

                  <p className="text-zinc-400 mt-1">
                    Ask questions about the topic anytime before taking the quiz.
                  </p>
                </div>

              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

                <div className="max-h-[500px] overflow-y-auto p-6 space-y-5">

                  {chatMessages.length === 0 && (
                    <div className="text-center text-zinc-500 py-10">
                      💡 Start a conversation with AI StudyMate.
                    </div>
                  )}

                  {chatMessages.map((chat, index) => (

                    <div
                      key={index}
                      className={`flex ${
                        chat.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                          chat.role === "user"
                            ? "bg-indigo-600"
                            : "bg-slate-800 border border-slate-700"
                        }`}
                      >

                        <p className="text-sm font-semibold mb-2 text-zinc-300">
                          {chat.role === "user"
                            ? "👤 You"
                            : "🤖 AI StudyMate"}
                        </p>

                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>
                            {chat.message}
                          </ReactMarkdown>
                        </div>

                      </div>

                    </div>

                  ))}

                  {chatLoading && (

                    <div className="flex justify-start">

                      <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4">
                        🤖 AI StudyMate is thinking...
                      </div>

                    </div>

                  )}

                </div>

                <div className="border-t border-slate-800 p-6">

                  <textarea
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Ask anything about this topic..."
                    className="w-full h-28 rounded-2xl bg-slate-950 border border-slate-700 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />

                  <div className="flex justify-end mt-4">

                    <button
                      onClick={handleChat}
                      disabled={chatLoading}
                      className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                      {chatLoading ? "Thinking..." : "Send Message"}
                    </button>

                  </div>

                </div>

              </div>

            </section>
          )}

        {quiz.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-8">

              <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-3xl">
                🧠
              </div>

              <div>
                <h2 className="text-4xl font-bold text-white">
                  Knowledge Check
                </h2>

                <p className="text-zinc-400 mt-1">
                  Test what you've learned before moving to personalized feedback.
                </p>
              </div>

            </div>

            <div className="space-y-8">
              {quiz.map(
                (question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-lg"
                  >
                    <div className="flex items-center gap-4 mb-6">

                      <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold">
                        {questionIndex + 1}
                      </div>

                      <h3 className="text-xl font-semibold text-white">
                        {question.question}
                      </h3>

                    </div>

                    <div className="grid gap-3">
                      {question.options.map(
                        (option, optionIndex) => {
                          const selected =
                            selectedAnswers[
                              questionIndex
                            ];

                          const isSelected =
                            selected === option;

                          const isCorrect =
                            option ===
                            question.answer;

                          let buttonStyle =
                            "bg-slate-800 border-slate-700 hover:bg-slate-700";

                          if (
                            !quizSubmitted &&
                            isSelected
                          ) {
                            buttonStyle =
                              "bg-indigo-600 border-indigo-400";
                          }

                          if (quizSubmitted) {
                            if (isCorrect) {
                              buttonStyle =
                                "bg-green-600 border-green-500";
                            } else if (
                              isSelected
                            ) {
                              buttonStyle =
                                "bg-red-600 border-red-500";
                            }
                          }

                          return (
                            <button
                              key={optionIndex}
                              onClick={() =>
                                handleAnswer(
                                  questionIndex,
                                  option
                                )
                              }
                              disabled={quizSubmitted}
                              className={`w-full text-left px-5 py-4 rounded-2xl border font-medium transition-all duration-200 hover:scale-[1.01] ${buttonStyle}`}
                            >
                              {option}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {!quizSubmitted && (
              <div className="mt-10 text-center">
                <p className="text-gray-400 mb-4">
                  Answered:{" "}
                  {
                    Object.keys(selectedAnswers)
                      .length
                  }{" "}
                  / {quiz.length}
                </p>

                <button
                  onClick={handleQuizSubmit}
                  className="bg-green-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 cursor-pointer"
                >
                  Submit Quiz
                </button>
              </div>
            )}

            {quizSubmitted && (

              <div className="mt-12 rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-2xl">

                <div className="p-10 text-center">

                  <div className="text-7xl mb-5">
                    🏆
                  </div>

                  <h3 className="text-4xl font-bold">
                    Quiz Completed!
                  </h3>

                  <p className="text-indigo-100 mt-3 text-lg">
                    Here's how you performed.
                  </p>

                  <div className="mt-8 inline-flex items-center justify-center w-36 h-36 rounded-full border-4 border-white text-5xl font-bold bg-white/10 backdrop-blur">

                    {score}

                  </div>

                  <p className="mt-5 text-xl">
                    out of <span className="font-bold">{quiz.length}</span>
                  </p>

                </div>

              </div>

              )}
            {feedbackLoading && (
              <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <p className="text-xl text-cyan-400">
                  🤖 AI is analyzing your
                  performance...
                </p>
              </div>
            )}
            {error && !feedback && (
              <div className="mt-8 bg-red-950 border border-red-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-400 mb-3">
                  🚫 AI Feedback Unavailable
                </h3>

                <p className="text-red-300">
                  {error}
                </p>
              </div>
            )}

            {feedback && (
              <section
                ref={feedbackRef}
                className="mt-16"
              >

                <div className="flex items-center gap-4 mb-8">

                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-3xl">
                    🤖
                  </div>

                  <div>
                    <h2 className="text-4xl font-bold text-white">
                      AI Performance Analysis
                    </h2>

                    <p className="text-zinc-400 mt-1">
                      Here's what you did well and where you can improve.
                    </p>
                  </div>

                </div>

                <div className="rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl">

                  <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"></div>

                  <div className="p-10">

                    <div className="prose prose-invert max-w-none
                                    prose-headings:text-white
                                    prose-p:text-gray-300
                                    prose-strong:text-cyan-300
                                    prose-li:text-gray-300
                                    leading-8">

                      <ReactMarkdown>
                        {feedback}
                      </ReactMarkdown>

                    </div>

                    {mistakes.length > 0 && (

                      <div className="mt-10 text-center">

                        <button
                          onClick={handleWeakAreaPractice}
                          disabled={generatedWeakQuiz.length === 0}
                          className="bg-orange-600 hover:bg-orange-700 px-8 py-4 rounded-2xl text-lg font-semibold transition disabled:opacity-50"
                        >
                          🎯 Practice Weak Areas
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              </section>
            )}

            {weakQuiz.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-4 mb-8">

                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-3xl">
                    🎯
                  </div>

                  <div>
                    <h2 className="text-4xl font-bold text-white">
                      Weak Area Practice
                    </h2>

                    <p className="text-zinc-400 mt-1">
                      Strengthen the concepts that need the most improvement.
                    </p>
                  </div>

                </div>

                <div className="space-y-8">
                  {weakQuiz.map(
                    (question, questionIndex) => (
                      <div
                        key={questionIndex}
                        className="bg-gradient-to-br from-slate-900 to-slate-950 border border-orange-500/20 rounded-3xl p-8 shadow-lg"
                      >
                        <div className="flex items-center gap-4 mb-6">

                          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold">
                            {questionIndex + 1}
                          </div>

                          <h3 className="text-xl font-semibold">
                            {question.question}
                          </h3>

                        </div>

                        <div className="grid gap-3">
                          {question.options.map(
                            (
                              option,
                              optionIndex
                            ) => {
                              const selected =
                                weakAnswers[
                                  questionIndex
                                ];

                              const isSelected =
                                selected === option;

                              const isCorrect =
                                option ===
                                question.answer;

                              let buttonStyle =
                                "bg-slate-800 border-slate-700 hover:bg-slate-700";

                              if (
                                !weakQuizSubmitted &&
                                isSelected
                              ) {
                                buttonStyle =
                                  "bg-orange-600 border-orange-400";
                              }

                              if (
                                weakQuizSubmitted
                              ) {
                                if (isCorrect) {
                                  buttonStyle =
                                    "bg-green-600 border-green-500";
                                } else if (
                                  isSelected
                                ) {
                                  buttonStyle =
                                    "bg-red-600 border-red-500";
                                }
                              }

                              return (
                                <button
                                  key={optionIndex}
                                  onClick={() =>
                                    handleWeakAnswer(
                                      questionIndex,
                                      option
                                    )
                                  }
                                  disabled={
                                    weakQuizSubmitted
                                  }
                                  className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] ${buttonStyle}`}
                                >
                                  {option}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {!weakQuizSubmitted && (
                  <div className="mt-10 text-center">
                    <p className="text-gray-400 mb-4">
                      Answered:{" "}
                      {
                        Object.keys(weakAnswers)
                          .length
                      }{" "}
                      / {weakQuiz.length}
                    </p>

                    <button
                      onClick={handleWeakQuizSubmit}
                      className="bg-orange-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 cursor-pointer"
                    >
                      Submit Practice Quiz
                    </button>
                  </div>
                )}

                {weakQuizSubmitted && (

                <div className="mt-12 rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 shadow-2xl">

                  <div className="p-10 text-center">

                    <div className="text-7xl mb-5">
                      🎉
                    </div>

                    <h3 className="text-4xl font-bold">
                      Practice Completed!
                    </h3>

                    <p className="text-orange-100 mt-3 text-lg">
                      Great job reinforcing your weak areas.
                    </p>

                    <div className="mt-8 inline-flex items-center justify-center w-36 h-36 rounded-full border-4 border-white text-5xl font-bold bg-white/10 backdrop-blur">

                      {weakScore}

                    </div>

                    <p className="mt-5 text-xl">
                      out of <span className="font-bold">{weakQuiz.length}</span>
                    </p>

                  </div>

                </div>

                )}

                {progressLoading && (
                  <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                    <p className="text-xl text-green-400">
                      📈 AI is analyzing your learning
                      progress...
                    </p>
                  </div>
                )}
                {error && !progressAnalysis && (
                    <div className="mt-8 bg-red-950 border border-red-700 rounded-xl p-6">
                      <h3 className="text-2xl font-bold text-red-400 mb-3">
                        🚫 Learning Analysis Unavailable
                      </h3>

                      <p className="text-red-300">
                        {error}
                      </p>
                    </div>
                  )}

                {progressAnalysis && (

                  <section
                    ref={progressRef}
                    className="mt-16"
                  >

                  <div className="flex items-center gap-4 mb-8">

                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-3xl">
                      📈
                    </div>

                    <div>

                      <h2 className="text-4xl font-bold text-white">
                        Learning Progress
                      </h2>

                      <p className="text-zinc-400 mt-1">
                        AI evaluation of your overall improvement.
                      </p>

                    </div>

                  </div>

                  <div className="rounded-3xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl">

                    <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>

                    <div className="p-10">

                      <div
                        className="prose prose-invert max-w-none
                                  prose-headings:text-white
                                  prose-p:text-gray-300
                                  prose-strong:text-emerald-300
                                  prose-li:text-gray-300
                                  leading-8"
                      >

                        <ReactMarkdown>
                          {progressAnalysis}
                        </ReactMarkdown>

                      </div>

                    </div>

                  </div>

                </section>

                )}
              
              </div>
            )}
          </div>
        )}
      <div className="sticky bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 py-5 mt-16">
        {error && (
          <div className="mb-4 bg-red-950 border border-red-700 rounded-2xl p-4">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-700 rounded-3xl flex items-center gap-3 p-3 shadow-2xl">
          <input
            type="text"
            placeholder="What would you like to learn today?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-transparent outline-none px-4 text-lg"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 rounded-2xl px-8 py-3 font-semibold transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                ⏳ Generating...
              </span>
            ) : (
              "🚀 Learn"
            )}
          </button>

        </div>

      </div>
      </div>
    </main>
  );
}