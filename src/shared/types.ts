export interface AIConfig {
  id: string;
  name: string;
  apiUrl: string;
  model: string;
  apiKey: string;
  provider: 'deepseek' | 'openai' | 'claude';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TranslationConfig {
  sourceLang: 'zh' | 'en';
  targetLang: 'zh' | 'en';
  autoTranslate: boolean;
  parallelTasks: number;
  activeAIConfigId: string | null;
}

export interface AppConfig {
  aiConfigs: AIConfig[];
  translationConfig: TranslationConfig;
  language: 'zh' | 'en';
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