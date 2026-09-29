import React from 'react';
import { PromptTemplate } from '../types/prompt';
import {
  Tag,
  Folder,
  ArrowRight,
  Sparkles,
  Sheet as SheetIcon,
  Star,
  Layers,
  Edit,
} from 'lucide-react';

interface PromptCardProps {
  prompt: PromptTemplate;
  onSelect: (prompt: PromptTemplate) => void;
  onEdit: (prompt: PromptTemplate) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onSelect,
  onEdit,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelect(prompt)}
      className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Category & Version & Favorite */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/70 border border-indigo-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Folder className="w-3 h-3" />
            {prompt.category}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              v{prompt.version}
            </span>
            <button
              onClick={(e) => onToggleFavorite(prompt.id, e)}
              className={`p-1 rounded-md transition ${
                prompt.isFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={prompt.isFavorite ? '取消最愛' : '加入最愛'}
            >
              <Star className={`w-3.5 h-3.5 ${prompt.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
          {prompt.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {prompt.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 group-hover:text-slate-300 transition"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-500">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 mt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{prompt.variables.length} 個自訂變數</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(prompt);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition"
            title="編輯此提示詞"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
            <span>使用</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
