import zhMessages from '../locales/zh.json';
import enMessages from '../locales/en.json';

const messages = {
  zh: zhMessages,
  en: enMessages
};

export type Language = 'zh' | 'en';

export class I18nManager {
  private static currentLanguage: Language = 'zh';

  static setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  static getLanguage(): Language {
    return this.currentLanguage;
  }

  static t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = messages[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，返回 key 本身
        return key;
      }
    }

    if (typeof value === 'string' && params) {
      return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, paramName) => {
        return params[paramName]?.toString() || match;
      });
    }

    return typeof value === 'string' ? value : key;
  }

  static getMessages(): typeof zhMessages {
    return messages[this.currentLanguage];
  }

  // 获取所有支持的语言
  static getSupportedLanguages(): { code: Language; name: string }[] {
    return [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ];
  }
}

// React Hook for i18n
export const useI18n = () => {
  return {
    t: I18nManager.t.bind(I18nManager),
    setLanguage: I18nManager.setLanguage.bind(I18nManager),
    getLanguage: I18nManager.getLanguage.bind(I18nManager),
    getSupportedLanguages: I18nManager.getSupportedLanguages.bind(I18nManager)
  };
};

export default I18nManager;