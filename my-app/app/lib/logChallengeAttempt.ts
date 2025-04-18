// lib/logChallengeAttempt.ts

export async function logChallengeAttempt({
  user_id,
  challenge_id,
  success,
  attempts,
  used_hint = false,   // ← include used_hint here
  xp_earned,
}: {
  user_id: string
  challenge_id: number
  success: boolean
  attempts: number
  used_hint?: boolean   // ← optional boolean
  xp_earned: number
}) {
  const res = await fetch("/api/xp/challenges/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id,
      challenge_id,
      success,
      attempts,
      used_hint,
      xp_earned,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to log challenge attempt")
  return data
}
