// AITutor/my-app/lib/auth.ts
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key"

// ✅ Client-side version
export function getUserFromToken() {
    if (typeof document === "undefined") return null
  
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]
  
    if (!token) return null
  
    try {
      const decoded = jwt.decode(token) as { userId: string; username: string; email?: string; full_name?: string }
  
      if (!decoded || !decoded.username) return null 
  
      return decoded
    } catch {
      return null
    }
  }
  
