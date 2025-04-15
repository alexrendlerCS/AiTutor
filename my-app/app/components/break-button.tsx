"use client"

import { useState } from "react"
import { Coffee } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"

export function BreakButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700"
        >
          <Coffee className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Take a Break</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-b from-blue-50 to-orange-50 border-orange-200">
        <DialogHeader>
          <DialogTitle className="text-orange-700 text-xl">Break Time!</DialogTitle>
          <DialogDescription className="text-gray-700">
            Great job on your learning! Taking breaks helps your brain remember what you've learned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200">
            <h3 className="font-medium text-orange-800 mb-2">Break Ideas:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                Stand up and stretch for 2 minutes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                Get a drink of water
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                Look out the window at something far away
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                Take 5 deep breaths
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button onClick={() => setOpen(false)} className="bg-orange-500 hover:bg-orange-600 rounded-full px-8">
              I'm Ready to Learn Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
