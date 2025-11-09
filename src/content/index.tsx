// import React from 'react';
// import { createRoot } from 'react-dom/client';
import { TranslationConfig } from '../shared/types';

// 获取语言设置的辅助函数
async function getLanguage(): Promise<'zh' | 'en'> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('appConfig', (result) => {
      const appConfig = result.appConfig;
      const language = appConfig?.language || 'zh';
      resolve(language);
    });
  });
}

class TranslationManager {
  protected config: TranslationConfig;
  protected isTranslating = false;
  protected language: 'zh' | 'en' = 'zh';

  constructor(config: TranslationConfig) {
    this.config = config;
    this.initializeLanguage();
  }

  // 初始化语言设置
  private async initializeLanguage() {
    this.language = await getLanguage();
  }

  // 获取翻译消息
  private t(key: string): string {
    const messages = {
      zh: {
        translating: '翻译中...',
        translationFailed: '翻译失败',
        loading: '翻译中...'
      },
      en: {
        translating: 'Translating...',
        translationFailed: 'Translation failed',
        loading: 'Translating...'
      }
    };

    return messages[this.language][key as keyof typeof messages['zh']] || key;
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
    loadingText.textContent = this.t('loading');

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
          errorElement.textContent = this.t('translationFailed');
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
      // 先清除所有现有的翻译结果
      this.clearTranslations();

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

      // 发送翻译完成通知
      chrome.runtime.sendMessage({
        type: 'translationCompleted',
        success: true
      });

    } catch (error) {
      console.error('Page translation failed:', error);
      // 发送翻译失败通知
      chrome.runtime.sendMessage({
        type: 'translationCompleted',
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      });
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

  let scrollTranslationManager: ScrollTranslationManager | null = null;

  // 监听来自弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'translatePage') {
      // 使用传统翻译模式
      const translationManager = new TranslationManager(message.config);
      translationManager.translatePage();
      sendResponse({ success: true });
    } else if (message.type === 'translatePageScroll') {
      // 使用滚动翻译模式
      if (scrollTranslationManager) {
        scrollTranslationManager.stopScrollTranslation();
      }
      scrollTranslationManager = new ScrollTranslationManager(message.config);
      scrollTranslationManager.startScrollTranslation();
      sendResponse({ success: true });
    } else if (message.type === 'clearTranslations') {
      const translationManager = new TranslationManager(message.config);
      translationManager.clearTranslations();
      if (scrollTranslationManager) {
        scrollTranslationManager.stopScrollTranslation();
      }
      sendResponse({ success: true });
    } else if (message.type === 'stopScrollTranslation') {
      if (scrollTranslationManager) {
        scrollTranslationManager.stopScrollTranslation();
        scrollTranslationManager = null;
      }
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('Mark Translation content script loaded');
}

// 滚动翻译管理器 - 基于可见区域的任务队列
class ScrollTranslationManager extends TranslationManager {
  private observer: IntersectionObserver | null = null;
  private translationQueue: Array<{ element: Element; text: string; priority: number }> = [];
  private isProcessingQueue = false;
  private processedElements = new Set<Element>();
  private batchSize = 3; // 每次处理的翻译任务数量
  private scrollDebounceTimer: number | null = null;

  constructor(config: TranslationConfig) {
    super(config);
  }

  // 初始化滚动翻译
  async startScrollTranslation() {
    if (this.isTranslating) return;

    this.isTranslating = true;

    // 先清除所有现有的翻译结果
    this.clearTranslations();
    this.processedElements.clear();

    // 设置 Intersection Observer 来检测可见区域
    this.setupIntersectionObserver();

    // 添加滚动事件监听器（带防抖）
    this.setupScrollListener();

    // 初始扫描可见区域
    this.scanVisibleArea();

    console.log('Scroll translation started');
  }

  // 设置滚动事件监听器（带防抖）
  private setupScrollListener() {
    const handleScroll = () => {
      // 清除之前的防抖计时器
      if (this.scrollDebounceTimer) {
        clearTimeout(this.scrollDebounceTimer);
      }

      // 设置新的防抖计时器
      this.scrollDebounceTimer = window.setTimeout(() => {
        this.handleScroll();
      }, 150); // 150ms 防抖延迟
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // 处理滚动事件
  private handleScroll() {
    // 重新计算队列中所有任务的优先级并重新排序
    this.reprioritizeQueue();

    // 重新扫描可见区域，添加新出现的元素
    this.scanVisibleArea();
  }

  // 重新计算队列优先级
  private reprioritizeQueue() {
    // 为队列中的每个任务重新计算优先级
    this.translationQueue.forEach(task => {
      task.priority = this.calculatePriority(task.element);
    });

    // 重新按优先级排序
    this.translationQueue.sort((a, b) => a.priority - b.priority);

    // 如果正在处理队列，可能需要重新安排处理顺序
    if (this.isProcessingQueue && this.translationQueue.length > 0) {
      console.log('Queue reprioritized during processing');
    }
  }

  // 设置 Intersection Observer
  private setupIntersectionObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleElementVisible(entry.target);
          }
        });
      },
      {
        root: null, // 相对于视口
        rootMargin: '100px', // 提前100px开始检测
        threshold: 0.1 // 10%可见时触发
      }
    );

    // 观察所有文本元素
    const textElements = this.getAllTextElements();
    textElements.forEach(element => {
      this.observer!.observe(element);
    });
  }

  // 获取所有文本元素
  private getAllTextElements(): Element[] {
    const elements: Element[] = [];
    const selectors = [
      'p',
      'article p',
      'main p',
      '.content p',
      '.article p',
      '.post p',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'li',
      '.text', '.paragraph'
    ];

    selectors.forEach(selector => {
      const foundElements = document.querySelectorAll(selector);
      foundElements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 10 && !this.processedElements.has(element)) {
          elements.push(element);
        }
      });
    });

    return elements;
  }

  // 计算元素优先级（基于可见性）
  private calculatePriority(element: Element): number {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    // 检查是否在可见区域内
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth
    );

    if (isVisible) {
      // 在可见区域内，优先级最高（数值越小优先级越高）
      return 0;
    } else {
      // 在可见区域外，根据距离计算优先级
      // 距离视口顶部越近，优先级越高
      const distanceFromTop = Math.max(0, -rect.top);
      const distanceFromBottom = Math.max(0, rect.bottom - viewportHeight);
      const minDistance = Math.min(distanceFromTop, distanceFromBottom);

      // 距离越小，优先级越高（数值越小）
      return 100 + minDistance;
    }
  }

  // 处理元素可见
  private handleElementVisible(element: Element) {
    if (this.processedElements.has(element)) return;

    const text = element.textContent?.trim();
    if (!text || text.length < 10) return;

    // 计算优先级
    const priority = this.calculatePriority(element);

    // 添加到翻译队列（按优先级排序）
    this.addToQueue({ element, text, priority });
    this.processedElements.add(element);

    // 触发队列处理
    this.processTranslationQueue();
  }

  // 添加任务到队列（按优先级排序）
  private addToQueue(task: { element: Element; text: string; priority: number }) {
    this.translationQueue.push(task);
    // 按优先级排序（数值越小优先级越高）
    this.translationQueue.sort((a, b) => a.priority - b.priority);
  }

  // 扫描初始可见区域
  private scanVisibleArea() {
    const elements = this.getAllTextElements();

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      if (isVisible) {
        this.handleElementVisible(element);
      }
    });
  }

  // 处理翻译队列
  private async processTranslationQueue() {
    if (this.isProcessingQueue || this.translationQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      // 从队列中取出优先级最高的批量任务
      const batch = this.translationQueue.splice(0, this.batchSize);

      if (batch.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      console.log(`Processing batch with priorities: ${batch.map(t => t.priority).join(', ')}`);

      // 为每个任务创建加载状态
      const tasks = batch.map(task => ({
        element: task.element,
        text: task.text,
        loadingElement: this.insertLoadingState(task.element)
      }));

      // 并发翻译
      const parallelLimit = this.config.parallelTasks || 3;
      await this.processTranslationBatch(tasks, parallelLimit);

      // 继续处理队列中的剩余任务
      setTimeout(() => {
        this.isProcessingQueue = false;
        if (this.translationQueue.length > 0) {
          this.processTranslationQueue();
        }
      }, 100);

    } catch (error) {
      console.error('Translation queue processing failed:', error);
      this.isProcessingQueue = false;
    }
  }

  // 处理翻译批次
  private async processTranslationBatch(
    tasks: Array<{ element: Element; text: string; loadingElement: HTMLDivElement }>,
    parallelLimit: number
  ): Promise<void> {
    const results: Array<{ success: boolean; translated?: string; error?: string }> = [];

    // 使用 Promise.all 和 slice 来实现并发控制
    for (let i = 0; i < tasks.length; i += parallelLimit) {
      const batch = tasks.slice(i, i + parallelLimit);

      const batchPromises = batch.map(async (task) => {
        try {
          const translated = await this.translateText(task.text);
          return { success: true, translated };
        } catch (error) {
          console.error('Translation failed for paragraph:', task.text, error);
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
          this.insertTranslation(task.element, result.translated);
        } else {
          // 插入错误状态
          this.insertErrorState(task.element, this.t('translationFailed'));
        }
      });
    }
  }

  // 插入错误状态
  private insertErrorState(originalElement: Element, errorMessage: string) {
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
    errorElement.textContent = errorMessage;
    originalElement.parentNode?.insertBefore(errorElement, originalElement.nextSibling);
  }

  // 停止滚动翻译
  stopScrollTranslation() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 清除防抖计时器
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = null;
    }

    // 移除滚动事件监听器
    window.removeEventListener('scroll', this.handleScroll);

    this.isTranslating = false;
    this.translationQueue = [];
    this.isProcessingQueue = false;

    console.log('Scroll translation stopped');
  }

  // 重新扫描页面（用于手动触发）
  rescanPage() {
    this.processedElements.clear();
    this.translationQueue = [];

    if (this.observer) {
      this.observer.disconnect();
    }

    this.setupIntersectionObserver();
    this.scanVisibleArea();
  }

  // 获取队列状态（用于调试）
  getQueueStatus() {
    const visibleCount = this.translationQueue.filter(task => task.priority === 0).length;
    const totalCount = this.translationQueue.length;
    return {
      visibleCount,
      totalCount,
      priorities: this.translationQueue.map(task => task.priority)
    };
  }
}

// 启动内容脚本
initialize();