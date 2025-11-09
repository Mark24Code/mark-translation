import { Message } from '../shared/types';
import { TranslationAPI } from '../shared/api';
import { StorageManager } from '../utils/storage';

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'translate') {
    handleTranslation(message.data, sendResponse);
    return true; // 保持消息通道开放
  } else if (message.type === 'translationCompleted') {
    handleTranslationCompleted(message.data);
    return true;
  }
});

async function handleTranslation(data: any, sendResponse: (response: any) => void) {
  try {
    const { text, sourceLang, targetLang } = data;

    // 获取 AI 配置
    const aiConfig = await StorageManager.getActiveAIConfig();

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

// 处理翻译完成通知
function handleTranslationCompleted(data: any) {
  const { success, error } = data;

  // 更新扩展图标状态
  updateIconStatus(success);

  console.log(`Translation completed: ${success ? 'success' : 'failed'}, error: ${error || 'none'}`);
}

// 更新扩展图标状态
function updateIconStatus(success: boolean) {
  const iconType = success ? 'success' : 'error';

  chrome.action.setIcon({
    path: {
      '16': `icons/icon-${iconType}-16.png`,
      '32': `icons/icon-${iconType}-32.png`,
      '48': `icons/icon-${iconType}-48.png`,
      '128': `icons/icon-${iconType}-128.png`
    }
  });

  // 重置图标状态为默认状态（idle）
  setTimeout(() => {
    chrome.action.setIcon({
      path: {
        '16': 'icons/icon-idle-16.png',
        '32': 'icons/icon-idle-32.png',
        '48': 'icons/icon-idle-48.png',
        '128': 'icons/icon-idle-128.png'
      }
    });
  }, 3000); // 3秒后重置
}

// 处理插件安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Mark Translation extension installed');
});