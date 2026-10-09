'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  HeartHandshake, 
  PhoneCall, 
  Mail, 
  MapPin, 
  Award, 
  MessageCircle,
  ExternalLink,
  Globe
} from 'lucide-react';

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-8 sm:pt-14 pb-8 sm:pb-12 border-t border-slate-800 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top 4 Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-6 sm:pb-10 border-b border-slate-800/80">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">100% Genuine Medicines</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Directly sourced from certified pharma manufacturers & licensed distributors.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">WHO-GMP Compliant</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Temperature-controlled pharmaceutical handling & home delivery across Pakistan.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">Registered Pharmacists</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Every prescription order is verified by certified healthcare professionals.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">WhatsApp Support</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Fast order assistance and healthcare consultation at 0318-4008718.</p>
            </div>
          </div>
        </div>

        {/* Middle Navigation & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-10 py-6 sm:py-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center p-0.5 border border-blue-100 shrink-0">
                <img
                  src="/logo.png"
                  alt="MykoTech Pharma"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none block">
                  MYKOTECH<span className="text-blue-400">PHARMA</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-400 font-bold tracking-wider uppercase mt-0.5 block">
                  Pvt Ltd &bull; Live long Live Happy!
                </span>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              MykoTech Pharma Pvt Ltd is your trusted online home pharmacy providing genuine medicines, pediatric drops, syrups, and health supplements with reliable doorstep delivery.
            </p>

            {/* Social & Community Channels */}
            <div className="pt-1 sm:pt-2 flex flex-wrap gap-2 sm:gap-3">
              <a
                href="https://whatsapp.com/channel/0029VbE2h1I9cDDV5alfzW2T"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-900/60 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Join WhatsApp Channel</span>
              </a>

              <a
                href="https://www.facebook.com/share/1C91dpHAE4/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-900/60 transition-colors"
              >
                <FacebookIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Facebook Page</span>
              </a>
            </div>
          </div>

          {/* Core Categories */}
          <div className="space-y-2 sm:space-y-3">
            <h5 className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase">Categories</h5>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
              <li><Link href="/products/?category=tablets" className="hover:text-blue-400 transition-colors">Tablets & Capsules</Link></li>
              <li><Link href="/products/?category=syrups" className="hover:text-blue-400 transition-colors">Syrups & Suspensions</Link></li>
              <li><Link href="/products/?category=drops" className="hover:text-blue-400 transition-colors">Pediatric Drops</Link></li>
              <li><Link href="/products/?category=food-supplements" className="hover:text-blue-400 transition-colors">Food Supplements</Link></li>
              <li><Link href="/products/?category=injectables-infusions" className="hover:text-blue-400 transition-colors">Injectables & IV</Link></li>
              <li><Link href="/products/?category=topical-derma" className="hover:text-blue-400 transition-colors">Topical Creams</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 sm:space-y-3">
            <h5 className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase">Services</h5>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
              <li><Link href="/prescription/" className="hover:text-blue-400 transition-colors">Upload Prescription</Link></li>
              <li><Link href="/products/" className="hover:text-blue-400 transition-colors">Online Storefront</Link></li>
              <li><Link href="/cart/" className="hover:text-blue-400 transition-colors">Shopping Cart</Link></li>
              <li><Link href="/about/" className="hover:text-blue-400 transition-colors">About Irfan Shahid Khan</Link></li>
              <li><Link href="/contact/" className="hover:text-blue-400 transition-colors">Help & Contact</Link></li>
            </ul>
          </div>

          {/* Direct Contact Details */}
          <div className="space-y-2 sm:space-y-3">
            <h5 className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase">Contact</h5>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Sector G-10/4, Medical Plaza, Islamabad</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Call: 0314-5200832</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp: 0318-4008718</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">Mykotechpharma@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 mt-2 sm:mt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 sm:gap-4">
          <p>&copy; {new Date().getFullYear()} MykoTech Pharma Pvt Ltd. All rights reserved.</p>
          <p className="text-center sm:text-right text-[11px] sm:text-xs">
            Medical Disclaimer: Please consult your registered doctor before taking medicine.
          </p>
        </div>
      </div>
    </footer>
  );
};
