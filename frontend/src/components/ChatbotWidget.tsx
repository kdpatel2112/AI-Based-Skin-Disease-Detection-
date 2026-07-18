import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../api/client";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  { label: "Accuracy & Trust", query: "How accurate is this app?" },
  { label: "What is Grad-CAM?", query: "What does the Grad-CAM heatmap show?" },
  { label: "Skincare Guidelines", query: "Daily skincare recommendations" },
  { label: "Diet & Food rules", query: "What foods should I eat or avoid?" },
  { label: "Warning & Danger signs", query: "When should I see a doctor?" },
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am your AI Skin Health assistant. 🌿\nHow can I help you understand your reports, skincare routines, or explainable AI metrics today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  async function handleSend(text: string) {
    if (!text.trim()) return;
    
    // Add user message
    const userMsg: Message = { sender: "user", text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post<{ reply: string }>("/chatbot/query", { message: text });
      const botMsg: Message = { sender: "bot", text: res.data.reply, timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        sender: "bot",
        text: "I am having trouble connecting to my knowledge base. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform focus:outline-none"
        style={{
          background: "linear-gradient(135deg, #C27A54, #A85C36)",
          boxShadow: "0 8px 30px rgba(168, 92, 54, 0.4)",
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-16 right-0 w-[90vw] sm:w-[380px] h-[500px] flex flex-col rounded-3xl overflow-hidden border border-skin-200 bg-white/95 shadow-2xl backdrop-blur-xl"
            style={{
              boxShadow: "0 24px 64px -12px rgba(168, 92, 54, 0.25)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 text-white flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #C27A54, #A85C36)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm leading-tight flex items-center gap-1.5">
                    Skin Health Chatbot <Sparkles size={12} className="text-amber-200 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-white/70">Educational FAQ Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Icon */}
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      m.sender === "user" ? "bg-skin-100 text-skin-700" : "bg-skin-500 text-white"
                    }`}
                  >
                    {m.sender === "user" ? <User size={12} /> : <Bot size={12} />}
                  </div>

                  {/* Text Bubble */}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs max-w-[75%] leading-relaxed whitespace-pre-line shadow-sm border ${
                      m.sender === "user"
                        ? "bg-skin-500 text-white border-skin-500 rounded-tr-none"
                        : "bg-skin-50/50 text-mocha border-skin-100 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5 flex-row">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center bg-skin-500 text-white shrink-0">
                    <Loader2 size={12} className="animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-skin-50/50 text-mocha/50 border border-skin-100 px-4 py-3 text-xs italic">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions Grid */}
            <div className="px-4 py-2 border-t border-skin-100 bg-skin-50/30">
              <p className="text-[10px] font-semibold text-mocha/40 uppercase tracking-wider mb-1.5">Suggested Questions</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q.query)}
                    className="whitespace-nowrap rounded-full border border-skin-200 bg-white px-3 py-1 text-[10px] font-medium text-skin-700 hover:border-skin-500 hover:bg-skin-50 transition-all shadow-sm"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 border-t border-skin-100 flex gap-2 items-center bg-white"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about skin metrics or recommendations..."
                className="flex-1 rounded-full border border-skin-200 bg-skin-50/50 px-4 py-2 text-xs focus:border-skin-500 focus:outline-none placeholder-mocha/40"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-full p-2 bg-skin-500 text-white disabled:bg-skin-200 hover:bg-skin-600 transition shadow"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
