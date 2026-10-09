'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  PhoneCall, 
  MessageCircle, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { uploadWebPToStorage } from '@/lib/imageCompression';
import { supabase } from '@/lib/supabase';

export default function PrescriptionUploadPage() {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [fileStats, setFileStats] = useState<{ compressed: number; saved: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setError(null);
        setIsCompressing(true);
        // Client-side auto-compress to sub-80KB WebP
        const res = await uploadWebPToStorage(file, 'prescriptions');
        setUploadedImageUrl(res.url);
        setFileStats({ compressed: res.compressedSizeKb, saved: res.reduction });
      } catch (err: any) {
        console.error(err);
        setError('Failed to process and compress prescription photo. Please try again.');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageUrl) {
      setError('Please upload a clear photo of your prescription.');
      return;
    }
    if (!patientName.trim() || !phone.trim()) {
      setError('Please enter patient name and contact phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Save directly to Cloud Database
      const { error: dbErr } = await supabase.from('prescriptions').insert([
        {
          patient_name: patientName.trim(),
          phone: phone.trim(),
          notes: notes.trim() || 'Prescription order via website',
          image_url: uploadedImageUrl,
          status: 'pending',
        },
      ]);

      if (dbErr) throw new Error(dbErr.message);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to submit prescription. Please try ordering via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          <span>Licensed Prescription Service</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-950">
          Upload Doctor's Prescription
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Snap a clear picture of your prescription slip. Our qualified pharmacists will verify it, calculate dosages, and dispatch your order.
        </p>
      </div>

      {submitted ? (
        /* Success Screen */
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-12 border border-slate-100 shadow-xl text-center space-y-4 sm:space-y-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Prescription Received Successfully!
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
              Thank you, <span className="font-bold text-slate-800">{patientName}</span>. Our registered clinical pharmacist is reviewing your slip. We will contact you at <span className="font-bold text-slate-800">{phone}</span> to confirm medicines and home delivery.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 max-w-md mx-auto space-y-1">
            <p className="font-bold text-slate-700">Estimated Verification Time: 15–30 Minutes</p>
            <p>Our team works 7 days a week to ensure timely delivery.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2 sm:pt-4">
            <a
              href={`https://wa.me/923184008718?text=${encodeURIComponent(
                `Hello MykoTech Pharma, I just uploaded a prescription for ${patientName} (${phone}). Please check and confirm.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp</span>
            </a>

            <Link
              href="/products/"
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      ) : (
        /* Prescription Submission Form */
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-slate-100 shadow-lg space-y-5 sm:space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: File Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>1. Attach Prescription Slip (Photo / Scan) *</span>
                {fileStats && (
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    Compressed: {fileStats.compressed} KB (-{fileStats.saved}%)
                  </span>
                )}
              </label>

              <label
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  uploadedImageUrl
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-blue-500 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-700">Compressing to WebP &bull; Tiny KB Target...</span>
                  </div>
                ) : uploadedImageUrl ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 p-1">
                      <img src={uploadedImageUrl} alt="Prescription" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Prescription Uploaded Successfully</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Click to change photo</span>
                  </div>
                ) : (
                  <div className="py-4 space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Take a photo or choose an image from device
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        JPEG, PNG, WEBP &bull; Auto-compressed to lightweight format
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Step 2: Patient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Irfan Shahid"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Contact Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0318-4008718"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Step 3: Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Additional Delivery Address / Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Mention specific brand preferences, required quantities, or full home delivery address..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Prescription...</span>
                </>
              ) : (
                <>
                  <span>Submit Prescription for Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Clinical Assurance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Confidential & HIPAA / DRAP Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Prompt 15-Minute Review</span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Call Support: 0314-5200832</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
