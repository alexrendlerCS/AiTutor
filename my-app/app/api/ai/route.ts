import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject } = body;

    const systemPrompt = `
      You're a supportive tutor for a 9-12-year-old student learning ${subject}.
      DO NOT give direct answers immediately.
      Instead, guide the student with small hints or questions that help them discover the answer.
      Praise effort, correct gently, and reward progress.
      Avoid repeating greetings. Be concise and encouraging for kids with short attention spans.
      Respond to correct answers by first saying "Correct!" then continuing on with the message
      `;

    // Determine whether it's a single prompt or full message history
    const chatMessages =
      body.messages && Array.isArray(body.messages)
        ? [{ role: "system", content: systemPrompt }, ...body.messages]
        : [
            { role: "system", content: systemPrompt },
            { role: "user", content: body.message },
          ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatMessages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("OpenAI API error:", err);
      return NextResponse.json({
        reply: "Hmm... I'm having trouble responding right now.",
      });
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      reply: "Something went wrong on the server.",
    });
  }
}
