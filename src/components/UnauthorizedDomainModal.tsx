import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldAlert, X } from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'floraya.github.io';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              需要將 GitHub Pages 網域加入授權清單
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Firebase 基於安全機制，只有在允許清單內的網域才能使用 Google 登入。請依照以下 2 個步驟新增：
            </p>
          </div>
        </div>

        {/* Domain to copy */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 font-medium block">
            步驟 1：複製您的 GitHub Pages 網域
          </span>
          <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
            <code className="text-xs font-mono font-bold text-emerald-400 selection:bg-emerald-800">
              {currentDomain}
            </code>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已複製</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製網域</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Button to Console */}
        <div className="space-y-2">
          <span className="text-[11px] text-slate-400 font-medium block">
            步驟 2：前往 Firebase 控制台加入「已授權網域」
          </span>
          <a
            href={consoleUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/20 transition active:scale-95 cursor-pointer"
          >
            <span>打開 Firebase 授權網域設定頁面</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-slate-500 text-center">
            點擊「Authorized domains (已授權網域)」➔「Add domain」貼上 <code>{currentDomain}</code> 儲存即立刻生效！
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            我知道了，關閉
          </button>
        </div>
      </div>
    </div>
  );
};
