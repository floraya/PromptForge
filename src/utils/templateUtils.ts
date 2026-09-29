export function extractVariables(content: string): string[] {
  const regex = /\{([a-zA-Z0-9_\u4e00-\u9fa5]+)\}/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      matches.add(match[1].trim());
    }
  }

  return Array.from(matches);
}

export function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{([a-zA-Z0-9_\u4e00-\u9fa5]+)\}/g, (fullMatch, key) => {
    const trimmedKey = key.trim();
    if (values[trimmedKey] !== undefined && values[trimmedKey].trim() !== '') {
      return values[trimmedKey];
    }
    return fullMatch; // keep original if empty
  });
}

export function formatLabel(key: string): string {
  // Translate common key patterns or capitalize
  const dict: Record<string, string> = {
    project_name: '專案名稱',
    core_objective: '核心目標',
    target_scale: '預期規模',
    frontend_stack: '前端技術',
    backend_stack: '後端技術',
    database_choice: '資料庫選型',
    deployment_env: '部署環境',
    security_requirements: '安全性需求',
    product_name: '產品名稱',
    channel: '宣傳管道',
    target_audience: '受眾定位',
    pain_point: '核心痛點',
    unique_selling_prop: '獨特賣點',
    cta: '行動呼籲 (CTA)',
    tone_of_voice: '口吻語調',
    focus_keyword: '主要關鍵字',
    secondary_keywords: '次要長尾字',
    search_intent: '搜尋意圖',
    content_format: '文章格式',
    competitor_weakness: '競品缺點',
  };

  if (dict[key]) return dict[key];

  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
