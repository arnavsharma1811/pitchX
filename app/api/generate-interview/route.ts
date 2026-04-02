import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role, level, techstack, amount } = await req.json();

  const { text } = await generateText({
    model: google("gemini-2.0-flash-001"),
    prompt: `Generate ${amount} interview questions for a ${level} ${role} position. 
    The candidate should know: ${techstack}. 
    Return ONLY a JSON array of questions like this, nothing else:
    ["Question 1?", "Question 2?", "Question 3?"]`,
  });

  const questions = JSON.parse(text.trim());
  return NextResponse.json({ questions });
}