import { AIConfig, TranslationConfig, AppConfig } from '../shared/types';

export class StorageManager {
  static async getAppConfig(): Promise<AppConfig> {
    const result = await chrome.storage.sync.get('appConfig');
    return result.appConfig || {
      aiConfigs: [],
      translationConfig: {
        sourceLang: 'en',
        targetLang: 'zh',
        autoTranslate: false,
        parallelTasks: 6,
        activeAIConfigId: null
      },
      language: 'zh'
    };
  }

  static async setAppConfig(config: AppConfig): Promise<void> {
    await chrome.storage.sync.set({ appConfig: config });
  }

  static async getAIConfigs(): Promise<AIConfig[]> {
    const appConfig = await this.getAppConfig();
    return appConfig.aiConfigs || [];
  }

  static async getActiveAIConfig(): Promise<AIConfig | null> {
    const appConfig = await this.getAppConfig();
    const activeConfig = appConfig.aiConfigs.find(config => config.isActive);
    return activeConfig || (appConfig.aiConfigs.length > 0 ? appConfig.aiConfigs[0] : null);
  }

  static async setActiveAIConfig(configId: string): Promise<void> {
    const appConfig = await this.getAppConfig();

    // 更新所有配置的激活状态
    const updatedConfigs = appConfig.aiConfigs.map(config => ({
      ...config,
      isActive: config.id === configId
    }));

    await this.setAppConfig({
      ...appConfig,
      aiConfigs: updatedConfigs,
      translationConfig: {
        ...appConfig.translationConfig,
        activeAIConfigId: configId
      }
    });
  }

  static async addAIConfig(config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const appConfig = await this.getAppConfig();
    const newConfig: AIConfig = {
      ...config,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedConfigs = [...appConfig.aiConfigs, newConfig];
    await this.setAppConfig({
      ...appConfig,
      aiConfigs: updatedConfigs
    });

    return newConfig.id;
  }

  static async updateAIConfig(configId: string, updates: Partial<AIConfig>): Promise<void> {
    const appConfig = await this.getAppConfig();
    const updatedConfigs = appConfig.aiConfigs.map(config =>
      config.id === configId
        ? { ...config, ...updates, updatedAt: Date.now() }
        : config
    );

    await this.setAppConfig({
      ...appConfig,
      aiConfigs: updatedConfigs
    });
  }

  static async deleteAIConfig(configId: string): Promise<void> {
    const appConfig = await this.getAppConfig();
    const updatedConfigs = appConfig.aiConfigs.filter(config => config.id !== configId);

    // 如果删除的是激活配置，需要更新激活状态
    const deletedConfig = appConfig.aiConfigs.find(config => config.id === configId);
    const newActiveConfigId = deletedConfig?.isActive && updatedConfigs.length > 0
      ? updatedConfigs[0].id
      : appConfig.translationConfig.activeAIConfigId;

    await this.setAppConfig({
      ...appConfig,
      aiConfigs: updatedConfigs,
      translationConfig: {
        ...appConfig.translationConfig,
        activeAIConfigId: newActiveConfigId
      }
    });
  }

  static async getTranslationConfig(): Promise<TranslationConfig> {
    const appConfig = await this.getAppConfig();
    return appConfig.translationConfig;
  }

  static async setTranslationConfig(config: TranslationConfig): Promise<void> {
    const appConfig = await this.getAppConfig();
    await this.setAppConfig({
      ...appConfig,
      translationConfig: config
    });
  }

  static async clearConfig(): Promise<void> {
    await chrome.storage.sync.remove(['appConfig']);
  }

  static async getLanguage(): Promise<'zh' | 'en'> {
    const appConfig = await this.getAppConfig();
    return appConfig.language || 'zh';
  }

  static async setLanguage(language: 'zh' | 'en'): Promise<void> {
    const appConfig = await this.getAppConfig();
    await this.setAppConfig({
      ...appConfig,
      language
    });
  }

  static async exportConfig(): Promise<string> {
    const appConfig = await this.getAppConfig();
    return JSON.stringify(appConfig, null, 2);
  }

  static async importConfig(configJson: string): Promise<void> {
    try {
      const appConfig = JSON.parse(configJson) as AppConfig;
      await this.setAppConfig(appConfig);
    } catch (error) {
      throw new Error('Invalid configuration file');
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}