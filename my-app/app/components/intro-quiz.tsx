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
    // Kindergarten – Level 1
    { level: 1, question: "What is 2 + 1?", answer: "3" },
    { level: 1, question: "What is 5 − 2?", answer: "3" },
    { level: 1, question: "Count the sides of a triangle.", answer: "3" },
    { level: 1, question: "What number comes after 6?", answer: "7" },

    // 1st Grade – Level 2
    { level: 2, question: "What is 10 + 4?", answer: "14" },
    { level: 2, question: "What is 13 − 5?", answer: "8" },
    {
      level: 2,
      question: "Is 17 greater than or less than 12?",
      answer: "greater",
    },
    {
      level: 2,
      question: "If you have 3 dimes, how much money is that?",
      answer: "30",
    },

    // 2nd Grade – Level 3
    { level: 3, question: "What is 7 × 2?", answer: "14" },
    { level: 3, question: "What is half of 20?", answer: "10" },
    {
      level: 3,
      question: "How many minutes are in half an hour?",
      answer: "30",
    },
    { level: 3, question: "What is the value of 3 quarters?", answer: "75" },

    // 3rd Grade – Level 4
    { level: 4, question: "What is 24 ÷ 6?", answer: "4" },
    { level: 4, question: "Round 67 to the nearest ten.", answer: "70" },
    { level: 4, question: "What is 1/3 of 21?", answer: "7" },
    { level: 4, question: "Solve: 8 + 6 ÷ 2", answer: "11" },

    // 4th Grade – Level 5
    { level: 5, question: "Solve for x: 2x = 16", answer: "8" },
    { level: 5, question: "What is 5 squared?", answer: "25" },
    {
      level: 5,
      question: "What is the area of a rectangle with sides 4 and 6?",
      answer: "24",
    },
    { level: 5, question: "What is 3/4 as a decimal?", answer: "0.75" },

    // 5th Grade – Level 6
    {
      level: 6,
      question: "What is the least common multiple of 4 and 6?",
      answer: "12",
    },
    { level: 6, question: "Simplify: 18/24", answer: "3/4" },
    { level: 6, question: "What is 25% of 200?", answer: "50" },
    {
      level: 6,
      question: "What is the volume of a cube with side 3?",
      answer: "27",
    },

    // 6th Grade – Level 7
    { level: 7, question: "Evaluate: 3(x + 2) if x = 4", answer: "18" },
    { level: 7, question: "Convert 0.75 to a fraction.", answer: "3/4" },
    { level: 7, question: "What is 10% of 450?", answer: "45" },
    { level: 7, question: "Solve: 36 ÷ 0.5", answer: "72" },

    // 7th Grade – Level 8
    { level: 8, question: "Solve: 2x − 5 = 9", answer: "7" },
    { level: 8, question: "What is the mean of 3, 6, 9, 12?", answer: "7.5" },
    {
      level: 8,
      question: "What is the slope of a line through (1,2) and (3,6)?",
      answer: "2",
    },
    { level: 8, question: "Simplify: (2x)(3x)", answer: "6x^2" },

    // 8th Grade – Level 9
    { level: 9, question: "Solve: x² = 49", answer: "7" },
    { level: 9, question: "What is the square root of 81?", answer: "9" },
    { level: 9, question: "Evaluate: |−7|", answer: "7" },
    { level: 9, question: "What is π to 2 decimal places?", answer: "3.14" },

    // 9th Grade (Algebra I) – Level 10
    { level: 10, question: "Factor: x² − 9", answer: "(x+3)(x−3)" },
    { level: 10, question: "Solve: x/2 + 3 = 7", answer: "8" },
    {
      level: 10,
      question: "What is the quadratic formula?",
      answer: "x = (−b ± √(b²−4ac)) / 2a",
    },
    {
      level: 10,
      question: "What is the solution to x² + 4x + 4 = 0?",
      answer: "−2",
    },

    // 10th Grade (Geometry) – Level 11
    {
      level: 11,
      question: "What is the sum of angles in a triangle?",
      answer: "180",
    },
    {
      level: 11,
      question: "What is the Pythagorean Theorem?",
      answer: "a² + b² = c²",
    },
    {
      level: 11,
      question: "Find the area of a circle with radius 5.",
      answer: "78.5",
    },
    {
      level: 11,
      question: "What is the volume of a cylinder with r=3, h=4?",
      answer: "113.1",
    },

    // 11th Grade (Algebra II/Trigonometry) – Level 12
    { level: 12, question: "What is sin(30°)?", answer: "0.5" },
    { level: 12, question: "Solve: log₁₀(1000)", answer: "3" },
    {
      level: 12,
      question: "What is the inverse of y = 2x + 3?",
      answer: "x = (y − 3)/2",
    },
    { level: 12, question: "Simplify: (x² + 3x + 2)/(x + 1)", answer: "x + 2" },
  ];

  const readingQuestions = [
    // Kindergarten – Level 1
    {
      level: 1,
      question: "What sound does the letter 'B' make?",
      answer: "buh",
    },
    { level: 1, question: "What is the opposite of 'big'?", answer: "small" },
    {
      level: 1,
      question: "Finish the sentence: The cat is on the ___",
      answer: "mat",
    },
    { level: 1, question: "Which animal says 'moo'?", answer: "cow" },

    // 1st Grade – Level 2
    {
      level: 2,
      question: "Which word rhymes with 'hat'? Cat or run?",
      answer: "cat",
    },
    {
      level: 2,
      question: "What do you call the person who writes a book?",
      answer: "author",
    },
    { level: 2, question: "Who is telling the story?", answer: "narrator" },
    { level: 2, question: "What does 'happy' mean?", answer: "joyful" },

    // 2nd Grade – Level 3
    {
      level: 3,
      question: "What is the main idea of a story?",
      answer: "what it's mostly about",
    },
    {
      level: 3,
      question: "Find the noun: The dog barked loudly.",
      answer: "dog",
    },
    { level: 3, question: "Which is a verb: run or apple?", answer: "run" },
    {
      level: 3,
      question: "What do we call the problem in a story?",
      answer: "conflict",
    },

    // 3rd Grade – Level 4
    { level: 4, question: "What is a synonym for 'angry'?", answer: "mad" },
    {
      level: 4,
      question: "What is a setting in a story?",
      answer: "where and when it happens",
    },
    { level: 4, question: "What’s the moral of a fable?", answer: "lesson" },
    {
      level: 4,
      question: "What’s the past tense of 'walk'?",
      answer: "walked",
    },

    // 4th Grade – Level 5
    {
      level: 5,
      question: "Which word means the opposite of 'noisy'?",
      answer: "quiet",
    },
    {
      level: 5,
      question: "Why do authors use paragraphs?",
      answer: "to organize ideas",
    },
    {
      level: 5,
      question: "What is the genre of a made-up story?",
      answer: "fiction",
    },
    {
      level: 5,
      question: "What’s a fact from this sentence: The sky is blue.",
      answer: "The sky is blue",
    },

    // 5th Grade – Level 6
    {
      level: 6,
      question: "What is the theme of a story?",
      answer: "the message or lesson",
    },
    {
      level: 6,
      question: "Which is a simile: fast as a cheetah or blue sky?",
      answer: "fast as a cheetah",
    },
    {
      level: 6,
      question: "Why do authors use dialogue?",
      answer: "to show character talking",
    },
    {
      level: 6,
      question: "What is a proper noun in this sentence: Sara ran to school.",
      answer: "Sara",
    },

    // 6th Grade – Level 7
    {
      level: 7,
      question: "What is first-person point of view?",
      answer: "I or we narrator",
    },
    { level: 7, question: "Define 'infer'.", answer: "figure out using clues" },
    {
      level: 7,
      question: "What is an antonym for 'generous'?",
      answer: "selfish",
    },
    {
      level: 7,
      question: "What does 'persuade' mean?",
      answer: "convince someone",
    },

    // 7th Grade – Level 8
    {
      level: 8,
      question:
        "What is the tone of this sentence: 'She slammed the door and shouted!'",
      answer: "angry",
    },
    {
      level: 8,
      question: "What does 'foreshadowing' mean?",
      answer: "hinting at future events",
    },
    {
      level: 8,
      question: "What is a hyperbole?",
      answer: "an extreme exaggeration",
    },
    {
      level: 8,
      question:
        "Which is a metaphor: The world is a stage or She is like a flower?",
      answer: "The world is a stage",
    },

    // 8th Grade – Level 9
    {
      level: 9,
      question: "What is the function of a thesis statement?",
      answer: "state the main argument",
    },
    {
      level: 9,
      question: "What is the difference between tone and mood?",
      answer: "tone is author’s attitude, mood is reader’s feeling",
    },
    {
      level: 9,
      question: "What does 'connotation' mean?",
      answer: "emotional meaning of a word",
    },
    {
      level: 9,
      question: "Define 'personification'.",
      answer: "giving human traits to non-human things",
    },

    // 9th Grade – Level 10
    {
      level: 10,
      question: "What is the central idea of an essay?",
      answer: "main point",
    },
    {
      level: 10,
      question: "What is the author's purpose if they want to make you laugh?",
      answer: "to entertain",
    },
    {
      level: 10,
      question: "What’s an allusion?",
      answer: "reference to something well known",
    },
    {
      level: 10,
      question: "What’s a counterargument?",
      answer: "the opposing view",
    },

    // 10th Grade – Level 11
    {
      level: 11,
      question: "What is ethos in persuasive writing?",
      answer: "appeal to credibility",
    },
    {
      level: 11,
      question: "What is a reliable source?",
      answer: "trustworthy and factual",
    },
    {
      level: 11,
      question: "What is a compound-complex sentence?",
      answer: "two independent clauses and one dependent clause",
    },
    {
      level: 11,
      question: "What does 'nuanced' mean?",
      answer: "subtle or detailed",
    },

    // 11th–12th Grade – Level 12
    {
      level: 12,
      question: "What is the function of a rhetorical question?",
      answer: "to make a point, not get an answer",
    },
    {
      level: 12,
      question: "What is an objective summary?",
      answer: "unbiased, no opinions",
    },
    {
      level: 12,
      question: "What is parallel structure in writing?",
      answer: "repeating grammar patterns",
    },
    {
      level: 12,
      question: "What is the difference between analysis and summary?",
      answer: "analysis explains how/why, summary recaps",
    },
  ];

  const [mathLevel, setMathLevel] = useState(2);
  const [mathHistory, setMathHistory] = useState<{ correct: boolean }[]>([]);
  const [currentMathQuestion, setCurrentMathQuestion] = useState(() =>
    getQuestion("math", 2)
  );

  const [readingLevel, setReadingLevel] = useState(2);
  const [readingHistory, setReadingHistory] = useState<{ correct: boolean }[]>(
    []
  );
  const [currentReadingQuestion, setCurrentReadingQuestion] = useState(() =>
    getQuestion("reading", 2)
  );


  function getQuestion(subject: "math" | "reading", level: number) {
    const pool =
      subject === "math"
        ? mathQuestions.filter((q) => q.level === level)
        : readingQuestions.filter((q) => q.level === level);
    return pool[Math.floor(Math.random() * pool.length)];
  }


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
    const isCorrect =
      userAnswer.trim().toLowerCase() ===
      currentMathQuestion.answer.toLowerCase();
    setMathHistory((prev) => [...prev, { correct: isCorrect }]);

    let newLevel = mathLevel;
    if (isCorrect && mathLevel < 5) newLevel++;
    else if (!isCorrect && mathLevel > 1) newLevel--;

    setMathLevel(newLevel);
    setCurrentMathQuestion(getQuestion("math", newLevel));
    setUserAnswer("");

    // End quiz after 5 questions
    if (mathHistory.length + 1 >= 5) {
      const correctCount = [...mathHistory, { correct: isCorrect }].filter(
        (h) => h.correct
      ).length;
      setMathScore((correctCount / 5) * 100);
      setStep(3);
    }
  };


  const handleReadingAnswer = async () => {
    const isCorrect =
      userAnswer.trim().toLowerCase() ===
      currentReadingQuestion.answer.toLowerCase();
    setReadingHistory((prev) => [...prev, { correct: isCorrect }]);

    let newLevel = readingLevel;
    if (isCorrect && newLevel < 5) newLevel++;
    else if (!isCorrect && newLevel > 1) newLevel--;

    setReadingLevel(newLevel);
    setCurrentReadingQuestion(getQuestion("reading", newLevel));
    setUserAnswer("");

    // End quiz after 5 adaptive reading questions
    if (readingHistory.length + 1 >= 5) {
      const correctCount = [...readingHistory, { correct: isCorrect }].filter(
        (h) => h.correct
      ).length;
      const readingScoreFinal = (correctCount / 5) * 100;
      setReadingScore(readingScoreFinal);

      setLoading(true);
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mathScore,
          readingScore: readingScoreFinal, 
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
              {currentMathQuestion?.question ?? "Loading question..."}
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
              {currentReadingQuestion.question}
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
