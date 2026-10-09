'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Award, 
  HeartHandshake, 
  PhoneCall, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  Pill,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 space-y-6 sm:space-y-14 w-full max-w-full overflow-x-hidden">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-4">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>About MykoTech Pharma Pvt Ltd</span>
        </div>
        <h1 className="text-2xl sm:text-5xl font-black text-slate-950">
          Dedicated to Quality Healthcare & Patient Vitality
        </h1>
        <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
          Founded and led by Irfan Shahid Khan, MykoTech Pharma Pvt Ltd is committed to delivering authentic pharmaceuticals, specialized drops, elixirs, and dietary supplements with our core promise: <span className="font-extrabold text-blue-700">Live long Live Happy!</span>
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">100% Genuine Medicine Guarantee</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every batch of medication is acquired directly through authorized pharmaceutical manufacturing channels with verifiable certification codes.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">WHO-GMP Compliant Standards</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Temperature-controlled cold chain facilities ensure syrups, injectables, and tablets retain peak potency throughout storage and home transit.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">Patient-Centric Clinical Counsel</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our qualified pharmacists review prescriptions, verify dosage compatibility, and answer customer queries promptly via WhatsApp.
          </p>
        </div>
      </div>

      {/* Leadership & Mission Statement */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-14 text-white grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-center shadow-xl">
        <div className="space-y-4">
          <span className="text-xs font-black tracking-widest text-blue-400 uppercase">
            Corporate Leadership
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Led by Irfan Shahid Khan
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            MykoTech Pharma Pvt Ltd was established with a clear mission: to eliminate counterfeit drugs and simplify access to essential healthcare. By combining modern clinical distribution with reliable doorstep home delivery, we serve families and medical practices nationwide.
          </p>
          <div className="pt-2 flex flex-col gap-2 text-xs text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Registered Pharmacy License &bull; DRAP Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Doorstep Home Delivery across Islamabad, Rawalpindi & Pakistan</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
          <h4 className="text-base font-bold text-white">Direct Communication</h4>
          <div className="space-y-3 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-4 h-4 text-blue-400" />
              <span>Direct Mobile: 0314-5200832</span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Official WhatsApp: 0318-4008718</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>Official Email: Mykotechpharma@gmail.com</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Sector G-10/4, Medical Commercial Plaza, Islamabad, Pakistan</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
