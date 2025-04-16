export function formatAIResponse(text: string): string {
    // Bold numbers
    let formatted = text.replace(/\b\d+\b/g, (match) => `<strong>${match}</strong>`)
  
    // Add emojis
    const emojiMap: Record<string, string> = {
      sticker: "📦",
      apple: "🍎",
      rainbow: "🌈",
      animal: "🐾",
      story: "📖",
      clue: "🕵️",
      planet: "🪐",
      number: "🔢",
      puzzle: "🧩",
      guess: "🤔",
      multiplication: "✖️",
      addition: "➕",
      subtraction: "➖",
    }
  
    for (const [keyword, emoji] of Object.entries(emojiMap)) {
      const regex = new RegExp(`\\b(${keyword}s?)\\b`, "gi")
      formatted = formatted.replace(regex, `$1 ${emoji}`)
    }
  
    return formatted
  }
  