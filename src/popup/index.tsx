import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  translationConfigAtom,
  translationStatusAtom,
  errorMessageAtom,
  loadConfigsAtom,
  translatePageAtom,
  clearTranslationsAtom,
  aiConfigsAtom,
  activeAIConfigAtom,
  setActiveAIConfigAtom,
  languageAtom,
  translationStylesAtom,
  activeTranslationStyleAtom,
  setActiveTranslationStyleAtom
} from '../store';
import { useI18n } from '../utils/i18n';

const Popup: React.FC = () => {
  const [config, setConfig] = useAtom(translationConfigAtom);
  const translationStatus = useAtomValue(translationStatusAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const aiConfigs = useAtomValue(aiConfigsAtom);
  const activeAIConfig = useAtomValue(activeAIConfigAtom);
  const language = useAtomValue(languageAtom);
  const translationStyles = useAtomValue(translationStylesAtom);
  const activeTranslationStyle = useAtomValue(activeTranslationStyleAtom);
  const loadConfigs = useSetAtom(loadConfigsAtom);
  const translatePage = useSetAtom(translatePageAtom);
  const clearTranslations = useSetAtom(clearTranslationsAtom);
  const setActiveAIConfig = useSetAtom(setActiveAIConfigAtom);
  const setActiveTranslationStyle = useSetAtom(setActiveTranslationStyleAtom);
  const { t } = useI18n();

  const [isScrollTranslation, setIsScrollTranslation] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  // 处理翻译页面
  const handleTranslatePage = () => {
    if (isScrollTranslation) {
      // 发送滚动翻译消息
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'translatePageScroll',
            config
          });
        }
      });
    } else {
      // 使用传统翻译
      translatePage();
    }
  };

  // 处理清除翻译
  const handleClearTranslations = () => {
    clearTranslations();

    // 如果正在滚动翻译，也停止它
    if (isScrollTranslation) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'stopScrollTranslation'
          });
        }
      });
    }
  };

  // 获取状态显示
  const getStatusInfo = () => {
    if (!activeAIConfig) {
      return { message: t('popup.noActiveConfiguration'), type: 'error' as const };
    }

    switch (translationStatus) {
      case 'translating':
        return { message: t('popup.translating'), type: 'info' as const };
      case 'success':
        return { message: t('popup.translationCompleted'), type: 'success' as const };
      case 'error':
        return { message: errorMessage || t('popup.translationFailed'), type: 'error' as const };
      default:
        if (isScrollTranslation) {
          return { message: '滚动翻译模式已启用', type: 'info' as const };
        }
        return { message: t('popup.readyToTranslate'), type: 'info' as const };
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

  const handleAIConfigChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const configId = e.target.value;
    if (configId) {
      await setActiveAIConfig(configId);
    }
  };

  const handleTranslationStyleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const styleId = e.target.value || null;
    await setActiveTranslationStyle(styleId);
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
        <h1 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{t('popup.title')}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* AI Configuration Selection */}
        {(aiConfigs || []).length > 0 ? (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666', fontWeight: '500' }}>
              {t('popup.aiConfiguration')}
            </label>
            <select
              value={activeAIConfig?.id || ''}
              onChange={handleAIConfigChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            >
              {(aiConfigs || []).map(config => (
                <option key={config.id} value={config.id}>
                  {config.name} {config.isActive ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{
            padding: '12px',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#856404', marginBottom: '8px' }}>
              {t('popup.noAiConfigurations')}
            </div>
            <button
              onClick={openSettings}
              style={{
                padding: '6px 12px',
                background: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {t('popup.addConfiguration')}
            </button>
          </div>
        )}

        {/* Language Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={config.sourceLang}
            onChange={handleSourceLangChange}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="en">{t('settings.english')} →</option>
            <option value="zh">{t('settings.chinese')} →</option>
          </select>
          <select
            value={config.targetLang}
            onChange={handleTargetLangChange}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="zh">{t('settings.chinese')}</option>
            <option value="en">{t('settings.english')}</option>
          </select>
        </div>

        {/* Translation Style Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666', fontWeight: '500' }}>
            翻译风格
          </label>
          <select
            value={activeTranslationStyle?.id || ''}
            onChange={handleTranslationStyleChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="">默认风格</option>
            {(translationStyles || []).map(style => (
              <option key={style.id} value={style.id}>
                {style.name} {style.isBuiltIn ? '(内置)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 滚动翻译模式切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="scrollTranslation"
            checked={isScrollTranslation}
            onChange={(e) => setIsScrollTranslation(e.target.checked)}
            style={{ margin: 0 }}
          />
          <label htmlFor="scrollTranslation" style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>
            滚动翻译模式
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleTranslatePage}
            disabled={translationStatus === 'translating' || !activeAIConfig}
            style={{
              flex: 1,
              padding: '10px',
              background: translationStatus === 'translating' || !activeAIConfig ? '#6c757d' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: translationStatus === 'translating' || !activeAIConfig ? 'not-allowed' : 'pointer',
              opacity: translationStatus === 'translating' || !activeAIConfig ? 0.6 : 1
            }}
          >
            {translationStatus === 'translating' ? t('popup.translating') :
             isScrollTranslation ? '开始滚动翻译' : t('popup.translatePage')}
          </button>
          <button
            onClick={handleClearTranslations}
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
            {t('popup.clear')}
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
          {t('popup.settings')}
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