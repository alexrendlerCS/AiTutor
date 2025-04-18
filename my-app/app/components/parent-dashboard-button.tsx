"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { getUserFromToken } from "../lib/auth"

export function ParentDashboardButton() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [user, setUser] = useState<{ username: string; full_name?: string; email?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const parsed = getUserFromToken()
    setUser(parsed)
  }, [])

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
    router.push("/")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = "admin123" // 🔐 Replace with env var or secure logic

    if (password === correctPassword) {
      setError(false)
      setOpen(false)
      router.push("/parent-dashboard") // Change route if needed
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
          <DialogDescription>
            View account info or enter password to access the dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-gray-700 pb-4">
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Name:</strong> {user?.full_name || "N/A"}</p>
          <p><strong>Email:</strong> {user?.email || "N/A"}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Dashboard Password</Label>
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

          <DialogFooter className="mt-4 flex justify-between items-center">
            <Button type="submit">Access Dashboard</Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
