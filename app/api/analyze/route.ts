import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "هیچ فایلێک نەدۆزرایەوە" }, { status: 400 });
    }

    const groqData = new FormData();
    groqData.append("file", file);
    groqData.append("model", "whisper-large-v3");

    // ناردنی بۆ سێرڤەری Groq
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "کێشەیەک لە سێرڤەری زیرەکی دەستکرد ڕوویدا" },
        { status: response.status }
      );
    }

    return NextResponse.json({ text: data.text });
  } catch (error) {
    return NextResponse.json({ error: "کێشەیەک لە سێرڤەر ڕوویدا" }, { status: 500 });
  }
}
