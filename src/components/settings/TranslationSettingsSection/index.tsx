import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useI18n } from '../../../utils/i18n';
import { translationConfigAtom, updateTranslationConfigAtom } from '../../../store';
import './TranslationSettingsSection.scss';

interface TranslationSettingsSectionProps {
  // 可以添加其他需要的props
}

const TranslationSettingsSection: React.FC<TranslationSettingsSectionProps> = () => {
  const translationConfig = useAtomValue(translationConfigAtom);
  const updateTranslationConfig = useSetAtom(updateTranslationConfigAtom);
  const { t } = useI18n();

  const handleTranslationConfigChange = (field: keyof typeof translationConfig, value: any) => {
    updateTranslationConfig({ [field]: value });
  };

  return (
    <div className="translation-settings-section">
      <h2 className="section-header">
        {t('settings.translationSettings')}
      </h2>

      <div className="settings-grid">
        <div className="settings-group">
          <label className="form-label">
            {t('settings.parallelTasks')}
          </label>
          <input
            type="number"
            value={translationConfig.parallelTasks}
            onChange={(e) => handleTranslationConfigChange('parallelTasks', parseInt(e.target.value) || 1)}
            min="1"
            max="20"
            className="form-input"
          />
          <div className="form-description">
            {t('settings.parallelTasksDescription')}
          </div>
        </div>

        <div className="settings-group">
          <label className="form-label">
            {t('settings.autoTranslate')}
          </label>
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={translationConfig.autoTranslate}
              onChange={(e) => handleTranslationConfigChange('autoTranslate', e.target.checked)}
            />
            <span>{t('settings.autoTranslateDescription')}</span>
          </label>
        </div>

        <div className="settings-group">
          <label className="form-label">
            {t('settings.defaultLanguageDirection')}
          </label>
          <div className="language-direction">
            <select
              value={translationConfig.sourceLang}
              onChange={(e) => handleTranslationConfigChange('sourceLang', e.target.value as 'zh' | 'en')}
              className="form-select"
            >
              <option value="en">{t('settings.english')}</option>
              <option value="zh">{t('settings.chinese')}</option>
            </select>
            <span className="direction-arrow">→</span>
            <select
              value={translationConfig.targetLang}
              onChange={(e) => handleTranslationConfigChange('targetLang', e.target.value as 'zh' | 'en')}
              className="form-select"
            >
              <option value="zh">{t('settings.chinese')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationSettingsSection;