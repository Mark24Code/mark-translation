# Mark Translation Browser Extension

一个支持中英互译的浏览器插件，使用 AI 模型进行高质量翻译。

## 功能特性

- ✅ 支持中英双向翻译
- ✅ 兼容 Chrome 和 Firefox (Manifest V3)
- ✅ 支持多种 AI 模型 (DeepSeek, OpenAI, Claude)
- ✅ 页面级别翻译
- ✅ 设置界面配置 API
- ✅ React + TypeScript 开发

## 安装和开发

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
# 构建 Chrome 版本
npm run build:chrome

# 构建 Firefox 版本
npm run build:firefox
```

## 项目结构

```
mark-translation/
├── src/
│   ├── background/          # 后台脚本
│   ├── content/            # 内容脚本
│   ├── popup/              # 弹出窗口界面
│   ├── options/            # 设置页面
│   ├── shared/             # 共享工具和类型
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── manifest.json           # 插件清单文件
└── package.json
```

## 使用说明

### 1. 配置 AI 服务
1. 点击浏览器插件图标
2. 点击 "Settings" 按钮
3. 选择 AI 提供商 (DeepSeek/OpenAI/Claude)
4. 填写 API URL、模型名称和 API Key
5. 点击 "Test Connection" 测试连接
6. 保存设置

### 2. 使用翻译功能
1. 在任意网页点击插件图标
2. 选择翻译方向 (中文→英文 或 英文→中文)
3. 点击 "Translate Page" 进行页面翻译
4. 翻译结果会显示在原文下方
5. 点击 "Clear" 清除翻译结果

## 支持的 AI 提供商

### DeepSeek
- API URL: `https://api.deepseek.com`
- 模型: `deepseek-chat`
- 特点: 免费额度，中文支持优秀

### OpenAI
- API URL: `https://api.openai.com`
- 模型: `gpt-3.5-turbo`, `gpt-4`
- 特点: 翻译质量高，付费服务

### Claude
- API URL: `https://api.anthropic.com`
- 模型: `claude-3-sonnet-20240229`
- 特点: 复杂翻译效果好

## 技术架构

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **浏览器扩展**: Manifest V3
- **状态管理**: Jotai
- **HTTP 客户端**: Axios

## 许可证

MIT License
