// 匹配引擎实现

import {
  MatchingEngine,
  MatchingConfig,
  MatchingResult,
  MatchingRule,
  ValidationRule,
  PriorityStrategy
} from './matching-types';
import {
  builtInMatchingRules,
  builtInValidationRules,
  builtInPriorityStrategies
} from './matching-rules';

export class DefaultMatchingEngine implements MatchingEngine {
  private config: MatchingConfig;

  constructor(config?: Partial<MatchingConfig>) {
    this.config = {
      rules: builtInMatchingRules,
      validations: builtInValidationRules,
      strategies: builtInPriorityStrategies,
      maxTextLength: 1000,
      minTextLength: 10,
      maxElementsPerPage: 50,
      ...config
    };
  }

  // 查找所有匹配的元素
  findElements(): Element[] {
    const allElements: Element[] = [];
    const seenElements = new Set<Element>();

    // 遍历所有启用的规则
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      for (const selector of rule.selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            // 去重
            if (!seenElements.has(element)) {
              seenElements.add(element);
              allElements.push(element);
            }
          }
        } catch (error) {
          console.warn(`Invalid selector: ${selector}`, error);
        }
      }
    }

    // 限制元素数量
    return allElements.slice(0, this.config.maxElementsPerPage);
  }

  // 验证元素并提取文本
  validateElements(elements: Element[]): MatchingResult[] {
    const results: MatchingResult[] = [];

    for (const element of elements) {
      const text = this.extractText(element);
      if (!text) continue;

      // 应用所有启用的验证规则
      const isValid = this.validateText(text);

      // 找到匹配的规则
      const matchingRule = this.findMatchingRule(element, text);
      if (!matchingRule) continue;

      results.push({
        element,
        text,
        rule: matchingRule,
        priority: matchingRule.priority || 999,
        isValid
      });
    }

    return results;
  }

  // 对结果进行优先级排序
  prioritizeResults(results: MatchingResult[]): MatchingResult[] {
    // 首先按规则优先级排序
    const sortedByRule = results.sort((a, b) => a.priority - b.priority);

    // 然后应用启用的策略
    for (const strategy of this.config.strategies) {
      if (strategy.enabled) {
        sortedByRule.sort((a, b) => {
          const priorityA = strategy.calculator(a.element);
          const priorityB = strategy.calculator(b.element);
          return priorityA - priorityB;
        });
      }
    }

    return sortedByRule;
  }

  // 获取配置
  getConfig(): MatchingConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(config: Partial<MatchingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 添加自定义规则
  addRule(rule: MatchingRule): void {
    this.config.rules.push(rule);
  }

  // 移除规则
  removeRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter(rule => rule.id !== ruleId);
  }

  // 启用/禁用规则
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.updatedAt = Date.now();
    }
  }

  // 私有方法
  private extractText(element: Element): string {
    // 获取元素的文本内容
    let text = element.textContent?.trim() || '';

    // 清理文本
    text = text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/^\s+|\s+$/g, '') // 去除首尾空格
      .replace(/[\r\n]+/g, ' ') // 替换换行符
      .trim();

    return text;
  }

  private validateText(text: string): boolean {
    // 基本长度检查
    if (text.length < this.config.minTextLength || text.length > this.config.maxTextLength) {
      return false;
    }

    // 应用所有启用的验证规则
    for (const validation of this.config.validations) {
      if (validation.enabled && !validation.validator(text)) {
        return false;
      }
    }

    return true;
  }

  private findMatchingRule(element: Element, text: string): MatchingRule | null {
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      // 检查元素是否匹配选择器
      const isMatching = rule.selectors.some(selector => {
        try {
          return element.matches(selector);
        } catch (error) {
          return false;
        }
      });

      if (isMatching && rule.validation(text)) {
        return rule;
      }
    }

    return null;
  }
}

// 创建默认匹配引擎实例
export const createMatchingEngine = (config?: Partial<MatchingConfig>): MatchingEngine => {
  return new DefaultMatchingEngine(config);
};