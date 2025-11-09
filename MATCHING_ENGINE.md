# 匹配引擎模块文档

## 概述

匹配引擎模块是一个可扩展的、模块化的系统，用于查找、验证和优先处理网页中的文本元素。它取代了之前硬编码的选择器和验证逻辑，提供了更好的可维护性和扩展性。

## 核心组件

### 1. 匹配规则 (Matching Rules)

匹配规则定义了如何选择和验证文本元素。每个规则包含：

- **选择器**: CSS选择器列表
- **验证函数**: 验证文本是否适合翻译
- **优先级**: 规则优先级（数值越小优先级越高）
- **启用状态**: 是否启用该规则

### 2. 验证规则 (Validation Rules)

验证规则定义了文本验证的标准：

- **最小长度验证**: 确保文本长度在合理范围内
- **URL过滤**: 过滤包含URL的文本
- **有意义文本验证**: 过滤纯数字或符号的文本
- **导航文本过滤**: 过滤常见的导航文本

### 3. 优先级策略 (Priority Strategies)

优先级策略定义了如何计算元素的处理优先级：

- **可见性优先**: 优先处理可见区域内的元素
- **距离优先**: 根据元素距离视口的距离计算优先级
- **大小优先**: 根据元素大小计算优先级

## 使用方法

### 基本使用

```typescript
import { createMatchingEngine } from './shared/matching-engine';

// 创建匹配引擎实例
const matchingEngine = createMatchingEngine();

// 查找所有匹配的元素
const elements = matchingEngine.findElements();

// 验证元素并提取文本
const validatedResults = matchingEngine.validateElements(elements);

// 对结果进行优先级排序
const prioritizedResults = matchingEngine.prioritizeResults(validatedResults);

// 处理有效的文本
prioritizedResults.forEach(result => {
  if (result.isValid) {
    console.log(`Found valid text: ${result.text}`);
  }
});
```

### 自定义配置

```typescript
import { createMatchingEngine } from './shared/matching-engine';

// 自定义配置
const customConfig = {
  maxTextLength: 2000,
  minTextLength: 20,
  maxElementsPerPage: 100,
};

const matchingEngine = createMatchingEngine(customConfig);
```

### 添加自定义规则

```typescript
const customRule = {
  id: 'custom-rule',
  name: '自定义规则',
  description: '针对特定网站的自定义选择器',
  selectors: ['.custom-content', '.user-generated'],
  validation: (text: string) => text.length >= 15 && text.length <= 500,
  priority: 5,
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

matchingEngine.addRule(customRule);
```

## 内置规则

### 通用文本规则
- **选择器**: `p`, `article p`, `main p`, `.content p`, `.article p`, `.post p`
- **验证**: 长度20-800字符
- **优先级**: 1

### Twitter/X 规则
- **选择器**: `[data-testid="tweetText"]`, `[role="article"] p`, `.tweet-text`
- **验证**: 长度5-280字符
- **优先级**: 2

### Facebook 规则
- **选择器**: `[data-ad-comet-preview="message"]`, `.userContent`
- **验证**: 长度10-500字符
- **优先级**: 3

### LinkedIn 规则
- **选择器**: `.feed-shared-update-v2__description`, `.feed-shared-text`
- **验证**: 长度10-1000字符
- **优先级**: 4

### 新闻和博客规则
- **选择器**: `.story-body`, `.entry-content`, `.post-content`
- **验证**: 长度30-1500字符
- **优先级**: 5

### 论坛和社区规则
- **选择器**: `.post-body`, `.comment-content`, `.message-body`
- **验证**: 长度10-800字符
- **优先级**: 6

### 现代应用规则
- **选择器**: `[class*="text"]`, `[class*="content"]`, `[class*="message"]`
- **验证**: 长度10-500字符
- **优先级**: 7

## 验证规则

### 最小长度验证
- 确保文本长度在10-1000字符范围内

### URL过滤
- 过滤包含URL的文本

### 有意义文本验证
- 过滤纯数字或符号的文本（至少5个字母数字字符）

### 导航文本过滤
- 过滤常见的导航文本（如"home", "about", "contact"等）

## 优先级策略

### 可见性优先
- 完全可见的元素优先级为0
- 不可见元素优先级为100

### 距离优先
- 根据元素距离视口的距离计算优先级
- 距离越小，优先级越高

### 大小优先
- 根据元素大小计算优先级
- 面积越大，优先级越高

## 扩展指南

### 添加新的匹配规则

1. 在 `matching-rules.ts` 中添加新的规则定义
2. 确保包含适当的选择器和验证逻辑
3. 设置合理的优先级

```typescript
export const newMatchingRule: MatchingRule = {
  id: 'new-platform',
  name: '新平台',
  description: '针对新平台的选择器',
  selectors: ['.new-platform-content'],
  validation: (text: string) => text.length >= 10 && text.length <= 500,
  priority: 8,
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
};
```

### 添加新的验证规则

```typescript
export const newValidationRule: ValidationRule = {
  id: 'custom-validation',
  name: '自定义验证',
  description: '自定义验证逻辑',
  validator: (text: string) => {
    // 自定义验证逻辑
    return !text.includes('spam');
  },
  enabled: true
};
```

### 添加新的优先级策略

```typescript
export const newPriorityStrategy: PriorityStrategy = {
  id: 'custom-priority',
  name: '自定义优先级',
  description: '基于自定义逻辑计算优先级',
  calculator: (element: Element) => {
    // 自定义优先级计算逻辑
    return element.children.length * 10;
  },
  enabled: true
};
```

## 调试和测试

### 调试匹配结果

```typescript
const matchingEngine = createMatchingEngine();
const elements = matchingEngine.findElements();
const validatedResults = matchingEngine.validateElements(elements);

console.log('Found elements:', elements.length);
console.log('Valid results:', validatedResults.filter(r => r.isValid).length);

validatedResults.forEach(result => {
  console.log(`${result.isValid ? '✓' : '✗'} [${result.rule.name}] "${result.text.substring(0, 50)}..."`);
});
```

### 测试页面

使用 `test-matching-engine.html` 文件来测试匹配引擎的功能。该页面包含了各种测试用例，可以验证规则的正确性。

## 性能考虑

- 匹配引擎会限制每页处理的元素数量（默认50个）
- 使用去重机制避免重复处理相同元素
- 选择器查询使用try-catch包装，避免无效选择器导致错误
- 优先级计算使用缓存和优化策略

## 迁移指南

从旧版本迁移到新的匹配引擎：

1. 移除硬编码的选择器列表
2. 使用 `createMatchingEngine()` 替代自定义的选择器逻辑
3. 使用匹配引擎的验证方法替代自定义验证逻辑
4. 使用匹配引擎的优先级策略替代自定义优先级计算