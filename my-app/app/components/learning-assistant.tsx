"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "./sidebar"
import { ChatInterface } from "./chat-interface"
import { ProgressTracker } from "./progress-tracker"
import { ParentDashboardButton } from "./parent-dashboard-button"
import { BreakButton } from "./break-button"
import { FocusModeButton } from "./focus-mode-button"
import { IdlePrompt } from "./idle-prompt"
import { EmotionalCheckIn } from "./emotional-check-in"

export type Subject = "math" | "reading" | "spelling" | "exploration"
export type Emotion = "happy" | "neutral" | "sad" | null

export function LearningAssistant() {
  const [activeSubject, setActiveSubject] = useState<Subject>("math")
  const [xpPoints, setXpPoints] = useState(120)
  const [focusMode, setFocusMode] = useState(false)
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(5 * 60) // 5 minutes in seconds
  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showEmotionalCheckIn, setShowEmotionalCheckIn] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null)
  const emotionalCheckTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset idle timer on activity
  const handleActivity = () => {
    setLastActivity(Date.now())
    setIsIdle(false)
  }

  // This would be connected to your actual AI implementation
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message)
    handleActivity()
    // In a real app, this would call your AI service
    // For demo purposes, let's add some XP
    setXpPoints((prev) => prev + 5)
  }

  useEffect(() => {
    const handleAnswerAttempt = (e: Event) => {
      const customEvent = e as CustomEvent<{
        subject: Subject
        correct: boolean
        attempts: number
      }>
      const { subject, correct, attempts } = customEvent.detail
  
      // XP logic
      let xpEarned = 2 // base XP
      if (correct && attempts === 1) xpEarned = 10
      else if (correct && attempts <= 2) xpEarned = 7
      else if (correct) xpEarned = 5
      else xpEarned = 1
  
      // Update XP
      setXpPoints((prev) => prev + xpEarned)
  
      // Optional: log or store in DB
      console.log(`Answer attempt:`, { subject, correct, attempts, xpEarned })
  
      // TODO: Supabase call to log performance (in the next step)
    }
  
    window.addEventListener("answer-attempt", handleAnswerAttempt)
  
    return () => {
      window.removeEventListener("answer-attempt", handleAnswerAttempt)
    }
  }, [])
  
  // Handle focus mode timer
  useEffect(() => {
    if (focusMode && focusTimeRemaining > 0) {
      focusTimerRef.current = setInterval(() => {
        setFocusTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (!focusMode) {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current)
      setFocusTimeRemaining(5 * 60) // Reset to 5 minutes
    } else if (focusTimeRemaining <= 0) {
      setFocusMode(false)
      if (focusTimerRef.current) clearInterval(focusTimerRef.current)
    }

    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current)
    }
  }, [focusMode, focusTimeRemaining])

  // Handle idle detection
  useEffect(() => {
    const idleThreshold = 15000 // 15 seconds

    const checkIdle = () => {
      const now = Date.now()
      if (now - lastActivity > idleThreshold) {
        setIsIdle(true)
      }
    }

    idleTimerRef.current = setInterval(checkIdle, 5000) // Check every 5 seconds

    // Set up event listeners for user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [lastActivity])

  // Emotional check-in timer
  useEffect(() => {
    // Show emotional check-in every 10 minutes
    emotionalCheckTimerRef.current = setInterval(
      () => {
        setShowEmotionalCheckIn(true)
      },
      10 * 60 * 1000,
    ) // 10 minutes

    return () => {
      if (emotionalCheckTimerRef.current) clearInterval(emotionalCheckTimerRef.current)
    }
  }, [])

  const handleEmotionSelected = (selectedEmotion: Emotion) => {
    setEmotion(selectedEmotion)
    setShowEmotionalCheckIn(false)
    // In a real app, you would use this emotion to adapt the learning experience
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar with subject navigation - hidden in focus mode */}
      {!focusMode && <Sidebar activeSubject={activeSubject} onSubjectChange={setActiveSubject} />}

      {/* Main content area */}
      <div className={`flex flex-col flex-1 p-4 md:p-6 overflow-hidden ${focusMode ? "bg-blue-50" : ""}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700">Learning Buddy</h1>
          

          {/* Focus mode timer */}
          {focusMode && (
            <div className="bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-600 animate-pulse">
              Let's stay focused for {Math.floor(focusTimeRemaining / 60)}:
              {(focusTimeRemaining % 60).toString().padStart(2, "0")} more minutes!
            </div>
          )}

          <div className="flex items-center gap-2">
            <FocusModeButton isActive={focusMode} onToggle={() => setFocusMode(!focusMode)} />
            <BreakButton />
            <ParentDashboardButton />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-full">
          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            <ProgressTracker xpPoints={xpPoints} />

            {/* Idle prompt appears when user is inactive */}
            <IdlePrompt
  subject={activeSubject}
  xpPoints={xpPoints}
  onEarnXp={(xp) => setXpPoints((prev) => prev + xp)}
  onPromptClick={async (promptText) => {
    const typingId = "typing"
    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()
  
    // 1. Show user message and assistant typing
    window.dispatchEvent(
      new CustomEvent("ai-message", {
        detail: [
          {
            id: userId,
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
    )
  
    // 2. Fetch response
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: promptText, subject: activeSubject }),
    })
  
    const { reply } = await response.json()
  
    // 3. Remove typing and show assistant reply (do NOT resend user message)
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
    )
  }}
  
  
/>
            <ChatInterface subject={activeSubject} onSendMessage={handleSendMessage} />

            {/* Emotional check-in */}
            {showEmotionalCheckIn && <EmotionalCheckIn onEmotionSelected={handleEmotionSelected} />}
          </div>
        </div>
      </div>
    </div>
  )
}
