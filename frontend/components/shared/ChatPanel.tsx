"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, MessageSquare, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Message = {
  id?: string;
  sender: "user" | "worker";
  sender_name?: string;
  text: string;
  time: string;
};

type ChatPanelProps = {
  bookingId: string;
  workerName: string;
  onClose?: () => void;
};

export function ChatPanel({ bookingId, workerName, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/${bookingId}/messages/`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.results || []);
      }
    } catch (err) {
      console.error("Failed to load chat messages", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const currentMsg = inputVal;
    setInputVal("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/${bookingId}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentMsg }),
        credentials: "include"
      });
      if (res.ok) {
        fetchMessages();
      } else {
        setMessages((prev) => [...prev, { sender: "user", text: currentMsg, time: "Just Now" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "user", text: currentMsg, time: "Just Now" }]);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-lg overflow-hidden flex flex-col h-[400px] animate-scale-up">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          <div>
            <strong className="text-xs block leading-tight font-black">{workerName}</strong>
            <span className="text-[9px] font-semibold text-primary-light">Real-time Chat Portal</span>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Window */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[80%] ${
              msg.sender === "user" ? "ml-auto items-end" : "items-start"
            }`}
          >
            <div className={`rounded-2xl px-3.5 py-2 text-xs font-semibold leading-5 ${
              msg.sender === "user"
                ? "bg-primary text-white"
                : "bg-white text-slate-800 border border-slate-200"
            }`}>
              {msg.text}
            </div>
            <span className="text-[8px] font-semibold text-slate-400 mt-1">{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs Bar */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-2.5 flex gap-2 bg-white">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask worker 'where are you?'..."
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-primary font-medium"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary hover:bg-primary-dark p-2.5 text-white transition-all shadow-sm shadow-primary/10"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
