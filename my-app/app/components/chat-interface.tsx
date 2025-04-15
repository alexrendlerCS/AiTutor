"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import type { Subject } from "./learning-assistant"
import { cn } from "../lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
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

  // Update welcome message when subject changes
  useEffect(() => {
    setMessages((prev) => [
      {
        id: "welcome-" + subject,
        content: getWelcomeMessage(subject),
        sender: "assistant",
      },
      ...prev.filter((msg) => msg.id !== "welcome" && !msg.id.startsWith("welcome-")),
    ])
  }, [subject])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
    }

    setMessages((prev) => [...prev, userMessage])
    onSendMessage(inputValue)
    setInputValue("")

    // Add typing indicator
    const typingId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        content: "",
        sender: "assistant",
        isTyping: true,
      },
    ])

    // Simulate AI response with typing effect
    // Fetch response from your backend
fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: inputValue, subject }),
})
  .then((res) => res.json())
  .then((data) => {
    // Remove typing indicator and show actual assistant response
    setMessages((prev) =>
      prev
        .filter((msg) => msg.id !== typingId)
        .concat({
          id: (Date.now() + 2).toString(),
          content: data.reply,
          sender: "assistant",
        }),
    );
  })
  .catch(() => {
    setMessages((prev) =>
      prev
        .filter((msg) => msg.id !== typingId)
        .concat({
          id: (Date.now() + 2).toString(),
          content: "Hmm... I'm having trouble responding right now. Try again in a moment!",
          sender: "assistant",
        }),
    );
  });

  }

  const handleVoiceInput = () => {
    // In a real app, this would use the Web Speech API
    setIsListening(!isListening)

    if (!isListening) {
      // Simulate voice recognition after 2 seconds
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
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[80%] rounded-2xl p-3 animate-fadeIn",
                message.sender === "user" ? "bg-purple-100 ml-auto rounded-tr-none" : "bg-blue-50 rounded-tl-none",
              )}
            >
              {message.isTyping ? (
                <div className="flex space-x-1 items-center h-6">
                  <div
                    className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              ) : (
                <p className="text-gray-800">{message.content}</p>
              )}
            </div>
          ))}
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
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors ${isListening ? "text-red-500 animate-pulse" : ""}`}
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
      return "Hi there! I'm your Math buddy. What would you like to learn today? We can work on numbers, shapes, or even fun math puzzles!"
    case "reading":
      return "Hello! Ready to explore amazing stories together? I can help you read, understand new words, or talk about your favorite books!"
    case "spelling":
      return "Welcome to Spelling! I can help you practice tricky words, learn spelling rules, or play word games. What would you like to do?"
    case "exploration":
      return "Time to explore! We can learn about animals, space, history, or anything else you're curious about. What would you like to discover?"
  }
}

function getAIResponse(subject: Subject, userMessage: string): string {
  // In a real app, this would call your AI service
  // This is just a simple demo response
  const responses = {
    math: [
      "That's a great math question! Let's figure it out together.",
      "I like how you're thinking about these numbers. Here's how we can solve it...",
      "Math can be fun! Let's break this down into simple steps.",
    ],
    reading: [
      "That's a wonderful observation about the story!",
      "I like how you're thinking about the characters. Have you noticed how they...",
      "Great question about that word! Let me explain what it means...",
    ],
    spelling: [
      "Good try! That word is tricky. Let's practice it together.",
      "You're getting better at spelling! Here's a tip to remember this one...",
      "Let's break this word into syllables to make it easier to spell.",
    ],
    exploration: [
      "What an interesting question! Let's explore that together.",
      "Did you know? Here's a cool fact about that...",
      "That's something scientists are still learning about! Here's what we know so far...",
    ],
  }

  const subjectResponses = responses[subject]
  return subjectResponses[Math.floor(Math.random() * subjectResponses.length)]
}

// Add this helper function for simulating voice input
function getRandomVoiceInput(subject: Subject): string {
  const inputs = {
    math: ["Can you help me with fractions?", "What's 7 times 8?", "How do I solve word problems?"],
    reading: ["What does 'perseverance' mean?", "Can you recommend a good book?", "How do I find the main idea?"],
    spelling: [
      "How do you spell 'necessary'?",
      "What's the rule for 'i before e'?",
      "Can you help me spell 'beautiful'?",
    ],
    exploration: ["Why is the sky blue?", "How do planes fly?", "Tell me about dinosaurs"],
  }

  const subjectInputs = inputs[subject]
  return subjectInputs[Math.floor(Math.random() * subjectInputs.length)]
}
