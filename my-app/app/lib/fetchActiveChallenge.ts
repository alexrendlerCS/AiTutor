// app/lib/fetchActiveChallenge.ts

export async function fetchActiveChallenge(subject: string) {
  try {
    const res = await fetch("/api/xp/challenges/current", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject }),
    });

    if (!res.ok) {
      console.error("Failed to fetch active challenge:", res.status);
      return null;
    }

    const data = await res.json();
    return data.challenge ?? null;
  } catch (err) {
    console.error("Error fetching active challenge:", err);
    return null;
  }
}
