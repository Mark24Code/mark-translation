import React from 'react';
import { useSetAtom } from 'jotai';
import { useI18n } from '../../../utils/i18n';
import {
  exportConfigsAtom,
  importConfigsAtom,
  resetConfigsAtom
} from '../../../store';

interface BackupSectionProps {
  status: string;
  statusType: 'info' | 'success' | 'error';
  setStatus: (status: string) => void;
  setStatusType: (type: 'info' | 'success' | 'error') => void;
}

const BackupSection: React.FC<BackupSectionProps> = ({
  status,
  statusType,
  setStatus,
  setStatusType
}) => {
  const exportConfigs = useSetAtom(exportConfigsAtom);
  const importConfigs = useSetAtom(importConfigsAtom);
  const resetConfigs = useSetAtom(resetConfigsAtom);

  const { t } = useI18n();

  // 莫兰迪紫色配色方案
  const morandiPurple = '#8B7D9C';
  const morandiLightPurple = '#E8E4F0';
  const textPrimary = '#333333';
  const textSecondary = 'rgba(51, 51, 51, 0.7)';

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

  return (
    <div>
      <h2 style={{
        margin: '0 0 20px 0',
        color: textPrimary,
        fontSize: '24px',
        fontWeight: '600'
      }}>
        {t('settings.backupRestore')}
      </h2>

      <div style={{
        padding: '20px',
        background: morandiLightPurple,
        borderRadius: '8px',
        border: `1px solid ${morandiPurple}`
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportConfig}
            style={{
              padding: '12px 24px',
              background: morandiPurple,
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
            background: morandiPurple,
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
              color: textPrimary,
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
    </div>
  );
};

export default BackupSection;
