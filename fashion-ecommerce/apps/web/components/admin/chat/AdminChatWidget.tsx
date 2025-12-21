'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AdminChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Chào admin 👋 Mình có thể hỗ trợ bạn tổng hợp và phân tích dữ liệu hệ thống như doanh thu, đơn hàng, sản phẩm, khách hàng. Hãy hỏi mình bất kỳ câu hỏi nào về tình hình kinh doanh!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, source: 'admin' }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Chat service error');
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer || 'Mình chưa có thông tin phù hợp.' },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, mình đang gặp lỗi. Bạn thử lại sau nhé.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle Button (chỉ hiển thị trong trang admin) */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          className="rounded-full shadow-lg bg-slate-900 hover:bg-slate-800"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label="Admin chat"
        >
          {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </Button>
      </div>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-40 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col transition-all',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white rounded-t-xl">
          <div>
            <p className="text-sm font-semibold">Trợ lý Admin</p>
            <p className="text-xs text-slate-200">
              Tổng hợp và phân tích dữ liệu hệ thống
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-100 hover:bg-slate-800"
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto bg-white" style={{ maxHeight: '340px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                'text-sm p-2 rounded-lg whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-slate-900 text-white ml-auto max-w-[85%]'
                  : 'bg-gray-100 text-gray-800 mr-auto max-w-[90%]'
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="text-sm text-gray-500 italic">Đang phân tích dữ liệu...</div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-gray-200 flex items-center gap-2 bg-white rounded-b-xl">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về doanh thu, đơn hàng, sản phẩm..."
            className="text-sm"
          />
          <Button size="icon" onClick={sendMessage} disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}


