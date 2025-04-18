"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Lightbulb } from "lucide-react"
import type { Subject } from "../learning-assistant/page"
import { logChallengeAttempt } from "../lib/logChallengeAttempt"

interface ChallengeBoxProps {
  subject: Subject
  xpPoints: number
  userId: string
  onEarnXp: (xp: number) => void
  onPromptClick: (prompt: string) => void
}

interface ChallengeQuestion {
  id: string
  text: string
  aiPrompt: string
  completed: boolean
  xpRequired: number
  xpReward: number
}

export function IdlePrompt({ subject, xpPoints, userId, onEarnXp, onPromptClick }: ChallengeBoxProps) {
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([])
  const [currentXP, setCurrentXP] = useState(xpPoints)
  const [isOpen, setIsOpen] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  // Keep XP in sync with outside state (prop)
  useEffect(() => {
    setCurrentXP(xpPoints)
  }, [xpPoints])

  useEffect(() => {
    const raw = getPromptsForSubject(subject)
    const generated = raw.map(({ text, aiPrompt }, index) => ({
      id: `${subject}-${index}`,
      text,
      aiPrompt,
      completed: false,
      xpRequired: index * 10,
      xpReward: 10,
    }))
    setQuestions(generated)
  }, [subject])

  const updateXpInDatabase = async (newXp: number) => {
    const subjectMap: Record<Subject, number> = {
      math: 1,
      reading: 2,
      spelling: 3,
      exploration: 4,
    }

    const subjectId = subjectMap[subject]
    if (!userId || !subjectId) return

    await fetch("/api/progress/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        subject: subjectId,
        xp: newXp,
      }),
    })
  }

  const handleClick = async (question: ChallengeQuestion) => {
    if (question.completed || currentXP < question.xpRequired) return

    // Trigger assistant AI prompt
    onPromptClick(question.aiPrompt)

    // Update state and backend
    const newXp = currentXP + question.xpReward
    onEarnXp(question.xpReward)
    setCurrentXP(newXp)
    updateXpInDatabase(newXp)

    // Mark question as completed
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, completed: true } : q))
    )

    // Log the attempt
    try {
      await logChallengeAttempt({
        user_id: userId,
        subject,
        correct: true,
        attempts: 1,
        used_hint: false,
        xp_earned: question.xpReward,
      })
    } catch (err) {
      console.error("❌ Failed to log challenge:", err)
    }
  }

  return (
    <details
      ref={detailsRef}
      className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 z-50 group"
      onToggle={() => setIsOpen(detailsRef.current?.open || false)}
    >
      <summary className="flex items-center justify-between cursor-pointer list-none text-yellow-700 font-semibold text-lg mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Challenge Questions
        </div>
        <ChevronDown
          className={`w-5 h-5 text-yellow-600 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </summary>

      <ul className="space-y-2">
        {questions.map((q) => (
          <li
            key={q.id}
            onClick={() => handleClick(q)}
            className={`p-2 rounded-md cursor-pointer transition ${
              q.completed
                ? "line-through text-gray-400"
                : currentXP < q.xpRequired
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-yellow-100 text-yellow-900"
            }`}
          >
            {q.text}{" "}
            {q.completed
              ? "✅"
              : currentXP < q.xpRequired
              ? `🔒 Requires ${q.xpRequired} XP`
              : `(+${q.xpReward} XP)`}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-yellow-800">Current XP: {currentXP}</p>
    </details>
  )
}

function getPromptsForSubject(subject: Subject): { text: string; aiPrompt: string }[] {
  const prompts = {
    math: [
      { text: "Solve a tricky multiplication problem!", aiPrompt: "Give the student a multiplication challenge involving two-digit numbers." },
      { text: "Try a logic puzzle with numbers!", aiPrompt: "Present a number-based logic riddle suitable for 10-year-olds." },
      { text: "What’s the next number in the pattern?", aiPrompt: "Create a number pattern and ask the student to find the next number." },
    ],
    reading: [
      { text: "Read a short story and summarize it!", aiPrompt: "Share a short 2-paragraph story and ask the student to summarize." },
      { text: "Guess the character from these clues!", aiPrompt: "Describe a fictional character and ask the student to guess who it is." },
      { text: "Find the main idea of a paragraph!", aiPrompt: "Present a paragraph and ask what the main idea is." },
    ],
    spelling: [
      { text: "Spell a really tricky word!", aiPrompt: "Give a challenging spelling word appropriate for a 10-year-old and ask them to spell it." },
      { text: "Unscramble this word challenge!", aiPrompt: "Give a scrambled word and ask the student to unscramble it." },
      { text: "Guess the spelling rule used in a sentence!", aiPrompt: "Present a sentence and ask what spelling rule is used in it." },
    ],
    exploration: [
      { text: "Guess the planet based on facts!", aiPrompt: "List 3 fun facts about a planet and ask the student to guess which planet it is." },
      { text: "Solve a mystery about animals!", aiPrompt: "Describe clues about an animal and ask the student to figure it out." },
      { text: "What’s the science behind rainbows?", aiPrompt: "Ask the student to explain how rainbows form in simple terms." },
    ],
  }

  return prompts[subject]
}
