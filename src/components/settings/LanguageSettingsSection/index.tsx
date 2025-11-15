import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useI18n } from '../../../utils/i18n';
import { languageAtom, updateLanguageAtom } from '../../../store';

interface LanguageSettingsSectionProps {
  // 可以添加其他需要的props
}

const LanguageSettingsSection: React.FC<LanguageSettingsSectionProps> = () => {
  const language = useAtomValue(languageAtom);
  const updateLanguage = useSetAtom(updateLanguageAtom);
  const { t } = useI18n();

  // 莫兰迪紫色配色方案
  const morandiPurple = '#8B7D9C';
  const morandiLightPurple = '#E8E4F0';
  const textPrimary = '#333333';
  const textSecondary = 'rgba(51, 51, 51, 0.7)';

  return (
    <div>
      <h2 style={{
        margin: '0 0 20px 0',
        color: textPrimary,
        fontSize: '24px',
        fontWeight: '600'
      }}>
        {t('settings.languageSettings')}
      </h2>

      <div style={{
        padding: '20px',
        background: morandiLightPurple,
        borderRadius: '8px',
        border: `1px solid ${morandiPurple}`
      }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
          {t('settings.interfaceLanguage')}
        </label>
        <select
          value={language}
          onChange={(e) => updateLanguage(e.target.value as 'zh' | 'en')}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${morandiPurple}`,
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: '#fff'
          }}
        >
          <option value="zh">中文 (Chinese)</option>
          <option value="en">English</option>
        </select>
        <div style={{ fontSize: '12px', color: textSecondary, marginTop: '4px' }}>
          {t('settings.languageDescription')}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsSection;