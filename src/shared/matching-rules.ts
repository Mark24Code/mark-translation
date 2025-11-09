// 匹配规则定义和配置

import { MatchingRule, ValidationRule, PriorityStrategy } from './matching-types';

// 内置验证规则
export const builtInValidationRules: ValidationRule[] = [
  {
    id: 'min-length',
    name: '最小长度验证',
    description: '确保文本长度在合理范围内',
    validator: (text: string) => {
      if (!text || text.length < 10) return false;
      if (text.length > 1000) return false;
      return true;
    },
    enabled: true
  },
  {
    id: 'url-filter',
    name: 'URL过滤',
    description: '过滤包含URL的文本',
    validator: (text: string) => !text.match(/https?:\/\/[^\s]+/),
    enabled: true
  },
  {
    id: 'meaningful-text',
    name: '有意义文本验证',
    description: '过滤纯数字或符号的文本',
    validator: (text: string) => {
      const cleanText = text.replace(/[^\w]/g, '');
      return cleanText.length >= 5;
    },
    enabled: true
  },
  {
    id: 'navigation-filter',
    name: '导航文本过滤',
    description: '过滤常见的导航文本',
    validator: (text: string) => {
      const navigationWords = [
        'home', 'about', 'contact', 'login', 'sign up', 'signup',
        'menu', 'search', 'follow', 'like', 'share', 'subscribe',
        'download', 'install', 'buy', 'purchase', 'shop', 'cart'
      ];
      const lowerText = text.toLowerCase();
      return !navigationWords.some(word => lowerText.includes(word));
    },
    enabled: true
  }
];

// 内置匹配规则
export const builtInMatchingRules: MatchingRule[] = [
  {
    id: 'universal-text',
    name: '通用文本',
    description: '通用的段落文本选择器',
    selectors: [
      'p',
      'article p',
      'main p',
      '.content p',
      '.article p',
      '.post p'
    ],
    validation: (text: string) => {
      return text.length >= 20 && text.length <= 800;
    },
    priority: 1,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'social-media-twitter',
    name: 'Twitter/X',
    description: 'Twitter/X平台的推文选择器',
    selectors: [
      '[data-testid="tweetText"]',
      '[role="article"] p',
      '.tweet-text',
      '[data-testid="tweet"] span',
      '[data-testid="tweetText"] span'
    ],
    validation: (text: string) => {
      return text.length >= 5 && text.length <= 280;
    },
    priority: 2,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'social-media-facebook',
    name: 'Facebook',
    description: 'Facebook平台的内容选择器',
    selectors: [
      '[data-ad-comet-preview="message"]',
      '.userContent',
      '.story_body_container',
      '[data-testid="post_message"]'
    ],
    validation: (text: string) => {
      return text.length >= 10 && text.length <= 500;
    },
    priority: 3,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'social-media-linkedin',
    name: 'LinkedIn',
    description: 'LinkedIn平台的内容选择器',
    selectors: [
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '.comments-comment-text',
      '.update-components-text'
    ],
    validation: (text: string) => {
      return text.length >= 10 && text.length <= 1000;
    },
    priority: 4,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'news-blog-content',
    name: '新闻和博客',
    description: '新闻网站和博客的内容选择器',
    selectors: [
      '.story-body',
      '.entry-content',
      '.post-content',
      '.text-content',
      '.article-body',
      '.content-body'
    ],
    validation: (text: string) => {
      return text.length >= 30 && text.length <= 1500;
    },
    priority: 5,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'forum-community',
    name: '论坛和社区',
    description: '论坛和社区网站的内容选择器',
    selectors: [
      '.post-body',
      '.comment-content',
      '.message-body',
      '.thread-content',
      '.discussion-content'
    ],
    validation: (text: string) => {
      return text.length >= 10 && text.length <= 800;
    },
    priority: 6,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'modern-apps',
    name: '现代应用',
    description: '现代Web应用的内容选择器',
    selectors: [
      '[class*="text"]',
      '[class*="content"]',
      '[class*="message"]',
      '[class*="post"]',
      '[class*="tweet"]',
      '[class*="comment"]'
    ],
    validation: (text: string) => {
      return text.length >= 10 && text.length <= 500;
    },
    priority: 7,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// 内置优先级策略
export const builtInPriorityStrategies: PriorityStrategy[] = [
  {
    id: 'visibility-priority',
    name: '可见性优先',
    description: '优先处理可见区域内的元素',
    calculator: (element: Element) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= viewportHeight &&
        rect.right <= viewportWidth
      );

      return isVisible ? 0 : 100;
    },
    enabled: true
  },
  {
    id: 'proximity-priority',
    name: '距离优先',
    description: '根据元素距离视口的距离计算优先级',
    calculator: (element: Element) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      const distanceFromTop = Math.max(0, -rect.top);
      const distanceFromBottom = Math.max(0, rect.bottom - viewportHeight);
      const minDistance = Math.min(distanceFromTop, distanceFromBottom);

      return minDistance;
    },
    enabled: true
  },
  {
    id: 'size-priority',
    name: '大小优先',
    description: '根据元素大小计算优先级',
    calculator: (element: Element) => {
      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;

      // 面积越大，优先级越高（数值越小）
      return Math.max(0, 1000 - area / 100);
    },
    enabled: false
  }
];