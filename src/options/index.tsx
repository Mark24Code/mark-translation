import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { AIConfig, TranslationConfig, TranslationStyle } from '../shared/types';
import { TranslationAPI } from '../shared/api';
import { useI18n } from '../utils/i18n';
import {
  aiConfigsAtom,
  activeAIConfigAtom,
  translationConfigAtom,
  languageAtom,
  errorMessageAtom,
  loadConfigsAtom,
  addAIConfigAtom,
  updateAIConfigAtom,
  deleteAIConfigAtom,
  setActiveAIConfigAtom,
  updateTranslationConfigAtom,
  updateLanguageAtom,
  resetConfigsAtom,
  exportConfigsAtom,
  importConfigsAtom,
  translationStylesAtom,
  activeTranslationStyleAtom,
  addTranslationStyleAtom,
  updateTranslationStyleAtom,
  deleteTranslationStyleAtom,
  setActiveTranslationStyleAtom
} from '../store';

const Options: React.FC = () => {
  const aiConfigs = useAtomValue(aiConfigsAtom);
  const activeAIConfig = useAtomValue(activeAIConfigAtom);
  const translationConfig = useAtomValue(translationConfigAtom);
  const language = useAtomValue(languageAtom);
  const errorMessage = useAtomValue(errorMessageAtom);
  const translationStyles = useAtomValue(translationStylesAtom);
  const activeTranslationStyle = useAtomValue(activeTranslationStyleAtom);
  const loadConfigs = useSetAtom(loadConfigsAtom);
  const addAIConfig = useSetAtom(addAIConfigAtom);
  const updateAIConfig = useSetAtom(updateAIConfigAtom);
  const deleteAIConfig = useSetAtom(deleteAIConfigAtom);
  const setActiveAIConfig = useSetAtom(setActiveAIConfigAtom);
  const updateTranslationConfig = useSetAtom(updateTranslationConfigAtom);
  const updateLanguage = useSetAtom(updateLanguageAtom);
  const resetConfigs = useSetAtom(resetConfigsAtom);
  const exportConfigs = useSetAtom(exportConfigsAtom);
  const importConfigs = useSetAtom(importConfigsAtom);
  const addTranslationStyle = useSetAtom(addTranslationStyleAtom);
  const updateTranslationStyle = useSetAtom(updateTranslationStyleAtom);
  const deleteTranslationStyle = useSetAtom(deleteTranslationStyleAtom);
  const setActiveTranslationStyle = useSetAtom(setActiveTranslationStyleAtom);

  const { t, getSupportedLanguages } = useI18n();

  const [status, setStatus] = useState<string>(t('settings.noConfigurations'));
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

  const [editingStyle, setEditingStyle] = useState<TranslationStyle | null>(null);
  const [newStyle, setNewStyle] = useState<Omit<TranslationStyle, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>>({
    name: '',
    description: '',
    prompt: ''
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
      name: t('providers.deepseek.name'),
      apiUrl: 'https://api.deepseek.com',
      models: [
        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek-coder', label: 'DeepSeek Coder' }
      ],
      defaultModel: 'deepseek-chat',
      helpText: t('providers.deepseek.helpText')
    },
    openai: {
      name: t('providers.openai.name'),
      apiUrl: 'https://api.openai.com',
      models: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
      ],
      defaultModel: 'gpt-3.5-turbo',
      helpText: t('providers.openai.helpText')
    },
    claude: {
      name: t('providers.claude.name'),
      apiUrl: 'https://api.anthropic.com',
      models: [
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
      ],
      defaultModel: 'claude-3-sonnet-20240229',
      helpText: t('providers.claude.helpText')
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
      setStatus(t('common.loading'));
      setStatusType('info');

      if (!newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey) {
        throw new Error(t('errors.fillAllFields'));
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
      setStatus(`✅ ${t('settings.configurationAdded')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to add config:', error);
      setStatus(`❌ ${t('errors.failedToAddConfiguration')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    try {
      setIsSaving(true);
      setStatus(t('common.loading'));
      setStatusType('info');

      if (!editingConfig.name || !editingConfig.apiUrl || !editingConfig.model || !editingConfig.apiKey) {
        throw new Error(t('errors.fillAllFields'));
      }

      await updateAIConfig({
        configId: editingConfig.id,
        updates: editingConfig
      });
      setEditingConfig(null);
      setStatus(`✅ ${t('settings.configurationUpdated')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to update config:', error);
      setStatus(`❌ ${t('errors.failedToUpdateConfiguration')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deleteAIConfig(configId);
        setStatus(`✅ ${t('settings.configurationDeleted')}`);
        setStatusType('success');
      } catch (error) {
        console.error('Failed to delete config:', error);
        setStatus(`❌ ${t('errors.failedToDeleteConfiguration')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setStatusType('error');
      }
    }
  };

  const handleSetActiveConfig = async (configId: string) => {
    try {
      await setActiveAIConfig(configId);
      setStatus(`✅ ${t('settings.activeConfigurationUpdated')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to set active config:', error);
      setStatus(`❌ ${t('errors.failedToSetActiveConfiguration')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Translation Style Handlers
  const handleNewStyleChange = (field: keyof typeof newStyle, value: string) => {
    setNewStyle(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditingStyleChange = (field: keyof TranslationStyle, value: string) => {
    if (editingStyle) {
      setEditingStyle(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  const handleAddStyle = async () => {
    try {
      setIsSaving(true);
      setStatus(t('common.loading'));
      setStatusType('info');

      if (!newStyle.name || !newStyle.description || !newStyle.prompt) {
        throw new Error(t('errors.fillAllFields'));
      }

      await addTranslationStyle(newStyle);
      setNewStyle({
        name: '',
        description: '',
        prompt: ''
      });
      setStatus(`✅ ${t('settings.translationStyleAdded')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to add translation style:', error);
      setStatus(`❌ ${t('errors.failedToAddTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStyle = async () => {
    if (!editingStyle) return;

    try {
      setIsSaving(true);
      setStatus(t('common.loading'));
      setStatusType('info');

      if (!editingStyle.name || !editingStyle.description || !editingStyle.prompt) {
        throw new Error(t('errors.fillAllFields'));
      }

      await updateTranslationStyle({
        styleId: editingStyle.id,
        updates: editingStyle
      });
      setEditingStyle(null);
      setStatus(`✅ ${t('settings.translationStyleUpdated')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to update translation style:', error);
      setStatus(`❌ ${t('errors.failedToUpdateTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStyle = async (styleId: string) => {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deleteTranslationStyle(styleId);
        setStatus(`✅ ${t('settings.translationStyleDeleted')}`);
        setStatusType('success');
      } catch (error) {
        console.error('Failed to delete translation style:', error);
        setStatus(`❌ ${t('errors.failedToDeleteTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setStatusType('error');
      }
    }
  };

  const handleSetActiveStyle = async (styleId: string | null) => {
    try {
      await setActiveTranslationStyle(styleId);
      setStatus(`✅ ${t('settings.activeTranslationStyleUpdated')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to set active translation style:', error);
      setStatus(`❌ ${t('errors.failedToSetActiveTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>{t('app.title')} {t('settings.title')}</h1>
      </div>

      {/* AI Configurations Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>{t('settings.aiConfigurations')}</h2>

        {/* Configuration List */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>{t('settings.yourConfigurations')}</h3>

          {(aiConfigs || []).length === 0 ? (
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#666'
            }}>
              {t('settings.noConfigurations')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(aiConfigs || []).map(config => (
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
                          {t('settings.setActive')}
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
                        {t('common.edit')}
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
                        {isTesting ? t('settings.testing') : t('common.test')}
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
                        {t('common.delete')}
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
            {editingConfig ? t('settings.editConfiguration') : t('settings.addNewConfiguration')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                {t('settings.configurationName')}
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
                {t('settings.aiProvider')}
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
                {t('settings.apiUrl')}
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
                {t('settings.model')}
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
                {(providerConfigs[editingConfig ? editingConfig.provider : newConfig.provider]?.models || []).map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                {t('settings.apiKey')}
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
                    {isSaving ? t('common.loading') : t('common.save')}
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
                    {t('common.cancel')}
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
                  {isSaving ? t('common.loading') : t('settings.addNewConfiguration')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>{t('settings.languageSettings')}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              {t('settings.interfaceLanguage')}
            </label>
            <select
              value={language}
              onChange={(e) => updateLanguage(e.target.value as 'zh' | 'en')}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="zh">中文 (Chinese)</option>
              <option value="en">English</option>
            </select>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {t('settings.languageDescription')}
            </div>
          </div>
        </div>
      </div>

      {/* Translation Settings Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>{t('settings.translationSettings')}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              {t('settings.parallelTasks')}
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
              {t('settings.parallelTasksDescription')}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              {t('settings.autoTranslate')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={translationConfig.autoTranslate}
                onChange={(e) => handleTranslationConfigChange('autoTranslate', e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>{t('settings.autoTranslateDescription')}</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
              {t('settings.defaultLanguageDirection')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={translationConfig.sourceLang}
                onChange={(e) => handleTranslationConfigChange('sourceLang', e.target.value as 'zh' | 'en')}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
              >
                <option value="en">{t('settings.english')}</option>
                <option value="zh">{t('settings.chinese')}</option>
              </select>
              <span style={{ color: '#666' }}>→</span>
              <select
                value={translationConfig.targetLang}
                onChange={(e) => handleTranslationConfigChange('targetLang', e.target.value as 'zh' | 'en')}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
              >
                <option value="zh">{t('settings.chinese')}</option>
                <option value="en">{t('settings.english')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Translation Styles Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>{t('settings.translationStyles')}</h2>

        {/* Active Translation Style Selection */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>{t('settings.activeTranslationStyle')}</h3>
          <select
            value={activeTranslationStyle?.id || ''}
            onChange={(e) => handleSetActiveStyle(e.target.value || null)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="">{t('settings.noTranslationStyle')}</option>
            {(translationStyles || []).map(style => (
              <option key={style.id} value={style.id}>
                {style.name} {style.isBuiltIn ? '(内置)' : ''}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {t('settings.translationStyleDescription')}
          </div>
        </div>

        {/* Translation Styles List */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>{t('settings.yourTranslationStyles')}</h3>

          {(translationStyles || []).length === 0 ? (
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#666'
            }}>
              {t('settings.noTranslationStyles')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(translationStyles || []).map(style => (
                <div key={style.id} style={{
                  padding: '15px',
                  border: `2px solid ${style.id === activeTranslationStyle?.id ? '#007acc' : '#ddd'}`,
                  borderRadius: '6px',
                  background: style.id === activeTranslationStyle?.id ? '#f0f8ff' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ color: '#333' }}>{style.name}</strong>
                      {style.isBuiltIn && (
                        <span style={{
                          marginLeft: '10px',
                          padding: '2px 8px',
                          background: '#6c757d',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          内置
                        </span>
                      )}
                      {style.id === activeTranslationStyle?.id && (
                        <span style={{
                          marginLeft: '10px',
                          padding: '2px 8px',
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          激活
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!style.isBuiltIn && (
                        <>
                          <button
                            onClick={() => setEditingStyle(style)}
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
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteStyle(style.id)}
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
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <div>{style.description}</div>
                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      <strong>提示词:</strong> {style.prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Translation Style Form */}
        <div style={{
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
            {editingStyle ? t('settings.editTranslationStyle') : t('settings.addNewTranslationStyle')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                {t('settings.styleName')}
              </label>
              <input
                type="text"
                value={editingStyle ? editingStyle.name : newStyle.name}
                onChange={(e) => editingStyle
                  ? handleEditingStyleChange('name', e.target.value)
                  : handleNewStyleChange('name', e.target.value)
                }
                placeholder="技术文档翻译"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                {t('settings.styleDescription')}
              </label>
              <input
                type="text"
                value={editingStyle ? editingStyle.description : newStyle.description}
                onChange={(e) => editingStyle
                  ? handleEditingStyleChange('description', e.target.value)
                  : handleNewStyleChange('description', e.target.value)
                }
                placeholder="适合技术文档、API文档、代码注释等"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                {t('settings.stylePrompt')}
              </label>
              <textarea
                value={editingStyle ? editingStyle.prompt : newStyle.prompt}
                onChange={(e) => editingStyle
                  ? handleEditingStyleChange('prompt', e.target.value)
                  : handleNewStyleChange('prompt', e.target.value)
                }
                placeholder="请将以下技术文档进行中英互译。保持技术术语的准确性，使用专业的技术语言..."
                rows={4}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
                required
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {t('settings.stylePromptDescription')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {editingStyle ? (
                <>
                  <button
                    onClick={handleUpdateStyle}
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
                    {isSaving ? t('common.loading') : t('common.save')}
                  </button>
                  <button
                    onClick={() => setEditingStyle(null)}
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
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddStyle}
                  disabled={isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt}
                  style={{
                    padding: '12px 24px',
                    background: isSaving ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt ? 'not-allowed' : 'pointer',
                    opacity: isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt ? 0.6 : 1
                  }}
                >
                  {isSaving ? t('common.loading') : t('settings.addNewTranslationStyle')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import/Export Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>{t('settings.backupRestore')}</h2>

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
            {t('settings.exportConfiguration')}
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
            {t('settings.importConfiguration')}
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
            {t('settings.resetAllSettings')}
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
        <h3 style={{ marginTop: '0', color: '#333' }}>{t('settings.gettingStarted')}</h3>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>1. {t('settings.addAiConfigurations')}:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>{t('settings.createMultipleConfigurations')}</li>
            <li>{t('settings.setOneConfigurationActive')}</li>
            <li>{t('settings.testConnectionsBeforeUsing')}</li>
          </ul>

          <p><strong>2. {t('settings.getYourApiKey')}:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>{t('settings.deepseek')}: <a href="https://platform.deepseek.com/" target="_blank" rel="noopener">platform.deepseek.com</a></li>
            <li>{t('settings.openai')}: <a href="https://platform.openai.com/" target="_blank" rel="noopener">platform.openai.com</a></li>
            <li>{t('settings.claude')}: <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a></li>
          </ul>

          <p><strong>3. {t('settings.backupYourSettings')}</strong> {t('settings.backupYourSettings')}</p>
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