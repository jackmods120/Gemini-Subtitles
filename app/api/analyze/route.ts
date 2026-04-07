import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE_MB = 24; // Groq limit is 25MB, making it 24 to be safe
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: `GROQ_API_KEY نەدراوە. لە Vercel → Settings → Environment Variables زیادی بکە.` },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return NextResponse.json({ error: "ڤیدیۆ نەدراوە" }, { status: 400 });
    }

    if (videoFile.size > MAX_SIZE_BYTES) {
      const sizeMB = (videoFile.size / 1024 / 1024).toFixed(1);
      return NextResponse.json({
        error: `ڤیدیۆکە ${sizeMB}MB یە. تکایە ڤیدیۆیەکی کەمتر لە ${MAX_SIZE_MB}MB بنێرە.`
      }, { status: 400 });
    }

    // هەنگاوی 1: وەرگرتنی دەق لە ڕێگەی Groq Whisper
    const whisperData = new FormData();
    whisperData.append("file", videoFile);
    whisperData.append("model", "whisper-large-v3");

    const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperData,
    });

    const whisperJson = await whisperRes.json();
    
    if (!whisperRes.ok) {
      throw new Error(whisperJson.error?.message || "کێشەیەک لە کاتی گوێگرتن لە ڤیدیۆکە ڕوویدا");
    }

    const rawText = whisperJson.text;
    if (!rawText || rawText.trim() === "") {
      return NextResponse.json({ error: "هیچ دەنگ و قسەیەک لەناو ڤیدیۆکە نەدۆزرایەوە." }, { status: 400 });
    }

    // هەنگاوی 2: ڕێکخستنی دەقەکە (لاتینی، ناوی ئەکتەر، دەنگ) لە ڕێگەی Groq Llama 3
    const prompt = `ئەمەی خوارەوە دەقی ڤیدیۆیەکە کە لە دەنگەوە کراوە بە نووسین:
"${rawText}"

تکایە ئەم دەقە ڕێکبخەوە بەپێی ئەم یاسایانە:
١. کاریگەری دەنگ و میوزیک ئەگەر هەستت پێکرد:
(muzikeki aram dest pe dekat)
٢. قسەی ئەکتەر بەپێی دەنگەکە (ناوی ئەکتەرەکە یان کەسەکە بنووسە):
Sanji: Choper, yek shit le bir me ke...
٣. هەموو دەقەکە بە کوردی سۆرانی بەڵام بە پیتی لاتینی بنووسە (هیچ پیتێکی عەرەبی/کوردی وەک 'ع، غ، ش، ی' بەکارمەهێنە، تەنها لاتینی).
٤. تەنها و تەنها ژێرنووسەکە بنووسە، هیچ ڕوونکردنەوە و وشەیەکی زیادە مەنووسە.`;

    const llamaRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // خێراترین مۆدێل بۆ ئەم کارە
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const llamaJson = await llamaRes.json();

    if (!llamaRes.ok) {
      throw new Error("کێشەیەک لە وەرگێڕانی دەقەکە ڕوویدا.");
    }

    const finalReply = llamaJson.choices[0].message.content.trim();

    return NextResponse.json({ reply: finalReply });

  } catch (err: unknown) {
    console.error("AI JACK route error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    
    return NextResponse.json({
      error: `کێشە: ${msg.slice(0, 150)}`
    }, { status: 500 });
  }
}
