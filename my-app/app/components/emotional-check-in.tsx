"use client"

import { useState } from "react"
import { cn } from "../lib/utils"
import type { Emotion } from "./learning-assistant"

interface EmotionalCheckInProps {
  onEmotionSelected: (emotion: Emotion) => void
}

export function EmotionalCheckIn({ onEmotionSelected }: EmotionalCheckInProps) {
  const [hoveredEmotion, setHoveredEmotion] = useState<Emotion>(null)

  const emotions = [
    { id: "happy" as Emotion, emoji: "😊", label: "I'm doing great!" },
    { id: "neutral" as Emotion, emoji: "😐", label: "I'm okay" },
    { id: "sad" as Emotion, emoji: "😣", label: "I'm struggling" },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-200 w-[90%] max-w-md animate-fadeIn z-10">
      <h3 className="text-center text-purple-700 font-medium mb-3">How are you feeling about today's lesson?</h3>

      <div className="flex justify-center gap-4">
        {emotions.map((emotion) => (
          <button
            key={emotion.id}
            className={cn(
              "flex flex-col items-center p-3 rounded-xl transition-all duration-200",
              hoveredEmotion === emotion.id ? "bg-purple-50 scale-110" : "hover:bg-purple-50",
            )}
            onMouseEnter={() => setHoveredEmotion(emotion.id)}
            onMouseLeave={() => setHoveredEmotion(null)}
            onClick={() => onEmotionSelected(emotion.id)}
          >
            <span className="text-4xl mb-2">{emotion.emoji}</span>
            <span className="text-sm text-gray-700">{emotion.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
