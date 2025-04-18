// AITutor/my-app/app/page.tsx
import { redirect } from "next/navigation"
import { getUserFromToken } from "./lib/auth"
import LoginSignupPage from "./components/login-signup-page"

export default function Home() {
  const user = getUserFromToken()

  if (user) {
    // ✅ Redirect to learning assistant if logged in
    redirect("/learning-assistant")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <LoginSignupPage />
    </main>
  )
}
