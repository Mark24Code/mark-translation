export interface AIConfig {
  apiUrl: string;
  model: string;
  apiKey: string;
  provider: 'deepseek' | 'openai' | 'claude';
}

export interface TranslationConfig {
  sourceLang: 'zh' | 'en';
  targetLang: 'zh' | 'en';
  autoTranslate: boolean;
}

export interface TranslationResult {
  original: string;
  translated: string;
  success: boolean;
  error?: string;
}

export interface Message {
  type: 'translate' | 'config' | 'status';
  data?: any;
}