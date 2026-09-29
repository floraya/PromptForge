# PromptForge - 專業提示詞庫與生成器 (Prompt Library & Generator)

參考知名 AI 提示詞社群平台 [God of Prompt](https://godofprompt.ai) 設計的高效提示詞庫與互動生成器。支援動態變數填寫、即時產出可複製提示詞、多維度標籤分類管理，並整合 Google 試算表（Google Sheets）實現版本控管與團隊多人同步協作。

---

## 🚀 主要特色功能

### 1. 專業提示詞庫 (Prompt Library)
- **多領域精選模板**：預載涵蓋軟體架構設計、爆款社群文案 (Copywriting)、SEO 萬字規劃、自主 AI Agent 系統指令、麥肯錫商業策略 (GTM) 等頂級模板。
- **靈活篩選與分類**：支援依專業領域類別、自訂標籤 (Tags)、關鍵字全文搜尋以及「我的最愛」進行快速檢索。

### 2. 動態變數填空與即時生成 (Interactive Prompt Runner)
- **填空式生成體驗**：參考 [God of Prompt - Software Architect](https://godofprompt.ai/prompt-library/build-full-stack-software-architectures)，每個提示詞均具備專屬變數設定介面。
- **雙欄對照**：
  - 左側提供結構化輸入欄位（支援文字、長文本、預設值一鍵填入與重設）。
  - 右側即時動態編譯提示詞內容，並支援**一鍵複製到剪貼簿**，可立即貼入 ChatGPT、Claude、Gemini 等大語言模型使用。
  - 支援「原始代碼」與「填空預覽」快速切換。

### 3. 提示詞編輯器與產生器 (Prompt Generator & Editor)
- **自訂模板建立**：輕鬆建立專屬提示詞，自訂標題、類別、標籤與簡介。
- **智慧自動偵測變數**：只要在提示詞內容中使用 `{變數名稱}` 語法，系統即時自動解析並生成客製化表單設定。
- **版本遞增控管**：每次修改儲存時自動追蹤遞增版本號（v1, v2...），維護完整演進歷程。

### 4. Google 試算表雙向同步與團隊協作 (Google Sheets Integration)
- **官方 Google OAuth 授權**：安全整合 Google 帳號。
- **一鍵建立團隊試算表**：自動建立具備格式化標題列（ID、標題、分類、標籤、完整內容、變數 JSON、版本號、作者、更新時間）的 Google 試算表。
- **自動寫入與同步**：
  - 新增或編輯提示詞時，可一鍵直接寫入或更新 Google 試算表。
  - **全部上傳 (Batch Sync)**：將本機提示詞庫批次同步至雲端試算表。
  - **從試算表載入 (Pull from Sheet)**：讀取試算表中最新由團隊成員新增或維護的提示詞，實現跨團隊多人即時協作。

---

## 🛠 技術架構

- **前端框架**：React 19, TypeScript
- **樣式設計**：Tailwind CSS v4
- **圖示庫**：Lucide React
- **認證與儲存**：Firebase Auth (Google OAuth 2.0 with Sheets & Drive Scopes)
- **雲端整合**：Google Sheets API v4, Google Drive API v3
- **本機快取**：LocalStorage (離線亦可正常預覽與生成)

---

## 📖 使用指南

1. **挑選提示詞**：在主頁提示詞庫中，點選任何卡片進入填空模式。
2. **填寫參數**：依您的專案背景修改左側欄位的參數，右側將即時組合出完整的提示詞。
3. **複製執行**：點擊「複製提示詞」，直接貼到任何 AI 工具中使用。
4. **新增自己的提示詞**：點擊右上角「新增提示詞」，在內容寫入 `{變數}` 即可自動建立互動模板。
5. **連結 Google 試算表**：
   - 點擊頂端「使用 Google 登入同步試算表」。
   - 點擊「建立團隊同步試算表」，後續所有新提示詞與版本均會同步至 Google 試算表保存！
