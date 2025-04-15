"use client"

import { Eye, EyeOff } from "lucide-react"
import { Button } from "../components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"

interface FocusModeButtonProps {
  isActive: boolean
  onToggle: () => void
}

export function FocusModeButton({ isActive, onToggle }: FocusModeButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className={`rounded-full transition-all duration-300 ${
              isActive
                ? "bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200 hover:text-blue-700"
                : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:text-purple-700"
            }`}
            onClick={onToggle}
          >
            {isActive ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exit Focus</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Focus Mode</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isActive ? "Exit focus mode" : "Hide distractions and focus on learning"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
