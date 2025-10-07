"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function Step1Page() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Array<{id: string; role: string; content: string}>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "你是一个有用的AI助手。" },
            ...messages,
            userMsg
          ].map(m => ({ role: m.role, content: m.content })),
          model: "deepseek-chat",
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const assistantId = `assistant_${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages(prev => prev.map(m => 
            m.id === assistantId ? { ...m, content: fullContent } : m
          ));
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        id: `error_${Date.now()}`, 
        role: "assistant", 
        content: "抱歉，发生了错误。" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Step 1: With Framer Motion</h1>
        
        <div className="mb-4">
          <p>Status: {status}</p>
          {session?.user && <p>User: {session.user.name}</p>}
        </div>

        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white ml-8"
                    : "bg-white dark:bg-gray-800 mr-8"
                }`}
              >
                <div className="font-semibold mb-1">
                  {message.role === "user" ? "You" : "AI"}
                </div>
                <div>{message.content}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.form 
          onSubmit={sendMessage} 
          className="flex gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border rounded-lg"
            disabled={loading}
          />
          <motion.button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? "Sending..." : "Send"}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
