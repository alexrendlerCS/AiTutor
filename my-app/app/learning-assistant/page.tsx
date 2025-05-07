"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/sidebar";
import { ChatInterface } from "../components/chat-interface";
import { ProgressTracker } from "../components/progress-tracker";
import { ParentDashboardButton } from "../components/parent-dashboard-button";
import { BreakButton } from "../components/break-button";
import { FocusModeButton } from "../components/focus-mode-button";
import { IdlePrompt } from "../components/idle-prompt";
import { EmotionalCheckIn } from "../components/emotional-check-in";
import { getUserFromToken } from "../lib/auth";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export type Subject = "math" | "reading" | "spelling" | "exploration";
export type Emotion = "happy" | "neutral" | "sad" | null;
const getSubjectId = async (subjectName: string): Promise<number | null> => {
  const res = await fetch(`/api/subjects?id_by_name=${subjectName}`);
  const { id } = await res.json();
  return id ?? null;
};

// Helper to get XP toward current level (same as ProgressTracker)
function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.15));
}
function getXpForCurrentLevel(totalXp: number, level: number): number {
  let xp = totalXp;
  for (let lvl = 1; lvl < level; lvl++) {
    xp -= getRequiredXpForLevel(lvl);
  }
  return xp;
}

export default function LearningAssistant() {
  const [activeSubject, setActiveSubject] = useState<Subject>("math");
  const [xpPoints, setXpPoints] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(5 * 60); // 5 minutes in seconds
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showEmotionalCheckIn, setShowEmotionalCheckIn] = useState(false);
  const [emotion, setEmotion] = useState<Emotion>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionalCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState("");
  const [userLevel, setUserLevel] = useState(1);
  const [currentChallengeId, setCurrentChallengeId] = useState<number | null>(
    null
  );
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);
  const { width, height } = useWindowSize();
  const subjectMap: Record<Subject, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  };

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        console.log("👤 Retrieved userId from /api/user:", data.userId);
        setUserId(data.userId);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch userId:", err);
      });
  }, []);

  // Reset idle timer on activity
  const handleActivity = () => {
    setLastActivity(Date.now());
    setIsIdle(false);
  };

  // Handles AI implementation
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    handleActivity();
  };

  const uploadXpToDatabase = async (newXp: number, subject: Subject) => {
    const subjectId = subjectMap[subject];
    if (!userId || !subjectId) {
      console.warn("⚠️ Skipping XP upload — missing userId or subjectId");
      return;
    }

    try {
      // 🧪 Check current XP from DB before writing
      const preCheck = await fetch(
        `/api/progress?user_id=${userId}&subject=${subjectId}`
      );
      const preData = await preCheck.json();
      const currentDbXp = preData?.xp ?? 0;

      console.log("🔍 XP in DB BEFORE write:", preData);

      if (newXp <= currentDbXp) {
        console.warn(
          `⚠️ Skipping XP write — attempted to overwrite with lower or equal value (new: ${newXp}, current: ${currentDbXp})`
        );
        return;
      }

      const res = await fetch("/api/progress/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          subject: subjectId,
          xp: newXp,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ XP successfully updated in DB:", data);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("xp-updated"));
        }, 800);
      } else {
        console.error("❌ Failed to update XP in DB:", data.error);
      }
    } catch (err) {
      console.error("❌ Error in uploadXpToDatabase:", err);
    }
  };

  useEffect(() => {
    const handleAnswerAttempt = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        subject: Subject;
        correct: boolean;
        attempts: number;
        xpEarned: number;
        challengeId: number | null;
      }>;

      const { subject, xpEarned, challengeId, attempts, correct } =
        customEvent.detail;

      console.log("✅ XP Event Received", customEvent.detail);

      // 🌟 Apply optimistic XP increase only if NOT a challenge
      if (!challengeId) {
        const subjectId = subjectMap[subject];
        const res = await fetch(
          `/api/progress?user_id=${userId}&subject=${subjectId}`
        );
        const data = await res.json();

        const currentDbXp = data?.xp ?? 0;
        const newXp = currentDbXp + xpEarned;

        console.log("🌟 Optimistically updating XP to:", newXp);
        setXpPoints(newXp);
        uploadXpToDatabase(newXp, subject);
      } else {
        // ✅ For challenges, just update visually (RPC will handle backend)
        setXpPoints((prev) => {
          const newXp = prev + xpEarned;
          console.log("🌟 Optimistically updating XP (challenge):", newXp);
          return newXp;
        });
      }

      // 🧠 Log freeform AI prompt attempt to user_prompt_attempts
      try {
        const subjectId = subjectMap[subject];
        if (!subjectId || !userId) return;

        // Only log freeform prompts when there is no challengeId
        if (!challengeId) {
          const res = await fetch("/api/xp/prompts/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              subject_id: subjectId,
              prompt: "N/A", // or replace with actual question if available
              success: correct,
              attempts,
              used_hint: false,
              xp_earned: xpEarned,
            }),
          });

          const result = await res.json();
          console.log("🧾 Logged freeform prompt:", result);
        }
      } catch (err) {
        console.error("❌ Failed to log freeform prompt attempt:", err);
      }

      // 📝 Log challenge attempt — backend handles XP update there
      if (challengeId && userId) {
        try {
          const res = await fetch("/api/xp/challenges/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              challenge_id: challengeId,
              success: correct,
              attempts,
              xp_earned: xpEarned,
            }),
          });

          const result = await res.json();
          console.log("📝 XP Log Result:", result);
          console.log("📦 Logging XP with payload:", {
            user_id: userId,
            challenge_id: challengeId,
            success: correct,
            attempts,
            xp_earned: xpEarned,
          });

          if (!res.ok) {
            console.error("❌ Challenge XP log failed:", result);
          }

          if (correct) {
            const challengeRes = await fetch("/api/xp/challenges/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subject }),
            });
            const challengeData = await challengeRes.json();
            if (challengeRes.ok && challengeData.challenge?.challenge_id) {
              setCurrentChallengeId(challengeData.challenge.challenge_id); // ✅ Store for future attempts
              console.log(
                "🆕 Set new challenge ID:",
                challengeData.challenge.challenge_id
              );
              window.dispatchEvent(new CustomEvent("challenge-complete"));
            } else {
              console.warn(
                "⚠️ Challenge generate failed:",
                challengeData.error
              );
            }

            // ✅ Notify IdlePrompt to reload
            window.dispatchEvent(new CustomEvent("challenge-complete"));
          }
        } catch (err) {
          console.error("❌ Failed to log XP in backend:", err);
        }
      }

      // ✅ Only trigger xp-updated refetch after CHALLENGE attempts
      if (challengeId) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("xp-updated"));
        }, 1000);
      }
    };

    window.addEventListener("answer-attempt", handleAnswerAttempt);
    return () =>
      window.removeEventListener("answer-attempt", handleAnswerAttempt);
  }, [userId]);

  useEffect(() => {
    const handleXpUpdated = async () => {
      if (!userId) return;
      const subjectId = subjectMap[activeSubject];
      if (!subjectId) return;

      // ⏳ Wait to allow backend to finish
      await new Promise((res) => setTimeout(res, 600)); // increase delay to 600ms

      console.log("🔄 Refetching XP after challenge logging...");

      const res = await fetch(
        `/api/progress?user_id=${userId}&subject=${subjectId}`
      );
      const data = await res.json();

      console.log("📬 Refetched XP from DB:", data.xp, "Level:", data.level);

      setXpPoints(data.xp ?? 0);
      setUserLevel(data.level ?? 1);
    };

    window.addEventListener("xp-updated", handleXpUpdated);
    return () => window.removeEventListener("xp-updated", handleXpUpdated);
  }, [userId, activeSubject]);

  // Handle focus mode timer
  useEffect(() => {
    if (focusMode && focusTimeRemaining > 0) {
      focusTimerRef.current = setInterval(() => {
        setFocusTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (!focusMode) {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
      setFocusTimeRemaining(5 * 60); // Reset to 5 minutes
    } else if (focusTimeRemaining <= 0) {
      setFocusMode(false);
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    }

    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, [focusMode, focusTimeRemaining]);

  // Handle idle detection
  useEffect(() => {
    const idleThreshold = 15000; // 15 seconds

    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivity > idleThreshold) {
        setIsIdle(true);
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 5000); // Check every 5 seconds

    // Set up event listeners for user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [lastActivity]);

  // Emotional check-in timer
  useEffect(() => {
    // Show emotional check-in every 10 minutes
    emotionalCheckTimerRef.current = setInterval(() => {
      setShowEmotionalCheckIn(true);
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (emotionalCheckTimerRef.current)
        clearInterval(emotionalCheckTimerRef.current);
    };
  }, []);

  const handleEmotionSelected = (selectedEmotion: Emotion) => {
    setEmotion(selectedEmotion);
    setShowEmotionalCheckIn(false);
    // In a real app, you would use this emotion to adapt the learning experience
  };

  // 2️⃣ whenever we have both userId & activeSubject, fetch XP+level:
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId) {
        console.warn("⚠️ Skipping loadProgress — no userId");
        return;
      }

      const subjectId = subjectMap[activeSubject];
      if (!subjectId) {
        console.warn(
          "⚠️ Skipping loadProgress — invalid subjectId for:",
          activeSubject
        );
        return;
      }

      console.log(
        `📦 Loading progress for user: ${userId}, subject: ${activeSubject} (id: ${subjectId})`
      );

      const res = await fetch(
        `/api/progress?user_id=${userId}&subject=${subjectId}`
      );
      const data = await res.json();

      // ✅ Sync XP state
      setXpPoints(data.xp ?? 0);
      setUserLevel(data.level ?? 1);

      console.log("📈 Progress data received:", data);

      // 🧹 NEW: Reset chat state on subject switch
      window.dispatchEvent(new CustomEvent("ai-message", { detail: [] })); // Clear chat
      window.dispatchEvent(new CustomEvent("reset-attempts")); // Reset attempts
      setCurrentChallengeId(null); // optional reset
    };

    loadProgress();
  }, [userId, activeSubject]);

  const handlePromptClick = async (promptText: string, challengeId: number) => {
    // Reset attempts/guessCount in ChatInterface when a challenge is selected
    window.dispatchEvent(new CustomEvent("reset-attempts"));
    setCurrentChallengeId(challengeId);
    const typingId = "typing";
    const userMsgId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();

    // 1. Show user message and assistant typing
    window.dispatchEvent(
      new CustomEvent("ai-message", {
        detail: [
          {
            id: userMsgId,
            content: promptText,
            sender: "user",
          },
          {
            id: typingId,
            content: "",
            sender: "assistant",
            isTyping: true,
          },
        ],
      })
    );

    // 2. Fetch assistant response
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: promptText, subject: activeSubject }),
    });

    const { reply } = await response.json();

    // 3. Dispatch final assistant reply
    window.dispatchEvent(
      new CustomEvent("ai-message", {
        detail: [
          {
            id: assistantId,
            content: reply,
            sender: "assistant",
          },
        ],
      })
    );
  };

  useEffect(() => {
    // Only show if level increased and currentLevelXp is small (just after level-up)
    const currentLevelXp = getXpForCurrentLevel(xpPoints, userLevel);
    if (userLevel > prevLevel && currentLevelXp < 10) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setPrevLevel(userLevel);
  }, [userLevel, prevLevel, xpPoints]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar with subject navigation - hidden in focus mode */}
      {!focusMode && (
        <Sidebar
          activeSubject={activeSubject}
          onSubjectChange={setActiveSubject}
        />
      )}

      {/* Main content area */}
      <div
        className={`flex flex-col flex-1 p-4 md:p-6 overflow-hidden ${
          focusMode ? "bg-blue-50" : ""
        }`}
      >
        {/* Level Up Modal */}
        {showLevelUp && (
          <>
            <Confetti
              width={width}
              height={height}
              numberOfPieces={300}
              recycle={false}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl px-10 py-8 border-4 border-yellow-300 flex flex-col items-center animate-fadeIn">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-yellow-700 mb-2">
                  Level Up!
                </div>
                <div className="text-lg text-green-600 font-semibold mb-2">
                  Welcome to Level {userLevel}!
                </div>
                <div className="text-gray-600">
                  Keep up the great work and earn even more XP!
                </div>
              </div>
            </div>
          </>
        )}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700">
            Learning Buddy
          </h1>

          {/* Focus mode timer */}
          {focusMode && (
            <div className="bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-600 animate-pulse">
              Let's stay focused for {Math.floor(focusTimeRemaining / 60)}:
              {(focusTimeRemaining % 60).toString().padStart(2, "0")} more
              minutes!
            </div>
          )}

          <div className="flex items-center gap-2">
            <FocusModeButton
              isActive={focusMode}
              onToggle={() => setFocusMode(!focusMode)}
            />
            <BreakButton />
            <ParentDashboardButton />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-full">
          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            <ProgressTracker
              xpPoints={xpPoints}
              level={userLevel}
              subject={activeSubject}
              userId={userId}
            />

            {/* Challenge Questions */}
            {userId && (
              <IdlePrompt
                subject={activeSubject}
                level={userLevel}
                userId={userId}
                initialXP={xpPoints}
                onEarnXp={(xp) => setXpPoints((prev) => prev + xp)}
                onPromptClick={(prompt, id) => {
                  handlePromptClick(prompt, id);
                }}
              />
            )}

            <ChatInterface
              subject={activeSubject}
              onSendMessage={handleSendMessage}
              userId={userId}
              currentChallengeId={currentChallengeId}
              onChallengeComplete={() => setCurrentChallengeId(null)}
            />

            {/* Emotional check-in */}
            {showEmotionalCheckIn && (
              <EmotionalCheckIn onEmotionSelected={handleEmotionSelected} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
