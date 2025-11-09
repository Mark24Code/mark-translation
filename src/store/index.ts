import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AIConfig, TranslationConfig, AppConfig } from '../shared/types';
import { StorageManager } from '../utils/storage';

// 应用配置状态
export const appConfigAtom = atomWithStorage<AppConfig>('appConfig', {
  aiConfigs: [],
  translationConfig: {
    sourceLang: 'en',
    targetLang: 'zh',
    autoTranslate: false,
    parallelTasks: 6,
    activeAIConfigId: null
  }
});

// AI 配置列表
export const aiConfigsAtom = atom(
  (get) => get(appConfigAtom).aiConfigs
);

// 激活的 AI 配置
export const activeAIConfigAtom = atom(
  (get) => {
    const appConfig = get(appConfigAtom);
    const activeConfig = appConfig.aiConfigs.find(config => config.isActive);
    return activeConfig || (appConfig.aiConfigs.length > 0 ? appConfig.aiConfigs[0] : null);
  }
);

// 翻译配置
export const translationConfigAtom = atom(
  (get) => get(appConfigAtom).translationConfig
);

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
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to load configs:', error);
      set(errorMessageAtom, 'Failed to load settings');
    }
  }
);

// 保存应用配置的导出器
export const saveAppConfigAtom = atom(
  null,
  async (get, set, appConfig: AppConfig) => {
    try {
      await StorageManager.setAppConfig(appConfig);
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
      set(errorMessageAtom, 'Failed to save settings');
    }
  }
);

// 添加 AI 配置的导出器
export const addAIConfigAtom = atom(
  null,
  async (get, set, config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const configId = await StorageManager.addAIConfig(config);
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
      return configId;
    } catch (error) {
      console.error('Failed to add AI config:', error);
      set(errorMessageAtom, 'Failed to add AI configuration');
      throw error;
    }
  }
);

// 更新 AI 配置的导出器
export const updateAIConfigAtom = atom(
  null,
  async (get, set, { configId, updates }: { configId: string; updates: Partial<AIConfig> }) => {
    try {
      await StorageManager.updateAIConfig(configId, updates);
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to update AI config:', error);
      set(errorMessageAtom, 'Failed to update AI configuration');
      throw error;
    }
  }
);

// 删除 AI 配置的导出器
export const deleteAIConfigAtom = atom(
  null,
  async (get, set, configId: string) => {
    try {
      await StorageManager.deleteAIConfig(configId);
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to delete AI config:', error);
      set(errorMessageAtom, 'Failed to delete AI configuration');
      throw error;
    }
  }
);

// 设置激活 AI 配置的导出器
export const setActiveAIConfigAtom = atom(
  null,
  async (get, set, configId: string) => {
    try {
      await StorageManager.setActiveAIConfig(configId);
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to set active AI config:', error);
      set(errorMessageAtom, 'Failed to set active configuration');
      throw error;
    }
  }
);

// 更新翻译配置的导出器
export const updateTranslationConfigAtom = atom(
  null,
  async (get, set, updates: Partial<TranslationConfig>) => {
    try {
      const currentConfig = get(translationConfigAtom);
      const newConfig = { ...currentConfig, ...updates };
      await StorageManager.setTranslationConfig(newConfig);
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to update translation config:', error);
      set(errorMessageAtom, 'Failed to update translation settings');
      throw error;
    }
  }
);

// 重置配置的导出器
export const resetConfigsAtom = atom(
  null,
  async (get, set) => {
    try {
      await StorageManager.clearConfig();
      const defaultConfig = {
        aiConfigs: [],
        translationConfig: {
          sourceLang: 'en',
          targetLang: 'zh',
          autoTranslate: false,
          parallelTasks: 6,
          activeAIConfigId: null
        }
      };
      set(appConfigAtom, defaultConfig);
      set(errorMessageAtom, null);
    } catch (error) {
      console.error('Failed to reset configs:', error);
      set(errorMessageAtom, 'Failed to reset settings');
    }
  }
);

// 导出配置的导出器
export const exportConfigsAtom = atom(
  null,
  async (get, set) => {
    try {
      return await StorageManager.exportConfig();
    } catch (error) {
      console.error('Failed to export configs:', error);
      set(errorMessageAtom, 'Failed to export settings');
      throw error;
    }
  }
);

// 导入配置的导出器
export const importConfigsAtom = atom(
  null,
  async (get, set, configJson: string) => {
    try {
      await StorageManager.importConfig(configJson);
      const appConfig = await StorageManager.getAppConfig();
      set(appConfigAtom, appConfig);
    } catch (error) {
      console.error('Failed to import configs:', error);
      set(errorMessageAtom, 'Failed to import settings');
      throw error;
    }
  }
);

// 翻译操作的导出器
export const translatePageAtom = atom(
  null,
  async (get, set) => {
    const activeAIConfig = get(activeAIConfigAtom);
    const translationConfig = get(translationConfigAtom);

    if (!activeAIConfig) {
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

        // 更新插件图标为打钩状态
        await updateExtensionIcon('success');

        // 5秒后恢复原始图标
        setTimeout(() => {
          updateExtensionIcon('idle');
        }, 5000);
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

// 更新插件图标的辅助函数
async function updateExtensionIcon(status: 'idle' | 'success' | 'error') {
  try {
    const iconPaths = {
      idle: {
        16: '/icons/icon-idle-16.png',
        32: '/icons/icon-idle-32.png',
        48: '/icons/icon-idle-48.png',
        128: '/icons/icon-idle-128.png'
      },
      success: {
        16: '/icons/icon-success-16.png',
        32: '/icons/icon-success-32.png',
        48: '/icons/icon-success-48.png',
        128: '/icons/icon-success-128.png'
      },
      error: {
        16: '/icons/icon-error-16.png',
        32: '/icons/icon-error-32.png',
        48: '/icons/icon-error-48.png',
        128: '/icons/icon-error-128.png'
      }
    };

    await chrome.action.setIcon({
      path: iconPaths[status]
    });
  } catch (error) {
    console.error('Failed to update extension icon:', error);
  }
}