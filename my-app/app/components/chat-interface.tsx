"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import type { Subject } from "./learning-assistant"
type OpenAIMessage = { role: "user" | "assistant"; content: string };
import { cn } from "../lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { formatAIResponse } from "../utils/formatAIResponse"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant" | "system"
  isTyping?: boolean
}

interface ChatInterfaceProps {
  subject: Subject
  onSendMessage: (message: string) => void
}

export function ChatInterface({ subject, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: getWelcomeMessage(subject),
      sender: "assistant",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [guessCount, setGuessCount] = useState(0)

const isAnswerCorrect = (userMessage: string, assistantMessage: string) => {
  // TODO: Replace with actual check logic
  return assistantMessage.toLowerCase().includes("correct") || userMessage.toLowerCase() === "42"
}

const handleSend = () => {
  if (!inputValue.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputValue,
    sender: "user",
  }

  setMessages((prev) => [...prev, userMessage])
  setGuessCount((prev) => prev + 1) // 🔄 Count each guess

  onSendMessage(inputValue)
  setInputValue("")

  const typingId = "typing"

  setMessages((prev) =>
    prev
      .filter((msg) => msg.id !== typingId)
      .concat({ id: typingId, content: "", sender: "assistant", isTyping: true })
  )

  const historyForAPI: OpenAIMessage[] = messages
    .filter((msg) => msg.sender === "user" || msg.sender === "assistant")
    .map((msg) => ({
      role: msg.sender as "user" | "assistant",
      content: msg.content,
    }))
    .concat({
      role: "user",
      content: inputValue,
    })

  fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, messages: historyForAPI }),
  })
    .then((res) => res.json())
    .then((data) => {
      const assistantReply = data.reply

      setMessages((prev) =>
        prev.filter((msg) => msg.id !== typingId).concat({
          id: crypto.randomUUID(),
          content: assistantReply,
          sender: "assistant",
        })
      )

      const correct = isAnswerCorrect(inputValue, assistantReply)

      // Fire event so parent (learning-assistant) can reward XP later
      window.dispatchEvent(
        new CustomEvent("answer-attempt", {
          detail: {
            subject,
            correct,
            attempts: guessCount + 1,
          },
        })
      )

      // Reset guess count if correct
      if (correct) setGuessCount(0)
    })
    .catch(() => {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== typingId).concat({
          id: crypto.randomUUID(),
          content: "Hmm... I'm having trouble responding right now. Try again in a moment!",
          sender: "assistant",
        })
      )
    })
}

  useEffect(() => {
    setMessages((prev) => [
      {
        id: "welcome-" + subject,
        content: getWelcomeMessage(subject),
        sender: "assistant",
      },
      ...prev.filter((msg) => !msg.id.startsWith("welcome")),
    ])
  }, [subject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handleExternalSend = (e: Event) => {
      const customEvent = e as CustomEvent<string | [Message, Message]>
      const detail = customEvent.detail
      console.log("🔥 Message received:", detail)
      if (Array.isArray(detail)) {
        const typingId = "typing"
      
        const newMessages = detail
          .filter((msg): msg is Message => !!msg) // remove null/undefined
          .map((msg) => ({ ...msg, id: msg.id ?? crypto.randomUUID() }))
      
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== typingId)
            .concat(newMessages)
        )
      }          
      
       else {
        const externalMessage = detail
  
        const userId = crypto.randomUUID()
        const typingId = "typing"
  
        const userMessage: Message = {
          id: userId,
          content: externalMessage,
          sender: "user",
        }
  
        setMessages((prev) => [
          ...prev,
          userMessage,
          { id: typingId, content: "", sender: "assistant", isTyping: true },
        ])
  
        fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, message: externalMessage }),
        })
          .then((res) => res.json())
          .then((data) => {
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              content: data.reply,
              sender: "assistant",
            }
  
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== typingId).concat(assistantMessage)
            )
          })
          .catch(() => {
            const errorMessage: Message = {
              id: crypto.randomUUID(),
              content: "Hmm... I'm having trouble responding right now. Try again in a moment!",
              sender: "assistant",
            }
  
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== typingId).concat(errorMessage)
            )
          })
      }
    }
  
    window.addEventListener("ai-message", handleExternalSend)
    console.log("✅ Listening for ai-message event...")
  
    return () => {
      window.removeEventListener("ai-message", handleExternalSend)
    }
  }, [messages, subject])

  const handleVoiceInput = () => {
    setIsListening(!isListening)

    if (!isListening) {
      setTimeout(() => {
        const fakeVoiceInput = getRandomVoiceInput(subject)
        setInputValue(fakeVoiceInput)
        setIsListening(false)
      }, 2000)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-md overflow-hidden border-2 border-purple-200 mt-4">
      <div className="p-4 bg-purple-50 border-b border-purple-100">
        <h2 className="text-lg font-semibold text-purple-800 capitalize">{subject} Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
        {messages.map((message) =>
  message && (
    <div
      key={message.id}
      className={cn(
        "max-w-[80%] rounded-2xl p-3 animate-fadeIn",
        message.sender === "user"
          ? "bg-purple-100 ml-auto rounded-tr-none"
          : "bg-blue-50 rounded-tl-none"
      )}
    >
      {message.isTyping ? (
        <div className="flex space-x-1 items-center h-6">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            ></div>
          ))}
        </div>
      ) : (
        <p className="text-gray-800">
          {message.sender === "assistant" ? (
            <span
              dangerouslySetInnerHTML={{
                __html: formatAIResponse(message.content).replace(/\n/g, "<br>"),
              }}
            />
          ) : (
            message.content
          )}
        </p>
      )}
    </div>
  )
)}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-purple-100 bg-white">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your question here..."
              className="rounded-full border-purple-200 focus-visible:ring-purple-400 pr-10"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleVoiceInput}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors ${
                      isListening ? "text-red-500 animate-pulse" : ""
                    }`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Speak your question</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button onClick={handleSend} className="rounded-full bg-purple-600 hover:bg-purple-700" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function getWelcomeMessage(subject: Subject): string {
  switch (subject) {
    case "math":
      return "Hi there! I'm your Math buddy. What would you like to learn today?"
    case "reading":
      return "Hello! Ready to explore amazing stories together?"
    case "spelling":
      return "Welcome to Spelling! Let's practice some fun and tricky words."
    case "exploration":
      return "Time to explore! What would you like to discover today?"
  }
}

function getRandomVoiceInput(subject: Subject): string {
  const inputs = {
    math: ["Can you help me with fractions?", "What's 7 times 8?", "How do I solve word problems?"],
    reading: ["What does 'perseverance' mean?", "Can you recommend a good book?", "How do I find the main idea?"],
    spelling: ["How do you spell 'necessary'?", "What's the rule for 'i before e'?", "Spell 'beautiful' for me?"],
    exploration: ["Why is the sky blue?", "How do planes fly?", "Tell me about dinosaurs"],
  }

  const subjectInputs = inputs[subject]
  return subjectInputs[Math.floor(Math.random() * subjectInputs.length)]
}
