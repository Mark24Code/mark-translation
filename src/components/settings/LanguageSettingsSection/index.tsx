import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useI18n } from '../../../utils/i18n';
import { languageAtom, updateLanguageAtom } from '../../../store';
import './LanguageSettingsSection.scss';

interface LanguageSettingsSectionProps {
  // 可以添加其他需要的props
}

const LanguageSettingsSection: React.FC<LanguageSettingsSectionProps> = () => {
  const language = useAtomValue(languageAtom);
  const updateLanguage = useSetAtom(updateLanguageAtom);
  const { t } = useI18n();

  return (
    <div className="language-settings-section">
      <h2 className="section-header">
        {t('settings.languageSettings')}
      </h2>

      <div className="settings-container">
        <label className="form-label">
          {t('settings.interfaceLanguage')}
        </label>
        <select
          value={language}
          onChange={(e) => updateLanguage(e.target.value as 'zh' | 'en')}
          className="form-select"
        >
          <option value="zh">中文 (Chinese)</option>
          <option value="en">English</option>
        </select>
        <div className="form-description">
          {t('settings.languageDescription')}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsSection;