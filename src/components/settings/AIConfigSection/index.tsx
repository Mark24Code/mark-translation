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
import './AIConfigSection.scss';

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
    <div className="ai-config-section">
      <h2 className="section-header">
        {t('settings.aiConfigurations')}
      </h2>

      {/* Configuration List */}
      <div className="config-list">
        <h3 className="subsection-header">
          {t('settings.yourConfigurations')}
        </h3>

        {(aiConfigs || []).length === 0 ? (
          <div className="empty-state">
            {t('settings.noConfigurations')}
          </div>
        ) : (
          <div className="configs-grid">
            {(aiConfigs || []).map(config => (
              <div
                key={config.id}
                className={`config-item ${config.isActive ? 'active' : ''}`}
              >
                <div className="config-header">
                  <div>
                    <strong className="config-name">{config.name}</strong>
                    {config.isActive && (
                      <span className="active-badge">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="action-buttons">
                    {!config.isActive && (
                      <button
                        onClick={() => handleSetActiveConfig(config.id)}
                        className="button primary small"
                      >
                        {t('settings.setActive')}
                      </button>
                    )}
                    <button
                      onClick={() => setEditingConfig(config)}
                      className="button secondary small"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => testConnection(config)}
                      disabled={isTesting}
                      className={`button primary small ${isTesting ? 'disabled' : ''}`}
                    >
                      {isTesting ? t('settings.testing') : t('common.test')}
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="button danger small"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
                <div className="config-details">
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
      <div className="config-form">
        <h3 className="subsection-header">
          {editingConfig ? t('settings.editConfiguration') : t('settings.addNewConfiguration')}
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
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
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('settings.aiProvider')}
            </label>
            <select
              value={editingConfig ? editingConfig.provider : newConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIConfig['provider'], !!editingConfig)}
              className="form-select"
              required
            >
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
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
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('settings.model')}
            </label>
            <select
              value={editingConfig ? editingConfig.model : newConfig.model}
              onChange={(e) => editingConfig
                ? handleEditingConfigChange('model', e.target.value)
                : handleNewConfigChange('model', e.target.value)
              }
              className="form-select"
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

          <div className="form-group">
            <label className="form-label">
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
              className="form-input"
              required
            />
          </div>

          <div className="button-group">
            {editingConfig ? (
              <>
                <button
                  onClick={handleUpdateConfig}
                  disabled={isSaving}
                  className={`button primary ${isSaving ? 'disabled' : ''}`}
                >
                  {isSaving ? t('common.loading') : t('common.save')}
                </button>
                <button
                  onClick={() => setEditingConfig(null)}
                  className="button secondary"
                >
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={handleAddConfig}
                disabled={isSaving || !newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey}
                className={`button primary ${isSaving || !newConfig.name || !newConfig.apiUrl || !newConfig.model || !newConfig.apiKey ? 'disabled' : ''}`}
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