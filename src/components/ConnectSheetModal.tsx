import React, { useState } from 'react';
import { Sheet as SheetIcon, Link2, AlertCircle, X, Check, HelpCircle } from 'lucide-react';

interface ConnectSheetModalProps {
  isOpen: boolean;
  currentSpreadsheetUrl?: string;
  onClose: () => void;
  onConnect: (sheetUrlOrId: string) => Promise<void>;
}

export const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  currentSpreadsheetUrl,
  onClose,
  onConnect,
}) => {
  const [urlInput, setUrlInput] = useState(currentSpreadsheetUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = urlInput.trim();
    if (!input) {
      setError('請輸入 Google 試算表連結或試算表 ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConnect(input);
      onClose();
    } catch (err: any) {
      setError(err?.message || '連結試算表失敗，請確認網址格式或試算表共用權限');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <SheetIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">連結團隊/共用 Google 試算表</h3>
              <p className="text-xs text-slate-400">所有人輸入同一張試算表網址，即可即時同步查看所有提示詞</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              Google 試算表完整網址或 Spreadsheet ID
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-500 outline-none transition"
              required
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>如何實現「所有人都能看到同一份提示詞」？</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>
                打開該 Google 試算表，點右上角<strong>「共用」</strong>按鈕。
              </li>
              <li>
                將一般存取權設為<strong>「知道連結的使用者皆可檢視」</strong>（或可編輯）。
              </li>
              <li>
                複製試算表網址貼入上方欄位，點擊「連結並同步」即可！
              </li>
              <li>
                其他使用者開啟網站後，只要同樣綁定該網址，就能看見並使用您上傳的關鍵詞。
              </li>
            </ol>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>連線讀取中...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>連結並同步提示詞</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
