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
    if (!rawText || rawText.trim() === "") {
      return NextResponse.json({ error: "ڤیدیۆکە هیچ دەنگ و قسەیەکی تێدا نەبوو" }, { status: 400 });
    }

    // فەرمانە زیرەکەکەی پێشترمان هەر بەکاردێنینەوە
    const systemPrompt = `You are AI JACK, a world-class Kurdish subtitling expert. Follow the rules with extreme precision.`;
    
    let userPrompt;
    if (language === 'sorani') {
      userPrompt = `Transcribe the following text into professional Kurdish Sorani subtitles using Arabic script.
Raw Text: "${rawText}"
**STRICT RULES:**
1.  **Output Language:** ONLY Kurdish Sorani with Arabic script (e.g., "سڵاو، چۆنی؟").
2.  **Speaker Identification:** Identify speakers clearly. Example: سارە: ئەمە نموونەیەکە.
3.  **Sound Effects:** Enclose non-dialogue sounds in parentheses. Example: (مۆسیقایەکی ئارام).
4.  **NO EXTRA TEXT:** Your entire output must be ONLY the formatted subtitle. Do not add any greetings or explanations.
Final Subtitle Output:`;
    } else { // زمانی لاتینی
      userPrompt = `Transcribe the following text into professional Kurdish Sorani subtitles using ONLY Latin letters.
Raw Text: "${rawText}"
**STRICT RULES:**
1.  **Output Language:** ONLY Kurdish Sorani with Latin letters (e.g., "Slaw, choni?").
2.  **Speaker Identification:** Identify speakers clearly. Example: Sara: Eme nmuneyeke.
3.  **Sound Effects:** Enclose non-dialogue sounds in parentheses. Example: (muzikeki aram).
4.  **NO EXTRA TEXT:** Your entire output must be ONLY the formatted subtitle. No extra explanations.
Final Subtitle Output:`;
    }

    const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // ============== گۆڕانکاری کۆتایی لێرەدایە ================
        // بەکارهێنانی بەهێزترین مۆدێلی بەردەست و سەقامگیر
        model: "llama3-70b-8192", 
        temperature: 0.2,
        messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": userPrompt }
        ]
      }),
    });

    const json2 = await res2.json();
    if (!res2.ok) {
      return NextResponse.json({ error: `هەڵە لە مێشکی زیرەک: ${json2.error?.message || "نەزانراو"}` }, { status: 400 });
    }

    return NextResponse.json({ reply: json2.choices[0].message.content.trim() });

  } catch (err: any) {
    return NextResponse.json({ error: `هەڵەی گشتی لە سێرڤەر: ${err.message}` }, { status: 500 });
  }
}
