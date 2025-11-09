import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  translationConfigAtom,
  translationStatusAtom,
  errorMessageAtom,
  loadConfigsAtom,
  translatePageAtom,
  clearTranslationsAtom
} from '../store';

const Popup: React.FC = () => {
  const [config, setConfig] = useAtom(translationConfigAtom);
  const translationStatus = useAtomValue(translationStatusAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const loadConfigs = useSetAtom(loadConfigsAtom);
  const translatePage = useSetAtom(translatePageAtom);
  const clearTranslations = useSetAtom(clearTranslationsAtom);

  useEffect(() => {
    loadConfigs();
  }, []);

  // 获取状态显示
  const getStatusInfo = () => {
    switch (translationStatus) {
      case 'translating':
        return { message: 'Translating...', type: 'info' as const };
      case 'success':
        return { message: '✅ Translation completed!', type: 'success' as const };
      case 'error':
        return { message: errorMessage || '❌ Translation failed', type: 'error' as const };
      default:
        return { message: 'Ready to translate', type: 'info' as const };
    }
  };

  const statusInfo = getStatusInfo();

  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = {
      ...config,
      sourceLang: e.target.value as 'zh' | 'en'
    };
    setConfig(newConfig);
  };

  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = {
      ...config,
      targetLang: e.target.value as 'zh' | 'en'
    };
    setConfig(newConfig);
  };

  const openSettings = () => {
    try {
      console.log('Opening options page...');
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Failed to open options page:', error);
      // 备用方法：直接打开 options.html
      window.open(chrome.runtime.getURL('options.html'), '_blank');
    }
  };

  return (
    <div style={{ width: '300px', padding: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Mark Translation</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={config.sourceLang}
            onChange={handleSourceLangChange}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="en">English →</option>
            <option value="zh">中文 →</option>
          </select>
          <select
            value={config.targetLang}
            onChange={handleTargetLangChange}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={translatePage}
            disabled={translationStatus === 'translating'}
            style={{
              flex: 1,
              padding: '10px',
              background: translationStatus === 'translating' ? '#6c757d' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: translationStatus === 'translating' ? 'not-allowed' : 'pointer',
              opacity: translationStatus === 'translating' ? 0.6 : 1
            }}
          >
            {translationStatus === 'translating' ? 'Translating...' : 'Translate Page'}
          </button>
          <button
            onClick={clearTranslations}
            style={{
              flex: 1,
              padding: '10px',
              background: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>

        <button
          onClick={openSettings}
          style={{
            padding: '8px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Settings
        </button>
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center',
          background: statusInfo.type === 'success' ? '#d4edda' :
                     statusInfo.type === 'error' ? '#f8d7da' : '#d1ecf1',
          color: statusInfo.type === 'success' ? '#155724' :
                statusInfo.type === 'error' ? '#721c24' : '#0c5460'
        }}
      >
        {statusInfo.message}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}