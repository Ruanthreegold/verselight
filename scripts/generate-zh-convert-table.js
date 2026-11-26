#!/usr/bin/env node
/**
 * Generate shared/zhConvertTable.json from OpenCC TSCharacters.txt.
 *
 * Usage:
 *   node scripts/generate-zh-convert-table.js [path/to/TSCharacters.txt]
 *
 * If no local file path is passed, fetches TSCharacters.txt from jsDelivr / GitHub.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'shared', 'zhConvertTable.json');

const REMOTE_URLS = [
  'https://cdn.jsdelivr.net/gh/BYVoid/OpenCC@master/data/dictionary/TSCharacters.txt',
  'https://raw.githubusercontent.com/BYVoid/OpenCC/master/data/dictionary/TSCharacters.txt',
];

// Single-character overrides for high-frequency lyrics characters omitted from
// OpenCC's TSCharacters.txt (e.g., Taiwan/HK variants or TSPhrases-only chars).
// Keeping this strictly 1-to-1 avoids phrase-level false positives.
const LYRICS_CHAR_OVERRIDES = {
  '著': '着',
  '簷': '檐',
  '祕': '秘',
  '託': '托',
  '汙': '污',
  '歎': '叹',
  '癡': '痴',
  '迴': '回',
};

async function loadSourceText(localPath) {
  if (localPath) {
    return fs.readFileSync(path.resolve(localPath), 'utf8');
  }
  let lastError = null;
  for (const url of REMOTE_URLS) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      if (text.length > 10000) {
        return text;
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Failed to fetch OpenCC TSCharacters.txt');
}

function buildTable(sourceText) {
  const table = {};
  const lines = sourceText.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const tabIndex = line.indexOf('\t');
    if (tabIndex === -1) continue;

    const trad = line.slice(0, tabIndex).trim();
    const candidates = line.slice(tabIndex + 1).trim().split(/\s+/).filter(Boolean);
    if (!trad || candidates.length === 0) continue;

    // Only keep single-codepoint 1-to-1 mappings where traditional != primary simplified.
    const simp = candidates[0];
    if ([...trad].length !== 1 || [...simp].length !== 1) continue;
    if (trad === simp) continue;

    table[trad] = simp;
  }

  for (const [trad, simp] of Object.entries(LYRICS_CHAR_OVERRIDES)) {
    if (trad !== simp) {
      table[trad] = simp;
    }
  }

  return table;
}

const localPath = process.argv[2] || '';
const sourceText = await loadSourceText(localPath);
const table = buildTable(sourceText);
const json = JSON.stringify(table);

fs.writeFileSync(OUTPUT_PATH, `${json}\n`, 'utf8');

const byteSize = Buffer.byteLength(json, 'utf8');
console.log(
  `Generated ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ${Object.keys(table).length} entries, ${(byteSize / 1024).toFixed(1)} KB`,
);
