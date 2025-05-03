// AITutor/my-app/app/components/login-signup-page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase-client";

export default function LoginSignupPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
    setForm({
      username: "",
      full_name: "",
      email: "",
      password: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      let authResponse;

      if (isLogin) {
        authResponse = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
      } else {
        authResponse = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.full_name,
              username: form.username,
            },
          },
        });
      }

      const { error } = authResponse;
      if (error) {
        setError(error.message);
        return;
      }

      // ✅ Ensure the session is fully loaded & cookie is synced
      await supabase.auth.getSession();

      setSuccess(isLogin ? "Welcome back! 🌟" : "You're signed up! 🚀");

      // ✅ Fetch authenticated user (optional)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn("No user found, fallback to intro quiz");
        return router.push("/intro-quiz");
      }

      // ✅ Insert into your custom 'users' table if not exists
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? "",
        username: user.user_metadata?.username ?? "",
      });

      // ✅ Check profile completion status
      const profileRes = await fetch("/api/profile/status");
      const profileData = await profileRes.json();

      if (profileData.completed_intro_quiz) {
        router.push("/learning-assistant");
      } else {
        router.push("/intro-quiz");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

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
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Your Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
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
  );
}
