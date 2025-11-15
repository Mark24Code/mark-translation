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
import './popup.scss';

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

  // 默认使用滚动翻译模式
  const [isScrollTranslation] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  // 处理翻译/显示原文切换
  const handleToggleTranslation = () => {
    if (translationStatus === 'idle' || translationStatus === 'error') {
      // 开始翻译
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
    } else {
      // 清除翻译，显示原文
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
        return { message: t('popup.readyToTranslate'), type: 'info' as const };
    }
  };

  // 获取按钮文本
  const getButtonText = () => {
    if (translationStatus === 'idle' || translationStatus === 'error') {
      return t('popup.translatePage');
    } else {
      return t('popup.showOriginal');
    }
  };

  const statusInfo = getStatusInfo();

  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSourceLang = e.target.value as 'zh' | 'en';

    // 如果源语言和目标语言相同，自动切换目标语言
    const newTargetLang = newSourceLang === config.targetLang
      ? (newSourceLang === 'zh' ? 'en' : 'zh')
      : config.targetLang;

    const newConfig = {
      ...config,
      sourceLang: newSourceLang,
      targetLang: newTargetLang
    };
    setConfig(newConfig);
  };

  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTargetLang = e.target.value as 'zh' | 'en';

    // 如果目标语言和源语言相同，自动切换源语言
    const newSourceLang = newTargetLang === config.sourceLang
      ? (newTargetLang === 'zh' ? 'en' : 'zh')
      : config.sourceLang;

    const newConfig = {
      ...config,
      sourceLang: newSourceLang,
      targetLang: newTargetLang
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
    <div className="popup-container">
      <div className="popup-header">
        <h1 className="popup-title">{t('popup.title')}</h1>
      </div>

      <div className="popup-content">
        {/* Language Selection */}
        <div className="language-selectors">
          <select
            value={config.sourceLang}
            onChange={handleSourceLangChange}
            className="language-select"
          >
            <option value="en">{t('settings.english')}</option>
            <option value="zh">{t('settings.chinese')}</option>
          </select>
          →
          <select
            value={config.targetLang}
            onChange={handleTargetLangChange}
            className="language-select"
          >
            <option value="zh">{t('settings.chinese')}</option>
            <option value="en">{t('settings.english')}</option>
          </select>
        </div>

        {/* Translation Style Selection */}
        <div className="translation-style-section">
          <label className="translation-style-label">
            {t('settings.translationStyles')}
          </label>
          <select
            value={activeTranslationStyle?.id || ''}
            onChange={handleTranslationStyleChange}
            className="translation-style-select"
          >
            {(translationStyles || []).map(style => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
        </div>


        <div className="button-group">
          <button
            onClick={handleToggleTranslation}
            disabled={translationStatus === 'translating' || !activeAIConfig}
            className="translate-button"
          >
            {translationStatus === 'translating' ? t('popup.translating') : getButtonText()}
          </button>
        </div>

        <button
          onClick={openSettings}
          className="settings-button"
        >
          {t('popup.settings')}
        </button>

        {/* AI Configuration Selection */}
        {(aiConfigs || []).length > 0 ? (
          <div className="ai-config-section">
            <label className="ai-config-label">
              {t('popup.aiConfiguration')}
            </label>
            <select
              value={activeAIConfig?.id || ''}
              onChange={handleAIConfigChange}
              className="ai-config-select"
            >
              {(aiConfigs || []).map(config => (
                <option key={config.id} value={config.id}>
                  {config.name} {config.isActive ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="warning-section">
            <div className="warning-text">
              {t('popup.noAiConfigurations')}
            </div>
            <button
              onClick={openSettings}
              className="add-config-button"
            >
              {t('popup.addConfiguration')}
            </button>
          </div>
        )}

      </div>

      <div className={`status-section ${statusInfo.type === 'success' ? 'status-success' :
          statusInfo.type === 'error' ? 'status-error' : 'status-info'
        }`}>
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
