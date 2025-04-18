// app/components/idle‑prompt.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Lightbulb }      from "lucide-react";
import type { Subject }                from "../learning-assistant/page";
import { logChallengeAttempt }         from "../lib/logChallengeAttempt";

interface ChallengeBoxProps {
  subject:   Subject;
  level:     number;       // pass in current user level
  userId:    string;
  onEarnXp:  (xp: number) => void;
  onPromptClick: (prompt: string) => void;
}

interface Challenge {
  id:         number;
  prompt:     string;
  difficulty: number;
}

function getDifficultyRangeForLevel(level: number): { min: number; max: number } {
  if (level < 10) {
    // Beginner users
    return { min: 1, max: 3 }
  } else if (level < 20) {
    // Intermediate users
    return { min: 4, max: 6 }
  } else {
    // Advanced users
    return { min: 7, max: 9 }
  }
}

export function IdlePrompt({
  subject,
  level,
  userId,
  onEarnXp,
  onPromptClick,
}: ChallengeBoxProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentXP, setCurrentXP]   = useState(0);
  const [isOpen, setIsOpen]         = useState(false);
  const detailsRef                  = useRef<HTMLDetailsElement>(null);
  const [isLoading, setIsLoading]   = useState(true);

  // keep XP in sync if parent updates it
  useEffect(() => {
    // you might pull this from props too
    // setCurrentXP(xpPoints);
  }, []);

  // load from our new API whenever subject or level changes
  useEffect(() => {
    const subjectMap: Record<Subject, number> = {
      math: 1,
      reading: 2,
      spelling: 3,
      exploration: 4,
    }
  
    async function fetchChallenges() {
      setIsLoading(true)
      try {
        
        const subjId = subjectMap[subject]
        if (!subjId) throw new Error("Invalid subject")
        
          
        // derive difficulty window from user level
        const { min: minDiff, max: maxDiff } = getDifficultyRangeForLevel(level)

        console.log("📦 Fetching challenges for:", {
          subject: subject,
          subject_id: subjId,
          level,
          minDiff,
          maxDiff
        })
        
        const res = await fetch(
          `/api/xp/challenges?subject_id=${subjId}&min_difficulty=${minDiff}&max_difficulty=${maxDiff}`
        )
        

  
        if (!res.ok) {
          console.error(`Fetch challenges failed: HTTP ${res.status}`)
          setChallenges([])
        } else {
          const list: Challenge[] = await res.json()
          setChallenges(list)
        }
      } catch (err) {
        console.error("Failed to load challenges:", err)
        setChallenges([])
      } finally {
        setIsLoading(false)
      }
    }
  
    fetchChallenges()
  }, [subject, level])


  const handleClick = async (c: Challenge) => {
    // one‑time only:
    if (currentXP >= 0 && /* replace with your logic to mark done */ false)
      return;

    // 1) fire AI prompt
    onPromptClick(c.prompt);

    // 2) award XP (we’ll say difficulty×10)
    const xpReward = c.difficulty * 10;
    const newXp    = currentXP + xpReward;
    onEarnXp(xpReward);
    setCurrentXP(newXp);

    // 3) log attempt server‑side
    try {
      await logChallengeAttempt({
        user_id:      userId,
        challenge_id: c.id,
        success:      true,
        attempts:     1,
        used_hint:    false,
        xp_earned:    xpReward,
      });
    } catch (e) {
      console.error("❌ logChallengeAttempt failed:", e);
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
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </summary>

      <ul className="space-y-2">
        {isLoading ? (
          <li className="text-gray-500 italic">Loading challenges…</li>
        ) : challenges.length === 0 ? (
          <li className="text-gray-500 italic">No challenges available.</li>
        ) : (
          challenges.map((c) => (
            <li
              key={c.id}
              onClick={() => handleClick(c)}
              className="p-2 rounded-md cursor-pointer hover:bg-yellow-100"
            >
              {c.prompt}{" "}
              <span className="text-sm text-yellow-700">
                +{c.difficulty * 10} XP
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="mt-3 text-sm text-yellow-800">
        Current XP: {currentXP}
      </p>
    </details>
  );
}
