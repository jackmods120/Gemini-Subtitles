import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    // Also support JSON message for text chat fallback
    if (!videoFile) {
      const body = await request.text();
      let message = "";
      try {
        const json = JSON.parse(body);
        message = json.message;
      } catch {
        return NextResponse.json({ error: "No video or message provided" }, { status: 400 });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(message);
      return NextResponse.json({ reply: result.response.text() });
    }

    // Convert video to base64
    const videoBuffer = await videoFile.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString("base64");
    const mimeType = videoFile.type || "video/mp4";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `تۆ AI JACK ی، متخەسیسی ژێرنووسی کوردی سۆرانی بە لاتین.

ئەم ڤیدیۆیە بە دقیق شیکاری بکە و ژێرنووسی تەواوت بنووسە بەم شێوەیە:

١. دەنگی میوزیک و کاریگەری دەنگی: لە ناو () بنووسە بە کوردی
   نمونە: (میوزیکێکی ئارام دەست پێدەکات)

٢. دیالۆگی ئەکتەرەکان: ناوی ئەکتەر: دەقی قسەکە
   - ناوی ئەکتەر بە لاتینی بنووسە
   - دەقی قسەکە بە لاتینی سۆرانی بنووسە
   نمونە: Sanji: (be dengeki himen) Choper, yek shit le bir me ke...

٣. کاریگەری دیکە لە ناو (): (dengey jigerechishani Sanji)

مەرجەکان:
- هەموو دیالۆگەکان بە لاتینی سۆرانی بنووسە
- ناوی ئەکتەرەکان بە لاتینی بنووسە
- هیچ عەرەبی یان کوردی ئەڵفبای مەنووسە
- زمان: تەنها لاتین
- هەر ئەکتەرێک دانە دانە ناوی بنووسە

وەڵامەکەت تەنها ژێرنووسەکان بن، هیچ ڕوونکردنەوەی تر مەنووسە.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: videoBase64,
        },
      },
      prompt,
    ]);

    const reply = result.response.text();
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("AI JACK error:", error);
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 }
    );
  }
}
