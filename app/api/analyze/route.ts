import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generativeai";
import { GoogleAIFileManager } from "@google/generativeai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

// ڕێگەپێدانی کاتی زیاتر بە Vercel تا ڤیدیۆکە تەواو دەبێت
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file found" }, { status: 400 });
    }

    // هێنانی API Key لە Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    // پاشەکەوتکردنی ڤیدیۆکە بە شێوەیەکی کاتی لەناو سێرڤەر (Vercel /tmp)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(os.tmpdir(), file.name);
    await writeFile(tempFilePath, buffer);

    // بەرزکردنەوەی بۆ جێمینای
    const uploadResponse = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.type,
      displayName: file.name,
    });

    // سڕینەوەی ڤیدیۆکە لە سێرڤەرەکەی خۆت بۆ پاککردنەوەی شوێن
    await unlink(tempFilePath);

    // چاوەڕێکردن تا گوگڵ ڤیدیۆکە پرۆسێس دەکات
    let fileState = await fileManager.getFile(uploadResponse.file.name);
    while (fileState.state === "PROCESSING") {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      fileState = await fileManager.getFile(uploadResponse.file.name);
    }

    if (fileState.state === "FAILED") {
      return NextResponse.json({ success: false, error: "Video processing failed on Google servers." }, { status: 500 });
    }

    const prompt = `
    تکایە سەیری ئەم ڤیدیۆیە بکە و بە زمانی کوردی (سۆرانی) وەسفێکی زۆر وردی بکە.
    ڕێک بەم شێوازەی خوارەوە کار بکە:
    - ناوی کەسایەتییەکان بنووسە و قسەکانیان وشە بە وشە وەربگێڕە.
    - هەستی ناو دەنگەکان (وەک: بە توڕەیی، بە هێمنی، بە هاوارەوە) لەناو کەوانەدا بنووسە پێش قسەکانیان.
    - دەنگەکانی دەوروبەر و کاریگەرییە دەنگییەکان (وەک لێدانی شمشێر، تەقینەوە، هەنگاو، گڕگرتن) لەناو کەوانەدا و بە تۆخ (Bold) وەسف بکە.
    - گۆڕانکاری لە میوزیکدا وەسف بکە.
    هیچ پێشەکی و کۆتاییەکی زیادە مەنووسە، تەنها سیناریۆکە وەک دەقێکی فیلم بنووسە.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      },
      { text: prompt },
    ]);

    // سڕینەوەی ڤیدیۆکە لە گوگڵ بۆ پاراستنی تایبەتمەندی
    await fileManager.deleteFile(uploadResponse.file.name);

    return NextResponse.json({ success: true, text: result.response.text() });

  } catch (error) {
    console.error("Error analyzing video:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
      }
