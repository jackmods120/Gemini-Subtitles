import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: `GEMINI_API_KEY نەدراوە. لە Vercel → Settings → Environment Variables زیادی بکە.` },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return NextResponse.json({ error: "ڤیدیۆ نەدراوە" }, { status: 400 });
    }

    // Check file size
    if (videoFile.size > MAX_SIZE_BYTES) {
      const sizeMB = (videoFile.size / 1024 / 1024).toFixed(1);
      return NextResponse.json({
        error: `ڤیدیۆکە ${sizeMB}MB یە — زۆر گەورەیە. تکایە ڤیدیۆیەکی کەمتر لە ${MAX_SIZE_MB}MB بنێرە.`
      }, { status: 200 });
    }

    // Read as base64
    const bytes = await videoFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = videoFile.type || "video/mp4";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.2,
      },
    });

    const prompt = `ئەم ڤیدیۆیە گوێی لێ بگرە و هەموو دەنگەکانی بنووسەرەوە بەم شێوەیە:

شێوەکاری نووسین:

١. کاریگەری دەنگ و میوزیک:
(muzikeki aram dest pe dekat)
(dengey peyekan deit)

٢. قسەی ئەکتەر:
Sanji: (be dengeki himen) Choper, yek shit le bir me ke...
Zoro: (be hezan) Em shwene biyani niye...

٣. کاریگەری تایبەت:
(dengey jigerechishani)
(dengey lidan u behem hatinewe)

یاسا:
- هەموو دەق بە لاتین (هیچ عەرەبی/کوردی ئەڵفبا مەنووسە)
- ناوی ئەکتەر بە لاتین
- قسەکان وەک دەنگیان دەدەن بنووسە
- تەنها ژێرنووس، هیچ ڕوونکردنەوەی تر مەنووسە`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      { text: prompt },
    ]);

    const reply = result.response.text().trim();
    if (!reply) {
      return NextResponse.json({ error: "Gemini وەڵامی نەدا. دووبارە هەوڵ بدەرەوە." }, { status: 200 });
    }

    return NextResponse.json({ reply });

  } catch (err: unknown) {
    console.error("AI JACK route error:", err);

    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("API_KEY") || msg.includes("API key")) {
      return NextResponse.json({ error: "GEMINI_API_KEY غەلەطە یان بەسەر چووە. کۆدی نوێ دروست بکە." }, { status: 200 });
    }
    if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ error: "API quota تەواو بووە. کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدە." }, { status: 200 });
    }
    if (msg.includes("size") || msg.includes("large") || msg.includes("payload")) {
      return NextResponse.json({ error: `ڤیدیۆکە زۆر گەورەیە. تکایە ڤیدیۆیەکی کەمتر لە ${MAX_SIZE_MB}MB بنێرە.` }, { status: 200 });
    }

    return NextResponse.json({
      error: `کێشە: ${msg.slice(0, 120)}`
    }, { status: 200 });
  }
}
