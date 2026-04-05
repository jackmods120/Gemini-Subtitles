"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const[loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.text);
      } else {
        setResult("❌ کێشەیەک ڕوویدا لە کاتی شیکردنەوەی ڤیدیۆکە.");
      }
    } catch (error) {
      setResult("❌ پەیوەندی لەگەڵ سێرڤەر پچڕا.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] text-black font-sans flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </motion.div>
          <motion.h1 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-bold tracking-tight mb-2">
            شیکارکەری ڤیدیۆی زیرەک
          </motion.h1>
          <motion.p initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-500">
            ڤیدیۆکەت دابنێ و با ژیری دەستکرد بیکات بە دەقێکی ورد
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/50">
          
          {/* Upload Area */}
          <div className="relative group">
            <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className={`border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center transition-all duration-300 ${file ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 group-hover:border-blue-400 group-hover:bg-gray-50/50'}`}>
              {file ? (
                <>
                  <FileVideo className="w-12 h-12 text-blue-500 mb-4" />
                  <p className="text-blue-600 font-medium text-center truncate w-full px-4">{file.name}</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-4 group-hover:text-blue-500 transition-colors" />
                  <p className="text-gray-600 font-medium">پەنجە لێرە بدە بۆ هەڵبژاردنی ڤیدیۆ</p>
                  <p className="text-gray-400 text-sm mt-2">MP4, MOV</p>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button onClick={handleUpload} disabled={!file || loading} className={`mt-6 w-full py-4 rounded-full font-semibold text-lg flex items-center justify-center transition-all duration-300 shadow-[0_8px_20px_rgb(59,130,246,0.3)] ${!file || loading ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98]'}`}>
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin ml-2" />
                خەریکی شیکردنەوەیە...
              </>
            ) : (
              "شیکردنەوەی ڤیدیۆ"
            )}
          </button>
        </motion.div>

        {/* Result Area */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="mt-8 bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                ئەنجامی شیکردنەوە
              </h3>
              <div className="p-4 bg-[#F2F2F7] rounded-2xl text-gray-800 leading-relaxed whitespace-pre-wrap text-right font-medium">
                {result}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
