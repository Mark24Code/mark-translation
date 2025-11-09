import React from 'react';
import { createRoot } from 'react-dom/client';
import { TranslationConfig } from '../shared/types';

class TranslationManager {
  private config: TranslationConfig;
  private isTranslating = false;

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  // 检测页面语言
  private detectPageLanguage(): 'zh' | 'en' {
    const htmlLang = document.documentElement.lang?.toLowerCase();
    const textContent = document.body.textContent || '';

    if (htmlLang.includes('zh') || this.isChineseText(textContent)) {
      return 'zh';
    }
    return 'en';
  }

  // 判断是否为中文文本
  private isChineseText(text: string): boolean {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    const totalChars = text.replace(/\s/g, '').length;

    if (!chineseChars || totalChars === 0) return false;

    return (chineseChars.length / totalChars) > 0.3;
  }

  // 获取文本段落
  private getTextParagraphs(): string[] {
    const paragraphs: string[] = [];

    // 选择主要的文本容器
    const selectors = [
      'p',
      'article p',
      'main p',
      '.content p',
      '.article p',
      '.post p'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 10) { // 过滤短文本
          paragraphs.push(text);
        }
      });
    });

    return [...new Set(paragraphs)]; // 去重
  }

  // 翻译文本
  private async translateText(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'translate',
          data: {
            text,
            sourceLang: this.config.sourceLang,
            targetLang: this.config.targetLang
          }
        },
        (response) => {
          if (response.success) {
            resolve(response.translated);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  // 在原文下方插入翻译
  private insertTranslation(originalElement: Element, translatedText: string) {
    const translationElement = document.createElement('div');
    translationElement.className = 'mark-translation';
    translationElement.style.cssText = `
      margin-top: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-left: 3px solid #007acc;
      border-radius: 4px;
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    `;
    translationElement.textContent = translatedText;

    originalElement.parentNode?.insertBefore(translationElement, originalElement.nextSibling);
  }

  // 执行页面翻译
  async translatePage() {
    if (this.isTranslating) return;

    this.isTranslating = true;

    try {
      const paragraphs = this.getTextParagraphs();
      console.log(`Found ${paragraphs.length} paragraphs to translate`);

      // 批量翻译
      for (const paragraph of paragraphs) {
        try {
          const translated = await this.translateText(paragraph);

          // 找到对应的 DOM 元素并插入翻译
          const elements = document.querySelectorAll('p, article p, main p, .content p');
          for (const element of elements) {
            if (element.textContent?.trim() === paragraph) {
              this.insertTranslation(element, translated);
              break;
            }
          }
        } catch (error) {
          console.error('Translation failed for paragraph:', paragraph, error);
        }
      }
    } catch (error) {
      console.error('Page translation failed:', error);
    } finally {
      this.isTranslating = false;
    }
  }

  // 清除所有翻译
  clearTranslations() {
    const translationElements = document.querySelectorAll('.mark-translation');
    translationElements.forEach(element => element.remove());
  }
}

// 初始化内容脚本
async function initialize() {
  // 监听来自弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'translatePage') {
      const translationManager = new TranslationManager(message.config);
      translationManager.translatePage();
      sendResponse({ success: true });
    } else if (message.type === 'clearTranslations') {
      const translationManager = new TranslationManager(message.config);
      translationManager.clearTranslations();
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('Mark Translation content script loaded');
}

// 启动内容脚本
initialize();