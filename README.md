# 🤖 هۆشی دەستکرد - چاتبۆتی کوردی

وێبسایتێکی چاتی هۆشمەند بە شێوازی iOS، بنیاتنراو بە Next.js و Gemini AI.

---

## ⚡ هەنگاوەکان بۆ بڵاوکردنەوە لە Vercel

### هەنگاوی ١: GitHub

1. بڕۆ [github.com](https://github.com) و هەژمار دروست بکە ئەگەر نەتە
2. کلیک لە `+` بکە → `New repository`
3. ناوی `my-ios-app` بنووسە
4. کلیک لە `Create repository` بکە
5. هەموو فایلەکانی ئەم ZIP ئەپلۆد بکە (بە `uploading an existing file`)

### هەنگاوی ٢: Vercel

1. بڕۆ [vercel.com](https://vercel.com)
2. بە هەژماری GitHub بچۆ ژوورەوە (`Continue with GitHub`)
3. کلیک لە `Add New Project` بکە
4. پرۆژەی `my-ios-app` هەڵبژێرە
5. **⚠️ پێش Deploy کردن:** بڕۆ بۆ `Environment Variables`:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `کۆدی API ی Gemini ەکەت لێرە بنووسە`
   - کلیک لە `Add` بکە
6. کلیک لە `Deploy` بکە
7. چاوەڕێ بکە تا تەواو ببێت (~2 خولەک)

---

## 🔑 چۆنی بدەستبهێنی API Key ی Gemini

1. بڕۆ [aistudio.google.com](https://aistudio.google.com)
2. کلیک لە `Get API Key` بکە
3. `Create API Key` → API کۆپی بکە
4. ئەم کۆدە لە Vercel لە `Environment Variables` دابنێ

---

## 🛡️ ئاگادارییەکی گرنگ سەبارەت بە ئاسایش

- **هەرگیز** API Key ەکەت لە GitHub نەخەرەوە
- `.env.local` فایلەکە بە خۆی لە `.gitignore` دایە، ئاسایشیت هەیە
- تەنها لە Vercel Environment Variables دابنێ

---

## 💻 کارکردن لە کۆمپیوتەرەکەت (Optional)

```bash
# داگرتنی پاکێجەکان
npm install

# کۆپی کردن و دانانی API Key
cp .env.local.example .env.local
# دواتر .env.local کرایەوە و API Key ەکەت دابنێ

# کارکردن
npm run dev
# بڕۆ: http://localhost:3000
```

---

بە مۆبایل: پێویستت بە ئەمانە نییە، تەنها Vercel بەکاربهێنە! 🚀
