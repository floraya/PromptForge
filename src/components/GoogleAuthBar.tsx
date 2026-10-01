import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, RefreshCw, ExternalLink, Sheet as SheetIcon, Share2, Link2 } from 'lucide-react';
import { SheetConfig } from '../types/prompt';

interface GoogleAuthBarProps {
  user: User | null;
  sheetConfig: SheetConfig | null;
  isConnecting: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onCreateSheet: () => void;
  onSyncAll: () => void;
  onPullFromSheet: () => void;
  onOpenConnectModal: () => void;
  onShareSheet: () => void;
}

export const GoogleAuthBar: React.FC<GoogleAuthBarProps> = ({
  user,
  sheetConfig,
  isConnecting,
  isSyncing,
  onSignIn,
  onSignOut,
  onCreateSheet,
  onSyncAll,
  onPullFromSheet,
  onOpenConnectModal,
  onShareSheet,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* Left side: Google Sheets sync status */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Google 試算表多人共用庫
          </div>

          {sheetConfig ? (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-400">已同步試算表:</span>
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                title="開啟 Google 試算表"
              >
                <SheetIcon className="w-3.5 h-3.5" />
                <span className="max-w-[200px] truncate">{sheetConfig.sheetTitle}</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>

              {/* Share / Copy link for others button */}
              <button
                type="button"
                onClick={onShareSheet}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-600/40 text-[11px] font-medium transition cursor-pointer"
                title="複製此試算表共用連結，提供給其他人一起檢視與編輯"
              >
                <Share2 className="w-3 h-3" />
                <span>複製共用連結</span>
              </button>

              <button
                type="button"
                onClick={onOpenConnectModal}
                className="text-slate-400 hover:text-slate-200 text-[11px] underline ml-1"
                title="切換或連結其他 Google 試算表"
              >
                切換試算表
              </button>

              {sheetConfig.lastSyncedAt && (
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  (最後同步: {new Date(sheetConfig.lastSyncedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">
                尚未綁定試算表，可建立或連結共用試算表：
              </span>
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-700/50 text-xs font-medium transition cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>連結已有的共用試算表網址</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side: Actions & User State */}
        <div className="flex items-center gap-2">
          {sheetConfig && (
            <button
              onClick={onPullFromSheet}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition disabled:opacity-50 cursor-pointer"
              title="立即從共用試算表抓取所有人上傳的最新提示詞"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncing ? '同步中...' : '同步/載入試算表'}</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2.5">
              {sheetConfig ? (
                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
                  title="將本機提示詞全部推送至共用試算表"
                >
                  <span>推送本機至試算表</span>
                </button>
              ) : (
                <button
                  onClick={onCreateSheet}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <SheetIcon className="w-3.5 h-3.5" />
                  <span>建立共用同步試算表</span>
                </button>
              )}

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-slate-600 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-slate-300 max-w-[120px] truncate hidden md:inline">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded transition"
                  title="登出 Google 帳號"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {!sheetConfig && (
                <button
                  onClick={onOpenConnectModal}
                  className="px-2.5 py-1 rounded text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 transition"
                >
                  輸入試算表連結
                </button>
              )}
              {/* Official Google Sign-In styled button */}
              <button
                onClick={onSignIn}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>{isConnecting ? '連線中...' : 'Google 登入上傳/同步'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
