'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { uploadWebPToStorage } from '@/lib/imageCompression';

interface SingleImageUploaderProps {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  folder?: 'products' | 'banners' | 'prescriptions';
  label?: string;
}

export const SingleImageUploader: React.FC<SingleImageUploaderProps> = ({
  currentUrl,
  onUploadSuccess,
  folder = 'products',
  label = 'Product Featured Image',
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number; saved: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, BMP, WEBP)');
      return;
    }

    try {
      setError(null);
      setIsCompressing(true);

      // In-browser client-side WebP compression + direct upload
      const res = await uploadWebPToStorage(file, folder);

      setStats({
        original: res.originalSizeKb,
        compressed: res.compressedSizeKb,
        saved: res.reduction,
      });

      setPreview(res.url);
      onUploadSuccess(res.url);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Failed to compress and upload image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    setStats(null);
    onUploadSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        {stats && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            {stats.compressed} KB ({stats.saved}% smaller)
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          preview
            ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
            : 'border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {isCompressing ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <div className="text-xs font-bold text-slate-700">
              Converting to WebP & Compressing to tiny KBs...
            </div>
            <div className="text-[11px] text-slate-400">Zero Base64 &bull; Sub-100KB Target</div>
          </div>
        ) : preview ? (
          <div className="relative group w-full flex flex-col items-center">
            <div className="relative w-full max-w-[200px] h-36 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2">
              <img
                src={preview}
                alt="Product preview"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-red-600 text-white shadow-md transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Optimized WebP Uploaded</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Click or drag to replace image</div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag & drop image
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, BMP auto-converted to &lt;60KB WebP
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
