import { Message } from '../shared/types';
import { TranslationAPI } from '../shared/api';
import { StorageManager } from '../utils/storage';

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'translate') {
    handleTranslation(message.data, sendResponse);
    return true; // 保持消息通道开放
  }
});

async function handleTranslation(data: any, sendResponse: (response: any) => void) {
  try {
    const { text, sourceLang, targetLang } = data;

    // 获取 AI 配置
    const aiConfig = await StorageManager.getAIConfig();

    if (!aiConfig) {
      sendResponse({
        success: false,
        error: 'AI configuration not found. Please configure the extension first.'
      });
      return;
    }

    // 创建翻译 API 实例
    const translationAPI = new TranslationAPI(aiConfig);

    // 执行翻译
    const result = await translationAPI.translate(text, sourceLang, targetLang);

    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    });
  }
}

// 处理插件安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Mark Translation extension installed');
});