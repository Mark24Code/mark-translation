import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { AIConfig, TranslationConfig } from '../shared/types';
import { TranslationAPI } from '../shared/api';
import {
  aiConfigAtom,
  translationConfigAtom,
  errorMessageAtom,
  loadConfigsAtom,
  saveConfigsAtom,
  resetConfigsAtom
} from '../store';

const Options: React.FC = () => {
  const [config, setConfig] = useAtom(aiConfigAtom);
  const [translationConfig, setTranslationConfig] = useAtom(translationConfigAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const loadConfigs = useSetAtom(loadConfigsAtom);
  const saveConfigs = useSetAtom(saveConfigsAtom);
  const resetConfigs = useSetAtom(resetConfigsAtom);

  const [status, setStatus] = useState<string>('Configure your AI provider settings to enable translation');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setStatus(errorMessage);
      setStatusType('error');
    }
  }, [errorMessage]);

  const handleInputChange = (field: keyof AIConfig, value: string) => {
    setConfig(prev => prev ? {
      ...prev,
      [field]: value
    } : {
      apiUrl: '',
      model: '',
      apiKey: '',
      provider: 'deepseek',
      [field]: value
    });
  };

  const handleTranslationConfigChange = (field: keyof TranslationConfig, value: any) => {
    setTranslationConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 提供商配置
  const providerConfigs = {
    deepseek: {
      name: 'DeepSeek',
      apiUrl: 'https://api.deepseek.com',
      models: [
        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek-coder', label: 'DeepSeek Coder' }
      ],
      defaultModel: 'deepseek-chat',
      helpText: 'Free tier available, excellent Chinese support'
    },
    openai: {
      name: 'OpenAI',
      apiUrl: 'https://api.openai.com',
      models: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
      ],
      defaultModel: 'gpt-3.5-turbo',
      helpText: 'High quality translations, paid service'
    },
    claude: {
      name: 'Claude',
      apiUrl: 'https://api.anthropic.com',
      models: [
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
      ],
      defaultModel: 'claude-3-sonnet-20240229',
      helpText: 'Excellent for complex translations'
    }
  };

  const handleProviderChange = (provider: AIConfig['provider']) => {
    const providerConfig = providerConfigs[provider];
    setConfig({
      provider,
      apiUrl: providerConfig.apiUrl,
      model: providerConfig.defaultModel,
      apiKey: config?.apiKey || '' // 保留现有的 API Key
    });
  };

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setStatus('Testing connection...');
      setStatusType('info');

      if (!config?.apiUrl || !config?.model || !config?.apiKey) {
        throw new Error('Please fill in all fields');
      }

      const translationAPI = new TranslationAPI(config);
      const result = await translationAPI.translate('Hello, how are you today?', 'en', 'zh');

      if (result.success) {
        setStatus(`✅ Connection successful! Test translation: "${result.translated}"`);
        setStatusType('success');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        setStatus('❌ Connection failed: Invalid API Key');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setStatus('❌ Connection failed: Invalid API URL or model');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setStatus('❌ Connection failed: Network error - check your internet connection');
      } else {
        setStatus(`❌ Connection failed: ${errorMessage}`);
      }
      setStatusType('error');
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setStatus('Saving settings...');
      setStatusType('info');

      if (!config?.apiUrl || !config?.model || !config?.apiKey) {
        throw new Error('Please fill in all AI provider fields');
      }

      // 验证配置
      if (!config.apiUrl.startsWith('https://')) {
        throw new Error('API URL must use HTTPS');
      }

      if (config.apiKey.length < 10) {
        throw new Error('API Key appears to be invalid');
      }

      // 验证并行任务数量
      if (translationConfig.parallelTasks < 1 || translationConfig.parallelTasks > 20) {
        throw new Error('Parallel tasks must be between 1 and 20');
      }

      await saveConfigs({ aiConfig: config, translationConfig });
      setStatus('✅ Settings saved successfully! You can now use the translation feature.');
      setStatusType('success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus(`❌ Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings? This will clear your API configuration and translation settings.')) {
      await resetConfigs();
      setStatus('Settings reset to defaults');
      setStatusType('info');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Mark Translation Settings</h1>
      </div>

      <form onSubmit={saveSettings}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            AI Provider
          </label>
          <select
            value={config?.provider || 'deepseek'}
            onChange={(e) => handleProviderChange(e.target.value as AIConfig['provider'])}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            required
          >
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            API URL
          </label>
          <input
            type="url"
            value={config?.apiUrl || ''}
            onChange={(e) => handleInputChange('apiUrl', e.target.value)}
            placeholder="https://api.deepseek.com"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            required
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Examples: https://api.deepseek.com, https://api.openai.com, https://api.anthropic.com
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            Model
          </label>
          <select
            value={config?.model || ''}
            onChange={(e) => handleInputChange('model', e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            required
          >
            <option value="">Select a model</option>
            {providerConfigs[config?.provider || 'deepseek']?.models.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {providerConfigs[config?.provider || 'deepseek']?.helpText}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            API Key
          </label>
          <input
            type="password"
            value={config?.apiKey || ''}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            placeholder="Enter your API key"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            required
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Your API key will be stored securely in browser storage
          </div>
        </div>

        {/* Translation Settings */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px' }}>Translation Settings</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              Parallel Translation Tasks
            </label>
            <input
              type="number"
              value={translationConfig.parallelTasks}
              onChange={(e) => handleTranslationConfigChange('parallelTasks', parseInt(e.target.value) || 1)}
              min="1"
              max="20"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Number of translation requests to process simultaneously (1-20). Higher values may improve speed but consume more API credits.
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              Auto-Translate
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={translationConfig.autoTranslate}
                onChange={(e) => handleTranslationConfigChange('autoTranslate', e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>Automatically translate pages when they load</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              Default Language Direction
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={translationConfig.sourceLang}
                onChange={(e) => handleTranslationConfigChange('sourceLang', e.target.value as 'zh' | 'en')}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
              <span style={{ color: '#666' }}>→</span>
              <select
                value={translationConfig.targetLang}
                onChange={(e) => handleTranslationConfigChange('targetLang', e.target.value as 'zh' | 'en')}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button
            type="button"
            onClick={testConnection}
            disabled={isTesting || isSaving || !config?.apiUrl || !config?.model || !config?.apiKey}
            style={{
              padding: '12px 24px',
              background: isTesting ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isTesting || isSaving || !config?.apiUrl || !config?.model || !config?.apiKey ? 'not-allowed' : 'pointer',
              opacity: isTesting || isSaving || !config?.apiUrl || !config?.model || !config?.apiKey ? 0.6 : 1
            }}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            type="submit"
            disabled={isTesting || isSaving || !config?.apiUrl || !config?.model || !config?.apiKey}
            style={{
              padding: '12px 24px',
              background: isSaving ? '#6c757d' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isTesting || isSaving || !config?.apiUrl || !config?.model || !config?.apiKey ? 'not-allowed' : 'pointer',
              opacity: isTesting || isSaving || !config?.apiUrl || !config?.model || !config?.apiKey ? 0.6 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={resetSettings}
            disabled={isTesting || isSaving}
            style={{
              padding: '12px 24px',
              background: '#f8f9fa',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isTesting || isSaving ? 'not-allowed' : 'pointer',
              opacity: isTesting || isSaving ? 0.6 : 1
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '14px',
          background: statusType === 'success' ? '#d4edda' :
                     statusType === 'error' ? '#f8d7da' : '#d1ecf1',
          color: statusType === 'success' ? '#155724' :
                statusType === 'error' ? '#721c24' : '#0c5460',
          border: `1px solid ${statusType === 'success' ? '#c3e6cb' :
                           statusType === 'error' ? '#f5c6cb' : '#bee5eb'}`,
          lineHeight: '1.5'
        }}
      >
        {status}
      </div>

      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginTop: '20px' }}>
        <h3 style={{ marginTop: '0', color: '#333' }}>Getting Started</h3>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>1. Choose a provider:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li><strong>DeepSeek</strong>: Free tier available, excellent Chinese support</li>
            <li><strong>OpenAI</strong>: High quality translations, paid service</li>
            <li><strong>Claude</strong>: Best for complex translations</li>
          </ul>

          <p><strong>2. Get your API key:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>DeepSeek: <a href="https://platform.deepseek.com/" target="_blank" rel="noopener">platform.deepseek.com</a></li>
            <li>OpenAI: <a href="https://platform.openai.com/" target="_blank" rel="noopener">platform.openai.com</a></li>
            <li>Claude: <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a></li>
          </ul>

          <p><strong>3. Test connection before saving</strong> to verify your settings</p>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
