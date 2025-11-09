import { AIConfig, TranslationResult, TranslationStyle } from './types';

export class TranslationAPI {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async translate(text: string, sourceLang: string, targetLang: string, translationStyle?: TranslationStyle | null): Promise<TranslationResult> {
    try {
      let response;

      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(text, sourceLang, targetLang, translationStyle);
          break;
        case 'deepseek':
          response = await this.callDeepSeek(text, sourceLang, targetLang, translationStyle);
          break;
        case 'claude':
          response = await this.callClaude(text, sourceLang, targetLang, translationStyle);
          break;
        default:
          throw new Error('Unsupported AI provider');
      }

      return {
        original: text,
        translated: response,
        success: true
      };
    } catch (error) {
      return {
        original: text,
        translated: '',
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  private async callOpenAI(text: string, sourceLang: string, targetLang: string, translationStyle?: TranslationStyle | null): Promise<string> {
    // 使用翻译风格的提示词，如果没有则使用默认提示词
    const systemPrompt = translationStyle?.prompt || `You are a professional translator. Translate the following ${sourceLang} text to ${targetLang}. Only return the translation, no explanations.`;

    const response = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  private async callDeepSeek(text: string, sourceLang: string, targetLang: string, translationStyle?: TranslationStyle | null): Promise<string> {
    // 使用翻译风格的提示词，如果没有则使用默认提示词
    const systemPrompt = translationStyle?.prompt || `Translate the following ${sourceLang} text to ${targetLang}. Only return the translation.`;

    const response = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  private async callClaude(text: string, sourceLang: string, targetLang: string, translationStyle?: TranslationStyle | null): Promise<string> {
    // 使用翻译风格的提示词，如果没有则使用默认提示词
    const userPrompt = translationStyle?.prompt
      ? `${translationStyle.prompt}\n\nText to translate: ${text}`
      : `Translate the following ${sourceLang} text to ${targetLang}. Only return the translation: ${text}`;

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  }
}