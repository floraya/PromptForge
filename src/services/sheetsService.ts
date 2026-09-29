import { PromptTemplate, SheetConfig } from '../types/prompt';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export const SHEET_HEADERS = [
  'ID',
  '標題',
  '分類',
  '標籤 (Tags)',
  '簡介',
  '完整提示詞模板 (含 {變數})',
  '動態變數清單 (JSON)',
  '版本號',
  '作者',
  '更新時間',
];

/**
 * Creates a brand new Google Spreadsheet dedicated to storing Prompt Library templates.
 */
export async function createPromptSpreadsheet(
  accessToken: string,
  title = 'PromptForge - 提示詞庫與版本管理'
): Promise<SheetConfig> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: '提示詞模板庫',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const response = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`無法建立 Google 試算表: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const sheetTitle = data.sheets?.[0]?.properties?.title || '提示詞模板庫';
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header row and format header
  await appendOrSetHeaders(accessToken, spreadsheetId, sheetTitle);

  return {
    spreadsheetId,
    spreadsheetUrl,
    sheetTitle,
    autoSync: true,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Sets the header row and styles for the spreadsheet
 */
export async function appendOrSetHeaders(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
) {
  const range = `${sheetTitle}!A1:J1`;
  const body = {
    range,
    majorDimension: 'ROWS',
    values: [SHEET_HEADERS],
  };

  const res = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to set headers:', err);
  }
}

/**
 * Synchronizes an individual prompt template to the Google Spreadsheet.
 * If the prompt already has a corresponding row or ID in the sheet, it updates it (incrementing version).
 * Otherwise, it appends a new row.
 */
export async function syncPromptToSheet(
  accessToken: string,
  config: SheetConfig,
  prompt: PromptTemplate
): Promise<{ success: boolean; spreadsheetUrl: string; rowUpdated?: number }> {
  // First, fetch existing rows to find if this prompt ID already exists
  const readRange = `${config.sheetTitle}!A:J`;
  const readRes = await fetch(
    `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(readRange)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!readRes.ok) {
    const err = await readRes.text();
    throw new Error(`無法讀取試算表內容: ${err}`);
  }

  const readData = await readRes.json();
  const rows: string[][] = readData.values || [];

  let targetRowIndex = -1;
  // Row 0 is header, start from 1
  for (let i = 1; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === prompt.id) {
      targetRowIndex = i + 1; // 1-based index in Google Sheets
      break;
    }
  }

  const rowValues = [
    prompt.id,
    prompt.title,
    prompt.category,
    prompt.tags.join(', '),
    prompt.description,
    prompt.content,
    JSON.stringify(prompt.variables),
    `v${prompt.version}`,
    prompt.author || '匿名',
    new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
  ];

  if (targetRowIndex > 0) {
    // Update existing row
    const updateRange = `${config.sheetTitle}!A${targetRowIndex}:J${targetRowIndex}`;
    const updateRes = await fetch(
      `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: updateRange,
          majorDimension: 'ROWS',
          values: [rowValues],
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`更新試算表列失敗: ${err}`);
    }

    return {
      success: true,
      spreadsheetUrl: config.spreadsheetUrl,
      rowUpdated: targetRowIndex,
    };
  } else {
    // Append new row
    const appendRange = `${config.sheetTitle}!A:J`;
    const appendRes = await fetch(
      `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: appendRange,
          majorDimension: 'ROWS',
          values: [rowValues],
        }),
      }
    );

    if (!appendRes.ok) {
      const err = await appendRes.text();
      throw new Error(`新增至試算表失敗: ${err}`);
    }

    return {
      success: true,
      spreadsheetUrl: config.spreadsheetUrl,
    };
  }
}

/**
 * Syncs all templates in batch into Google Sheets (e.g. initial setup)
 */
export async function batchSyncAllToSheet(
  accessToken: string,
  config: SheetConfig,
  prompts: PromptTemplate[]
): Promise<void> {
  const allRows = [
    SHEET_HEADERS,
    ...prompts.map((p) => [
      p.id,
      p.title,
      p.category,
      p.tags.join(', '),
      p.description,
      p.content,
      JSON.stringify(p.variables),
      `v${p.version}`,
      p.author || '團隊協作',
      new Date(p.updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
    ]),
  ];

  const clearRes = await fetch(
    `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetTitle + '!A:J')}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const range = `${config.sheetTitle}!A1`;
  const updateRes = await fetch(
    `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: allRows,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`批次同步試算表失敗: ${err}`);
  }
}

/**
 * Pulls prompt templates from a linked Google Sheet back into the application.
 */
export async function pullPromptsFromSheet(
  accessToken: string,
  config: SheetConfig
): Promise<PromptTemplate[]> {
  const range = `${config.sheetTitle}!A2:J500`;
  const res = await fetch(
    `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`無法從試算表抓取資料: ${err}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  const pulledPrompts: PromptTemplate[] = [];

  for (const row of rows) {
    if (!row || !row[0] || !row[1]) continue;

    const id = row[0];
    const title = row[1];
    const category = row[2] || '軟體架構 & 工程';
    const tags = row[3] ? row[3].split(',').map((t) => t.trim()).filter(Boolean) : [];
    const description = row[4] || '';
    const content = row[5] || '';
    let variables: any[] = [];
    try {
      if (row[6]) {
        variables = JSON.parse(row[6]);
      }
    } catch {
      variables = [];
    }

    const versionStr = row[7] || 'v1';
    const versionNum = parseInt(versionStr.replace(/\D/g, ''), 10) || 1;
    const author = row[8] || '試算表同步';
    const updatedAt = row[9] || new Date().toISOString();

    const defaultValues: Record<string, string> = {};
    variables.forEach((v) => {
      if (v.key) defaultValues[v.key] = v.defaultValue || '';
    });

    pulledPrompts.push({
      id,
      title,
      slug: id,
      category,
      tags,
      description,
      content,
      variables,
      defaultValues,
      version: versionNum,
      author,
      createdAt: updatedAt,
      updatedAt,
      syncedToSheet: true,
    });
  }

  return pulledPrompts;
}

/**
 * Searches for any user spreadsheets created by this app
 */
export async function listAppSpreadsheets(accessToken: string): Promise<{ id: string; name: string }[]> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(
      `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)&pageSize=20&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Failed to list spreadsheets', err);
    return [];
  }
}
