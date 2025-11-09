import { AIConfig, TranslationResult } from './types';

export class TranslationAPI {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    try {
      let response;

      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(text, sourceLang, targetLang);
          break;
        case 'deepseek':
          response = await this.callDeepSeek(text, sourceLang, targetLang);
          break;
        case 'claude':
          response = await this.callClaude(text, sourceLang, targetLang);
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

  private async callOpenAI(text: string, sourceLang: string, targetLang: string): Promise<string> {
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
            content: `You are a professional translator. Translate the following ${sourceLang} text to ${targetLang}. Only return the translation, no explanations.`
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

  private async callDeepSeek(text: string, sourceLang: string, targetLang: string): Promise<string> {
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
            content: `Translate the following ${sourceLang} text to ${targetLang}. Only return the translation.`
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

  private async callClaude(text: string, sourceLang: string, targetLang: string): Promise<string> {
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
            content: `Translate the following ${sourceLang} text to ${targetLang}. Only return the translation: ${text}`
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