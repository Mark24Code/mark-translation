import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { AIConfig } from '../../../shared/types';
import { useI18n } from '../../../utils/i18n';
import {
  aiConfigsAtom,
  activeAIConfigAtom,
  addAIConfigAtom,
  updateAIConfigAtom,
  deleteAIConfigAtom,
  setActiveAIConfigAtom
} from '../../../store';

interface AIConfigSectionProps {
  status: string;
  statusType: 'info' | 'success' | 'error';
  setStatus: (status: string) => void;
  setStatusType: (type: 'info' | 'success' | 'error') => void;
  isTesting: boolean;
  setIsTesting: (testing: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  editingConfig: AIConfig | null;
  setEditingConfig: (config: AIConfig | null) => void;
  newConfig: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>;
  setNewConfig: (config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  providerConfigs: Record<string, any>;
  handleProviderChange: (provider: AIConfig['provider'], isEditing: boolean) => void;
  testConnection: (config: AIConfig) => void;
}

const AIConfigSection: React.FC<AIConfigSectionProps> = ({
  status,
  statusType,
  setStatus,
  setStatusType,
  isTesting,
  setIsTesting,
  isSaving,
  setIsSaving,
  editingConfig,
  setEditingConfig,
  newConfig,
  setNewConfig,
  providerConfigs,
  handleProviderChange,
  testConnection
}) => {
  const aiConfigs = useAtomValue(aiConfigsAtom);
  const activeAIConfig = useAtomValue(activeAIConfigAtom);
  const addAIConfig = useSetAtom(addAIConfigAtom);
  const updateAIConfig = useSetAtom(updateAIConfigAtom);
  const deleteAIConfig = useSetAtom(deleteAIConfigAtom);
  const setActiveAIConfig = useSetAtom(setActiveAIConfigAtom);

  const { t } = useI18n();

  // 莫兰迪紫色配色方案
  const morandiPurple = '#8B7D9C';
  const morandiLightPurple = '#E8E4F0';
  const morandiDarkPurple = '#6B5B7A';
  const textPrimary = '#333333';
  const textSecondary = 'rgba(51, 51, 51, 0.7)';
  const textTertiary = 'rgba(51, 51, 51, 0.5)';

  const handleNewConfigChange = (field: keyof typeof newConfig, value: string | boolean) => {
    setNewConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditingConfigChange = (field: keyof AIConfig, value: string | boolean) => {
    if (editingConfig) {
      setEditingConfig({
        ...editingConfig,
        [field]: value
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

  return (
    <div>
      <h2 style={{
        margin: '0 0 20px 0',
        color: textPrimary,
        fontSize: '24px',
        fontWeight: '600'
      }}>
        {t('settings.aiConfigurations')}
      </h2>

      {/* Configuration List */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: textPrimary,
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {t('settings.yourConfigurations')}
        </h3>

        {(aiConfigs || []).length === 0 ? (
          <div style={{
            padding: '20px',
            background: morandiLightPurple,
            borderRadius: '8px',
            textAlign: 'center',
            color: textSecondary,
            border: `1px solid ${morandiPurple}`
          }}>
            {t('settings.noConfigurations')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(aiConfigs || []).map(config => (
              <div key={config.id} style={{
                padding: '15px',
                border: `2px solid ${config.isActive ? morandiPurple : morandiLightPurple}`,
                borderRadius: '8px',
                background: config.isActive ? morandiLightPurple : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ color: textPrimary }}>{config.name}</strong>
                    {config.isActive && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        background: morandiPurple,
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
                          background: morandiPurple,
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
                        color: textPrimary,
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
                        background: isTesting ? textTertiary : morandiPurple,
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
                <div style={{ fontSize: '14px', color: textSecondary }}>
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
        background: morandiLightPurple,
        borderRadius: '8px',
        border: `1px solid ${morandiPurple}`
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: textPrimary,
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {editingConfig ? t('settings.editConfiguration') : t('settings.addNewConfiguration')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
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
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
              {t('settings.aiProvider')}
            </label>
            <select
              value={editingConfig ? editingConfig.provider : newConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIConfig['provider'], !!editingConfig)}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              required
            >
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
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
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
              {t('settings.model')}
            </label>
            <select
              value={editingConfig ? editingConfig.model : newConfig.model}
              onChange={(e) => editingConfig
                ? handleEditingConfigChange('model', e.target.value)
                : handleNewConfigChange('model', e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
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
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
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
                    background: isSaving ? textTertiary : morandiPurple,
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
                    color: textPrimary,
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
                  background: isSaving || !newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey ? textTertiary : morandiPurple,
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
  );
};

export default AIConfigSection;