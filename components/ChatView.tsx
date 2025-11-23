import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle, Copy, Check, TrendingUp } from 'lucide-react';
import { Message, MessageRole, Transaction } from '../types';
import { generateTextResponse } from '../services/gemini';
import { LoadingDots } from './LoadingDots';
import ReactMarkdown from 'react-markdown';

interface ChatViewProps {
  transactions: Transaction[];
}

export const ChatView: React.FC<ChatViewProps> = ({ transactions }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: '你好！我是你的 AI 投資分析師。我可以看到您左側的交易紀錄（包含止盈止損設定）。您可以問我：「我的投資組合風險如何？」或「分析一下我持有的 2330 台積電」。',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a context-aware prompt
      // Exclude large base64 image strings from the context to save tokens/bandwidth
      const sanitizedTransactions = transactions.map(({ imageUrl, ...rest }) => ({
        ...rest,
        hasImage: !!imageUrl
      }));

      const transactionContext = sanitizedTransactions.length > 0 
        ? `目前的投資組合交易紀錄資料如下 (JSON格式): ${JSON.stringify(sanitizedTransactions)}\n\n`
        : "目前尚無交易紀錄。\n\n";
      
      const fullPrompt = `${transactionContext}用戶問題: ${input}`;

      const responseText = await generateTextResponse(fullPrompt);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ERROR,
        text: "抱歉，分析服務暫時無法使用。",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-2">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <TrendingUp size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">AI 投資顧問</h2>
          <p className="text-xs text-slate-500">基於您的交易紀錄與策略進行分析</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${
                message.role === MessageRole.USER
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : message.role === MessageRole.ERROR
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {message.role === MessageRole.MODEL && (
                <button
                  onClick={() => copyToClipboard(message.text, message.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 text-slate-500"
                  title="複製內容"
                >
                  {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
              
              <div className="flex items-start gap-2">
                {message.role === MessageRole.MODEL && (
                  <Bot size={18} className="mt-1 shrink-0 text-indigo-500" />
                )}
                {message.role === MessageRole.ERROR && (
                  <AlertCircle size={18} className="mt-1 shrink-0" />
                )}
                <div className={`text-sm leading-relaxed overflow-hidden prose prose-sm ${message.role === MessageRole.USER ? 'prose-invert' : 'prose-slate'}`}>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              </div>
              <div className={`text-[10px] mt-2 opacity-70 ${message.role === MessageRole.USER ? 'text-indigo-100' : 'text-slate-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <LoadingDots />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="詢問投資建議，例如：分析我的持股風險..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};