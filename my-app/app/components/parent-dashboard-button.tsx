"use client"

import type React from "react"

import { useState } from "react"
import { User } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export function ParentDashboardButton() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple demo password check - in a real app, use proper authentication
    if (password === "parent123") {
      // Would redirect to parent dashboard in a real app
      window.alert("Parent dashboard access granted!")
      setOpen(false)
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
          <User className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parent/Teacher Access</DialogTitle>
          <DialogDescription>Enter your password to access the dashboard.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">Incorrect password. Please try again.</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Access Dashboard</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
