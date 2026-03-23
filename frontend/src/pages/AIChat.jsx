import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, User, Bot, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId
        })
      });

      const data = await response.json();
      
      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    inputRef.current?.focus();
  };

  const suggestedQuestions = [
    "Why is copper price rising?",
    "What's the best time to buy steel?",
    "Compare suppliers for aluminium",
    "Forecast rubber prices for next month"
  ];

  return (
    <div className="p-6 h-[calc(100vh-100px)] flex flex-col" data-testid="ai-chat-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            AI ASSISTANT
          </h1>
          <p className="text-gray-500 mt-1">Ask questions about raw materials</p>
        </div>
        <Button
          variant="outline"
          onClick={startNewChat}
          data-testid="new-chat-btn"
          className="border-white/10 text-gray-400 hover:text-white"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat Container */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        <GlassCardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-blue-500/10 mb-4">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">How can I help you today?</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Ask me anything about raw material prices, forecasts, supplier comparisons, or procurement strategies.
                </p>
                
                {/* Suggested Questions */}
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(question)}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-blue-500/30 transition-colors text-left"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    data-testid={`chat-message-${idx}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user" 
                        ? "bg-blue-500" 
                        : message.error 
                          ? "bg-red-500/20" 
                          : "bg-green-500/20"
                    }`}>
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className={`w-4 h-4 ${message.error ? "text-red-400" : "text-green-400"}`} />
                      )}
                    </div>
                    <div className={`max-w-[70%] ${
                      message.role === "user" ? "text-right" : ""
                    }`}>
                      <div className={`p-4 rounded-2xl ${
                        message.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : message.error
                            ? "bg-red-500/10 text-red-400 rounded-bl-none"
                            : "bg-white/5 text-gray-200 rounded-bl-none"
                      }`}>
                        <p className={`text-sm whitespace-pre-wrap ${
                          message.role === "assistant" ? "font-data" : ""
                        }`}>
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-gray-600 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-400" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about raw materials, prices, forecasts..."
                className="flex-1 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                data-testid="send-message-btn"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              AI responses are generated based on current market data and may not reflect real-time conditions.
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};

export default AIChat;
