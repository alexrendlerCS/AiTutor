// AITutor/my-app/lib/auth.ts
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key"

export async function getUserFromToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded as { userId: string; username?: string; email?: string }
  } catch {
    return null
  }
}
