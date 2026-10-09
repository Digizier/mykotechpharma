'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton: React.FC<{
  phoneNumber?: string;
  defaultMessage?: string;
}> = ({
  phoneNumber = '923184008718',
  defaultMessage = 'Hello MykoTech Pharma, I would like to inquire about medicine delivery.',
}) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <aside aria-label="Customer Support" className="fixed bottom-20 sm:bottom-6 right-5 sm:right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-3.5 py-3 rounded-full shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-current text-white shrink-0" />
        <span className="hidden sm:inline">Order on WhatsApp</span>
      </a>
    </aside>
  );
};
