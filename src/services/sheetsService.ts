import { PromptTemplate, SheetConfig } from '../types/prompt';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Formats a prompt template into a safe array of cell values for Google Sheets.
 * Google Sheets has a strict limit of 50,000 characters per cell.
 * If base64 images exceed cell limits, we safely handle them so sync never crashes with 400.
 */
const MAX_CELL_CHAR_LIMIT = 48000;

function safeCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  if (str.length > MAX_CELL_CHAR_LIMIT) {
    return str.slice(0, MAX_CELL_CHAR_LIMIT);
  }
  return str;
}

/**
 * Prepares image values safely for Google Sheets:
 * - URL images (http/https) are always preserved completely.
 * - Oversized data:image base64 strings that exceed cell limit are truncated/omitted or condensed.
 */
function prepareImageForSheet(imgUrl?: string): string {
  if (!imgUrl) return '';
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    return imgUrl;
  }
  // If base64 is within cell limit, keep it; otherwise skip base64 to avoid Google Sheets 50000 char error
  if (imgUrl.length < MAX_CELL_CHAR_LIMIT) {
    return imgUrl;
  }
  return '';
}

function prepareShowcaseImagesForSheet(images?: string[]): string {
  if (!images || images.length === 0) return '';
  // Keep external URLs and reasonably sized images
  const safeImages: string[] = [];
  let totalLength = 2; // '[]'
  for (const img of images) {
    const safe = prepareImageForSheet(img);
    if (safe) {
      if (totalLength + safe.length + 5 < MAX_CELL_CHAR_LIMIT) {
        safeImages.push(safe);
        totalLength += safe.length + 5;
      }
    }
  }
  return safeImages.length > 0 ? JSON.stringify(safeImages) : '';
}

function mapPromptToRow(prompt: PromptTemplate): string[] {
  return [
    safeCell(prompt.id),
    safeCell(prompt.title),
    safeCell(prompt.category),
    safeCell(prompt.tags?.join(', ') || ''),
    safeCell(prompt.description),
    safeCell(prompt.content),
    safeCell(JSON.stringify(prompt.variables || [])),
    safeCell(`v${prompt.version || 1}`),
    safeCell(prompt.author || '團隊協作'),
    safeCell(new Date(prompt.updatedAt || Date.now()).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })),
    prepareImageForSheet(prompt.previewImageUrl),
    prepareShowcaseImagesForSheet(prompt.showcaseImages),
  ];
}

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
  '成果預覽圖 (URL)',
  '成果圖片列表 (JSON)',
];

/**
 * Creates a brand new Google Spreadsheet dedicated to storing Prompt Library templates.
 * Also configures Google Drive permissions so that anyone with the link can view (or edit),
 * making it a truly shared public prompt repository for all users.
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

  // Automatically make the sheet shared publicly ("anyone with the link can view / edit")
  try {
    await makeSheetPubliclyShared(accessToken, spreadsheetId);
  } catch (permErr) {
    console.warn('Could not set public permission automatically:', permErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    sheetTitle,
    autoSync: true,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Sets Google Drive permission: Anyone with the link can view (or edit)
 */
export async function makeSheetPubliclyShared(accessToken: string, spreadsheetId: string): Promise<void> {
  await fetch(`${DRIVE_API_BASE}/files/${spreadsheetId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader', // anyone with link can view
      type: 'anyone',
    }),
  });
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
  const readRange = `${config.sheetTitle}!A:L`;
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

  const rowValues = mapPromptToRow(prompt);

  if (targetRowIndex > 0) {
    // Update existing row
    const updateRange = `${config.sheetTitle}!A${targetRowIndex}:L${targetRowIndex}`;
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
    const appendRange = `${config.sheetTitle}!A:L`;
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
    ...prompts.map((p) => mapPromptToRow(p)),
  ];

  const clearRes = await fetch(
    `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetTitle + '!A:L')}:clear`,
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
 * Supports reading with accessToken OR via Google's public spreadsheet CSV/JSON export if shared publicly.
 */
export async function pullPromptsFromSheet(
  accessToken: string | null,
  config: SheetConfig
): Promise<PromptTemplate[]> {
  // If we have an accessToken, use Google Sheets API directly
  if (accessToken) {
    const range = `${config.sheetTitle}!A2:L500`;
    const res = await fetch(
      `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rows: string[][] = data.values || [];
      return parseRowsToPrompts(rows);
    }
  }

  // Fallback for public shared sheets (Anyone on the internet with the link can view)
  // Fetch using the public CSV/tsv export URL (works without requiring login)
  try {
    const publicCsvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.sheetTitle)}`;
    const csvRes = await fetch(publicCsvUrl);
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const parsedRows = parseCsvToRows(csvText);
      // Skip header row
      return parseRowsToPrompts(parsedRows.slice(1));
    }
  } catch (publicErr) {
    console.warn('Public CSV pull failed:', publicErr);
  }

  throw new Error('無法從試算表抓取資料，請確認試算表已開啟「知道連結的使用者皆可檢視」或已登入授權。');
}

/**
 * Parses 2D array of Google Sheets rows into PromptTemplate objects
 */
function parseRowsToPrompts(rows: string[][]): PromptTemplate[] {
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

    const previewImageUrl = row[10] || undefined;
    let showcaseImages: string[] | undefined = undefined;
    try {
      if (row[11]) {
        showcaseImages = JSON.parse(row[11]);
      } else if (previewImageUrl) {
        showcaseImages = [previewImageUrl];
      }
    } catch {
      showcaseImages = previewImageUrl ? [previewImageUrl] : undefined;
    }

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
      previewImageUrl,
      showcaseImages,
    });
  }

  return pulledPrompts;
}

/**
 * Simple CSV parser handling quotes and commas
 */
function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
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
