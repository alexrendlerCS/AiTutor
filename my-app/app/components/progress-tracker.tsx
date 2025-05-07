"use client";

import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import type { Subject } from "../learning-assistant/page";

interface ProgressTrackerProps {
  xpPoints: number;
  level: number;
  subject: Subject;
  userId: string;
}

// 🔢 Same formula as backend
function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.15));
}

// Helper to get XP toward current level
function getXpForCurrentLevel(totalXp: number, level: number): number {
  let xp = totalXp;
  for (let lvl = 1; lvl < level; lvl++) {
    xp -= getRequiredXpForLevel(lvl);
  }
  return xp;
}

export function ProgressTracker({
  xpPoints,
  level,
  subject,
  userId,
}: ProgressTrackerProps) {
  const xpToNextLevel = getRequiredXpForLevel(level);
  const currentLevelXp = getXpForCurrentLevel(xpPoints, level);
  const progress = Math.min(currentLevelXp / xpToNextLevel, 1);

  const [prevXP, setPrevXP] = useState(xpPoints);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  // Fetch completed challenge levels
  useEffect(() => {
    const fetchCompletedLevels = async () => {
      if (!userId || !subject) return;

      try {
        const res = await fetch(
          `/api/xp/challenges/completed-levels?user_id=${userId}&subject=${subject}`
        );
        const data = await res.json();
        if (data.completedLevels) {
          setCompletedLevels(data.completedLevels);
        }
      } catch (err) {
        console.error("❌ Failed to fetch completed levels:", err);
      }
    };

    fetchCompletedLevels();
  }, [userId, subject]);

  // Listen for challenge completion to update circles
  useEffect(() => {
    const handleChallengeComplete = async () => {
      if (!userId || !subject) return;

      try {
        const res = await fetch(
          `/api/xp/challenges/completed-levels?user_id=${userId}&subject=${subject}`
        );
        const data = await res.json();
        if (data.completedLevels) {
          setCompletedLevels(data.completedLevels);
        }
      } catch (err) {
        console.error("❌ Failed to refresh completed levels:", err);
      }
    };

    window.addEventListener("challenge-complete", handleChallengeComplete);
    return () => {
      window.removeEventListener("challenge-complete", handleChallengeComplete);
    };
  }, [userId, subject]);

  useEffect(() => {
    if (xpPoints > prevXP) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      setPrevXP(xpPoints);
      return () => clearTimeout(timer);
    }
  }, [xpPoints, prevXP]);

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
            isAnimating && "text-green-500 scale-110"
          )}
        >
          {currentLevelXp} XP {isAnimating && "+5"}
        </div>
      </div>

      <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out",
            isAnimating && "animate-pulse"
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">
          {currentLevelXp} / {xpToNextLevel} XP to Level {level + 1}
        </span>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 -ml-1 rounded-full border-2 border-white transition-all",
                completedLevels.includes(i + 1)
                  ? "bg-yellow-400"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
