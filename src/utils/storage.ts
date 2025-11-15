import { AIConfig, TranslationConfig, AppConfig, TranslationStyle } from '../shared/types';
import { PARALLEL_TASKS_DEFAULT } from '../constants';

export class StorageManager {
  static async getAppConfig(): Promise<AppConfig> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('appConfig', (result) => {
        // Firefox 兼容性处理：result 可能为 undefined 或空对象
        const appConfig = result?.appConfig;
        if (appConfig) {
          resolve(appConfig);
        } else {
          resolve({
            aiConfigs: [],
            translationConfig: {
              sourceLang: 'en',
              targetLang: 'zh',
              autoTranslate: true,
              parallelTasks: PARALLEL_TASKS_DEFAULT,
              activeAIConfigId: null,
              activeTranslationStyleId: null
            },
            translationStyles: this.getBuiltInTranslationStyles(),
            language: 'zh'
          });
        }
      });
    });
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

  // 翻译风格相关方法
  static async getTranslationStyles(): Promise<TranslationStyle[]> {
    const appConfig = await this.getAppConfig();
    return appConfig.translationStyles || [];
  }

  static async getActiveTranslationStyle(): Promise<TranslationStyle | null> {
    const appConfig = await this.getAppConfig();
    const activeStyleId = appConfig.translationConfig.activeTranslationStyleId;
    if (!activeStyleId) return null;

    return appConfig.translationStyles.find(style => style.id === activeStyleId) || null;
  }

  static async setActiveTranslationStyle(styleId: string | null): Promise<void> {
    const appConfig = await this.getAppConfig();
    await this.setAppConfig({
      ...appConfig,
      translationConfig: {
        ...appConfig.translationConfig,
        activeTranslationStyleId: styleId
      }
    });
  }

  static async addTranslationStyle(style: Omit<TranslationStyle, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>): Promise<string> {
    const appConfig = await this.getAppConfig();
    const newStyle: TranslationStyle = {
      ...style,
      id: this.generateId(),
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedStyles = [...appConfig.translationStyles, newStyle];
    await this.setAppConfig({
      ...appConfig,
      translationStyles: updatedStyles
    });

    return newStyle.id;
  }

  static async updateTranslationStyle(styleId: string, updates: Partial<TranslationStyle>): Promise<void> {
    const appConfig = await this.getAppConfig();
    const updatedStyles = appConfig.translationStyles.map(style =>
      style.id === styleId && !style.isBuiltIn
        ? { ...style, ...updates, updatedAt: Date.now() }
        : style
    );

    await this.setAppConfig({
      ...appConfig,
      translationStyles: updatedStyles
    });
  }

  static async deleteTranslationStyle(styleId: string): Promise<void> {
    const appConfig = await this.getAppConfig();
    const styleToDelete = appConfig.translationStyles.find(style => style.id === styleId);

    // 不能删除内置风格
    if (styleToDelete?.isBuiltIn) {
      throw new Error('Cannot delete built-in translation style');
    }

    const updatedStyles = appConfig.translationStyles.filter(style => style.id !== styleId);

    // 如果删除的是激活风格，需要更新激活状态
    const deletedStyleId = appConfig.translationConfig.activeTranslationStyleId === styleId
      ? null
      : appConfig.translationConfig.activeTranslationStyleId;

    await this.setAppConfig({
      ...appConfig,
      translationStyles: updatedStyles,
      translationConfig: {
        ...appConfig.translationConfig,
        activeTranslationStyleId: deletedStyleId
      }
    });
  }

  // 获取内置翻译风格
  private static getBuiltInTranslationStyles(): TranslationStyle[] {
    return [
      {
        id: 'default',
        name: '默认风格',
        description: '标准的中英互译，保持原文风格',
        prompt: '请将以下文本进行中英互译，保持原文的风格和语气，确保翻译准确流畅。',
        isBuiltIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'tech-docs',
        name: '编程技术文档',
        description: '适合技术文档、API文档、代码注释等',
        prompt: '请将以下技术文档进行中英互译。保持技术术语的准确性，使用专业的技术语言，确保代码片段和API名称保持原样。技术文档需要精确、简洁、专业。',
        isBuiltIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'literature',
        name: '文学名著',
        description: '适合小说、诗歌、散文等文学作品',
        prompt: '请将以下文学作品进行中英互译。保持文学作品的优美语言和艺术性，注意修辞手法的传达，保持原文的韵律和情感色彩。文学作品需要优雅、富有诗意、情感丰富。',
        isBuiltIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'news',
        name: '时政新闻',
        description: '适合新闻、时事评论、政策文件等',
        prompt: '请将以下新闻内容进行中英互译。保持新闻的客观性和准确性，使用正式的语言风格，确保政治术语和专有名词的准确翻译。新闻需要客观、准确、正式。',
        isBuiltIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'social-media',
        name: '社交网络',
        description: '适合社交媒体、聊天、评论等',
        prompt: '请将以下社交媒体内容进行中英互译。保持口语化和网络用语的特点，注意表情符号和网络流行语的恰当翻译，保持轻松随意的语气。社交媒体需要自然、口语化、生动。',
        isBuiltIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
