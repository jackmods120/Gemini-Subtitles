"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, ChevronDown } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4 msg-ai">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center flex-shrink-0 shadow-md">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="glass-card rounded-[20px] rounded-bl-[6px] px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <div className="typing-dot w-2 h-2 rounded-full bg-[#8E8E93]" />
          <div className="typing-dot w-2 h-2 rounded-full bg-[#8E8E93]" />
          <div className="typing-dot w-2 h-2 rounded-full bg-[#8E8E93]" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const time = message.timestamp.toLocaleTimeString("ku", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse msg-user" : "msg-ai"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center flex-shrink-0 shadow-md">
          <Sparkles size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-[20px] shadow-sm ${
            isUser
              ? "bg-[#007AFF] text-white rounded-br-[6px]"
              : "glass-card text-[#1C1C1E] rounded-bl-[6px]"
          }`}
          style={{ lineHeight: "1.6", fontSize: "15px" }}
        >
          {message.content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-[#8E8E93] px-1">{time}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "سڵاو! 👋 من هۆشی دەستکردم. چۆنم دەکەیت؟ هەر پرسیارێکت هەبێت خۆشحاڵ دەبم وەڵامی بدەمەوە.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  const adjustTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "چاتەکە سڕایەوە. دوبارە سڵاو! 😊 چۆن دەتوانم یارمەتیت بدەم؟",
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "ببورە، کێشەیەک روویدا. دوبارە هەوڵ بدەرەوە.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "ببورە، کێشەیەک روویدا. پەیوەندی ئینتەرنێتەکەت بپشکنە و دوبارە هەوڵ بدەرەوە.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto relative">
      {/* Header */}
      <div
        className="safe-top flex-shrink-0 z-10"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[17px] text-[#1C1C1E]">هۆشی دەستکرد</h1>
              <p className="text-[12px] text-[#34C759] font-medium">● ئونلاینە</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(120,120,128,0.12)" }}
            title="سڕینەوەی چات"
          >
            <Trash2 size={16} className="text-[#8E8E93]" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-4"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 glass-card rounded-full px-4 py-2 flex items-center gap-1 text-[13px] text-[#007AFF] font-medium shadow-lg animate-scale-in z-10"
        >
          <ChevronDown size={14} />
          نوێترین
        </button>
      )}

      {/* Input area */}
      <div
        className="safe-bottom flex-shrink-0 px-4 py-3 z-10"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="flex items-end gap-2 rounded-[24px] px-4 py-2"
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="پەیامێک بنووسە..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1C1C1E] placeholder-[#8E8E93] py-1"
            style={{
              resize: "none",
              maxHeight: "120px",
              fontFamily: "inherit",
              direction: "rtl",
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: input.trim() && !isLoading ? "#007AFF" : "rgba(120,120,128,0.2)",
            }}
          >
            <Send
              size={15}
              className={input.trim() && !isLoading ? "text-white" : "text-[#8E8E93]"}
              style={{ transform: "rotate(180deg)" }}
            />
          </button>
        </div>
        <p className="text-center text-[11px] text-[#8E8E93] mt-2 opacity-60">
          Enter بکە بۆ ناردن · Shift+Enter بۆ هێڵێکی نوێ
        </p>
      </div>
    </div>
  );
}
