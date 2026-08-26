'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, MessageSquare, Globe, Send } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Check out this design asset on DesignHub: ${title}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
      link: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: Send,
      color: 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100',
      link: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: Globe,
      color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      link: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Share2 className="h-4 w-4 text-indigo-600" />
            <span>Share Design Asset</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Canonical Page Link</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Intents Grid */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Share directly to</span>
          <div className="grid grid-cols-2 gap-2.5">
            {shareOptions.map((opt) => (
              <a
                key={opt.name}
                href={opt.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition-colors ${opt.color}`}
              >
                <opt.icon className="h-4 w-4" />
                <span>{opt.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
