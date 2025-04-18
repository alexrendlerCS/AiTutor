// AITutor/my-app/lib/api/logChallengeAttempt.ts
export async function logChallengeAttempt({
    user_id,
    subject,
    correct,
    attempts,
    used_hint,
    xp_earned,
  }: {
    user_id: string
    subject: string
    correct: boolean
    attempts: number
    used_hint: boolean
    xp_earned: number
  }) {
    const res = await fetch("/api/xp/challenges/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        subject,
        correct,
        attempts,
        used_hint,
        xp_earned,
      }),
    })
  
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to log challenge attempt")
  
    return data
  }
  