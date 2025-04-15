import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { message, subject } = await req.json();

  const prompt = `You're a friendly tutor for kids learning ${subject}. Respond to this question: "${message}"`;

  const chat = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return NextResponse.json({ reply: chat.choices[0].message.content });
}
