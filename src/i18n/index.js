// VerseLight i18n 运行时
// - 构建期由 scripts/i18n-vite-plugin.js 把界面文案改写成 __t("English")
// - 运行时按当前语言查表，查不到就回退英文原文
// - 默认中文（zh-CN），可在设置里切换（setLocale 会持久化到 localStorage）

import { create } from 'zustand';
import zhCN from './zh-CN.json' with { type: 'json' };

export const SUPPORTED_LOCALES = ['zh-CN', 'en'];
export const DEFAULT_LOCALE = 'zh-CN';
const STORAGE_KEY = 'verselight.locale';

const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const buildDict = (raw) => {
  const map = new Map();
  for (const [key, val] of Object.entries(raw || {})) {
    map.set(normalize(key), val);
  }
  return map;
};

const DICTIONARIES = {
  'zh-CN': buildDict(zhCN),
  // 英文是源码原文，无需字典；查不到时自然回退
  en: new Map(),
};

const readStoredLocale = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    // localStorage 不可用时使用默认语言
  }
  return DEFAULT_LOCALE;
};

export const useLocaleStore = create((set) => ({
  locale: typeof window === 'undefined' ? DEFAULT_LOCALE : readStoredLocale(),
  setLocale: (locale) => {
    const next = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 忽略存储失败
    }
    set({ locale: next });
  },
}));

export const getLocale = () => useLocaleStore.getState().locale;

export const setLocale = (locale) => useLocaleStore.getState().setLocale(locale);

/** 按当前语言翻译；缺失时返回英文原文，保证不会出现空白界面。 */
export function t(key) {
  const dict = DICTIONARIES[getLocale()];
  if (!dict) return key;
  return dict.get(normalize(key)) ?? key;
}

/** React 组件用：订阅语言变化以便重新渲染。 */
export const useLocale = () => useLocaleStore((state) => state.locale);

export default t;