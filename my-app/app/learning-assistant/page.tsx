"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "../components/sidebar"
import { ChatInterface } from "../components/chat-interface"
import { ProgressTracker } from "../components/progress-tracker"
import { ParentDashboardButton } from "../components/parent-dashboard-button"
import { BreakButton } from "../components/break-button"
import { FocusModeButton } from "../components/focus-mode-button"
import { IdlePrompt } from "../components/idle-prompt"
import { EmotionalCheckIn } from "../components/emotional-check-in"
import { getUserFromToken } from "../lib/auth"

export type Subject = "math" | "reading" | "spelling" | "exploration"
export type Emotion = "happy" | "neutral" | "sad" | null
const getSubjectId = async (subjectName: string): Promise<number | null> => {
  const res = await fetch(`/api/subjects?id_by_name=${subjectName}`)
  const { id } = await res.json()
  return id ?? null
}

export default function LearningAssistant() {
  const [activeSubject, setActiveSubject] = useState<Subject>("math")
  const [xpPoints, setXpPoints] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(5 * 60) // 5 minutes in seconds
  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showEmotionalCheckIn, setShowEmotionalCheckIn] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null)
  const emotionalCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [userId, setUserId] = useState("")
  const [userLevel, setUserLevel]               = useState(1)     
  const [currentChallengeId, setCurrentChallengeId] = useState<number | null>(null) 
  const subjectMap: Record<Subject, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  }
  
  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUserId(data.userId)
      })
  }, [])


  
  // Reset idle timer on activity
  const handleActivity = () => {
    setLastActivity(Date.now())
    setIsIdle(false)
  }

  // Handles AI implementation
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message)
    handleActivity()
  }

  useEffect(() => {
    const handleAnswerAttempt = (e: Event) => {
      const customEvent = e as CustomEvent<{
        subject: Subject
        correct: boolean
        attempts: number
      }>
      const { subject, correct, attempts } = customEvent.detail
  
      let xpEarned = 2
      if (correct && attempts === 1) xpEarned = 10
      else if (correct && attempts <= 2) xpEarned = 7
      else if (correct) xpEarned = 5
      else xpEarned = 1
  
      setXpPoints((prev) => {
        const newXp = prev + xpEarned
        updateXpInDatabase(newXp)
        return newXp
      })
  
      console.log(`Answer attempt:`, { subject, correct, attempts, xpEarned })
    }
  
    window.addEventListener("answer-attempt", handleAnswerAttempt)
    return () => window.removeEventListener("answer-attempt", handleAnswerAttempt)
  }, [activeSubject])
  
  
  
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

  const updateXpInDatabase = async (newXp: number) => {
    if (!userId) return
    const subjectId = subjectMap[activeSubject]
    if (!subjectId) return
  
    await fetch("/api/progress/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        subject: subjectId,
        xp: newXp,
      }),
    })
  }
  
  
  const handleEmotionSelected = (selectedEmotion: Emotion) => {
    setEmotion(selectedEmotion)
    setShowEmotionalCheckIn(false)
    // In a real app, you would use this emotion to adapt the learning experience
  }

    // 2️⃣ whenever we have both userId & activeSubject, fetch XP+level:
    useEffect(() => {
      const loadProgress = async () => {
        if (!userId) return
        const subjectId = subjectMap[activeSubject]
        if (!subjectId) return
  
        const res = await fetch(`/api/progress?user_id=${userId}&subject=${subjectId}`)
        const data = await res.json()
        setXpPoints(data.xp    ?? 0)
        setUserLevel(data.level ?? 1)      // ← populate level
      }
  
      loadProgress()
    }, [userId, activeSubject])
    
    const handlePromptClick = async (promptText: string, challengeId: number) => {
      setCurrentChallengeId(challengeId)   
      const typingId = "typing"
      const userMsgId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()
    
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
      )
    
      // 2. Fetch assistant response
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptText, subject: activeSubject }),
      })
    
      const { reply } = await response.json()
    
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
      )
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
    <ProgressTracker xpPoints={xpPoints} level={userLevel} />

    {/* Challenge Questions */}
    {userId && (
      <IdlePrompt
      subject={activeSubject}
      level={userLevel}
      userId={userId}
      initialXP={xpPoints}
      onEarnXp={(xp) => setXpPoints((prev) => prev + xp)}
      onPromptClick={(prompt, id) => {
        handlePromptClick(prompt, id)
      }}      
    />
    
    )}

<ChatInterface
  subject={activeSubject}
  onSendMessage={handleSendMessage}
  userId={userId}
  currentChallengeId={currentChallengeId} // ✅ new
/>



    {/* Emotional check-in */}
    {showEmotionalCheckIn && (
      <EmotionalCheckIn onEmotionSelected={handleEmotionSelected} />
    )}
  </div>
</div>

      </div>
    </div>
  )
}
