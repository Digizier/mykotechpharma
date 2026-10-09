'use client';

import React, { useState } from 'react';
import { 
  PhoneCall, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send,
  ExternalLink
} from 'lucide-react';

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
  </svg>
);

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 space-y-6 sm:space-y-12 w-full max-w-full overflow-x-hidden">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-950">
          Get in Touch with MykoTech Pharma
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          Have questions regarding drug availability, prescription uploads, or home delivery? Reach our pharmacy care team directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        
        {/* Left: Contact Info & Channels */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-4 sm:space-y-6">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              Official Pharmacy Channels
            </h3>

            <div className="space-y-4 text-sm">
              <a
                href="tel:03145200832"
                className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Call Helpline</span>
                  <div className="font-extrabold text-slate-900 group-hover:text-blue-600 text-base">
                    0314-5200832
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Direct phone line for medical inquiries</p>
                </div>
              </a>

              <a
                href="https://wa.me/923184008718"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Official WhatsApp</span>
                  <div className="font-extrabold text-slate-900 group-hover:text-emerald-600 text-base">
                    0318-4008718
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Instant prescription ordering & chat support</p>
                </div>
              </a>

              <a
                href="mailto:Mykotechpharma@gmail.com"
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Official Email</span>
                  <div className="font-extrabold text-slate-900 text-base">
                    Mykotechpharma@gmail.com
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Corporate and supply chain inquiries</p>
                </div>
              </a>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Address & Dispatch Hub</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    Sector G-10/4, Medical Commercial Plaza, Islamabad, Pakistan
                  </div>
                </div>
              </div>
            </div>

            {/* Social channels */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
              <a
                href="https://whatsapp.com/channel/0029VbE2h1I9cDDV5alfzW2T"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Join WhatsApp Channel</span>
              </a>

              <a
                href="https://www.facebook.com/share/1C91dpHAE4/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <FacebookIcon className="w-4 h-4" />
                <span>Facebook Page</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Message Form */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-4 sm:space-y-6">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
            Send an Online Inquiry
          </h3>

          {sent ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-slate-900">Message Received!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Thank you, {name}. Our customer care team will reply to your inquiry shortly via WhatsApp or phone call.
              </p>
              <button
                onClick={() => setSent(false)}
                className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="0314-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Message / Medicine Request *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter your query or required medicine details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send Inquiry</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
