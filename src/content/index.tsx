// import React from 'react';
// import { createRoot } from 'react-dom/client';
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

    if (htmlLang?.includes('zh') || this.isChineseText(textContent)) {
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
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.success) {
            resolve(response.translated);
          } else {
            reject(new Error(response?.error || 'Translation failed'));
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

  // 在原文下方插入加载状态
  private insertLoadingState(originalElement: Element): HTMLDivElement {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'mark-translation-loading';
    loadingElement.style.cssText = `
      margin-top: 8px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-left: 3px solid #ffc107;
      border-radius: 4px;
      font-size: 0.9em;
      color: #856404;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 创建加载动画
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007acc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    const loadingText = document.createElement('span');
    loadingText.textContent = '翻译中...';

    loadingElement.appendChild(spinner);
    loadingElement.appendChild(loadingText);

    originalElement.parentNode?.insertBefore(loadingElement, originalElement.nextSibling);

    return loadingElement;
  }

  // 移除加载状态
  private removeLoadingState(loadingElement: HTMLDivElement) {
    loadingElement.remove();
  }

  // 并发处理翻译任务
  private async processTranslationBatch(
    tasks: Array<{ paragraph: string; targetElement: Element; loadingElement: HTMLDivElement }>,
    parallelLimit: number
  ): Promise<void> {
    const results: Array<{ success: boolean; translated?: string; error?: string }> = [];

    // 使用 Promise.all 和 slice 来实现并发控制
    for (let i = 0; i < tasks.length; i += parallelLimit) {
      const batch = tasks.slice(i, i + parallelLimit);

      const batchPromises = batch.map(async (task) => {
        try {
          const translated = await this.translateText(task.paragraph);
          return { success: true, translated };
        } catch (error) {
          console.error('Translation failed for paragraph:', task.paragraph, error);
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 处理当前批次的结果
      batch.forEach((task, index) => {
        const result = batchResults[index];

        // 移除加载状态
        this.removeLoadingState(task.loadingElement);

        if (result.success && result.translated) {
          // 插入翻译结果
          this.insertTranslation(task.targetElement, result.translated);
        } else {
          // 插入错误状态
          const errorElement = document.createElement('div');
          errorElement.className = 'mark-translation-error';
          errorElement.style.cssText = `
            margin-top: 8px;
            padding: 8px 12px;
            background: #f8d7da;
            border-left: 3px solid #dc3545;
            border-radius: 4px;
            font-size: 0.9em;
            color: #721c24;
            font-style: italic;
          `;
          errorElement.textContent = '翻译失败';
          task.targetElement.parentNode?.insertBefore(errorElement, task.targetElement.nextSibling);
        }
      });
    }
  }

  // 执行页面翻译
  async translatePage() {
    if (this.isTranslating) return;

    this.isTranslating = true;

    try {
      const paragraphs = this.getTextParagraphs();
      console.log(`Found ${paragraphs.length} paragraphs to translate`);

      // 准备翻译任务
      const translationTasks: Array<{ paragraph: string; targetElement: Element; loadingElement: HTMLDivElement }> = [];

      for (const paragraph of paragraphs) {
        // 找到对应的 DOM 元素
        const elements = document.querySelectorAll('p, article p, main p, .content p');
        let targetElement: Element | null = null;

        for (const element of elements) {
          if (element.textContent?.trim() === paragraph) {
            targetElement = element;
            break;
          }
        }

        if (!targetElement) continue;

        // 插入加载状态
        const loadingElement = this.insertLoadingState(targetElement);
        translationTasks.push({ paragraph, targetElement, loadingElement });
      }

      // 使用配置的并行任务数量进行并发翻译
      const parallelLimit = this.config.parallelTasks || 6;
      console.log(`Using parallel limit: ${parallelLimit}`);

      await this.processTranslationBatch(translationTasks, parallelLimit);

    } catch (error) {
      console.error('Page translation failed:', error);
    } finally {
      this.isTranslating = false;
    }
  }

  // 清除所有翻译
  clearTranslations() {
    const translationElements = document.querySelectorAll('.mark-translation');
    const loadingElements = document.querySelectorAll('.mark-translation-loading');
    const errorElements = document.querySelectorAll('.mark-translation-error');

    translationElements.forEach(element => element.remove());
    loadingElements.forEach(element => element.remove());
    errorElements.forEach(element => element.remove());
  }
}

// 注入 CSS 样式
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// 初始化内容脚本
async function initialize() {
  // 注入 CSS 样式
  injectStyles();

  // 监听来自弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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