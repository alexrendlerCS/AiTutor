// lib/logChallengeAttempt.ts
export async function logChallengeAttempt({
  user_id,
  challenge_id,
  success,
  attempts,
  used_hint = false,
  xp_earned,
}: {
  user_id: string;
  challenge_id: number;
  success: boolean;
  attempts: number;
  used_hint?: boolean;
  xp_earned: number;
}) {
  // Check if already answered
  const checkRes = await fetch("/api/xp/challenges/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, challenge_id }),
  });

  const check = await checkRes.json();

  if (check.alreadyAnswered) {
    console.warn("🚫 Attempt already logged — skipping insert.");
    return { skipped: true };
  }

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
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to log challenge attempt");
  return data;
}
