// AITutor/my-app/app/intro-quiz/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // 🌀

export default function IntroQuizPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    age: "",
    grade: "",
    gender: "",
  });

  const [mathScore, setMathScore] = useState(0);
  const [readingScore, setReadingScore] = useState(0);
  const [currentMathQ, setCurrentMathQ] = useState(0);
  const [currentReadingQ, setCurrentReadingQ] = useState(0);

  const mathQuestions = [
    { question: "5 + 3 =", answer: "8" },
    { question: "10 - 7 =", answer: "3" },
    { question: "2 × 6 =", answer: "12" },
  ];

  const readingQuestions = [
    { question: "What is the opposite of 'hot'?", answer: "cold" },
    { question: "Finish the sentence: The sky is ___", answer: "blue" },
    { question: "Which animal barks?", answer: "dog" },
  ];

  const [userAnswer, setUserAnswer] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    setLoading(false);

    if (res.ok) {
      setStep(2);
    } else {
      alert("Error saving profile info. Try again!");
    }
  };

  const handleMathAnswer = () => {
    if (
      userAnswer.trim().toLowerCase() ===
      mathQuestions[currentMathQ].answer.toLowerCase()
    ) {
      setMathScore((prev) => prev + 1);
    }
    setUserAnswer("");
    if (currentMathQ + 1 < mathQuestions.length) {
      setCurrentMathQ(currentMathQ + 1);
    } else {
      setStep(3);
    }
  };

  const handleReadingAnswer = async () => {
    if (
      userAnswer.trim().toLowerCase() ===
      readingQuestions[currentReadingQ].answer.toLowerCase()
    ) {
      setReadingScore((prev) => prev + 1);
    }
    setUserAnswer("");
    if (currentReadingQ + 1 < readingQuestions.length) {
      setCurrentReadingQ(currentReadingQ + 1);
    } else {
      setLoading(true);
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mathScore: (mathScore / mathQuestions.length) * 100,
          readingScore: (readingScore / readingQuestions.length) * 100,
        }),
      });
      setLoading(false);

      if (res.ok) {
        router.push("/learning-assistant");
      } else {
        alert("Error submitting quiz results. Try again!");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg relative overflow-hidden">
      {/* Progress indicator */}
      <div className="flex justify-center mb-6 space-x-2">
        <div
          className={`h-2 w-12 rounded-full ${
            step >= 1 ? "bg-purple-500" : "bg-gray-300"
          }`}
        />
        <div
          className={`h-2 w-12 rounded-full ${
            step >= 2 ? "bg-purple-500" : "bg-gray-300"
          }`}
        />
        <div
          className={`h-2 w-12 rounded-full ${
            step >= 3 ? "bg-purple-500" : "bg-gray-300"
          }`}
        />
      </div>

      {/* Animate Steps */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-bold mb-4 text-center">
              Tell us about yourself!
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <input
                type="number"
                placeholder="Age"
                value={profile.age}
                onChange={(e) =>
                  setProfile({ ...profile, age: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={profile.grade}
                onChange={(e) =>
                  setProfile({ ...profile, grade: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select your Grade</option>
                <option value="Kindergarten">Kindergarten</option>
                <option value="1st Grade">1st Grade</option>
                <option value="2nd Grade">2nd Grade</option>
                <option value="3rd Grade">3rd Grade</option>
                <option value="4th Grade">4th Grade</option>
                <option value="5th Grade">5th Grade</option>
                <option value="6th Grade">6th Grade</option>
                <option value="7th Grade">7th Grade</option>
                <option value="8th Grade">8th Grade</option>
              </select>

              <select
                value={profile.gender}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="">Select Gender (optional)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="math"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Math Quiz</h2>
            <p className="mb-4 text-center">
              {mathQuestions[currentMathQ].question}
            </p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Your answer"
            />
            <button
              onClick={handleMathAnswer}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Checking..." : "Submit Answer"}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Reading Quiz</h2>
            <p className="mb-4 text-center">
              {readingQuestions[currentReadingQ].question}
            </p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Your answer"
            />
            <button
              onClick={handleReadingAnswer}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Answer"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
