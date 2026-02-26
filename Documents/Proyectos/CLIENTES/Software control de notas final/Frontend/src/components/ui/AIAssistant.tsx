"use client";
import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Estimado docente, estoy a su disposición para asistirle en la planificación y gestión de sus actividades académicas. ¿En qué área requiere mi apoyo hoy?" },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post("/api/ai/chat", { message: userMessage });
      if (res.data.status) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, hubo un error al procesar tu mensaje." },
        ]);
      }
    } catch (error) {
      console.error("Error AI Chat:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "No puedo conectarme con el servicio de IA en este momento." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
            <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[500px] transition-colors duration-300"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Asistente AI</h3>
                  <span className="text-[10px] opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    En línea
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded-lg transition hover:cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-[#121212]/50"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {msg.role === "assistant" ? "Asistente" : "Tú"}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#2a2a2a] p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#121212] rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escribe tu consulta..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-30 transition-colors hover:cursor-pointer"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 text-center">
                Desarrollado con inteligencia artificial para apoyo docente.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-teal-600 to-teal-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-teal-500/20 transition-all hover:cursor-pointer relative group"
      >
        <div className="absolute inset-0 rounded-full bg-teal-400 opacity-0 group-hover:opacity-20 animate-ping pointer-events-none" />
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
};

export default AIAssistant;
