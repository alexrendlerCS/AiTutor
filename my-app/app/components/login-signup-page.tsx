// AITutor/my-app/app/components/login-signup-page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginSignupPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError("")
    setSuccess("")
    setForm({
      username: "",
      full_name: "",
      email: "",
      password: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
  
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup"
  
    const payload = isLogin
      ? {
          login: form.email,
          password: form.password,
        }
      : form
  
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Oops! Something went wrong. Try again! 😓")
    } else {
      setSuccess(
        isLogin
          ? "Welcome back, superstar! 🌟"
          : "You're all signed up! Redirecting... 🚀"
      )
      document.cookie = `token=${data.token}; path=/`
  
      router.push("/learning-assistant") 

    }
  }
  
  
  return (
    <div className="max-w-md mx-auto mt-20 bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-center mb-4">
        {isLogin ? "Login" : "Sign Up"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Choose a Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Your Full Name"
              value={form.full_name}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </>
        )}

        <input
          type="text"
          placeholder={isLogin ? "Email or Username" : "Email (optional)"}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm text-center font-semibold">
            {success}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-purple-600 text-white rounded p-2 hover:bg-purple-700"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button onClick={toggleMode} className="text-purple-600 underline">
          {isLogin ? "Sign up" : "Login"}
        </button>
      </p>
    </div>
  )
}
