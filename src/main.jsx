// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './index.css';
import useLyricsStore from './context/LyricsStore';
import { registerChunkLoadRecovery } from './utils/chunkLoadRecovery';
import { useLocale } from './i18n';

registerChunkLoadRecovery();

// 语言切换需要让整棵树重新渲染，这里用 key 强制重挂载（切换语言是低频操作）。
const Root = () => {
  const locale = useLocale();
  return <App key={locale} />;
};

if (typeof window !== 'undefined' && window.electronAPI) {
  try {
    useLyricsStore.getState().setIsDesktopApp(true);
  } catch (error) {
    console.warn('Failed to initialize desktop mode flag:', error);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
