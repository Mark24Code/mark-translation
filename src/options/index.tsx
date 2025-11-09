import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AIConfig } from '../shared/types';
import { StorageManager } from '../utils/storage';
import { TranslationAPI } from '../shared/api';

const Options: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>({
    apiUrl: '',
    model: '',
    apiKey: '',
    provider: 'deepseek'
  });
  const [status, setStatus] = useState<string>('Configure your AI provider settings to enable translation');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await StorageManager.getAIConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setStatus('Settings loaded successfully');
        setStatusType('success');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleInputChange = (field: keyof AIConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProviderChange = (provider: AIConfig['provider']) => {
    setConfig(prev => ({
      ...prev,
      provider
    }));

    // 设置默认值
    switch (provider) {
      case 'deepseek':
        setConfig(prev => ({
          ...prev,
          apiUrl: 'https://api.deepseek.com',
          model: 'deepseek-chat'
        }));
        break;
      case 'openai':
        setConfig(prev => ({
          ...prev,
          apiUrl: 'https://api.openai.com',
          model: 'gpt-3.5-turbo'
        }));
        break;
      case 'claude':
        setConfig(prev => ({
          ...prev,
          apiUrl: 'https://api.anthropic.com',
          model: 'claude-3-sonnet-20240229'
        }));
        break;
    }
  };

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      setStatusType('info');

      if (!config.apiUrl || !config.model || !config.apiKey) {
        throw new Error('Please fill in all fields');
      }

      const translationAPI = new TranslationAPI(config);
      const result = await translationAPI.translate('Hello', 'en', 'zh');

      if (result.success) {
        setStatus(`Connection successful! Test translation: "${result.translated}"`);
        setStatusType('success');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setStatus('Saving settings...');
      setStatusType('info');

      if (!config.apiUrl || !config.model || !config.apiKey) {
        throw new Error('Please fill in all fields');
      }

      await StorageManager.setAIConfig(config);
      setStatus('Settings saved successfully!');
      setStatusType('success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    }
  };

  const resetSettings = () => {
    setConfig({
      apiUrl: '',
      model: '',
      apiKey: '',
      provider: 'deepseek'
    });
    setStatus('Settings reset');
    setStatusType('info');
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
            value={config.provider}
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
            value={config.apiUrl}
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
          <input
            type="text"
            value={config.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            placeholder="deepseek-chat"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            required
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Examples: deepseek-chat, gpt-3.5-turbo, claude-3-sonnet-20240229
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            placeholder="Enter your API key"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            required
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Your API key will be stored securely in browser storage
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button
            type="button"
            onClick={testConnection}
            style={{
              padding: '12px 24px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Test Connection
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={resetSettings}
            style={{
              padding: '12px 24px',
              background: '#f8f9fa',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
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
                           statusType === 'error' ? '#f5c6cb' : '#bee5eb'}`
        }}
      >
        {status}
      </div>

      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginTop: '20px' }}>
        <h3 style={{ marginTop: '0', color: '#333' }}>Provider Information</h3>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li><strong>DeepSeek</strong>: Free tier available, supports Chinese well</li>
          <li><strong>OpenAI</strong>: High quality, paid service</li>
          <li><strong>Claude</strong>: Excellent for complex translations</li>
        </ul>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}