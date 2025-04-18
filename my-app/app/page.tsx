// AITutor/my-app/app/page.tsx
import { getUserFromToken } from "./lib/auth"
import { LearningAssistant } from "./components/learning-assistant"
import LoginSignupPage from "./components/login-signup-page"

export default async function Home() {
  const user = await getUserFromToken()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {user ? <LearningAssistant /> : <LoginSignupPage />}
    </main>
  )
}
