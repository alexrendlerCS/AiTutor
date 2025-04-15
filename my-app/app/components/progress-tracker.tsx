"use client"

import { useState, useEffect } from "react"
import { cn } from "../lib/utils"

interface ProgressTrackerProps {
  xpPoints: number
}

export function ProgressTracker({ xpPoints }: ProgressTrackerProps) {
  // Calculate level based on XP (simple formula for demo)
  const level = Math.floor(xpPoints / 100) + 1
  const progress = (xpPoints % 100) / 100

  // Track previous XP to detect changes
  const [prevXP, setPrevXP] = useState(xpPoints)
  const [isAnimating, setIsAnimating] = useState(false)

  // Detect XP changes and trigger animation
  useEffect(() => {
    if (xpPoints > prevXP) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1500)
      setPrevXP(xpPoints)

      return () => clearTimeout(timer)
    }
  }, [xpPoints, prevXP])

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-100 text-yellow-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
            {level}
          </div>
          <span className="font-medium text-purple-800">Learning Level</span>
        </div>
        <div
          className={cn(
            "text-sm font-medium text-purple-600 transition-all",
            isAnimating && "text-green-500 scale-110",
          )}
        >
          {xpPoints} XP {isAnimating && "+5"}
        </div>
      </div>

      <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out",
            isAnimating && "animate-pulse",
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">
          {xpPoints % 100} / 100 XP to Level {level + 1}
        </span>
        <div className="flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 -ml-1 rounded-full border-2 border-white transition-all",
                i < progress * 3 ? "bg-yellow-400" : "bg-gray-200",
                isAnimating && i === Math.floor(progress * 3) - 1 && "animate-ping",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
