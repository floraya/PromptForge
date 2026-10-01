import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  PromptTemplate,
  SheetConfig,
  CATEGORIES,
  INITIAL_PROMPT_TEMPLATES,
} from './types/prompt';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  createPromptSpreadsheet,
  syncPromptToSheet,
  batchSyncAllToSheet,
  pullPromptsFromSheet,
} from './services/sheetsService';
import { GoogleAuthBar } from './components/GoogleAuthBar';
import { PromptCard } from './components/PromptCard';
import { PromptRunner } from './components/PromptRunner';
import { PromptEditorModal } from './components/PromptEditorModal';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import { ConnectSheetModal } from './components/ConnectSheetModal';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Search,
  Plus,
  Filter,
  Sparkles,
  Sheet as SheetIcon,
  BookOpen,
  ArrowLeft,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  Wand2,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'promptforge_templates_v1';
const SHEET_CONFIG_KEY = 'promptforge_sheet_config_v1';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnectingAuth, setIsConnectingAuth] = useState(false);

  // Sheets state
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(() => {
    try {
      const stored = localStorage.getItem(SHEET_CONFIG_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Prompts Library state
  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_PROMPT_TEMPLATES;
    } catch {
      return INITIAL_PROMPT_TEMPLATES;
    }
  });

  // Selected Prompt for Runner view
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('全部類別');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save prompts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prompts));
    } catch (e) {
      console.error('Failed to save prompts to localStorage', e);
    }
  }, [prompts]);

  // Save sheet config to localStorage
  useEffect(() => {
    try {
      if (sheetConfig) {
        localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(sheetConfig));
      } else {
        localStorage.removeItem(SHEET_CONFIG_KEY);
      }
    } catch (e) {
      console.error('Failed to save sheetConfig to localStorage', e);
    }
  }, [sheetConfig]);

  // Automatically pull shared prompts on launch or if sheetConfig is set
  useEffect(() => {
    if (!sheetConfig) return;
    pullPromptsFromSheet(accessToken, sheetConfig)
      .then((pulled) => {
        if (pulled.length > 0) {
          setPrompts((prev) => {
            const map = new Map<string, PromptTemplate>();
            prev.forEach((p) => map.set(p.id, p));
            pulled.forEach((p) => {
              const old = map.get(p.id);
              map.set(p.id, {
                ...p,
                isFavorite: old?.isFavorite || false,
              });
            });
            return Array.from(map.values());
          });
          setSheetConfig((prev) => (prev ? { ...prev, lastSyncedAt: new Date().toISOString() } : null));
        }
      })
      .catch((e) => {
        console.warn('Initial auto pull error:', e);
      });
  }, [accessToken, sheetConfig?.spreadsheetId]);

  // Keep selectedPrompt synchronized with prompts state if updated
  useEffect(() => {
    if (selectedPrompt) {
      const fresh = prompts.find((p) => p.id === selectedPrompt.id);
      if (fresh) setSelectedPrompt(fresh);
    }
  }, [prompts]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setSyncToast({ message, type });
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Google Login Handler
  const handleSignIn = async () => {
    setIsConnectingAuth(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showNotification(`成功連結 Google 帳號 (${res.user.displayName || res.user.email})`);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('auth/unauthorized-domain') || err?.code === 'auth/unauthorized-domain') {
        setShowDomainModal(true);
      } else {
        showNotification(`登入失敗: ${errMsg}`, 'error');
      }
    } finally {
      setIsConnectingAuth(false);
    }
  };

  // Google Logout Handler
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    showNotification('已登出 Google 帳號');
  };

  // Create new Dedicated Google Spreadsheet
  const handleCreateSheet = async () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }
    setIsSyncing(true);
    try {
      const config = await createPromptSpreadsheet(accessToken, 'PromptForge - 提示詞庫與版本同步');
      setSheetConfig(config);
      // Batch sync initial prompts into it
      await batchSyncAllToSheet(accessToken, config, prompts);
      showNotification('Google 試算表已成功建立並同步初始提示詞庫！');
    } catch (err: any) {
      console.error('Failed to create sheet:', err);
      showNotification(`建立試算表失敗: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync All prompts to existing spreadsheet
  const handleSyncAll = async () => {
    if (!accessToken || !sheetConfig) {
      showNotification('請先登入並連結試算表', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      await batchSyncAllToSheet(accessToken, sheetConfig, prompts);
      setSheetConfig({ ...sheetConfig, lastSyncedAt: new Date().toISOString() });
      showNotification(`已將 ${prompts.length} 筆提示詞全部同步至 Google 試算表！`);
    } catch (err: any) {
      console.error('Sync all error:', err);
      showNotification(`同步失敗: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull latest updates from Google Spreadsheet (Multi-user sync)
  const handlePullFromSheet = async () => {
    if (!sheetConfig) {
      setShowConnectModal(true);
      return;
    }
    setIsSyncing(true);
    try {
      const pulled = await pullPromptsFromSheet(accessToken, sheetConfig);
      if (pulled.length > 0) {
        // Merge or replace
        const map = new Map<string, PromptTemplate>();
        // Keep current favorites
        prompts.forEach((p) => map.set(p.id, p));
        pulled.forEach((p) => {
          const old = map.get(p.id);
          map.set(p.id, {
            ...p,
            isFavorite: old?.isFavorite || false,
          });
        });
        const merged = Array.from(map.values());
        setPrompts(merged);
        setSheetConfig({ ...sheetConfig, lastSyncedAt: new Date().toISOString() });
        showNotification(`成功從共用試算表同步載入 ${pulled.length} 筆所有人上傳的提示詞！`);
      } else {
        showNotification('試算表中尚無資料列');
      }
    } catch (err: any) {
      console.error('Pull error:', err);
      showNotification(`載入失敗: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect to an existing shared Google Sheet
  const handleConnectExistingSheet = async (sheetUrlOrId: string) => {
    let sheetId = sheetUrlOrId.trim();
    // Match ID from URL like https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
    const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    const newConfig: SheetConfig = {
      spreadsheetId: sheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      sheetTitle: '提示詞模板庫',
      autoSync: true,
      lastSyncedAt: new Date().toISOString(),
    };

    // Test pulling from it
    const pulled = await pullPromptsFromSheet(accessToken, newConfig);
    setSheetConfig(newConfig);

    if (pulled.length > 0) {
      const map = new Map<string, PromptTemplate>();
      prompts.forEach((p) => map.set(p.id, p));
      pulled.forEach((p) => {
        const old = map.get(p.id);
        map.set(p.id, {
          ...p,
          isFavorite: old?.isFavorite || false,
        });
      });
      setPrompts(Array.from(map.values()));
      showNotification(`成功連結並載入 ${pulled.length} 筆共用提示詞！`);
    } else {
      showNotification('已成功綁定共用試算表！');
    }
  };

  // Copy shareable link for others to join
  const handleShareSheet = async () => {
    if (!sheetConfig) return;
    try {
      await navigator.clipboard.writeText(sheetConfig.spreadsheetUrl);
      showNotification('已複製 Google 試算表共用網址！將此網址分享給他人即可同步提示詞庫。');
    } catch {
      showNotification(`共用網址: ${sheetConfig.spreadsheetUrl}`);
    }
  };

  // Save or Update Prompt (From Modal)
  const handleSavePrompt = async (promptToSave: PromptTemplate, syncImmediately: boolean) => {
    const existingIndex = prompts.findIndex((p) => p.id === promptToSave.id);
    let updatedList: PromptTemplate[];

    if (existingIndex >= 0) {
      updatedList = [...prompts];
      updatedList[existingIndex] = promptToSave;
    } else {
      updatedList = [promptToSave, ...prompts];
    }

    setPrompts(updatedList);

    // If sync immediately to Google Sheet is enabled
    if (syncImmediately && accessToken && sheetConfig) {
      setIsSyncing(true);
      try {
        await syncPromptToSheet(accessToken, sheetConfig, promptToSave);
        setSheetConfig({ ...sheetConfig, lastSyncedAt: new Date().toISOString() });
        showNotification(`提示詞【${promptToSave.title}】(v${promptToSave.version}) 已同步儲存至 Google 試算表！`);
      } catch (err: any) {
        console.error('Error syncing prompt to sheet:', err);
        showNotification(`儲存成功，但試算表同步失敗: ${err.message}`, 'error');
      } finally {
        setIsSyncing(false);
      }
    } else {
      showNotification(`提示詞【${promptToSave.title}】已成功儲存！`);
    }

    // If currently viewing this prompt in runner, keep it active
    if (selectedPrompt?.id === promptToSave.id) {
      setSelectedPrompt(promptToSave);
    }
  };

  // Quick update images for a prompt (e.g. from runner)
  const handleUpdatePromptImages = (promptId: string, images: string[]) => {
    setPrompts((prev) =>
      prev.map((p) => {
        if (p.id !== promptId) return p;
        return {
          ...p,
          previewImageUrl: images[0] || undefined,
          showcaseImages: images.length > 0 ? images : undefined,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showNotification('成果圖片已成功更新！');
  };

  // Sync a single prompt from Runner view
  const handleSyncSinglePrompt = async (prompt: PromptTemplate) => {
    if (!accessToken || !sheetConfig) {
      if (!user) {
        handleSignIn();
      } else if (!sheetConfig) {
        handleCreateSheet();
      }
      return;
    }
    setIsSyncing(true);
    try {
      await syncPromptToSheet(accessToken, sheetConfig, prompt);
      setSheetConfig({ ...sheetConfig, lastSyncedAt: new Date().toISOString() });
      showNotification(`提示詞【${prompt.title}】v${prompt.version} 已寫入 Google 試算表！`);
    } catch (err: any) {
      console.error('Single prompt sync error:', err);
      showNotification(`同步失敗: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  // Filter prompts
  const filteredPrompts = prompts.filter((p) => {
    if (selectedCategory !== '全部類別' && p.category !== selectedCategory) {
      return false;
    }
    if (showFavoritesOnly && !p.isFavorite) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      const matchContent = p.content.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTags || matchContent;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Google Sheets Sync Header Bar */}
      <GoogleAuthBar
        user={user}
        sheetConfig={sheetConfig}
        isConnecting={isConnectingAuth}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onCreateSheet={handleCreateSheet}
        onSyncAll={handleSyncAll}
        onPullFromSheet={handlePullFromSheet}
        onOpenConnectModal={() => setShowConnectModal(true)}
        onShareSheet={handleShareSheet}
      />

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPrompt(null)}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black tracking-tight text-white block group-hover:text-indigo-400 transition">
                  PromptForge
                </span>
                <span className="text-[10px] text-slate-400 -mt-0.5 block tracking-wider uppercase">
                  專業提示詞庫 & 生成器
                </span>
              </div>
            </button>
          </div>

          {/* Top Actions: Create / Generator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {selectedPrompt && (
              <button
                onClick={() => setSelectedPrompt(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">返回提示詞庫</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingPrompt(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>新增提示詞 (Prompt Generator)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-xs sm:text-sm font-medium ${
              syncToast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            }`}
          >
            {syncToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{syncToast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {selectedPrompt ? (
          /* Single Prompt Runner View (Like https://godofprompt.ai/prompt-library/build-full-stack-software-architectures) */
          <div>
            <div className="mb-4">
              <button
                onClick={() => setSelectedPrompt(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回提示詞庫列表 (Prompt Library)</span>
              </button>
            </div>

            <PromptRunner
              prompt={selectedPrompt}
              onEditPrompt={(p) => {
                setEditingPrompt(p);
                setIsEditorOpen(true);
              }}
              onSyncThisPromptToSheet={accessToken ? handleSyncSinglePrompt : undefined}
              onUpdatePromptImages={handleUpdatePromptImages}
              isSyncing={isSyncing}
              sheetUrl={sheetConfig?.spreadsheetUrl}
            />
          </div>
        ) : (
          /* Prompt Library Hub (Like https://godofprompt.ai/prompt-library) */
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 py-6 px-4 sm:px-8 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

              <div className="max-w-2xl mx-auto space-y-3 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/40 text-indigo-400 text-[11px] font-medium">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>神級提示詞庫 (Prompt Library) & 自訂填空生成器</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  精準釋放 AI 潛能的{' '}
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
                    專業提示詞庫與工作流
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  參考 God of Prompt 體驗，支援動態變數填寫、即時產生複製提示詞。
                  可一鍵將自訂提示詞備份並寫入 Google 試算表進行版本管理與團隊多人同步！
                </p>

                {/* Big Search Input */}
                <div className="pt-1 max-w-lg mx-auto">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋提示詞標題、描述、變數或標籤..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-xs sm:text-sm outline-none shadow-md transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                      >
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Navigation: Categories & Tags */}
            <div className="space-y-3">
              {/* Category Pills - Wrap downward without horizontal scroll */}
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category;
                  const count =
                    category === '全部類別'
                      ? prompts.length
                      : prompts.filter((p) => p.category === category).length;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>{category}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tag filters & favorites toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-900">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      showFavoritesOnly
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>只看最愛 ({prompts.filter((p) => p.isFavorite).length})</span>
                  </button>
                </div>

                <span className="text-slate-500 text-xs">
                  顯示 <strong>{filteredPrompts.length}</strong> 個提示詞模板
                </span>
              </div>
            </div>

            {/* Prompt Cards Grid */}
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">找不到符合條件的提示詞</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  嘗試清除搜尋字詞或篩選條件，或者點擊右上角的「新增提示詞」自行建立！
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('全部類別');
                    setSearchQuery('');
                    setShowFavoritesOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-400 font-semibold transition"
                >
                  重設所有篩選條件
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onSelect={(p) => setSelectedPrompt(p)}
                    onEdit={(p) => {
                      setEditingPrompt(p);
                      setIsEditorOpen(true);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Prompt Editor & Generator Modal */}
      <PromptEditorModal
        isOpen={isEditorOpen}
        initialPrompt={editingPrompt}
        hasGoogleSync={Boolean(user && sheetConfig)}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
      />

      {/* Unauthorized Domain Guide Modal */}
      <UnauthorizedDomainModal
        isOpen={showDomainModal}
        onClose={() => setShowDomainModal(false)}
        projectId={firebaseConfig.projectId || 'gen-lang-client-0776135231'}
      />

      {/* Connect Shared Sheet Modal */}
      <ConnectSheetModal
        isOpen={showConnectModal}
        currentSpreadsheetUrl={sheetConfig?.spreadsheetUrl}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectExistingSheet}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>PromptForge 提示詞編輯庫 — 打造專屬 AI 提示詞工程知識庫</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>支援動態變數填空</span>
            <span>•</span>
            <span>Google 試算表協作</span>
            <span>•</span>
            <span>多版本追蹤</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
