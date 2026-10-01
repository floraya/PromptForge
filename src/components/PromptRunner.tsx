import React, { useState, useEffect, useRef } from 'react';
import { PromptTemplate } from '../types/prompt';
import { fillTemplate } from '../utils/templateUtils';
import {
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Sheet as SheetIcon,
  Tag,
  Folder,
  Edit3,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Plus,
  Maximize2,
  X,
} from 'lucide-react';

interface PromptRunnerProps {
  prompt: PromptTemplate;
  onEditPrompt: (prompt: PromptTemplate) => void;
  onSyncThisPromptToSheet?: (prompt: PromptTemplate) => void;
  onUpdatePromptImages?: (promptId: string, images: string[]) => void;
  isSyncing?: boolean;
  sheetUrl?: string;
}

export const PromptRunner: React.FC<PromptRunnerProps> = ({
  prompt,
  onEditPrompt,
  onSyncThisPromptToSheet,
  onUpdatePromptImages,
  isSyncing = false,
  sheetUrl,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showRawTemplate, setShowRawTemplate] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const quickUploadRef = useRef<HTMLInputElement>(null);

  // Combine showcase images
  const allImages = prompt.showcaseImages?.length
    ? prompt.showcaseImages
    : prompt.previewImageUrl
    ? [prompt.previewImageUrl]
    : [];

  // Initialize values from prompt defaults or fallback
  useEffect(() => {
    const initial: Record<string, string> = {};
    prompt.variables.forEach((v) => {
      initial[v.key] = prompt.defaultValues?.[v.key] ?? v.defaultValue ?? '';
    });
    setValues(initial);
  }, [prompt]);

  const handleInputChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    const initial: Record<string, string> = {};
    prompt.variables.forEach((v) => {
      initial[v.key] = prompt.defaultValues?.[v.key] ?? v.defaultValue ?? '';
    });
    setValues(initial);
  };

  const filledContent = fillTemplate(prompt.content, values);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(filledContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
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
              let compressed = canvas.toDataURL('image/webp', 0.65);
              if (compressed.length >= 40000) {
                compressed = canvas.toDataURL('image/jpeg', 0.55);
              }
              const updated = [...allImages, compressed];
              onUpdatePromptImages?.(prompt.id, updated);
            }
          };
        }
      };
      reader.readAsDataURL(file);
    });

    if (quickUploadRef.current) {
      quickUploadRef.current.value = '';
    }
  };

  const handleRemoveImage = (idxToRemove: number) => {
    const updated = allImages.filter((_, idx) => idx !== idxToRemove);
    onUpdatePromptImages?.(prompt.id, updated);
    if (activeImageIndex >= updated.length) {
      setActiveImageIndex(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-700/50 flex items-center gap-1">
                <Folder className="w-3 h-3" />
                {prompt.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                版本 v{prompt.version}
              </span>
              {prompt.author && (
                <span className="text-xs text-slate-400">
                  作者: <strong className="text-slate-200">{prompt.author}</strong>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {prompt.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {prompt.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-indigo-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap lg:flex-col items-center sm:items-end gap-2.5 shrink-0">
            <button
              onClick={() => onEditPrompt(prompt)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>編輯模板 & 變數</span>
            </button>

            {onSyncThisPromptToSheet && (
              <button
                onClick={() => onSyncThisPromptToSheet(prompt)}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition disabled:opacity-50 cursor-pointer"
                title="將本提示詞與版本同步推送到 Google 試算表"
              >
                <SheetIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSyncing ? '同步中...' : '同步至試算表 (v' + prompt.version + ')'}</span>
              </button>
            )}

            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition"
              >
                <span>在 Google 試算表檢視</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="全尺寸 AI 產生成果圖"
              className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Runner: Variables on Left, Generated Prompt on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Variables + Generated Output Images below */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">填入自訂參數 (Variables)</h3>
                  <p className="text-[11px] text-slate-400">
                    填入下方欄位，右側將即時產出可複製提示詞
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
                title="重設為預設值"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重設</span>
              </button>
            </div>

            {prompt.variables.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                本提示詞未包含任何動態變數欄位。
                <br />
                可點擊「編輯模板」在內容中加入如 {'{專案名稱}'} 建立變數！
              </div>
            ) : (
              <div className="space-y-4">
                {prompt.variables.map((variable) => {
                  const currentValue = values[variable.key] ?? '';
                  return (
                    <div key={variable.key} className="space-y-1.5 group">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{variable.label}</span>
                          <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/70 px-1 py-0.5 rounded">
                            {`{${variable.key}}`}
                          </span>
                        </label>
                        {variable.defaultValue && currentValue !== variable.defaultValue && (
                          <button
                            type="button"
                            onClick={() => handleInputChange(variable.key, variable.defaultValue || '')}
                            className="text-[10px] text-slate-400 hover:text-slate-300 underline"
                          >
                            填入預設值
                          </button>
                        )}
                      </div>

                      {variable.type === 'textarea' || (variable.defaultValue && variable.defaultValue.length > 50) ? (
                        <textarea
                          rows={3}
                          value={currentValue}
                          placeholder={variable.placeholder || `輸入 ${variable.label}...`}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 outline-none transition resize-none leading-relaxed"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          placeholder={variable.placeholder || `輸入 ${variable.label}...`}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 outline-none transition"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Generated Output Image Showcase Gallery - Located directly under Variables */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI 產生成果圖展示 (Generated Images)</h3>
                  <p className="text-[11px] text-slate-400">
                    共 {allImages.length} 張成果圖
                  </p>
                </div>
              </div>

              {/* Quick Upload button directly in runner */}
              <div>
                <input
                  type="file"
                  ref={quickUploadRef}
                  onChange={handleQuickUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => quickUploadRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上傳圖片</span>
                </button>
              </div>
            </div>

            {allImages.length === 0 ? (
              <div
                onClick={() => quickUploadRef.current?.click()}
                className="border border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-6 text-center bg-slate-950/40 hover:bg-slate-900/60 transition cursor-pointer space-y-2 group"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">
                  尚未上傳此提示詞產生後的成果圖片
                </p>
                <p className="text-[11px] text-slate-500">
                  點擊此處可立即從電腦上傳 AI 產出的效果圖，展示給團隊與使用者！
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Main Selected Image Showcase */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[360px] flex items-center justify-center group">
                  <img
                    src={allImages[activeImageIndex] || allImages[0]}
                    alt="AI 產生成果大圖"
                    className="max-h-[360px] w-auto object-contain cursor-zoom-in"
                    onClick={() => setLightboxImage(allImages[activeImageIndex] || allImages[0])}
                  />

                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(allImages[activeImageIndex] || allImages[0])}
                      className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-slate-200 hover:text-white border border-slate-700 transition"
                      title="全螢幕檢視"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(activeImageIndex)}
                      className="p-1.5 rounded-lg bg-rose-950/80 backdrop-blur-sm text-rose-300 hover:text-white border border-rose-700/60 transition"
                      title="刪除此圖片"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnails row */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          activeImageIndex === idx
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`縮圖 ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Generated Output Preview & Copy (God of Prompt style) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="text-sm font-bold text-white">
                  {showRawTemplate ? '原始模板格式 (含變數代碼)' : '已編譯之完整提示詞 (可直接複製)'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRawTemplate(!showRawTemplate)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
                >
                  {showRawTemplate ? '切換為填空預覽' : '檢視原始代碼'}
                </button>

                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>已複製到剪貼簿！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>複製提示詞</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prompt Preview Content Box */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 max-h-[550px] overflow-y-auto">
              <pre className="text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                {showRawTemplate ? prompt.content : filledContent}
              </pre>
            </div>

            {/* Quick guide */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-300">
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                <strong>如何使用：</strong> 點擊上方<strong>「複製提示詞」</strong>
                後，可直接貼入 ChatGPT、Claude、Gemini 或其他 AI 工具中直接執行！
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
