// app/components/idle-prompt.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { Subject } from "../learning-assistant/page";
import { logChallengeAttempt } from "../lib/logChallengeAttempt";
import { fetchActiveChallenge } from "../lib/fetchActiveChallenge";
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

export function IdlePrompt({
  subject,
  level,
  userId,
  initialXP,
  onEarnXp,
  onPromptClick,
}: ChallengeBoxProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentXP, setCurrentXP] = useState(initialXP);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const supabase = useRef(createPagesBrowserClient()).current;
  const [showUnlockedMessage, setShowUnlockedMessage] = useState(false);

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
    async function loadExistingChallenge() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/xp/challenges/current", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject }),
        });

        if (res.ok) {
          const data = await res.json();
          setChallenge(data.challenge ?? null);
        } else {
          console.error("❌ Failed to load existing challenge:", res.status);
          setChallenge(null);
        }
      } catch (err) {
        console.error("❌ Error loading challenge:", err);
        setChallenge(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingChallenge();
  }, [subject]);


  useEffect(() => {
    const handleChallengeComplete = async () => {
      const latest = await fetchActiveChallenge(subject);
      if (latest) {
        setChallenge(latest);
        setShowUnlockedMessage(true);
        setTimeout(() => setShowUnlockedMessage(false), 3000);
      }
    };
    console.log(
      "🎯 challenge-complete event received — fetching new challenge..."
    );

    window.addEventListener("challenge-complete", handleChallengeComplete);
    return () => {
      window.removeEventListener("challenge-complete", handleChallengeComplete);
    };
  }, [subject]);

  const handleClick = async (c: Challenge) => {
    // Optional: prevent re-clicking rapidly
    if (!c) return;

    // 🔄 Send the challenge to the AI assistant for evaluation
    onPromptClick(c.prompt, c.id);
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
      {showUnlockedMessage && (
        <div className="mb-3 text-green-700 font-semibold text-center animate-fade-in">
          🎉 New Challenge Unlocked!
        </div>
      )}

      <ul className="space-y-2">
        {isLoading ? (
          <p className="text-gray-500 italic">Loading challenge…</p>
        ) : challenge ? (
          <div
            className="p-3 rounded-md cursor-pointer hover:bg-yellow-100 transition"
            onClick={() => handleClick(challenge)}
          >
            {challenge.prompt}
            <span className="text-sm text-yellow-700 ml-2">
              +{challenge.difficulty * 10} XP
            </span>
          </div>
        ) : (
          <p className="text-gray-500 italic">No challenge available.</p>
        )}
      </ul>

      <p className="mt-3 text-sm text-yellow-800">Current XP: {currentXP}</p>
    </details>
  );
}
