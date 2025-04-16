"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Lightbulb } from "lucide-react"
import type { Subject } from "./learning-assistant"

interface ChallengeBoxProps {
  subject: Subject
  xpPoints: number
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

export function IdlePrompt({ subject, xpPoints, onEarnXp, onPromptClick }: ChallengeBoxProps) {
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([])
  const [currentXP, setCurrentXP] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)

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

  const handleClick = (question: ChallengeQuestion) => {
    if (question.completed || currentXP < question.xpRequired) return

    onPromptClick(question.aiPrompt)
    onEarnXp(question.xpReward)
    setCurrentXP((prev) => prev + question.xpReward)
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, completed: true } : q))
    )
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
      {
        text: "Solve a tricky multiplication problem!",
        aiPrompt: "Give the student a challenging multiplication word problem using two-digit numbers, and encourage them to show their work."
      },
      {
        text: "Try a logic puzzle with numbers!",
        aiPrompt: "Present a math-based logic puzzle using basic addition, subtraction, and reasoning suitable for ages 9–12."
      },
      {
        text: "What’s the next number in the pattern?",
        aiPrompt: "Give a number pattern (e.g., 2, 4, 8, 16...) and ask the student to find the next number with a short explanation."
      }
    ],
    reading: [
      {
        text: "Read a short story and summarize it!",
        aiPrompt: "Share a short paragraph-level story and ask the student to summarize the main idea in 1–2 sentences."
      },
      {
        text: "Guess the character from these clues!",
        aiPrompt: "Describe a fictional character using three clues and ask the student to guess who it is."
      },
      {
        text: "Find the main idea of a paragraph!",
        aiPrompt: "Present a short paragraph and ask the student to identify the main idea in their own words."
      }
    ],
    spelling: [
      {
        text: "Spell a really tricky word!",
        aiPrompt: "Give the student a tricky spelling word appropriate for grade 4–6 and ask them to try spelling it out loud."
      },
      {
        text: "Unscramble this word challenge!",
        aiPrompt: "Give the student a scrambled word and ask them to unscramble it (e.g., 'tac' = 'cat'). Choose words that fit the subject's grade level."
      },
      {
        text: "Guess the spelling rule used in a sentence!",
        aiPrompt: "Present a sentence that highlights a spelling rule (like 'i before e except after c') and ask the student to explain the rule."
      }
    ],
    exploration: [
      {
        text: "Guess the planet based on facts!",
        aiPrompt: "List 3 interesting facts about a planet and ask the student to guess which one it is."
      },
      {
        text: "Solve a mystery about animals!",
        aiPrompt: "Describe a mystery animal using clues about its behavior and habitat, and ask the student to guess the animal."
      },
      {
        text: "What’s the science behind rainbows?",
        aiPrompt: "Ask the student to explain how rainbows are formed, or provide a short explanation and quiz them on it."
      }
    ]
  }

  return prompts[subject]
}
