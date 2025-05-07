"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Subject } from "../learning-assistant/page.tsx";
type OpenAIMessage = { role: "user" | "assistant"; content: string };
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { formatAIResponse } from "../utils/formatAIResponse";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant" | "system";
  isTyping?: boolean;
}

interface ChatInterfaceProps {
  subject: Subject;
  onSendMessage: (message: string) => void;
  userId: string;
  currentChallengeId: number | null;
  onChallengeComplete?: () => void;
}

export function ChatInterface({
  subject,
  onSendMessage,
  userId,
  currentChallengeId,
  onChallengeComplete,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: getWelcomeMessage(subject),
      sender: "assistant",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [guessCount, setGuessCount] = useState(0);
  const [showChallengeCelebration, setShowChallengeCelebration] =
    useState(false);
  const [challengeXpEarned, setChallengeXpEarned] = useState(0);
  const { width, height } = useWindowSize();

  const isAnswerCorrect = (assistantMessage: string): boolean =>
    assistantMessage.toLowerCase().includes("correct!");

  const subjectMap: Record<Subject, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    console.log(
      "[DEBUG] handleSend called. currentChallengeId:",
      currentChallengeId
    );

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
    };

    const beforeTyping = [...messages, userMessage];

    setMessages(beforeTyping);
    setGuessCount((prev) => prev + 1);
    onSendMessage(inputValue);
    setInputValue("");

    const typingId = "typing";
    const withTyping = beforeTyping
      .filter((m) => m.id !== typingId)
      .concat({
        id: typingId,
        content: "",
        sender: "assistant",
        isTyping: true,
      });
    setMessages(withTyping);

    const historyForAPI: OpenAIMessage[] = beforeTyping
      .filter((m) => m.sender === "user" || m.sender === "assistant")
      .map((m) => ({
        role: m.sender as "user" | "assistant",
        content: m.content,
      }))
      .concat({ role: "user", content: inputValue });

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          messages: historyForAPI,
          challenge: !!currentChallengeId,
          challengeId: currentChallengeId,
        }),
      });

      const data = await res.json();
      const assistantReply = data.reply;

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: crypto.randomUUID(),
            content: assistantReply,
            sender: "assistant",
          })
      );

      const correct = isAnswerCorrect(assistantReply);
      const attempts = guessCount + 1;
      let xpEarned = 0;
      let xpMessage = "";

      if (!currentChallengeId) {
        console.log(
          "[DEBUG] Treating as freeform prompt. Resetting challenge context."
        );
        if (onChallengeComplete) onChallengeComplete(); // Reset challenge context for freeform
        // Freeform prompt: log and get XP result
        const logRes = await fetch("/api/xp/prompts/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            subject_id: subjectMap[subject],
            prompt: inputValue,
            success: correct,
            attempts,
            used_hint: false,
          }),
        });
        const logData = await logRes.json();
        xpEarned = logData.xp_earned ?? 0;
        xpMessage =
          logData.message || (xpEarned > 0 ? `+${xpEarned} XP (Freeform)` : "");
        if (xpMessage) {
          toast.info(xpMessage, { duration: 2500 });
        }
        // Only dispatch XP event for freeform, no challengeId
        if (xpEarned > 0) {
          window.dispatchEvent(
            new CustomEvent("answer-attempt", {
              detail: {
                subject,
                correct,
                attempts,
                xpEarned,
                challengeId: null,
              },
            })
          );
        }
      } else {
        console.log(
          "[DEBUG] Treating as challenge prompt. Challenge ID:",
          currentChallengeId
        );
        // Debug log before logging challenge attempt
        console.log(
          "ChatInterface: Logging attempt for challenge",
          currentChallengeId,
          {
            userId,
            attempts: guessCount + 1,
            inputValue,
          }
        );
        // Challenge: use backend XP value
        let logRes = null;
        let logData = null;
        try {
          logRes = await fetch("/api/xp/challenges/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              challenge_id: currentChallengeId,
              success: correct,
              attempts,
              used_hint: false,
            }),
          });
          logData = await logRes.json();
        } catch (err) {
          console.error("❌ Error logging challenge attempt:", err);
        }
        xpEarned = logData?.xp_earned ?? 0;
        if (xpEarned > 0) {
          setChallengeXpEarned(xpEarned);
          setShowChallengeCelebration(true);
          setTimeout(() => setShowChallengeCelebration(false), 3500);
          // Only dispatch XP event for challenge
          window.dispatchEvent(
            new CustomEvent("answer-attempt", {
              detail: {
                subject,
                correct,
                attempts,
                xpEarned,
                challengeId: currentChallengeId,
              },
            })
          );
        }
        // ✅ Trigger challenge-complete only if correct AND challenge
        if (correct && currentChallengeId) {
          window.dispatchEvent(new CustomEvent("challenge-complete"));
          setGuessCount(0); // reset guesses
          if (onChallengeComplete) onChallengeComplete(); // notify parent to reset
        }
      }
    } catch (err) {
      console.error("❌ AI response error:", err);
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: crypto.randomUUID(),
            content:
              "Hmm... I'm having trouble responding right now. Try again in a moment!",
            sender: "assistant",
          })
      );
    }
  };

  useEffect(() => {
    setMessages((prev) => [
      {
        id: "welcome-" + subject,
        content: getWelcomeMessage(subject),
        sender: "assistant",
      },
      ...prev.filter((msg) => !msg.id.startsWith("welcome")),
    ]);
  }, [subject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleExternalSend = (e: Event) => {
      const customEvent = e as CustomEvent<string | [Message, Message]>;
      const detail = customEvent.detail;
      console.log("🔥 Message received:", detail);
      if (Array.isArray(detail)) {
        const typingId = "typing";

        const newMessages = detail
          .filter((msg): msg is Message => !!msg) // remove null/undefined
          .map((msg) => ({ ...msg, id: msg.id ?? crypto.randomUUID() }));

        setMessages((prev) =>
          prev.filter((msg) => msg.id !== typingId).concat(newMessages)
        );
      } else {
        const externalMessage = detail;

        const userId = crypto.randomUUID();
        const typingId = "typing";

        const userMessage: Message = {
          id: userId,
          content: externalMessage,
          sender: "user",
        };

        setMessages((prev) => [
          ...prev,
          userMessage,
          { id: typingId, content: "", sender: "assistant", isTyping: true },
        ]);

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
            };

            setMessages((prev) =>
              prev.filter((msg) => msg.id !== typingId).concat(assistantMessage)
            );
          })
          .catch(() => {
            const errorMessage: Message = {
              id: crypto.randomUUID(),
              content:
                "Hmm... I'm having trouble responding right now. Try again in a moment!",
              sender: "assistant",
            };

            setMessages((prev) =>
              prev.filter((msg) => msg.id !== typingId).concat(errorMessage)
            );
          });
      }
    };

    window.addEventListener("ai-message", handleExternalSend);
    console.log("✅ Listening for ai-message event...");

    return () => {
      window.removeEventListener("ai-message", handleExternalSend);
    };
  }, [messages, subject]);

  useEffect(() => {
    const resetState = () => {
      setMessages([
        {
          id: "welcome-" + subject,
          content: getWelcomeMessage(subject),
          sender: "assistant",
        },
      ]);
      setGuessCount(0);
    };

    window.addEventListener("reset-attempts", resetState);
    return () => {
      window.removeEventListener("reset-attempts", resetState);
    };
  }, [subject]);

  const handleVoiceInput = () => {
    setIsListening(!isListening);

    if (!isListening) {
      setTimeout(() => {
        const fakeVoiceInput = getRandomVoiceInput(subject);
        setInputValue(fakeVoiceInput);
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-md overflow-hidden border-2 border-purple-200 mt-4">
      <div className="p-4 bg-purple-50 border-b border-purple-100">
        <h2 className="text-lg font-semibold text-purple-800 capitalize">
          {subject} Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map(
            (message) =>
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
                            __html: formatAIResponse(message.content).replace(
                              /\n/g,
                              "<br>"
                            ),
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
                    className={`absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors ${
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700"
                    tabIndex={-1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm text-purple-800 font-medium">
                    <strong>XP Tips:</strong>
                    <br />
                    You earn{" "}
                    <span className="text-purple-600 font-bold">
                      more XP
                    </span>{" "}
                    by completing{" "}
                    <span className="text-purple-600 font-bold">
                      challenge questions
                    </span>
                    !<br />
                    Freeform questions are for practice and curiosity. Try a
                    challenge for bigger rewards!
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            onClick={handleSend}
            className="rounded-full bg-purple-600 hover:bg-purple-700"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Celebration Confetti and Modal for Challenge XP */}
      {showChallengeCelebration && (
        <>
          <Confetti
            width={width}
            height={height}
            numberOfPieces={300}
            recycle={false}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl px-10 py-8 border-4 border-purple-300 flex flex-col items-center animate-fadeIn">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-purple-700 mb-2">
                Challenge Complete!
              </div>
              <div className="text-lg text-green-600 font-semibold mb-2">
                +{challengeXpEarned} XP
              </div>
              <div className="text-gray-600">
                Amazing job! Keep going for more rewards!
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getWelcomeMessage(subject: Subject): string {
  switch (subject) {
    case "math":
      return "Hi there! I'm your Math buddy. What would you like to learn today?";
    case "reading":
      return "Hello! Ready to explore amazing stories together?";
    case "spelling":
      return "Welcome to Spelling! Let's practice some fun and tricky words.";
    case "exploration":
      return "Time to explore! What would you like to discover today?";
  }
}

function getRandomVoiceInput(subject: Subject): string {
  const inputs = {
    math: [
      "Can you help me with fractions?",
      "What's 7 times 8?",
      "How do I solve word problems?",
    ],
    reading: [
      "What does 'perseverance' mean?",
      "Can you recommend a good book?",
      "How do I find the main idea?",
    ],
    spelling: [
      "How do you spell 'necessary'?",
      "What's the rule for 'i before e'?",
      "Spell 'beautiful' for me?",
    ],
    exploration: [
      "Why is the sky blue?",
      "How do planes fly?",
      "Tell me about dinosaurs",
    ],
  };

  const subjectInputs = inputs[subject];
  return subjectInputs[Math.floor(Math.random() * subjectInputs.length)];
}
