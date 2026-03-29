'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
} from 'lucide-react';

export const SUGGESTIONS = [
  'Show me PHI scores for Bondi, NSW',
  'What are the trending areas in Australia?',
  'Which properties are overvalued in Melbourne?',
  'What is the national market overview?',
  'How have trends changed in Manly over 6 months?',
  'Compare supply vs demand in Sydney CBD',
];

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-slate-700' : 'bg-gradient-to-br from-orange-500 to-orange-700'
        }`}
      >
        {isUser ? <User className="w-3 h-3 text-slate-300" /> : <Bot className="w-3 h-3 text-white" />}
      </div>
      <div
        className={`rounded-lg px-3 py-2 max-w-[85%] ${
          isUser ? 'bg-slate-700 text-slate-200' : 'bg-slate-800/80 border border-slate-700/50 text-slate-300'
        }`}
      >
        {isUser ? (
          <p className="text-xs whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-xs prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_code]:bg-slate-700 [&_code]:px-1 [&_code]:rounded [&_code]:text-[10px] [&_strong]:text-slate-200">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ messages, input, setInput, onSend, sending, onClear, inputRef, messagesEndRef, className = '' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 ${className}`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-700 rounded flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-300">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-600 hover:text-slate-400">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold text-slate-300 mb-1">PHI Intelligence</p>
            <p className="text-[10px] text-slate-600 mb-3 max-w-[180px]">Ask about PHI scores, valuations, or any market data</p>
            <div className="space-y-1.5 w-full">
              {SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSend(s)}
                  className="w-full text-left text-[10px] text-slate-500 bg-slate-800/50 hover:bg-slate-800 hover:text-slate-300 px-2.5 py-1.5 rounded transition-colors border border-slate-800 hover:border-slate-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-slate-800/80 rounded-lg border border-slate-700/50 px-3 py-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Querying market data...
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-slate-800 p-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about PHI scores..."
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 disabled:opacity-50 transition-all"
            style={{ minHeight: '32px', maxHeight: '72px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 72) + 'px';
            }}
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-7 h-7 rounded-md bg-orange-600 text-white flex items-center justify-center hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
