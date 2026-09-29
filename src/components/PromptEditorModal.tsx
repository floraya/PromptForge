import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../types/prompt';
import { extractVariables, formatLabel } from '../utils/templateUtils';
import {
  Sparkles,
  Save,
  Tag,
  Folder,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  AlertCircle,
  Sheet as SheetIcon,
} from 'lucide-react';
import { CATEGORIES } from '../types/prompt';

interface PromptEditorModalProps {
  isOpen: boolean;
  initialPrompt?: PromptTemplate | null;
  hasGoogleSync: boolean;
  onClose: () => void;
  onSave: (prompt: PromptTemplate, syncToSheetImmediately: boolean) => void;
}

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  initialPrompt,
  hasGoogleSync,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialPrompt);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[1]);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [author, setAuthor] = useState('');
  const [syncToSheet, setSyncToSheet] = useState(true);

  // Extracted variables in real-time
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [varDefaultValues, setVarDefaultValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialPrompt) {
      setTitle(initialPrompt.title);
      setCategory(initialPrompt.category);
      setDescription(initialPrompt.description);
      setContent(initialPrompt.content);
      setTags([...initialPrompt.tags]);
      setAuthor(initialPrompt.author || '');
      const initialLabels: Record<string, string> = {};
      const initialDefaults: Record<string, string> = {};
      initialPrompt.variables.forEach((v) => {
        initialLabels[v.key] = v.label;
        initialDefaults[v.key] = v.defaultValue || '';
      });
      setCustomLabels(initialLabels);
      setVarDefaultValues(initialDefaults);
    } else {
      // Default template for generator
      setTitle('');
      setCategory('軟體架構 & 工程');
      setDescription('');
      setContent(
        `你是一位經驗豐富的【{專業角色}】。\n\n請根據以下背景為我完成【{任務目標}】：\n- 目標客群/讀者：{目標受眾}\n- 風格與語調：{語調風格}\n- 關鍵產出要求：{詳細規格}\n\n請提供結構清晰、條理分明的執行步驟與實例。`
      );
      setTags(['AI 生成', '自訂模板']);
      setAuthor('');
      setCustomLabels({});
      setVarDefaultValues({});
    }
  }, [initialPrompt, isOpen]);

  // Extract variables when content changes
  useEffect(() => {
    const vars = extractVariables(content);
    setDetectedVars(vars);
  }, [content]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const insertVariablePlaceholder = (varName: string) => {
    const placeholder = `{${varName}}`;
    setContent((prev) => prev + placeholder);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請輸入提示詞標題');
      return;
    }
    if (!content.trim()) {
      alert('請輸入提示詞內容');
      return;
    }

    const compiledVariables = detectedVars.map((v) => ({
      key: v,
      label: customLabels[v] || formatLabel(v),
      defaultValue: varDefaultValues[v] || '',
      placeholder: `請輸入 ${customLabels[v] || formatLabel(v)}...`,
    }));

    const finalDefaultValues: Record<string, string> = {};
    detectedVars.forEach((v) => {
      finalDefaultValues[v] = varDefaultValues[v] || '';
    });

    const now = new Date().toISOString();
    const promptId = initialPrompt?.id || `prompt-${Date.now()}`;
    const version = initialPrompt ? initialPrompt.version + 1 : 1;

    const newPrompt: PromptTemplate = {
      id: promptId,
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/[\s\W-]+/g, '-'),
      category,
      tags: tags.length > 0 ? tags : ['精選'],
      description: description.trim() || '使用者自訂提示詞模板',
      content: content.trim(),
      variables: compiledVariables,
      defaultValues: finalDefaultValues,
      version,
      author: author.trim() || '我的提示詞',
      createdAt: initialPrompt?.createdAt || now,
      updatedAt: now,
      isFavorite: initialPrompt?.isFavorite || false,
    };

    onSave(newPrompt, hasGoogleSync && syncToSheet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {isEditing ? '編輯提示詞模板' : '建立全新提示詞 (Prompt Generator)'}
                {isEditing && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300">
                    目前 v{initialPrompt?.version} → 存檔將升為 v{(initialPrompt?.version || 1) + 1}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                支援 <code className="text-indigo-400 bg-indigo-950/60 px-1 py-0.5 rounded font-mono font-semibold">{'\{變數名稱\}'}</code> 動態填空，可自動生成客製化表單
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                提示詞標題 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：資深軟體架構師系統設計指南"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                分類類別
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 text-white text-sm outline-none transition cursor-pointer"
              >
                {CATEGORIES.filter((c) => c !== '全部類別').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">簡短功能描述 (Description)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="說明這個提示詞的使用情境、解決什麼核心問題與預期產出..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              標籤分類 (Tags - 按 Enter 新增)
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700 min-h-[42px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 text-xs font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="輸入標籤如 '行銷'、'API'..."
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none flex-1 min-w-[120px] px-1 py-0.5"
              />
            </div>
          </div>

          {/* Content with Variable quick inserter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                提示詞模板內容 (Prompt Content)
                <span className="text-rose-400">*</span>
              </label>

              {/* Quick Variable suggestions */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-[11px]">快捷插入變數:</span>
                {['專案名稱', '受眾', '目標', '口吻'].map((quickVar) => (
                  <button
                    key={quickVar}
                    type="button"
                    onClick={() => insertVariablePlaceholder(quickVar)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 border border-slate-700 text-[11px] transition font-mono cursor-pointer"
                  >
                    +{`{${quickVar}}`}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={9}
              placeholder="請撰寫完整的提示詞。使用 {關鍵詞} 作為待填寫的動態變數欄位，例如：請身為 {角色}，幫我針對 {目標市場} 產出一份 {主題} 分析報告..."
              required
              className="w-full p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-indigo-500 text-white font-mono text-sm leading-relaxed outline-none transition"
            />
          </div>

          {/* Detected Dynamic Variables Preview & Config */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-slate-200">
                  即時解析動態變數 ({detectedVars.length} 個)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                在上方使用 {'{變數名稱}'} 即可自動生成填空欄位
              </span>
            </div>

            {detectedVars.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                尚未在內容中偵測到任何 {'{變數}'}。您可以在提示詞中加入例如 {'{專案名稱}'} 或 {'{target_audience}'}。
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {detectedVars.map((v) => (
                  <div
                    key={v}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {`{${v}}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">自訂顯示標籤:</span>
                        <input
                          type="text"
                          value={customLabels[v] || ''}
                          placeholder={formatLabel(v)}
                          onChange={(e) =>
                            setCustomLabels({ ...customLabels, [v]: e.target.value })
                          }
                          className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">預設填入值:</span>
                        <input
                          type="text"
                          value={varDefaultValues[v] || ''}
                          placeholder="預設範例..."
                          onChange={(e) =>
                            setVarDefaultValues({ ...varDefaultValues, [v]: e.target.value })
                          }
                          className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional info & Google Sync Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">創作者/維護者:</span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="例如：AI 提示詞工程師"
                className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs outline-none"
              />
            </div>

            {hasGoogleSync && (
              <label className="flex items-center gap-2 cursor-pointer text-emerald-400 font-medium">
                <input
                  type="checkbox"
                  checked={syncToSheet}
                  onChange={(e) => setSyncToSheet(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <SheetIcon className="w-3.5 h-3.5" />
                <span>儲存時同步寫入 Google 試算表（自動版本控管）</span>
              </label>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? '更新並儲存版本' : '發佈提示詞模板'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
