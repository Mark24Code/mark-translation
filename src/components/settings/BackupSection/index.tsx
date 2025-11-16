import React from 'react';
import { useSetAtom } from 'jotai';
import { useI18n } from '../../../utils/i18n';
import { useToast } from '../../../contexts/ToastContext';
import {
  exportConfigsAtom,
  importConfigsAtom,
  resetConfigsAtom
} from '../../../store';
import './BackupSection.scss';

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
  const { showToast } = useToast();

  const { t } = useI18n();

  const handleExportConfig = async () => {
    try {
      const configJson = await exportConfigs();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 生成带时间戳的文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      a.download = `flash-translation-config-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(t('settings.configurationExported'), 'success');
    } catch (error) {
      console.error('Failed to export config:', error);
      showToast(t('errors.failedToExportConfiguration'), 'error');
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
        showToast(t('settings.configurationImported'), 'success');
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Failed to import config:', error);
      showToast(t('errors.failedToImportConfiguration'), 'error');
    }

    // 重置文件输入
    event.target.value = '';
  };

  const handleResetConfig = async () => {
    if (confirm(t('common.confirmReset'))) {
      await resetConfigs();
      showToast(t('settings.settingsReset'), 'info');
    }
  };

  return (
    <div className="settings-section backup-section">
      <h2 className="section-header">
        {t('settings.backupRestore')}
      </h2>

      <div className="backup-container">
        <div className="button-group">
          <button
            onClick={handleExportConfig}
            className="button primary"
          >
            {t('settings.exportConfiguration')}
          </button>

          <label className="file-input-label">
            {t('settings.importConfiguration')}
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="file-input"
            />
          </label>

          <button
            onClick={handleResetConfig}
            className="button secondary"
          >
            {t('settings.resetAllSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupSection;
