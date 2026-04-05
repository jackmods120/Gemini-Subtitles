"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Sparkles, Copy, Check, Film, Zap, ChevronRight } from "lucide-react";

interface SubtitleResult {
  raw: string;
  lines: SubtitleLine[];
}

interface SubtitleLine {
  type: "action" | "dialogue" | "sound";
  speaker?: string;
  text: string;
}

function parseSubtitles(raw: string): SubtitleLine[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      return { type: "action", text: trimmed.slice(1, -1) };
    }
    const dialogMatch = trimmed.match(/^([^:(]+):\s*(\(.*?\))?\s*(.+)/);
    if (dialogMatch) {
      return {
        type: "dialogue",
        speaker: dialogMatch[1].trim(),
        text: ((dialogMatch[2] || "") + " " + dialogMatch[3]).trim(),
      };
    }
    return { type: "sound", text: trimmed };
  });
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SubtitleResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    setVideoFile(file);
    setResult(null);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const processVideo = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(interval); return 85; }
        return p + Math.random() * 6;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) throw new Error("Processing failed");
      const data = await response.json();
      const raw = data.reply || "";
      setResult({ raw, lines: parseSubtitles(raw) });
    } catch {
      clearInterval(interval);
      setProgress(0);
      setResult({
        raw: "کێشەیەک روویدا. تکایە دووبارە هەوڵ بدەرەوە.",
        lines: [{ type: "sound", text: "کێشەیەک روویدا. تکایە دووبارە هەوڵ بدەرەوە." }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        :root {
          --bg: #09090f;
          --card: rgba(255,255,255,0.038);
          --card-hover: rgba(255,255,255,0.06);
          --border: rgba(255,255,255,0.07);
          --border-lit: rgba(191,161,90,0.35);
          --gold: #C9A84C;
          --gold-light: #F0D98A;
          --gold-dim: rgba(201,168,76,0.12);
          --gold-glow: rgba(201,168,76,0.25);
          --text: #EDE8DF;
          --muted: rgba(237,232,223,0.4);
          --green: #30D158;
        }
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        html, body {
          margin: 0; padding: 0;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-thumb { background: var(--border-lit); border-radius: 2px; }

        .glass {
          background: var(--card);
          backdrop-filter: blur(28px) saturate(1.6);
          -webkit-backdrop-filter: blur(28px) saturate(1.6);
          border: 1px solid var(--border);
        }
        .gold-border { border-color: var(--border-lit) !important; }

        @keyframes orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.1); }
          66% { transform: translate(-20px,15px) scale(0.95); }
        }
        @keyframes logo-pulse {
          0%,100% { box-shadow: 0 0 0 0 var(--gold-glow), 0 8px 32px rgba(0,0,0,0.6); }
          50% { box-shadow: 0 0 0 12px transparent, 0 8px 40px rgba(0,0,0,0.7); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        @keyframes progress-glow {
          0%,100% { box-shadow: 0 0 8px var(--gold-glow); }
          50% { box-shadow: 0 0 20px var(--gold-glow), 0 0 40px rgba(201,168,76,0.15); }
        }

        .logo-icon {
          animation: logo-pulse 3s ease-in-out infinite;
        }
        .gold-btn {
          background: linear-gradient(135deg, #9A7B2E, #C9A84C, #F0D98A, #C9A84C, #9A7B2E);
          background-size: 300% 100%;
          animation: shimmer 4s linear infinite;
          color: #0a0906;
          font-weight: 700;
          border: none;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(201,168,76,0.3), 0 1px 0 rgba(255,255,255,0.15) inset;
        }
        .gold-btn:active { transform: scale(0.97); }
        .gold-btn:disabled { opacity: 0.4; animation: none; }

        .gold-text {
          background: linear-gradient(90deg, #9A7B2E, #F0D98A, #C9A84C, #F0D98A, #9A7B2E);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        .progress-track {
          background: rgba(255,255,255,0.05);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-fill {
          background: linear-gradient(90deg, #9A7B2E, #F0D98A, #9A7B2E);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite, progress-glow 2s ease-in-out infinite;
          border-radius: 99px;
          transition: width 0.4s ease;
        }

        .subtitle-line { animation: slide-up 0.35s ease-out both; }
        .feature-pill { animation: slide-up 0.5s ease-out both; }
        .result-block { animation: slide-up 0.45s ease-out; }
        
        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0;
          animation: orb-drift 18s ease-in-out infinite;
        }

        .drag-over { border-color: var(--border-lit) !important; background: var(--gold-dim) !important; }
        
        .tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 99px;
          background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.2);
          color: var(--gold); font-size: 11px; font-weight: 500;
          letter-spacing: 0.04em;
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="orb" style={{ width: 500, height: 500, top: -100, right: -150, background: "radial-gradient(circle, rgba(201,168,76,0.18), transparent 70%)", animationDuration: "20s" }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: 50, left: -150, background: "radial-gradient(circle, rgba(80,100,200,0.12), transparent 70%)", animationDuration: "25s", animationDelay: "-8s" }} />

      <div className="relative z-10 min-h-[100dvh] flex flex-col max-w-lg mx-auto px-5">

        {/* ── HEADER ── */}
        <header className="pt-16 pb-7">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div
              className="logo-icon w-[58px] h-[58px] rounded-[18px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1c1508, #2e2010)",
                border: "1px solid rgba(201,168,76,0.5)",
              }}
            >
              <div className="absolute inset-0" style={{
                background: "linear-gradient(145deg, rgba(201,168,76,0.15) 0%, transparent 60%)"
              }} />
              <Zap size={24} style={{ color: "#F0D98A", position: "relative", zIndex: 1 }} />
            </div>

            <div>
              <h1 className="text-[26px] font-bold leading-none gold-text tracking-tight">
                AI JACK
              </h1>
              <p className="text-[11px] mt-1.5 tracking-[0.18em] uppercase" style={{ color: "var(--muted)" }}>
                Kurdish Subtitle Engine
              </p>
            </div>
          </div>

          <p className="mt-5 text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
            ڤیدیۆت ناردەوە، AI JACK ژێرنووسی کوردی سۆرانی بە لاتینی بۆ دروست دەکات.
          </p>
        </header>

        {/* ── UPLOAD ── */}
        <div
          className={`glass rounded-[28px] overflow-hidden transition-all duration-300 ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {videoPreview ? (
            <div className="relative">
              <video
                src={videoPreview}
                className="w-full"
                style={{ maxHeight: 210, objectFit: "cover", display: "block" }}
                controls playsInline
              />
              <button
                onClick={() => { setVideoFile(null); setVideoPreview(null); setResult(null); }}
                className="glass absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white text-xl font-light"
              >×</button>
              <div className="glass absolute bottom-3 left-3 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Film size={11} style={{ color: "var(--gold)" }} />
                <span className="text-[11px] text-white/60 max-w-[160px] truncate">{videoFile?.name}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-9 flex flex-col items-center gap-5 active:scale-[0.98] transition-transform"
            >
              <div
                className="w-[70px] h-[70px] rounded-[22px] flex items-center justify-center"
                style={{
                  background: "var(--gold-dim)",
                  border: "1.5px dashed rgba(201,168,76,0.45)"
                }}
              >
                <Upload size={26} style={{ color: "var(--gold)" }} />
              </div>
              <div className="text-center space-y-1.5">
                <p className="font-semibold text-[15px]" style={{ color: "var(--text)" }}>
                  ڤیدیۆیەک هەڵبژێرە
                </p>
                <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                  یان ئێرە دابنێ
                </p>
              </div>
              <div className="flex gap-2">
                {["MP4", "MOV", "AVI", "MKV"].map((f) => (
                  <span key={f} className="tag">{f}</span>
                ))}
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* ── PROCESS BUTTON ── */}
        {videoFile && !isProcessing && !result && (
          <button
            onClick={processVideo}
            className="gold-btn mt-4 w-full py-[17px] rounded-[22px] flex items-center justify-center gap-3 text-[15px]"
            style={{ animation: "slide-up 0.3s ease-out" }}
          >
            <Sparkles size={18} />
            ژێرنووسی کوردی دروست بکە
            <ChevronRight size={16} />
          </button>
        )}

        {/* ── PROCESSING ── */}
        {isProcessing && (
          <div className="glass gold-border mt-4 rounded-[28px] p-6 space-y-5" style={{ animation: "fade-in 0.3s ease-out" }}>
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--gold-dim)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  animation: "spin-slow 4s linear infinite"
                }}
              >
                <Zap size={18} style={{ color: "var(--gold-light)" }} />
              </div>
              <div>
                <p className="font-semibold text-[14px]">AI JACK کار دەکات...</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                  شیکاری دەنگ · ناسینی ئەکتەر · وەرگێڕان
                </p>
              </div>
            </div>
            <div>
              <div className="progress-track h-[5px]">
                <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--muted)" }}>
                <span>ئامادەکاری...</span>
                <span style={{ color: "var(--gold)" }}>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div className="result-block mt-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--gold)", boxShadow: "0 0 6px var(--gold-glow)" }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--muted)" }}>
                  ژێرنووسی کوردی
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
                style={{
                  background: copied ? "rgba(48,209,88,0.1)" : "var(--gold-dim)",
                  border: `1px solid ${copied ? "rgba(48,209,88,0.3)" : "rgba(201,168,76,0.25)"}`,
                  color: copied ? "var(--green)" : "var(--gold)",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "کۆپی کرا ✓" : "کۆپی بکە"}
              </button>
            </div>

            {/* Lines */}
            <div
              className="glass rounded-[28px] overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {result.lines.map((line, i) => (
                  <div
                    key={i}
                    className="subtitle-line px-5 py-4"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {line.type === "action" && (
                      <p style={{ color: "rgba(201,168,76,0.6)", fontStyle: "italic", fontSize: 12 }}>
                        ({line.text})
                      </p>
                    )}
                    {line.type === "dialogue" && (
                      <div>
                        {line.speaker && (
                          <p style={{ color: "var(--gold-light)", fontSize: 11, fontWeight: 600, marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            {line.speaker}
                          </p>
                        )}
                        <p style={{ color: "var(--text)", fontSize: 14, direction: "ltr", lineHeight: 1.6 }}>
                          {line.text}
                        </p>
                      </div>
                    )}
                    {line.type === "sound" && (
                      <p style={{ color: "rgba(237,232,223,0.3)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        ♪ {line.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setResult(null); setVideoFile(null); setVideoPreview(null); }}
              className="w-full py-4 rounded-[22px] text-[13px] font-medium transition-all active:scale-98 glass"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              ← ڤیدیۆی تر ئەبار بکە
            </button>
          </div>
        )}

        {/* ── FEATURES (idle) ── */}
        {!videoFile && !result && (
          <div className="mt-7 space-y-3" style={{ animation: "fade-in 0.6s ease-out 0.2s both" }}>
            <p className="text-[10px] tracking-[0.2em] uppercase text-center mb-4" style={{ color: "rgba(237,232,223,0.25)" }}>
              تایبەتمەندیەکان
            </p>
            {[
              { icon: "🎬", title: "ناسینی ئەکتەر", desc: "دانە دانە ناوی ئەکتەرەکان دەنووسێت", delay: "0.3s" },
              { icon: "🎵", title: "کاریگەری دەنگ", desc: "دەنگی میوزیک و کاریگەریەکان دەناسێت", delay: "0.4s" },
              { icon: "📝", title: "سۆرانی لاتین", desc: "بە لاتینی وەک Slaw chony دەنووسێت", delay: "0.5s" },
            ].map((f, i) => (
              <div
                key={i}
                className="feature-pill glass flex items-center gap-4 p-4 rounded-[22px]"
                style={{ animationDelay: f.delay }}
              >
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.15)" }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{f.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto py-8 text-center">
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(237,232,223,0.15)", textTransform: "uppercase" }}>
            AI JACK — Kurdish Subtitle Engine
          </p>
        </footer>
      </div>
    </>
  );
}
