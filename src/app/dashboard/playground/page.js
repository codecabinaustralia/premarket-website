'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
  MessageSquare,
} from 'lucide-react';

const SUGGESTIONS = [
  'What is the buyer score for Bondi, NSW?',
  'What are the trending areas in Australia?',
  'Show me the market forecast for Melbourne CBD',
  'What are property insights for Surry Hills?',
  'How have buyer trends changed in Manly over the last 6 months?',
  'What is the seller score for Parramatta, NSW?',
];

export default function PlaygroundPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [apiAccess, setApiAccess] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/join');
    }
  }, [user, loading, router]);

  // Listen for apiAccess changes
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setApiAccess(snap.data().apiAccess || { status: 'none' });
      }
    });
    return () => unsub();
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (apiAccess?.status === 'approved') {
      inputRef.current?.focus();
    }
  }, [apiAccess]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || sending) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    try {
      // Build conversation for the API (only role + content)
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiAccess.apiKey,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  // Gate: must have approved API access
  if (apiAccess && apiAccess.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">API Access Required</h2>
          <p className="text-slate-500 mb-6">
            You need an approved API key to use the Playground. Request access from the Developer Portal.
          </p>
          <Link
            href="/dashboard/developers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            Go to Developer Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">API Playground</h1>
                <p className="text-xs text-slate-500">Chat with Premarket market data</p>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            <EmptyState onSelect={(text) => sendMessage(text)} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {sending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Querying market data...
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any area in Australia..."
                rows={1}
                disabled={sending}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white disabled:opacity-50 transition-all"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-[#e48900] to-[#c64500] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Powered by Claude &middot; Queries your API key in real time
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }) {
  // Pick 3 random suggestions
  const [picks] = useState(() => {
    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Market Intelligence Playground</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Ask questions about buyer demand, seller activity, market forecasts, and property insights across Australia.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {picks.map((suggestion, i) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(suggestion)}
            className="text-left bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-slate-900 transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 mb-1.5 transition-colors" />
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-slate-900'
            : 'bg-gradient-to-br from-[#e48900] to-[#c64500]'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`rounded-xl px-4 py-3 max-w-[85%] ${
          isUser
            ? 'bg-slate-900 text-white'
            : 'bg-white border border-slate-200 text-slate-700'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm prose-slate max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_strong]:text-slate-900">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
