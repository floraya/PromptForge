import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 4,
  label = '上傳產生後的圖片 (成果展示 / 範例圖)',
  description = '支援上傳本地圖片或貼上圖片 URL。讓團隊或使用者一眼看到此提示詞實際生成的圖像效果！',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle local file selection and convert to compressed base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg('');
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('僅支援上傳圖片格式 (JPEG, PNG, WebP, GIF)');
        return;
      }

      // Check size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('單張圖片檔案過大，請選擇 5MB 以內的圖片');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Compress image via Canvas to keep localStorage light
          compressImage(result, (compressedDataUrl) => {
            onChange([...images, compressedDataUrl]);
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to resize/compress image to ~720px max and compact webp/jpeg to stay very light
  const compressImage = (dataUrl: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 720;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Use webp or jpeg with good compact compression
        let compressed = canvas.toDataURL('image/webp', 0.65);
        if (compressed.length >= 40000) {
          // If still large, compress further with jpeg 0.55
          compressed = canvas.toDataURL('image/jpeg', 0.55);
        }
        callback(compressed);
      } else {
        callback(dataUrl);
      }
    };
    img.onerror = () => callback(dataUrl);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setErrorMsg('請輸入有效的圖片網址 (以 https:// 開頭)');
      return;
    }

    if (images.length >= maxImages) {
      setErrorMsg(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
    setErrorMsg('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...rest]);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            {label}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            ({images.length} / {maxImages} 張)
          </span>
        </label>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-950"
            >
              <img
                src={imgUrl}
                alt={`產出成果圖 ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Primary Badge */}
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-sm shadow">
                  封面主圖
                </span>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-500 text-white shadow transition cursor-pointer"
                    title="移除此圖片"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="w-full py-1 rounded bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white text-[10px] font-semibold transition cursor-pointer"
                  >
                    設為主圖
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload & URL Input Row */}
      {images.length < maxImages && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* File Upload Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 text-slate-200 text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>從電腦選擇圖片上傳</span>
            </button>

            {/* URL Input Form */}
            <div className="flex-1 flex gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="或直接貼上圖片網址 (https://...)"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition cursor-pointer active:scale-95"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
