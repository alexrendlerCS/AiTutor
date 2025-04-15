"use client"

import { useState } from "react"
import { Lightbulb } from "lucide-react"
import type { Subject } from "./learning-assistant"

interface IdlePromptProps {
  subject: Subject
  onPromptClick: () => void
}

export function IdlePrompt({ subject, onPromptClick }: IdlePromptProps) {
  // Get random prompt based on subject
  const [prompt] = useState(() => getRandomPrompt(subject))

  return (
    <div
      className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-3 flex items-center gap-3 cursor-pointer animate-fadeIn"
      onClick={onPromptClick}
    >
      <div className="bg-yellow-100 p-2 rounded-full">
        <Lightbulb className="h-5 w-5 text-yellow-600" />
      </div>
      <div className="flex-1">
        <p className="text-gray-700">{prompt}</p>
      </div>
    </div>
  )
}

function getRandomPrompt(subject: Subject): string {
  const prompts = {
    math: [
      "Want to try a math riddle?",
      "Curious about a fun number fact?",
      "Need help with a math problem?",
      "Want to learn a cool math trick?",
    ],
    reading: [
      "Want to explore a new story?",
      "Need help understanding a word?",
      "Curious about a character in your book?",
      "Want to practice reading together?",
    ],
    spelling: [
      "Need help spelling a tricky word?",
      "Want to play a quick word game?",
      "Curious about where a word comes from?",
      "Want to learn a spelling rule?",
    ],
    exploration: [
      "Curious about a science fact?",
      "Want to learn about animals?",
      "Interested in space exploration?",
      "Want to discover something new about our world?",
    ],
  }

  const subjectPrompts = prompts[subject]
  return subjectPrompts[Math.floor(Math.random() * subjectPrompts.length)]
}
