"use client";

import { useState, FormEvent } from 'react';
import { User, Mail, MessageSquare, Send, PartyPopper } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center p-8 bg-zinc-900/80 rounded-xl border border-white/10">
        <PartyPopper className="w-12 h-12 mx-auto text-emerald-400" />
        <h2 className="text-xl font-semibold mt-4">ขอบคุณที่ติดต่อเรา</h2>
        <p className="mt-2 text-white/80">ทีมงานจะติดต่อกลับโดยเร็วที่สุด</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-1.5">
          ชื่อ (Name)
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            name="name"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 pr-3 block w-full bg-zinc-800/80 border-zinc-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors duration-200"
            placeholder="ชื่อของคุณ"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1.5">
          อีเมล (Email)
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="email"
            name="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 pr-3 block w-full bg-zinc-800/80 border-zinc-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors duration-200"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white/90 mb-1.5">
          ข้อความ (Message)
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-white/40" />
          <textarea
            name="message"
            id="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="pl-10 pr-3 block w-full bg-zinc-800/80 border-zinc-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors duration-200"
            placeholder="ข้อความของคุณ..."
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          className="w-full group flex items-center justify-center gap-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-zinc-900 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="w-4 h-4 transform group-hover:-rotate-12 transition-transform" />
          <span>ส่งข้อความ</span>
        </button>
      </div>
    </form>
  );
}
