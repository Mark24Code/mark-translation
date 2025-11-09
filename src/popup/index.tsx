import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { TranslationConfig } from '../shared/types';
import { StorageManager } from '../utils/storage';

const Popup: React.FC = () => {
  const [config, setConfig] = useState<TranslationConfig>({
    sourceLang: 'en',
    targetLang: 'zh',
    autoTranslate: false
  });
  const [status, setStatus] = useState<string>('Ready to translate');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await StorageManager.getTranslationConfig();
      setConfig(savedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleTranslate = async () => {
    try {
      setStatus('Translating...');
      setStatusType('info');

      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // 发送消息到内容脚本
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'translatePage',
        config
      });

      if (response?.success) {
        setStatus('Translation completed');
        setStatusType('success');
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setStatus('Translation failed. Please check settings.');
      setStatusType('error');
    }
  };

  const handleClear = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'clearTranslations',
          config
        });

        setStatus('Translations cleared');
        setStatusType('success');
      }
    } catch (error) {
      console.error('Clear error:', error);
      setStatus('Failed to clear translations');
      setStatusType('error');
    }
  };

  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = {
      ...config,
      sourceLang: e.target.value as 'zh' | 'en'
    };
    setConfig(newConfig);
    StorageManager.setTranslationConfig(newConfig);
  };

  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = {
      ...config,
      targetLang: e.target.value as 'zh' | 'en'
    };
    setConfig(newConfig);
    StorageManager.setTranslationConfig(newConfig);
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
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
            onClick={handleTranslate}
            style={{
              flex: 1,
              padding: '10px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Translate Page
          </button>
          <button
            onClick={handleClear}
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
          background: statusType === 'success' ? '#d4edda' :
                     statusType === 'error' ? '#f8d7da' : '#d1ecf1',
          color: statusType === 'success' ? '#155724' :
                statusType === 'error' ? '#721c24' : '#0c5460'
        }}
      >
        {status}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}