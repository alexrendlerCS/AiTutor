"use client"

import type React from "react"

import { Book, Brain, Calculator, Sparkles } from "lucide-react"
import { cn } from "../lib/utils"
import type { Subject } from "../learning-assistant/page.tsx"
import { useIsMobile } from "../hooks/use-mobile"
import { useState } from "react"
import { Button } from "../components/ui/button"
import { Sheet, SheetContent } from "../components/ui/sheet"

interface SidebarProps {
  activeSubject: Subject
  onSubjectChange: (subject: Subject) => void
}

interface SubjectButtonProps {
  subject: Subject
  isActive: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function SubjectButton({ subject, isActive, onClick, icon, label }: SubjectButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full",
        isActive ? "bg-white text-purple-700 shadow-md" : "text-purple-600 hover:bg-white/50",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300",
          isActive ? "bg-purple-100 shadow-[0_0_8px_rgba(147,51,234,0.5)]" : "bg-white/80",
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

export function Sidebar({ activeSubject, onSubjectChange }: SidebarProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const subjects = [
    { id: "math" as Subject, label: "Math", icon: <Calculator className="w-6 h-6" /> },
    { id: "reading" as Subject, label: "Reading", icon: <Book className="w-6 h-6" /> },
    { id: "spelling" as Subject, label: "Spelling", icon: <Brain className="w-6 h-6" /> },
    { id: "exploration" as Subject, label: "Explore", icon: <Sparkles className="w-6 h-6" /> },
  ]

  const sidebarContent = (
    <div className="h-full flex flex-col bg-purple-100 rounded-r-3xl p-4">
      <div className="flex-1 flex flex-col gap-4 mt-16 md:mt-8">
        {subjects.map((subject) => (
          <SubjectButton
            key={subject.id}
            subject={subject.id}
            isActive={activeSubject === subject.id}
            onClick={() => {
              onSubjectChange(subject.id)
              if (isMobile) setOpen(false)
            }}
            icon={subject.icon}
            label={subject.label}
          />
        ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-10 bg-purple-100 text-purple-700"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="h-5 w-5" />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="p-0 w-[180px] bg-transparent border-none">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return <div className="hidden md:block w-[180px] shrink-0">{sidebarContent}</div>
}
