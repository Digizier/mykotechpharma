'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Star, X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { uploadWebPToStorage, deleteImageFromStorage } from '@/lib/imageCompression';

interface UploadedImageItem {
  url: string;
  sizeKb: number;
  originalSizeKb: number;
  reduction: number;
  isPrimary: boolean;
}

interface MultiImageUploaderProps {
  initialUrls?: string[];
  primaryUrl?: string;
  onChange: (urls: string[], primaryUrl: string) => void;
  folder?: 'products' | 'banners';
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  initialUrls = [],
  primaryUrl = '',
  onChange,
  folder = 'products',
}) => {
  const [images, setImages] = useState<UploadedImageItem[]>(() => {
    const combined = Array.from(new Set([primaryUrl, ...(initialUrls || [])])).filter(Boolean);
    return combined.map((url, idx) => ({
      url,
      sizeKb: 35,
      originalSizeKb: 150,
      reduction: 75,
      isPrimary: primaryUrl ? url === primaryUrl : idx === 0,
    }));
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when initialUrls or primaryUrl change (e.g. editing a different medicine)
  useEffect(() => {
    const combined = Array.from(new Set([primaryUrl, ...(initialUrls || [])])).filter(Boolean);
    setImages(
      combined.map((url, idx) => ({
        url,
        sizeKb: 35,
        originalSizeKb: 150,
        reduction: 75,
        isPrimary: primaryUrl ? url === primaryUrl : idx === 0,
      }))
    );
  }, [primaryUrl, (initialUrls || []).join(',')]);

  const syncState = (newImages: UploadedImageItem[]) => {
    setImages(newImages);
    const urls = newImages.map((img) => img.url);
    const primary = newImages.find((img) => img.isPrimary)?.url || urls[0] || '';
    onChange(urls, primary);
  };

  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Please select valid image files');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      const newItems: UploadedImageItem[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setProgressMsg(`Compressing & Uploading [${i + 1}/${validFiles.length}] to WebP...`);

        const res = await uploadWebPToStorage(file, folder);
        newItems.push({
          url: res.url,
          sizeKb: res.compressedSizeKb,
          originalSizeKb: res.originalSizeKb,
          reduction: res.reduction,
          isPrimary: images.length === 0 && newItems.length === 0,
        });
      }

      const merged = [...images, ...newItems];
      // Ensure at least one is primary
      if (!merged.some((img) => img.isPrimary) && merged.length > 0) {
        merged[0].isPrimary = true;
      }

      syncState(merged);
    } catch (err: any) {
      console.error('Batch compression error:', err);
      setError(err?.message || 'Batch upload failed');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    syncState(updated);
  };

  const handleRemove = (index: number) => {
    const target = images[index];
    if (target?.url) {
      deleteImageFromStorage(target.url).catch((err) => {
        console.warn('Storage delete non-critical error:', err);
      });
    }
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    syncState(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Product Gallery & Multi-Images
        </label>
        <span className="text-xs text-slate-500 font-medium">
          {images.length} image{images.length !== 1 ? 's' : ''} uploaded
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/10 rounded-2xl p-5 cursor-pointer flex flex-col items-center justify-center text-center transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
          }}
        />

        {isProcessing ? (
          <div className="py-4 flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            <span className="text-xs font-bold text-slate-700">{progressMsg}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                Click to add multiple images or drop them here
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every image is converted in-browser to tiny WebP KBs (Sub-100KB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((item, index) => (
            <div
              key={item.url + index}
              className={`relative rounded-xl border p-2 bg-white flex flex-col items-center group transition-all ${
                item.isPrimary
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="relative w-full h-28 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-1">
                <img
                  src={item.url}
                  alt={`Product view ${index + 1}`}
                  className="w-full h-full object-contain"
                />

                {/* Primary star badge */}
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  className={`absolute top-1.5 left-1.5 p-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-md transition-all ${
                    item.isPrimary
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-900/70 hover:bg-amber-500 text-white opacity-80 group-hover:opacity-100'
                  }`}
                  title={item.isPrimary ? 'Cover photo' : 'Click to set as primary cover'}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {item.isPrimary && <span className="text-[9px]">Primary</span>}
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-900/70 hover:bg-red-600 text-white opacity-80 group-hover:opacity-100 transition-all shadow-md"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Size badge */}
              <div className="mt-2 flex items-center justify-between w-full text-[10px] text-slate-500 font-semibold px-1">
                <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.sizeKb} KB
                </span>
                <span>-{item.reduction}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
