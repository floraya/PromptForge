export interface PromptTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  content: string; // The raw prompt containing {variable}
  variables: PromptVariable[];
  defaultValues: Record<string, string>;
  isFavorite?: boolean;
  version: number;
  author?: string;
  createdAt: string;
  updatedAt: string;
  syncedToSheet?: boolean;
  sheetRowIndex?: number;
}

export interface PromptVariable {
  key: string;
  label: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export const CATEGORIES = [
  '全部類別',
  '軟體架構 & 工程',
  '行銷與文案 (Copywriting)',
  'SEO & 內容策略',
  '商業營運 & 策略',
  '數據分析 & 研究',
  '產品設計 & UI/UX',
  '學習與個人成長',
  'AI Agent & 自動化',
] as const;

export const INITIAL_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'full-stack-arch',
    title: '全端軟體架構設計師 (Full-Stack Software Architect)',
    slug: 'build-full-stack-software-architectures',
    description: '設計高可用、可擴展之現代化全端架構規格書，包含前後端技術選型、資料庫架構、快取機制與安全部署策略。',
    category: '軟體架構 & 工程',
    tags: ['架構設計', '全端開發', '微服務', '系統設計', 'DevOps'],
    content: `你是一位擁有 15 年以上頂尖科技公司經驗的資深全端首席架構師（Chief Architect）。

請為我的專案【{project_name}】設計一份企業級全端軟體架構規格書。

### 專案背景與需求：
- 核心目標：{core_objective}
- 預期用戶量與規模：{target_scale}
- 前端偏好技術：{frontend_stack}
- 後端偏好架構：{backend_stack}
- 主要資料庫或存儲策略：{database_choice}
- 雲端或部署環境：{deployment_env}
- 安全性與法規要求：{security_requirements}

### 請依循以下結構產出詳盡架構指南：
1. **系統整體拓撲圖規劃**（文字流程架構，涵蓋 CDN、負載平衡器、API 閘道器、服務層與快取）
2. **前後端分離架構與狀態管理**（狀態流、SSR/SSG、API 規格協議如 GraphQL/REST/tRPC）
3. **資料庫架構與快取策略**（關聯性與非關聯性資料模型、讀寫分離、Redis 快取失效策略）
4. **驗證與存取控制 (IAM / Auth)**（JWT/OAuth2/RBAC 實作與防護防偽）
5. **CI/CD 自動化與監控告警**（Docker、Kubernetes、Prometheus/Grafana、Log 聚合）
6. **潛在瓶頸與 3 階段擴展預案**（當用戶成長 10 倍時的應對策略）`,
    variables: [
      { key: 'project_name', label: '專案名稱', defaultValue: 'AI 智慧助理 SaaS 平台', placeholder: '例如：跨國電商平台 / AI 助理' },
      { key: 'core_objective', label: '核心目標', defaultValue: '提供高併發即時對話與工作流自動化平台', placeholder: '說明專案欲達成的關鍵價值' },
      { key: 'target_scale', label: '預期規模', defaultValue: '首年 10 萬活躍用戶，尖峰 QPS 約 1,200', placeholder: '例如：DAU 50,000 / QPS 500' },
      { key: 'frontend_stack', label: '前端偏好技術', defaultValue: 'Next.js 15, TypeScript, Tailwind CSS, Zustand', placeholder: '例如：React / Next.js / Vue' },
      { key: 'backend_stack', label: '後端技術選型', defaultValue: 'Go / Node.js 微服務, gRPC, Redis, BullMQ', placeholder: '例如：FastAPI / Go / NestJS' },
      { key: 'database_choice', label: '資料庫策略', defaultValue: 'PostgreSQL (主資料庫) + Redis (Session/快取) + Pinecone (向量)', placeholder: '例如：PostgreSQL + Redis' },
      { key: 'deployment_env', label: '部署環境', defaultValue: 'AWS (EKS, CloudFront, RDS Aurora Serverless)', placeholder: '例如：GCP / AWS / Vercel + Supabase' },
      { key: 'security_requirements', label: '安全性/法規', defaultValue: 'SOC2 準則、AES-256 加密、嚴格 RBAC 權限與 Rate Limiting', placeholder: '例如：GDPR, SOC2, OWASP' },
    ],
    defaultValues: {
      project_name: 'AI 智慧助理 SaaS 平台',
      core_objective: '提供高併發即時對話與工作流自動化平台',
      target_scale: '首年 10 萬活躍用戶，尖峰 QPS 約 1,200',
      frontend_stack: 'Next.js 15, TypeScript, Tailwind CSS, Zustand',
      backend_stack: 'Go / Node.js 微服務, gRPC, Redis, BullMQ',
      database_choice: 'PostgreSQL (主資料庫) + Redis (Session/快取) + Pinecone (向量)',
      deployment_env: 'AWS (EKS, CloudFront, RDS Aurora Serverless)',
      security_requirements: 'SOC2 準則、AES-256 加密、嚴格 RBAC 權限與 Rate Limiting',
    },
    version: 1,
    author: 'God of Prompt Team',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    isFavorite: true,
  },
  {
    id: 'viral-copywriting-master',
    title: '爆款社群銷售文案大師 (Viral Copywriting Master)',
    slug: 'viral-social-media-copywriting',
    description: '運用 PAS / AIDA / StoryBrand 框架，針對目標受眾痛點撰寫吸睛、高互動與高轉化率之社群爆款銷售文案。',
    category: '行銷與文案 (Copywriting)',
    tags: ['行銷文案', '社群經營', '轉化率', '心理學', '爆款'],
    content: `你是一位頂級 Direct-Response 銷售文案大師，精通 Eugene Schwartz 顧客意識 5 階段與 Robert Cialdini 影響力心理學。

請為產品【{product_name}】撰寫 3 組高點擊、高轉換的社群爆款文案，投放管道為【{channel}】。

### 產品與受眾資料：
- 目標受眾 (Target Audience)：{target_audience}
- 核心痛點 (Pain Point)：{pain_point}
- 產品主要賣點與突破：{unique_selling_prop}
- 優惠或行動呼籲 (Call To Action)：{cta}
- 文案語氣風格：{tone_of_voice}

### 請輸出以下三種不同文案風格版本：
1. **【PAS 痛點刺激轉化型】**：深入共情痛點 -> 放大不行動的代價 -> 引入解方 -> 強烈 CTA
2. **【反常識/認知反差故事型】**：打破大眾既有常識吸睛 -> 帶出個人啟發故事 -> 揭露產品秘密
3. **【乾貨清單 + 價值堆疊型】**：條列 3 個立刻見效的技巧，最後無縫導流至促銷/註冊

請在每篇文案文末附上適合的 Emoji 視覺排版與 5 個精準的 Hashtags。`,
    variables: [
      { key: 'product_name', label: '產品或服務名稱', defaultValue: 'Notion 企業高效生產力模組庫', placeholder: '例如：健康代餐奶昔 / 線上課程' },
      { key: 'channel', label: '投放平台/社群', defaultValue: 'Threads & Instagram', placeholder: '例如：Facebook / Threads / LinkedIn / 電子報' },
      { key: 'target_audience', label: '目標受眾畫像', defaultValue: '經常加班、每天被雜事追著跑的科技業經理人與自由接案者', placeholder: '受眾身分、年齡或特徵' },
      { key: 'pain_point', label: '核心困境與痛點', defaultValue: '筆記分散在各處、任務永遠做不完、找不到重要資料浪費大把時間', placeholder: '受眾最想解決的煩惱' },
      { key: 'unique_selling_prop', label: '獨家賣點/優勢', defaultValue: '開箱即用、一鍵串接 Google 日曆、內建自動化專案看板', placeholder: '為什麼非選你不可' },
      { key: 'cta', label: '行動呼籲 (CTA)', defaultValue: '限時領取早鳥 6 折優惠，留言「模組」立即寄送載點！', placeholder: '例如：點擊個人檔案連結免費體驗' },
      { key: 'tone_of_voice', label: '文案口吻', defaultValue: '犀利幽默、專業乾貨、像懂你的朋友在分享真心話', placeholder: '例如：溫柔知性 / 熱情澎湃 / 幽默犀利' },
    ],
    defaultValues: {
      product_name: 'Notion 企業高效生產力模組庫',
      channel: 'Threads & Instagram',
      target_audience: '經常加班、每天被雜事追著跑的科技業經理人與自由接案者',
      pain_point: '筆記分散在各處、任務永遠做不完、找不到重要資料浪費大把時間',
      unique_selling_prop: '開箱即用、一鍵串接 Google 日曆、內建自動化專案看板',
      cta: '限時領取早鳥 6 折優惠，留言「模組」立即寄送載點！',
      tone_of_voice: '犀利幽默、專業乾貨、像懂你的朋友在分享真心話',
    },
    version: 1,
    author: 'Copywriting AI Lab',
    createdAt: '2026-03-16T12:00:00Z',
    updatedAt: '2026-03-22T14:30:00Z',
    isFavorite: true,
  },
  {
    id: 'seo-top-ranking-generator',
    title: 'SEO 萬字長文與 Google 排名規劃師',
    slug: 'seo-top-ranking-content-architect',
    description: '針對特定關鍵字生成具備 E-E-A-T 權威性架構的深度 SEO 長文大綱與內容策略，搶佔搜尋首頁。',
    category: 'SEO & 內容策略',
    tags: ['SEO', '搜尋引擎優化', '內容行銷', 'E-E-A-T', '關鍵字'],
    content: `你是一位資深 SEO 內容專家與搜尋引擎演算演算法研究員。

我的目標是讓關鍵字【{focus_keyword}】在 Google 搜尋結果獲得排名第一。

請根據以下設定，產出一份極具競爭力的深度文章大綱與內容撰寫指南：
- 主關鍵字：{focus_keyword}
- 次要關鍵字 (LSI)：{secondary_keywords}
- 目標搜尋意圖：{search_intent}
- 內容類型：{content_format}
- 競爭對手文章常見缺點：{competitor_weakness}

### 請提供以下規劃：
1. **吸睛高 CTR 的 5 組 H1 標題構想**（包含數字、疑問、痛點與承諾）
2. **Meta Description 撰寫建議**（130-155 字元，包含主關鍵字與點擊誘因）
3. **完整的 H2 / H3 階層大綱規劃**（涵蓋使用者常見問題 FAQ 與結構化資料 Schema 建議）
4. **E-E-A-T 權威性強化點**（如何融入實證數據、專家觀點、圖表設計建議）
5. **內部連結與導購錨點 (Anchor Text) 布局戰略**`,
    variables: [
      { key: 'focus_keyword', label: '主關鍵字', defaultValue: '2026 最佳專案管理軟體推薦', placeholder: '例如：美白精華液推薦 / 買房流程指南' },
      { key: 'secondary_keywords', label: '次要/長尾關鍵字', defaultValue: '專案管理工具比較, 免費甘特圖軟體, 敏捷團隊協作', placeholder: '逗號分隔的關鍵字' },
      { key: 'search_intent', label: '搜尋意圖', defaultValue: '商業調查 (Commercial) 與 資訊型 (Informational)', placeholder: '例如：交易型 / 資訊型 / 導航型' },
      { key: 'content_format', label: '文章格式', defaultValue: '深度綜合評測指南 + 功能對照表 + 挑選決策樹', placeholder: '例如：步驟教學 / 懶人包 / 評測' },
      { key: 'competitor_weakness', label: '競品現有缺點', defaultValue: '只列出外觀沒有實際團隊試用體驗、價格方案過期、缺乏免費方案限制說明', placeholder: '競品不足處' },
    ],
    defaultValues: {
      focus_keyword: '2026 最佳專案管理軟體推薦',
      secondary_keywords: '專案管理工具比較, 免費甘特圖軟體, 敏捷團隊協作',
      search_intent: '商業調查 (Commercial) 與 資訊型 (Informational)',
      content_format: '深度綜合評測指南 + 功能對照表 + 挑選決策樹',
      competitor_weakness: '只列出外觀沒有實際團隊試用體驗、價格方案過期、缺乏免費方案限制說明',
    },
    version: 1,
    author: 'Growth SEO Studio',
    createdAt: '2026-03-18T09:15:00Z',
    updatedAt: '2026-03-24T16:00:00Z',
    isFavorite: false,
  },
  {
    id: 'ai-agent-system-prompt',
    title: '自主 AI Agent 系統指令架構師 (Agentic System Prompt)',
    slug: 'ai-agent-system-prompt-builder',
    description: '構建嚴謹、反幻覺、具備工具調用規範 (Tool Calling) 與防越獄機制的企業級 AI Agent System Prompt。',
    category: 'AI Agent & 自動化',
    tags: ['AI Agent', 'System Prompt', 'Prompt Engineering', 'LangChain', '安全防護'],
    content: `你是一位資深 Prompt Engineer 與 AI Agent 架構師。

請為具備自主規劃能力的 AI Agent【{agent_role}】撰寫一段高度模組化且安全的 System Prompt。

### Agent 職責與環境：
- 角色定位：{agent_role}
- 運作任務目標：{primary_mission}
- 允許使用的工具/API：{available_tools}
- 思考與決策框架：{reasoning_framework}
- 安全護欄與拒絕回答條件：{safety_guardrails}
- 輸出格式規範：{output_format}

### 請按照以下最佳實踐設計 System Prompt：
\`\`\`markdown
# ROLE & CORE PERSONA
[角色身份設定與核心心態]

# EXECUTION WORKFLOW
[逐步規劃、反思、執行、驗證的 ReAct / Plan-and-Solve 循環]

# TOOL INVOCATION RULES
[嚴格限制不可假設未知參數、錯誤重試機制、確認機制]

# BOUNDARIES & SECURITY
[防 Prompt Injection 注入攻擊、幻覺消除、超時與終止條件]

# RESPONSE TEMPLATE
[標準回答或 JSON 結構範本]
\`\`\``,
    variables: [
      { key: 'agent_role', label: 'Agent 角色定位', defaultValue: '跨雲端資源成本最佳化分析師 (Cloud FinOps Agent)', placeholder: '例如：客服專員 / 資料科學助手' },
      { key: 'primary_mission', label: '主要任務目標', defaultValue: '分析用戶 AWS 與 GCP 月度帳單，自動偵測未充分利用的閒置實例並產出降本提案', placeholder: '任務目標' },
      { key: 'available_tools', label: '可調用工具清單', defaultValue: 'aws_cost_explorer, gcp_billing_api, slack_notify, export_csv', placeholder: '工具函式名稱' },
      { key: 'reasoning_framework', label: '思考框架', defaultValue: 'Thought -> Action -> Observation (ReAct) + 自我反思驗證', placeholder: '例如：ReAct / Chain of Thought' },
      { key: 'safety_guardrails', label: '安全護欄', defaultValue: '絕不能未經人工點擊確認即調用刪除/終止資源 API；嚴禁洩露 Cloud Credentials', placeholder: '限制與安全規則' },
      { key: 'output_format', label: '輸出格式', defaultValue: 'Markdown 摘要報表 + 具備 savings_estimate 與 risk_level 的結構化 JSON', placeholder: '例如：Markdown / JSON' },
    ],
    defaultValues: {
      agent_role: '跨雲端資源成本最佳化分析師 (Cloud FinOps Agent)',
      primary_mission: '分析用戶 AWS 與 GCP 月度帳單，自動偵測未充分利用的閒置實例並產出降本提案',
      available_tools: 'aws_cost_explorer, gcp_billing_api, slack_notify, export_csv',
      reasoning_framework: 'Thought -> Action -> Observation (ReAct) + 自我反思驗證',
      safety_guardrails: '絕不能未經人工點擊確認即調用刪除/終止資源 API；嚴禁洩露 Cloud Credentials',
      output_format: 'Markdown 摘要報表 + 具備 savings_estimate 與 risk_level 的結構化 JSON',
    },
    version: 1,
    author: 'AI Automation Hub',
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-03-25T17:40:00Z',
    isFavorite: true,
  },
  {
    id: 'executive-business-strategy',
    title: '麥肯錫級商業策略與市場進入 (Go-to-Market Strategy)',
    slug: 'mckinsey-style-gtm-business-strategy',
    description: '以頂級管理顧問架構，產出嚴密市場進入、定價包裝與 TAM/SAM/SOM 估算報告。',
    category: '商業營運 & 策略',
    tags: ['商業策略', 'GTM', '市場分析', '定價策略', '創業'],
    content: `你是一位曾任職於 McKinsey & Company 與 Sequoia Capital 的資深策略合夥人。

請針對即將推出的商業項目【{venture_name}】，運用 MECE 原則制定一套完整的市場進入策略 (Go-to-Market Strategy)。

### 商業背景資料：
- 項目名稱與領域：{venture_name}
- 核心解決方案：{core_offering}
- 目標產業與客戶規模：{industry_and_segment}
- 現有主要競爭對手：{direct_competitors}
- 預算與時間週期：{timeline_and_budget}

### 請提供以下四個維度的深度分析：
1. **市場總量與進入路徑 (TAM / SAM / SOM & Beachhead Market)**
   - 找出初期阻力最小、最容易產生滾雪球效應的利基灘頭堡市場
2. **產品定價與包裝矩陣 (Pricing & Monetization Architecture)**
   - 推薦 3 種定價模式（Freemium, Tiered, Usage-based），並評估 LTV/CAC 比率
3. **獲客管道分配 (Customer Acquisition Channels)**
   - 依據 0-6 個月、6-18 個月階段，列出 Organic (SEO/社群)、Paid、Outbound 與 Partner 比例
4. **關鍵執行里程碑與風險對沖 (Milestones & Strategic Moats)**
   - 如何打造防禦壁壘（網路效應、切換成本、品牌心智）`,
    variables: [
      { key: 'venture_name', label: '商業項目名稱', defaultValue: 'MedFlow - 診所 AI 自動掛號與語音分診 SaaS', placeholder: '項目或品牌名稱' },
      { key: 'core_offering', label: '核心產品/服務', defaultValue: '結合 LLM 與 VoIP 語音電話，24小時自動應對病患預約並即時排入醫療系統', placeholder: '核心解決方案' },
      { key: 'industry_and_segment', label: '目標產業/客戶', defaultValue: '中小型牙科、家醫科與物理治療診所 (員工數 5-25 人)', placeholder: '例如：中小企業 / 零售電商' },
      { key: 'direct_competitors', label: '競品或現有做法', defaultValue: '診所前台人工總機電話紀錄、傳統舊式預約系統', placeholder: '現有同業或替代方案' },
      { key: 'timeline_and_budget', label: '時間與預算週期', defaultValue: '前 6 個月，初期行銷啟動預算約 2 萬美元', placeholder: '例如：前 3 個月 / 5 萬美元' },
    ],
    defaultValues: {
      venture_name: 'MedFlow - 診所 AI 自動掛號與語音分診 SaaS',
      core_offering: '結合 LLM 與 VoIP 語音電話，24小時自動應對病患預約並即時排入醫療系統',
      industry_and_segment: '中小型牙科、家醫科與物理治療診所 (員工數 5-25 人)',
      direct_competitors: '診所前台人工總機電話紀錄、傳統舊式預約系統',
      timeline_and_budget: '前 6 個月，初期行銷啟動預算約 2 萬美元',
    },
    version: 1,
    author: 'McKinsey Alum Strategy',
    createdAt: '2026-03-22T14:00:00Z',
    updatedAt: '2026-03-26T18:00:00Z',
    isFavorite: false,
  },
];
