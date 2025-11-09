// 匹配规则和策略类型定义

export interface MatchingRule {
  id: string;
  name: string;
  description: string;
  selectors: string[];
  validation: (text: string) => boolean;
  priority?: number; // 规则优先级，数值越小优先级越高
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validator: (text: string) => boolean;
  enabled: boolean;
}

export interface PriorityStrategy {
  id: string;
  name: string;
  description: string;
  calculator: (element: Element) => number;
  enabled: boolean;
}

export interface MatchingConfig {
  rules: MatchingRule[];
  validations: ValidationRule[];
  strategies: PriorityStrategy[];
  maxTextLength: number;
  minTextLength: number;
  maxElementsPerPage: number;
}

export interface MatchingResult {
  element: Element;
  text: string;
  rule: MatchingRule;
  priority: number;
  isValid: boolean;
}

export interface MatchingEngine {
  findElements(): Element[];
  validateElements(elements: Element[]): MatchingResult[];
  prioritizeResults(results: MatchingResult[]): MatchingResult[];
  getConfig(): MatchingConfig;
  updateConfig(config: Partial<MatchingConfig>): void;
}