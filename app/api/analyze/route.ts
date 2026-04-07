import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "کۆدی GROQ_API_KEY لە Vercel دانەنراوە" }, { status: 400 });

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const language = formData.get("language") as "latin" | "sorani" | null;

    if (!videoFile) return NextResponse.json({ error: "هیچ ڤیدیۆیەک نەگەیشتە سێرڤەر" }, { status: 400 });
    if (!language) return NextResponse.json({ error: "هیچ زمانێک هەڵنەبژێردراوە" }, { status: 400 });

    // هەنگاوی 1: گوێگرتن لە ڤیدیۆکە
    const whisperData = new FormData();
    whisperData.append("file", videoFile);
    whisperData.append("model", "whisper-large-v3");

    const res1 = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperData,
    });

    const json1 = await res1.json();
    if (!res1.ok) {
      return NextResponse.json({ error: `هەڵە لە بیستنی دەنگ: ${json1.error?.message || "نەزانراو"}` }, { status: 400 });
    }

    const rawText = json1.text;
    if (!rawText) return NextResponse.json({ error: "ڤیدیۆکە هیچ دەنگێکی تێدا نەبوو" }, { status: 400 });

    // هەنگاوی 2: دروستکردنی داواکاری زیرەک بەپێی زمانی هەڵبژێردراو
    let prompt;
    if (language === 'sorani') {
      prompt = `تۆ پسپۆڕی دروستکردنی ژێرنووسی کوردی سۆرانیت. ئەم دەقەی خوارەوە کە لە ڤیدیۆیەک وەرگیراوە، بکە بە ژێرنووسێکی پڕۆفیشناڵ:
"${rawText}"

یاساکانی ژێرنووس:
1.  **زمان**: بە تەواوی بە **کوردی سۆرانی (ئەلفبێی عەرەبی)** بینووسە.
2.  **ناسینی ئەکتەر**: ناوی قسەکەرەکە بنووسە. نموونە: سارە: سڵاو، چۆنی؟
3.  **کاریگەری دەنگ**: لەنێوان دوو کەوانەدا بنووسە. نموونە: (مۆسیقایەکی ئارام)
4.  **پاک و خاوێنی**: تەنها ژێرنووسەکە بنووسە. هیچ ڕوونکردنەوەیەک مەکە.`;
    } else { // زمانی لاتینی
      prompt = `You are an expert Kurdish subtitle creator. Transcribe the following raw text into professional subtitles:
"${rawText}"

Rules:
1.  **Language**: Write everything in **Kurdish Sorani using Latin letters only**.
2.  **Speaker Identification**: Identify speakers. Example: Sartip: Slaw, choni?
3.  **Sound Effects**: Describe sounds in parentheses. Example: (muzikeki aram)
4.  **Clean Output**: Provide ONLY the subtitle text. No extra explanations.`;
    }

    const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // ============== گۆڕانکارییەکە لێرەدایە ================
        // بەکارهێنانی هەمان مۆدێلی خێرا و سەقامگیری تیلیگرام بۆتەکەت
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }]
      }),
    });

    const json2 = await res2.json();
    if (!res2.ok) {
      return NextResponse.json({ error: `هەڵە لە نووسینەوە: ${json2.error?.message || "نەزانراو"}` }, { status: 400 });
    }

    return NextResponse.json({ reply: json2.choices[0].message.content.trim() });

  } catch (err: any) {
    return NextResponse.json({ error: `هەڵەی گشتی: ${err.message}` }, { status: 500 });
  }
      }
