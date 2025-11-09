import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AIConfig, TranslationConfig } from '../shared/types';

// AI 配置状态
export const aiConfigAtom = atomWithStorage<AIConfig | null>('aiConfig', null);

// 翻译配置状态
export const translationConfigAtom = atomWithStorage<TranslationConfig>('translationConfig', {
  sourceLang: 'en',
  targetLang: 'zh',
  autoTranslate: false,
  parallelTasks: 6
});

// 翻译状态
export const translationStatusAtom = atom<'idle' | 'translating' | 'success' | 'error'>('idle');

// 当前翻译进度
export const translationProgressAtom = atom<{
  total: number;
  completed: number;
  failed: number;
}>({
  total: 0,
  completed: 0,
  failed: 0
});

// 错误消息
export const errorMessageAtom = atom<string | null>(null);

// 当前活动标签页
export const activeTabAtom = atom<chrome.tabs.Tab | null>(null);

// 导出器函数 - 用于从存储中加载配置
export const loadConfigsAtom = atom(
  null,
  async (get, set) => {
    try {
      // 从 chrome.storage 加载配置
      const [aiConfigResult, translationConfigResult] = await Promise.all([
        new Promise<AIConfig | null>((resolve) => {
          chrome.storage.sync.get('aiConfig', (result) => {
            resolve(result.aiConfig || null);
          });
        }),
        new Promise<TranslationConfig>((resolve) => {
          chrome.storage.sync.get('translationConfig', (result) => {
            resolve(result.translationConfig || {
              sourceLang: 'en',
              targetLang: 'zh',
              autoTranslate: false,
              parallelTasks: 6
            });
          });
        })
      ]);

      set(aiConfigAtom, aiConfigResult);
      set(translationConfigAtom, translationConfigResult);
    } catch (error) {
      console.error('Failed to load configs:', error);
      set(errorMessageAtom, 'Failed to load settings');
    }
  }
);

// 保存配置的导出器
export const saveConfigsAtom = atom(
  null,
  async (get, set, { aiConfig, translationConfig }: { aiConfig?: AIConfig | null; translationConfig?: TranslationConfig }) => {
    try {
      const updates: Record<string, any> = {};

      if (aiConfig !== undefined) {
        set(aiConfigAtom, aiConfig);
        updates.aiConfig = aiConfig;
      }

      if (translationConfig !== undefined) {
        set(translationConfigAtom, translationConfig);
        updates.translationConfig = translationConfig;
      }

      if (Object.keys(updates).length > 0) {
        await chrome.storage.sync.set(updates);
      }
    } catch (error) {
      console.error('Failed to save configs:', error);
      set(errorMessageAtom, 'Failed to save settings');
    }
  }
);

// 重置配置的导出器
export const resetConfigsAtom = atom(
  null,
  async (get, set) => {
    try {
      await chrome.storage.sync.remove(['aiConfig', 'translationConfig']);
      set(aiConfigAtom, null);
      set(translationConfigAtom, {
        sourceLang: 'en',
        targetLang: 'zh',
        autoTranslate: false,
        parallelTasks: 6
      });
      set(errorMessageAtom, null);
    } catch (error) {
      console.error('Failed to reset configs:', error);
      set(errorMessageAtom, 'Failed to reset settings');
    }
  }
);

// 翻译操作的导出器
export const translatePageAtom = atom(
  null,
  async (get, set) => {
    const aiConfig = get(aiConfigAtom);
    const translationConfig = get(translationConfigAtom);

    if (!aiConfig) {
      set(errorMessageAtom, 'Please configure AI settings first');
      return;
    }

    try {
      set(translationStatusAtom, 'translating');
      set(translationProgressAtom, { total: 0, completed: 0, failed: 0 });
      set(errorMessageAtom, null);

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      set(activeTabAtom, tab);

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // 发送翻译消息到内容脚本
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'translatePage',
        config: translationConfig
      });

      if (response?.success) {
        set(translationStatusAtom, 'success');
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      set(translationStatusAtom, 'error');

      if (error.message.includes('Could not establish connection')) {
        set(errorMessageAtom, 'Please refresh the page and try again');
      } else {
        set(errorMessageAtom, 'Translation failed. Please check settings and refresh the page.');
      }
    }
  }
);

// 清除翻译的导出器
export const clearTranslationsAtom = atom(
  null,
  async (get, set) => {
    const translationConfig = get(translationConfigAtom);
    const activeTab = get(activeTabAtom);

    try {
      const tab = activeTab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'clearTranslations',
          config: translationConfig
        });
      }
    } catch (error) {
      console.error('Clear error:', error);
      set(errorMessageAtom, 'Failed to clear translations');
    }
  }
);