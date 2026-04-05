import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `تۆ یارمەتیدەرێکی هۆشیاری و بەرپرسیاری کوردی (سۆرانی) یت. هەمیشە بە زمانی کوردی سۆرانی وەڵام بدەرەوە. 
- وەڵامەکانت کورت، ڕوون، و بەسوود بن
- زمانی گرم و دۆستانە بەکاربهێنە  
- ئەگەر پرسیار بە زمانێکی تر بووایە، هێج کات بە کوردی وەڵام بدەرەوە
- ئەگەر زانستی یان تەکنیکی بووایە، بە وشەی ئاسان ڕوونیبکەرەوە`,
    });

    // Build chat history (exclude welcome message, last 10 messages max)
    const chatHistory = (history || [])
      .slice(-10)
      .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
