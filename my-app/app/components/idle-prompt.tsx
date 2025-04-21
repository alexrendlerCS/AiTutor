// app/components/idle-prompt.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { Subject } from "../learning-assistant/page";
import { logChallengeAttempt } from "../lib/logChallengeAttempt";
import { hasUserAnsweredChallenge } from "../lib/hasUserAnsweredChallenge";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

interface ChallengeBoxProps {
  subject: Subject;
  level: number;
  userId: string;
  initialXP: number;
  onEarnXp: (xp: number) => void;
  onPromptClick: (prompt: string, challengeId: number) => void; 
}


interface Challenge {
  id: number;
  prompt: string;
  difficulty: number;
}

function getDifficultyRangeForLevel(level: number): { min: number; max: number } {
  if (level < 10) return { min: 1, max: 3 };
  if (level < 20) return { min: 4, max: 6 };
  return { min: 7, max: 9 };
}

export function IdlePrompt({
  subject,
  level,
  userId,
  initialXP,
  onEarnXp,
  onPromptClick,
}: ChallengeBoxProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [answeredChallengeIds, setAnsweredChallengeIds] = useState<number[]>([]);
  const [currentXP, setCurrentXP] = useState(initialXP); // ✅ use initialXP
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const supabase = useRef(createPagesBrowserClient()).current;

  // ✅ update XP if parent changes it
  useEffect(() => {
    setCurrentXP(initialXP);
  }, [initialXP]);
  
  const updateXpInDatabase = async (newXp: number) => {
    const subjectMap: Record<Subject, number> = {
      math: 1,
      reading: 2,
      spelling: 3,
      exploration: 4,
    };
    const subjectId = subjectMap[subject];
    await fetch("/api/progress/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        subject: subjectId,
        xp: newXp,
      }),
    });
  };

  useEffect(() => {
    const subjectMap: Record<Subject, number> = {
      math: 1,
      reading: 2,
      spelling: 3,
      exploration: 4,
    };
  
    async function fetchChallenges() {
      if (!userId) {
        console.warn("🛑 Skipping fetchChallenges — no userId yet.");
        return;
      }
  
      setIsLoading(true);
  
      try {
        const subjId = subjectMap[subject];
        const { min, max } = getDifficultyRangeForLevel(level);
  
        const res = await fetch(
          `/api/xp/challenges?subject_id=${subjId}&min_difficulty=${min}&max_difficulty=${max}`
        )        
  
        if (!res.ok) throw new Error(`Failed to fetch challenges: HTTP ${res.status}`);
  
        const list: Challenge[] = await res.json();
        setChallenges(list);
  
        // ✅ Check which challenges are already answered by the user
        const answeredIds = await Promise.all(
          list.map(async (c) => {
            console.log("✅ Loaded challenges:", list.map(c => c.id));
            const answered = await hasUserAnsweredChallenge(userId, c.id);
            console.log("Answered?", answered);
            return answered ? c.id : null;
          })
        );
        
  
        setAnsweredChallengeIds(answeredIds.filter((id): id is number => id !== null));
      } catch (err) {
        console.error("❌ Error loading challenges:", err);
        setChallenges([]);
      } finally {
        setIsLoading(false);
      }
    }
  
    fetchChallenges();
  }, [subject, level, userId]);
  
  useEffect(() => {
    const handleExternalAnswerAttempt = (e: Event) => {
      const customEvent = e as CustomEvent<{
        challengeId: number
        correct: boolean
      }>
  
      const { challengeId, correct } = customEvent.detail
  
      if (correct && !answeredChallengeIds.includes(challengeId)) {
        setAnsweredChallengeIds((prev) => [...prev, challengeId])
      }
    }
  
    window.addEventListener("answer-attempt", handleExternalAnswerAttempt)
  
    return () => {
      window.removeEventListener("answer-attempt", handleExternalAnswerAttempt)
    }
  }, [answeredChallengeIds])
  
  const handleClick = async (c: Challenge) => {
    const alreadyAnswered = answeredChallengeIds.includes(c.id);
    if (alreadyAnswered) {
      alert("You've already answered this question! Wait for new ones tomorrow.");
      return;
    }
  
    onPromptClick(c.prompt, c.id); // ✅ pass both prompt + ID
  
    const xpReward = c.difficulty * 10;
    const newXp = currentXP + xpReward;
    setCurrentXP(newXp);
    await updateXpInDatabase(newXp);
    onEarnXp(xpReward);
  
    try {
      await logChallengeAttempt({
        user_id: userId,
        challenge_id: c.id,
        success: true,
        attempts: 1,
        used_hint: false,
        xp_earned: xpReward,
      });
  
      setAnsweredChallengeIds((prev) => [...prev, c.id]);
    } catch (err) {
      console.error("❌ logChallengeAttempt failed:", err);
    }
  };  
  
  return (
    <details
      ref={detailsRef}
      className="bg-yellow-50 border rounded p-4 z-50"
      onToggle={() => setIsOpen(!!detailsRef.current?.open)}
    >
      <summary className="flex justify-between cursor-pointer mb-2">
        <div className="flex items-center gap-2 text-yellow-700 font-semibold">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Challenge Questions (level {level})
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </summary>

      <ul className="space-y-2">
        {isLoading ? (
          <li className="text-gray-500 italic">Loading challenges…</li>
        ) : challenges.length === 0 ? (
          <li className="text-gray-500 italic">No challenges available.</li>
        ) : (
          challenges.map((c) => {
            const isAnswered = answeredChallengeIds.includes(c.id);
            return (
              <li
                key={c.id}
                onClick={() => handleClick(c)}
                className={`p-2 rounded-md transition-all ${
                  isAnswered
                    ? "opacity-50 line-through cursor-not-allowed"
                    : "cursor-pointer hover:bg-yellow-100"
                }`}
              >
                {c.prompt}
                <span className="text-sm text-yellow-700 ml-2">
                  +{c.difficulty * 10} XP
                </span>
              </li>
            );
          })
        )}
      </ul>

      <p className="mt-3 text-sm text-yellow-800">Current XP: {currentXP}</p>
    </details>
  );
}
