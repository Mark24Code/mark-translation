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

// 导入新的布局和组件
import SettingsLayout from '../components/SettingsLayout/index';
import AIConfigSection from '../components/settings/AIConfigSection/index';
import TranslationSettingsSection from '../components/settings/TranslationSettingsSection';
import LanguageSettingsSection from '../components/settings/LanguageSettingsSection';
import TranslationStylesSection from '../components/settings/TranslationStylesSection';
import BackupSection from '../components/settings/BackupSection/index';
import HelpSection from '../components/settings/HelpSection';

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

  // 状态管理
  const [activeSection, setActiveSection] = useState<string>('ai-config');
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

  // 渲染当前活动部分
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'ai-config':
        return (
          <AIConfigSection
            status={status}
            statusType={statusType}
            setStatus={setStatus}
            setStatusType={setStatusType}
            isTesting={isTesting}
            setIsTesting={setIsTesting}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            editingConfig={editingConfig}
            setEditingConfig={setEditingConfig}
            newConfig={newConfig}
            setNewConfig={setNewConfig}
            providerConfigs={providerConfigs}
            handleProviderChange={handleProviderChange}
            testConnection={testConnection}
          />
        );
      case 'translation':
        return <TranslationSettingsSection />;
      case 'styles':
        return (
          <TranslationStylesSection
            status={status}
            statusType={statusType}
            setStatus={setStatus}
            setStatusType={setStatusType}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            editingStyle={editingStyle}
            setEditingStyle={setEditingStyle}
            newStyle={newStyle}
            setNewStyle={setNewStyle}
          />
        );
      case 'language':
        return <LanguageSettingsSection />;
      case 'backup':
        return (
          <BackupSection
            status={status}
            statusType={statusType}
            setStatus={setStatus}
            setStatusType={setStatusType}
          />
        );
      case 'help':
        return <HelpSection />;
      default:
        return (
          <AIConfigSection
            status={status}
            statusType={statusType}
            setStatus={setStatus}
            setStatusType={setStatusType}
            isTesting={isTesting}
            setIsTesting={setIsTesting}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            editingConfig={editingConfig}
            setEditingConfig={setEditingConfig}
            newConfig={newConfig}
            setNewConfig={setNewConfig}
            providerConfigs={providerConfigs}
            handleProviderChange={handleProviderChange}
            testConnection={testConnection}
          />
        );
    }
  };

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {/* 状态显示 */}
      {status && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            borderRadius: '8px',
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
      )}

      {/* 当前活动部分 */}
      {renderActiveSection()}
    </SettingsLayout>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
