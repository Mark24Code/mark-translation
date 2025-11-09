import { AIConfig, TranslationConfig } from '../shared/types';

export class StorageManager {
  static async getAIConfig(): Promise<AIConfig | null> {
    const result = await chrome.storage.sync.get('aiConfig');
    return result.aiConfig || null;
  }

  static async setAIConfig(config: AIConfig): Promise<void> {
    await chrome.storage.sync.set({ aiConfig: config });
  }

  static async getTranslationConfig(): Promise<TranslationConfig> {
    const result = await chrome.storage.sync.get('translationConfig');
    return result.translationConfig || {
      sourceLang: 'en',
      targetLang: 'zh',
      autoTranslate: false,
      parallelTasks: 6
    };
  }

  static async setTranslationConfig(config: TranslationConfig): Promise<void> {
    await chrome.storage.sync.set({ translationConfig: config });
  }

  static async clearConfig(): Promise<void> {
    await chrome.storage.sync.remove(['aiConfig', 'translationConfig']);
  }
}