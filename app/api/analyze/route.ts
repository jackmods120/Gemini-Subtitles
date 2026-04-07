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

    if (!videoFile) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    // Convert video to base64
    const videoBuffer = await videoFile.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString("base64");
    const mimeType = (videoFile.type || "video/mp4") as string;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `ئەم ڤیدیۆیە بە وردی گوێی لێ بگرە و تەواوی دیالۆگ و دەنگەکانی بنووسەرەوە.

یاسا و شێوەکار:

١. کاریگەری دەنگ و میوزیک → لە ناو () بنووسە بە کوردی
نمونە: (muzikeki aram u hiwash dest pe dekat)

٢. دیالۆگی ئەکتەر → ناو: دەق
- ناوی ئەکتەر: بە لاتینی
- دەقی قسەکە: بە لاتینی سۆرانی
نمونە: Sanji: (be dengeki himen u leserxo) Choper, yek shit le bir me ke...

٣. کاریگەری تایبەت → لە ناو () بنووسە
نمونە: (dengey jigerechishani Sanji)
نمونە: (dengey peyekan deit ke derawet)

٤. میوزیک گۆڕانی → لە ناو () بنووسە
نمونە: (muzikeke be tewawi degoriit bo goraniyeki xira u behiz le jori fonk)

مەرجی گرنگ:
- هەموو دەقەکان بە لاتین بنووسە، هیچ عەرەبی یان کوردی ئەڵفبا مەنووسە
- هەر ئەکتەرێک بە ناوی خۆی دانە دانە
- دەقی قسەکان وەک چۆن دەڵێن بنووسە
- تەنها ژێرنووس، هیچ ڕوونکردنەوە یان تێبینی تر مەنووسە`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: videoBase64,
        },
      },
      { text: prompt },
    ]);

    const reply = result.response.text();
    return NextResponse.json({ reply });

  } catch (error: unknown) {
    console.error("AI JACK error:", error);

    // Check if video is too large
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("too large") || errMsg.includes("size")) {
      return NextResponse.json(
        { reply: "ڤیدیۆکە زۆر گەورەیە. تکایە ڤیدیۆیەکی بچووکتر بنێرە (کەمتر لە 20MB)." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { reply: "کێشەیەک روویدا. تکایە:\n١. ئینتەرنێتەکەت بپشکنە\n٢. ڤیدیۆیەکی بچووکتر هەوڵ بدە\n٣. دوبارە هەوڵ بدەرەوە" },
      { status: 200 }
    );
  }
}
