"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Copy, Check, Zap, ChevronRight, Sparkles } from "lucide-react";

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
    const m = trimmed.match(/^([^:(]{1,30}):\s*(.+)/);
    if (m) {
      return { type: "dialogue", speaker: m[1].trim(), text: m[2].trim() };
    }
    return { type: "sound", text: trimmed };
  });
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [raw, setRaw] = useState<string | null>(null);
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [copied, setCopied] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) return;
    setVideoFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setRaw(null);
    setLines([]);
    setError(null);
  }, []);

  const submit = async () => {
    if (!videoFile) return;
    setLoading(true);
    setProgress(0);
    setError(null);

    const ticker = setInterval(() => {
      setProgress(p => p >= 88 ? 88 : p + Math.random() * 5);
    }, 600);

    try {
      const fd = new FormData();
      fd.append("video", videoFile);

      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = await res.json();

      clearInterval(ticker);
      setProgress(100);

      if (json.error) throw new Error(json.error);
      const text = json.reply || "";
      setRaw(text);
      setLines(parseSubtitles(text));
    } catch (e) {
      clearInterval(ticker);
      setProgress(0);
      setError(e instanceof Error ? e.message : "کێشەیەک روویدا");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!raw) return;
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setRaw(null);
    setLines([]);
    setError(null);
    setProgress(0);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:'Sora',-apple-system,sans-serif}
        html,body{margin:0;padding:0;background:#0c0c12;color:#ede8df;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px}

        .card{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08);border-radius:24px}
        .card-gold{background:rgba(201,168,76,.07);border:1px solid rgba(201,168,76,.2);border-radius:24px}

        .gold-text{background:linear-gradient(90deg,#7a5e1e,#f0d98a,#c9a84c,#f0d98a,#7a5e1e);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shine 5s linear infinite}
        @keyframes shine{to{background-position:200% center}}

        .btn-gold{background:linear-gradient(135deg,#7a5e1e,#c9a84c,#f0d98a,#c9a84c,#7a5e1e);background-size:250% 100%;animation:shine 4s linear infinite;color:#0a0800;font-weight:700;border:none;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 20px rgba(201,168,76,.3)}
        .btn-gold:active{transform:scale(.96)}
        .btn-ghost{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(237,232,223,.5);cursor:pointer;transition:background .2s}
        .btn-ghost:active{background:rgba(255,255,255,.08)}

        .drop-zone{border:1.5px dashed rgba(201,168,76,.3);border-radius:24px;background:rgba(201,168,76,.04);cursor:pointer;transition:all .2s}
        .drop-zone.over{border-color:rgba(201,168,76,.7);background:rgba(201,168,76,.1)}

        .progress-bg{background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden;height:5px}
        .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#7a5e1e,#f0d98a,#7a5e1e);background-size:200% 100%;animation:shine 2s linear infinite;transition:width .4s ease}

        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.4)}50%{box-shadow:0 0 0 10px rgba(201,168,76,0)}}

        .animate-up{animation:slideUp .4s ease-out both}
        .animate-fade{animation:fadeIn .4s ease-out both}
        .logo-pulse{animation:pulse 3s ease-in-out infinite}
        .spin{animation:spin 3s linear infinite}

        .line-action{color:rgba(201,168,76,.65);font-style:italic;font-size:12px}
        .line-speaker{color:#f0d98a;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
        .line-text{color:#ede8df;font-size:14px;line-height:1.6;direction:ltr}
        .line-sound{color:rgba(237,232,223,.25);font-size:11px;letter-spacing:.1em;text-transform:uppercase}

        .orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}
      `}</style>

      <div className="orb" style={{width:500,height:500,top:-100,right:-120,background:"radial-gradient(circle,rgba(201,168,76,.15),transparent 65%)"}}/>
      <div className="orb" style={{width:380,height:380,bottom:0,left:-100,background:"radial-gradient(circle,rgba(60,80,200,.1),transparent 65%)"}}/>

      <div style={{position:"relative",zIndex:1,minHeight:"100dvh",display:"flex",flexDirection:"column",maxWidth:520,margin:"0 auto",padding:"0 18px"}}>
        <header style={{paddingTop:56,paddingBottom:28}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div className="logo-pulse" style={{width:56,height:56,borderRadius:18,background:"linear-gradient(145deg,#1c1508,#2e2010)",border:"1px solid rgba(201,168,76,.45)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
              <Zap size={22} color="#f0d98a"/>
            </div>
            <div>
              <h1 className="gold-text" style={{fontSize:28,fontWeight:700,margin:0,letterSpacing:"-.02em"}}>AI JACK</h1>
              <p style={{fontSize:11,margin:"4px 0 0",letterSpacing:".18em",textTransform:"uppercase",color:"rgba(237,232,223,.35)"}}>Kurdish Subtitle Engine</p>
            </div>
          </div>
          <p style={{marginTop:16,fontSize:13,lineHeight:1.7,color:"rgba(237,232,223,.45)"}}>
            ڤیدیۆت بنێرە — AI JACK ژێرنووسی کوردی سۆرانی بە لاتینی بۆ دروست دەکات
          </p>
        </header>

        {!videoUrl ? (
          <div
            className={`drop-zone animate-up`}
            style={{padding:"40px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}
            onClick={()=>fileRef.current?.click()}
            onDragOver={e=>{e.preventDefault();setDrag(true)}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)pick(f)}}
          >
            <div style={{width:72,height:72,borderRadius:22,background:"rgba(201,168,76,.1)",border:"1.5px dashed rgba(201,168,76,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Upload size={28} color="rgba(201,168,76,.8)"/>
            </div>
            <div style={{textAlign:"center"}}>
              <p style={{margin:0,fontWeight:600,fontSize:16,color:"#ede8df"}}>ڤیدیۆیەک هەڵبژێرە</p>
              <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(237,232,223,.4)"}}>یان ئێرە دابنێ</p>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
              {["MP4","MOV","AVI","MKV"].map(f=>(
                <span key={f} style={{padding:"4px 12px",borderRadius:99,background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.2)",color:"rgba(201,168,76,.8)",fontSize:11,fontWeight:500}}>{f}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-up" style={{position:"relative",borderRadius:24,overflow:"hidden",border:"1px solid rgba(255,255,255,.08)"}}>
            <video src={videoUrl} style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}} controls playsInline/>
            <button onClick={reset} style={{position:"absolute",top:10,right:10,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,.6)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="video/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)pick(f)}}/>

        {videoFile && !loading && !raw && (
          <button className="btn-gold animate-up" onClick={submit} style={{marginTop:16,width:"100%",padding:"17px 24px",borderRadius:22,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <Sparkles size={18}/>
            ژێرنووسی کوردی دروست بکە
            <ChevronRight size={16}/>
          </button>
        )}

        {error && (
          <div className="animate-up" style={{marginTop:16,padding:"16px 20px",borderRadius:20,background:"rgba(255,80,80,.08)",border:"1px solid rgba(255,80,80,.2)"}}>
            <p style={{margin:0,fontSize:13,color:"rgba(255,120,120,.9)",lineHeight:1.6}}>{error}</p>
            <button className="btn-gold" onClick={submit} style={{marginTop:12,padding:"10px 20px",borderRadius:14,fontSize:13}}>دووبارە هەوڵ بدە</button>
          </div>
        )}

        {loading && (
          <div className="card animate-fade" style={{marginTop:16,padding:"24px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
              <div className="spin" style={{width:42,height:42,borderRadius:14,background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Zap size={18} color="#f0d98a"/>
              </div>
              <div>
                <p style={{margin:0,fontWeight:600,fontSize:14,color:"#ede8df"}}>AI JACK کار دەکات...</p>
                <p style={{margin:"3px 0 0",fontSize:11,color:"rgba(237,232,223,.4)"}}>شیکاری دەنگ · ناسینی ئەکتەر · وەرگێڕان</p>
              </div>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{width:`${progress}%`}}/>
            </div>
            <p style={{margin:"8px 0 0",fontSize:11,color:"rgba(201,168,76,.7)",textAlign:"right"}}>{Math.round(progress)}%</p>
          </div>
        )}

        {raw && lines.length > 0 && (
          <div className="animate-up" style={{marginTop:16,display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 2px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#c9a84c",boxShadow:"0 0 8px rgba(201,168,76,.5)"}}/>
                <span style={{fontSize:13,fontWeight:600,color:"rgba(237,232,223,.6)"}}>ژێرنووسی کوردی</span>
              </div>
              <button
                onClick={copy}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:12,fontSize:12,fontWeight:600,background:copied?"rgba(48,209,88,.1)":"rgba(201,168,76,.1)",border:`1px solid ${copied?"rgba(48,209,88,.3)":"rgba(201,168,76,.25)"}`,color:copied?"#30d158":"#e8c97a",cursor:"pointer"}}
              >
                {copied ? <Check size={13}/> : <Copy size={13}/>}
                {copied ? "کۆپی کرا ✓" : "کۆپی بکە"}
              </button>
            </div>

            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"4px"}}>
                {lines.map((ln, i) => (
                  <div key={i} style={{padding:"12px 16px",borderRadius:18,marginBottom:2,background:i%2===0?"rgba(255,255,255,.02)":"transparent",animation:`slideUp .3s ease-out ${i*.04}s both`}}>
                    {ln.type==="action" && <p className="line-action" style={{margin:0}}>({ln.text})</p>}
                    {ln.type==="dialogue" && (
                      <div>
                        {ln.speaker && <p className="line-speaker" style={{margin:0}}>{ln.speaker}</p>}
                        <p className="line-text" style={{margin:0}}>{ln.text}</p>
                      </div>
                    )}
                    {ln.type==="sound" && <p className="line-sound" style={{margin:0}}>♪ {ln.text}</p>}
                  </div>
                ))}
              </div>
            </div>

            <details style={{cursor:"pointer"}}>
              <summary style={{fontSize:12,color:"rgba(237,232,223,.3)",padding:"8px 4px",listStyle:"none",display:"flex",alignItems:"center",gap:6}}>
                <ChevronRight size={12}/> دەقی خام
              </summary>
              <pre style={{margin:"8px 0 0",padding:"16px",borderRadius:18,background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.06)",fontSize:11,color:"rgba(237,232,223,.4)",whiteSpace:"pre-wrap",direction:"ltr",fontFamily:"monospace",overflow:"auto"}}>{raw}</pre>
            </details>

            <button className="btn-ghost" onClick={reset} style={{width:"100%",padding:"14px",borderRadius:20,fontSize:13}}>
              ← ڤیدیۆی تر ئەبار بکە
            </button>
          </div>
        )}

        {!videoFile && !raw && (
          <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:10,letterSpacing:".2em",textTransform:"uppercase",textAlign:"center",color:"rgba(237,232,223,.2)",marginBottom:6}}>تایبەتمەندیەکان</p>
            {[
              {icon:"🎬",title:"ناسینی ئەکتەر",desc:"دانە دانە ناوی ئەکتەرەکان دەنووسێت",d:".3s"},
              {icon:"🎵",title:"کاریگەری دەنگ",desc:"میوزیک و کاریگەری دەنگی ڤیدیۆ",d:".4s"},
              {icon:"📝",title:"سۆرانی لاتین",desc:"وەک: Slaw chony, chawt habu?",d:".5s"},
            ].map((f,i)=>(
              <div key={i} className="card" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",animation:`slideUp .4s ease-out ${f.d} both`}}>
                <div style={{width:44,height:44,borderRadius:14,background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{f.icon}</div>
                <div>
                  <p style={{margin:0,fontSize:13,fontWeight:600,color:"#ede8df"}}>{f.title}</p>
                  <p style={{margin:"3px 0 0",fontSize:11,color:"rgba(237,232,223,.4)"}}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer style={{marginTop:"auto",paddingTop:32,paddingBottom:28,textAlign:"center"}}>
          <p style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:"rgba(237,232,223,.12)",margin:0}}>AI JACK — Kurdish Subtitle Engine</p>
        </footer>
      </div>
    </>
  );
      }
