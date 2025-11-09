import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { AIConfig, TranslationConfig } from '../shared/types';
import { TranslationAPI } from '../shared/api';
import {
  aiConfigsAtom,
  activeAIConfigAtom,
  translationConfigAtom,
  errorMessageAtom,
  loadConfigsAtom,
  addAIConfigAtom,
  updateAIConfigAtom,
  deleteAIConfigAtom,
  setActiveAIConfigAtom,
  updateTranslationConfigAtom,
  resetConfigsAtom,
  exportConfigsAtom,
  importConfigsAtom
} from '../store';

const Options: React.FC = () => {
  const aiConfigs = useAtomValue(aiConfigsAtom);
  const activeAIConfig = useAtomValue(activeAIConfigAtom);
  const translationConfig = useAtomValue(translationConfigAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const loadConfigs = useSetAtom(loadConfigsAtom);
  const addAIConfig = useSetAtom(addAIConfigAtom);
  const updateAIConfig = useSetAtom(updateAIConfigAtom);
  const deleteAIConfig = useSetAtom(deleteAIConfigAtom);
  const setActiveAIConfig = useSetAtom(setActiveAIConfigAtom);
  const updateTranslationConfig = useSetAtom(updateTranslationConfigAtom);
  const resetConfigs = useSetAtom(resetConfigsAtom);
  const exportConfigs = useSetAtom(exportConfigsAtom);
  const importConfigs = useSetAtom(importConfigsAtom);

  const [status, setStatus] = useState<string>('Configure your AI provider settings to enable translation');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [newConfig, setNewConfig] = useState<Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    apiUrl: '',
    model: '',
    apiKey: '',
    provider: 'deepseek',
    isActive: false
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setStatus(errorMessage);
      setStatusType('error');
    }
  }, [errorMessage]);

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

  const handleNewConfigChange = (field: keyof typeof newConfig, value: string | boolean) => {
    setNewConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditingConfigChange = (field: keyof AIConfig, value: string | boolean) => {
    if (editingConfig) {
      setEditingConfig(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  const handleProviderChange = (provider: AIConfig['provider'], isEditing: boolean = false) => {
    const providerConfig = providerConfigs[provider];
    if (isEditing && editingConfig) {
      setEditingConfig({
        ...editingConfig,
        provider,
        apiUrl: providerConfig.apiUrl,
        model: providerConfig.defaultModel
      });
    } else {
      setNewConfig({
        ...newConfig,
        provider,
        apiUrl: providerConfig.apiUrl,
        model: providerConfig.defaultModel
      });
    }
  };

  const handleAddConfig = async () => {
    try {
      setIsSaving(true);
      setStatus('Adding configuration...');
      setStatusType('info');

      if (!newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey) {
        throw new Error('Please fill in all fields');
      }

      await addAIConfig(newConfig);
      setNewConfig({
        name: '',
        apiUrl: '',
        model: '',
        apiKey: '',
        provider: 'deepseek',
        isActive: false
      });
      setStatus('✅ Configuration added successfully!');
      setStatusType('success');
    } catch (error) {
      console.error('Failed to add config:', error);
      setStatus(`❌ Failed to add configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    try {
      setIsSaving(true);
      setStatus('Updating configuration...');
      setStatusType('info');

      if (!editingConfig.name || !editingConfig.apiUrl || !editingConfig.model || !editingConfig.apiKey) {
        throw new Error('Please fill in all fields');
      }

      await updateAIConfig({
        configId: editingConfig.id,
        updates: editingConfig
      });
      setEditingConfig(null);
      setStatus('✅ Configuration updated successfully!');
      setStatusType('success');
    } catch (error) {
      console.error('Failed to update config:', error);
      setStatus(`❌ Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      try {
        await deleteAIConfig(configId);
        setStatus('✅ Configuration deleted successfully!');
        setStatusType('success');
      } catch (error) {
        console.error('Failed to delete config:', error);
        setStatus(`❌ Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setStatusType('error');
      }
    }
  };

  const handleSetActiveConfig = async (configId: string) => {
    try {
      await setActiveAIConfig(configId);
      setStatus('✅ Active configuration updated!');
      setStatusType('success');
    } catch (error) {
      console.error('Failed to set active config:', error);
      setStatus(`❌ Failed to set active configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    }
  };

  const testConnection = async (config: AIConfig) => {
    try {
      setIsTesting(true);
      setStatus(`Testing connection for ${config.name}...`);
      setStatusType('info');

      const translationAPI = new TranslationAPI(config);
      const result = await translationAPI.translate('Hello, how are you today?', 'en', 'zh');

      if (result.success) {
        setStatus(`✅ Connection successful for ${config.name}! Test translation: "${result.translated}"`);
        setStatusType('success');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        setStatus(`❌ Connection failed for ${config.name}: Invalid API Key`);
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setStatus(`❌ Connection failed for ${config.name}: Invalid API URL or model`);
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setStatus(`❌ Connection failed for ${config.name}: Network error - check your internet connection`);
      } else {
        setStatus(`❌ Connection failed for ${config.name}: ${errorMessage}`);
      }
      setStatusType('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportConfig = async () => {
    try {
      const configJson = await exportConfigs();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mark-translation-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('✅ Configuration exported successfully!');
      setStatusType('success');
    } catch (error) {
      console.error('Failed to export config:', error);
      setStatus(`❌ Failed to export configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const configJson = e.target?.result as string;
        await importConfigs(configJson);
        setStatus('✅ Configuration imported successfully!');
        setStatusType('success');
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Failed to import config:', error);
      setStatus(`❌ Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    }

    // 重置文件输入
    event.target.value = '';
  };

  const handleResetConfig = async () => {
    if (confirm('Are you sure you want to reset all settings? This will clear all configurations.')) {
      await resetConfigs();
      setStatus('Settings reset to defaults');
      setStatusType('info');
    }
  };

  const handleTranslationConfigChange = (field: keyof TranslationConfig, value: any) => {
    updateTranslationConfig({ [field]: value });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Mark Translation Settings</h1>
      </div>

      {/* AI Configurations Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>AI Configurations</h2>

        {/* Configuration List */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>Your Configurations</h3>

          {aiConfigs.length === 0 ? (
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#666'
            }}>
              No configurations yet. Add your first configuration below.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aiConfigs.map(config => (
                <div key={config.id} style={{
                  padding: '15px',
                  border: `2px solid ${config.isActive ? '#007acc' : '#ddd'}`,
                  borderRadius: '6px',
                  background: config.isActive ? '#f0f8ff' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ color: '#333' }}>{config.name}</strong>
                      {config.isActive && (
                        <span style={{
                          marginLeft: '10px',
                          padding: '2px 8px',
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!config.isActive && (
                        <button
                          onClick={() => handleSetActiveConfig(config.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => setEditingConfig(config)}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#333',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => testConnection(config)}
                        disabled={isTesting}
                        style={{
                          padding: '6px 12px',
                          background: isTesting ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: isTesting ? 'not-allowed' : 'pointer',
                          opacity: isTesting ? 0.6 : 1
                        }}
                      >
                        {isTesting ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <div>Provider: {providerConfigs[config.provider]?.name}</div>
                    <div>Model: {config.model}</div>
                    <div>API URL: {config.apiUrl}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Configuration Form */}
        <div style={{
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
            {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                Configuration Name
              </label>
              <input
                type="text"
                value={editingConfig ? editingConfig.name : newConfig.name}
                onChange={(e) => editingConfig
                  ? handleEditingConfigChange('name', e.target.value)
                  : handleNewConfigChange('name', e.target.value)
                }
                placeholder="My DeepSeek Config"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                AI Provider
              </label>
              <select
                value={editingConfig ? editingConfig.provider : newConfig.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIConfig['provider'], !!editingConfig)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                API URL
              </label>
              <input
                type="url"
                value={editingConfig ? editingConfig.apiUrl : newConfig.apiUrl}
                onChange={(e) => editingConfig
                  ? handleEditingConfigChange('apiUrl', e.target.value)
                  : handleNewConfigChange('apiUrl', e.target.value)
                }
                placeholder="https://api.deepseek.com"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                Model
              </label>
              <select
                value={editingConfig ? editingConfig.model : newConfig.model}
                onChange={(e) => editingConfig
                  ? handleEditingConfigChange('model', e.target.value)
                  : handleNewConfigChange('model', e.target.value)
                }
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              >
                <option value="">Select a model</option>
                {providerConfigs[editingConfig ? editingConfig.provider : newConfig.provider]?.models.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                API Key
              </label>
              <input
                type="password"
                value={editingConfig ? editingConfig.apiKey : newConfig.apiKey}
                onChange={(e) => editingConfig
                  ? handleEditingConfigChange('apiKey', e.target.value)
                  : handleNewConfigChange('apiKey', e.target.value)
                }
                placeholder="Enter your API key"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {editingConfig ? (
                <>
                  <button
                    onClick={handleUpdateConfig}
                    disabled={isSaving}
                    style={{
                      padding: '12px 24px',
                      background: isSaving ? '#6c757d' : '#007acc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.6 : 1
                    }}
                  >
                    {isSaving ? 'Updating...' : 'Update Configuration'}
                  </button>
                  <button
                    onClick={() => setEditingConfig(null)}
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
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddConfig}
                  disabled={isSaving || !newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey}
                  style={{
                    padding: '12px 24px',
                    background: isSaving ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: isSaving || !newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey ? 'not-allowed' : 'pointer',
                    opacity: isSaving || !newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey ? 0.6 : 1
                  }}
                >
                  {isSaving ? 'Adding...' : 'Add Configuration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Translation Settings Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>Translation Settings</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
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

          <div>
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

          <div>
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
      </div>

      {/* Import/Export Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>Backup & Restore</h2>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportConfig}
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
            Export Configuration
          </button>

          <label style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'inline-block'
          }}>
            Import Configuration
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={handleResetConfig}
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
            Reset All Settings
          </button>
        </div>
      </div>

      {/* Status Display */}
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

      {/* Help Section */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginTop: '20px' }}>
        <h3 style={{ marginTop: '0', color: '#333' }}>Getting Started</h3>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>1. Add AI Configurations:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>Create multiple configurations for different AI providers</li>
            <li>Set one configuration as active for translations</li>
            <li>Test connections before using</li>
          </ul>

          <p><strong>2. Get your API key:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>DeepSeek: <a href="https://platform.deepseek.com/" target="_blank" rel="noopener">platform.deepseek.com</a></li>
            <li>OpenAI: <a href="https://platform.openai.com/" target="_blank" rel="noopener">platform.openai.com</a></li>
            <li>Claude: <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a></li>
          </ul>

          <p><strong>3. Backup your settings</strong> using the export feature</p>
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