// import React from 'react';
// import { createRoot } from 'react-dom/client';
import { TranslationConfig } from '../shared/types';
import { createMatchingEngine } from '../shared/matching-engine';
import { PARALLEL_TASKS_DEFAULT } from '../constants';
import './content.scss';

// 获取语言设置的辅助函数
async function getLanguage(): Promise<'zh' | 'en'> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('appConfig', (result) => {
      // Firefox 兼容性处理：result 可能为 undefined 或空对象
      const appConfig = result?.appConfig;
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

  // 调试方法：显示找到的元素信息
  private debugElements(selector: string, elements: NodeListOf<Element>) {
    // console.log(`Selector '${selector}' found ${elements.length} elements:`);
    elements.forEach((element, index) => {
      const text = this.extractTextContent(element);
      const isValid = this.isValidText(text);
      // console.log(`  [${index}] ${isValid ? '✓' : '✗'} "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    });
  }

  // 获取文本段落
  private getTextParagraphs(): string[] {
    const paragraphs: string[] = [];

    // 使用匹配引擎查找和验证元素
    const matchingEngine = createMatchingEngine();
    const elements = matchingEngine.findElements();
    const validatedResults = matchingEngine.validateElements(elements);
    const prioritizedResults = matchingEngine.prioritizeResults(validatedResults);

    // 提取有效的文本内容
    prioritizedResults.forEach(result => {
      if (result.isValid) {
        paragraphs.push(result.text);
      }
    });

    return [...new Set(paragraphs)]; // 去重
  }

  // 提取文本内容，处理复杂的 DOM 结构
  private extractTextContent(element: Element): string {
    // 克隆元素以避免修改原 DOM
    const clone = element.cloneNode(true) as Element;

    // 移除不需要的元素
    const elementsToRemove = clone.querySelectorAll(
      'script, style, noscript, iframe, img, video, audio, button, input, select, textarea, nav, header, footer, aside, .ad, .advertisement, .sponsored, [aria-hidden="true"]'
    );
    elementsToRemove.forEach(el => el.remove());

    // 获取清理后的文本内容
    const text = clone.textContent?.trim() || '';

    // 进一步清理文本
    return this.cleanText(text);
  }

  // 清理文本内容
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/^\s+|\s+$/g, '') // 去除首尾空格
      .replace(/[\r\n\t]+/g, ' ') // 替换换行符和制表符
      .trim();
  }

  // 验证文本是否适合翻译
  private isValidText(text: string): boolean {
    if (!text || text.length < 10) return false;

    // 过滤掉 URL
    if (text.match(/https?:\/\/[^\s]+/)) return false;

    // 过滤掉纯数字或符号
    if (text.replace(/[^\w]/g, '').length < 5) return false;

    // 过滤掉常见的导航文本
    const navigationWords = ['home', 'about', 'contact', 'login', 'sign up', 'menu', 'search', 'follow', 'like', 'share'];
    const lowerText = text.toLowerCase();
    if (navigationWords.some(word => lowerText.includes(word))) {
      return false;
    }

    return true;
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
    translationElement.className = 'mark-translation-typing';

    // 初始为空内容
    translationElement.textContent = '';

    originalElement.parentNode?.insertBefore(translationElement, originalElement.nextSibling);

    // 开始逐字显示
    this.typeText(translationElement, translatedText);
  }

  // 逐字显示文本
  private typeText(element: HTMLDivElement, text: string) {
    let index = 0;
    const speed = 30; // 每个字符的显示间隔（毫秒）

    const typeNextChar = () => {
      if (index < text.length) {
        // 添加下一个字符
        element.textContent = text.substring(0, index + 1);
        index++;
        setTimeout(typeNextChar, speed);
      } else {
        // 打字完成，设置最终类名
        element.className = 'mark-translation';
      }
    };

    // 开始打字
    setTimeout(typeNextChar, 100);
  }

  // 在原文下方插入加载状态
  private insertLoadingState(originalElement: Element): HTMLDivElement {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'mark-translation-loading';

    // 创建圆形loading动画
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

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
      // console.log(`Found ${paragraphs.length} paragraphs to translate`);

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
      const parallelLimit = this.config.parallelTasks || PARALLEL_TASKS_DEFAULT;
      // console.log(`Using parallel limit: ${parallelLimit}`);

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


// 初始化内容脚本
async function initialize() {

  let scrollTranslationManager: ScrollTranslationManager | null = null;

  // 监听来自弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'translatePage' || message.type === 'translatePageScroll') {
      // 使用滚动翻译模式（默认模式）
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

  // console.log('Mark Translation content script loaded');
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

    // console.log('Scroll translation started');
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
      // console.log('Queue reprioritized during processing');
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
    const seenElements = new Set<Element>();

    // 使用匹配引擎查找元素
    const matchingEngine = createMatchingEngine();
    const foundElements = matchingEngine.findElements();

    // 过滤已处理的元素和重复元素
    foundElements.forEach(element => {
      if (!this.processedElements.has(element) && !seenElements.has(element)) {
        seenElements.add(element);
        elements.push(element);
      }
    });

    return elements;
  }

  // 计算元素优先级（基于可见性）
  private calculatePriority(element: Element): number {
    // 使用匹配引擎的优先级策略
    const matchingEngine = createMatchingEngine();
    const config = matchingEngine.getConfig();

    let priority = 999; // 默认优先级

    // 应用所有启用的优先级策略
    for (const strategy of config.strategies) {
      if (strategy.enabled) {
        const strategyPriority = strategy.calculator(element);
        // 取最小的优先级值（数值越小优先级越高）
        priority = Math.min(priority, strategyPriority);
      }
    }

    return priority;
  }

  // 处理元素可见
  private handleElementVisible(element: Element) {
    if (this.processedElements.has(element)) return;

    // 使用匹配引擎验证元素
    const matchingEngine = createMatchingEngine();
    const elements = [element];
    const validatedResults = matchingEngine.validateElements(elements);

    if (validatedResults.length === 0 || !validatedResults[0].isValid) return;

    const text = validatedResults[0].text;
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

    // 使用匹配引擎的可见性策略来优化检测
    const matchingEngine = createMatchingEngine();
    const config = matchingEngine.getConfig();
    const visibilityStrategy = config.strategies.find(s => s.id === 'visibility-priority' && s.enabled);

    elements.forEach(element => {
      let isVisible = false;

      if (visibilityStrategy) {
        // 使用匹配引擎的可见性策略
        const priority = visibilityStrategy.calculator(element);
        isVisible = priority === 0; // 可见性策略中0表示完全可见
      } else {
        // 回退到基本的可见性检测
        const rect = element.getBoundingClientRect();
        isVisible = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      }

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

      // console.log(`Processing batch with priorities: ${batch.map(t => t.priority).join(', ')}`);

      // 为每个任务创建加载状态
      const tasks = batch.map(task => ({
        element: task.element,
        text: task.text,
        loadingElement: this.insertLoadingState(task.element)
      }));

      // 并发翻译
      const parallelLimit = this.config.parallelTasks || PARALLEL_TASKS_DEFAULT;
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

    // 错误消息
    const messageSpan = document.createElement('span');
    messageSpan.className = 'error-message';
    messageSpan.textContent = errorMessage;

    // 重试按钮
    const retryButton = document.createElement('button');
    retryButton.className = 'retry-button';
    retryButton.title = '重试翻译';

    // 环绕箭头图标 (SVG)
    const retryIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    retryIcon.setAttribute('viewBox', '0 0 24 24');
    retryIcon.setAttribute('class', 'retry-icon');
    retryIcon.innerHTML = `
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    `;

    retryButton.appendChild(retryIcon);

    // 重试点击事件
    retryButton.addEventListener('click', () => {
      this.handleRetryTranslation(originalElement, errorElement);
    });

    errorElement.appendChild(messageSpan);
    errorElement.appendChild(retryButton);
    originalElement.parentNode?.insertBefore(errorElement, originalElement.nextSibling);
  }

  // 处理重试翻译
  private async handleRetryTranslation(originalElement: Element, errorElement: HTMLDivElement) {
    const retryButton = errorElement.querySelector('.retry-button') as HTMLButtonElement;
    if (!retryButton) return;

    // 禁用按钮并显示重试中状态
    retryButton.disabled = true;
    retryButton.classList.add('retrying');

    try {
      // 移除错误元素
      errorElement.remove();

      // 插入加载状态
      const loadingElement = this.insertLoadingState(originalElement);

      // 提取原始文本
      const text = this.extractTextContent(originalElement);

      if (!text || !this.isValidText(text)) {
        throw new Error('Invalid text for translation');
      }

      // 重新翻译
      const translated = await this.translateText(text);

      // 移除加载状态
      this.removeLoadingState(loadingElement);

      // 插入翻译结果
      this.insertTranslation(originalElement, translated);

    } catch (error) {
      console.error('Retry translation failed:', error);

      // 重新插入错误状态
      this.insertErrorState(originalElement, this.t('translationFailed'));
    } finally {
      // 重置按钮状态
      retryButton.disabled = false;
      retryButton.classList.remove('retrying');
    }
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

    // console.log('Scroll translation stopped');
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
