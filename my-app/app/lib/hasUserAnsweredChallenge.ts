// app/lib/hasUserAnsweredChallenge.ts
export async function hasUserAnsweredChallenge(
  userId: string,
  challengeId: number
): Promise<boolean> {
  if (!userId) {
    console.warn("⚠️ No userId provided to hasUserAnsweredChallenge");
    return false;
  }

  try {
    const res = await fetch("/api/xp/challenges/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, challenge_id: challengeId }),
    });

    const data = await res.json();
    console.log(`🔍 Challenge ${challengeId} for user ${userId} answered?`, data);

    return !!data.alreadyAnswered;
  } catch (error) {
    console.error("❌ Error calling /api/xp/challenges/check:", error);
    return false;
  }
}
