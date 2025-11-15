import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useI18n } from '../../../utils/i18n';
import { translationConfigAtom, updateTranslationConfigAtom } from '../../../store';

interface TranslationSettingsSectionProps {
  // 可以添加其他需要的props
}

const TranslationSettingsSection: React.FC<TranslationSettingsSectionProps> = () => {
  const translationConfig = useAtomValue(translationConfigAtom);
  const updateTranslationConfig = useSetAtom(updateTranslationConfigAtom);
  const { t } = useI18n();

  // 莫兰迪紫色配色方案
  const morandiPurple = '#8B7D9C';
  const morandiLightPurple = '#E8E4F0';
  const textPrimary = '#333333';
  const textSecondary = 'rgba(51, 51, 51, 0.7)';

  const handleTranslationConfigChange = (field: keyof typeof translationConfig, value: any) => {
    updateTranslationConfig({ [field]: value });
  };

  return (
    <div>
      <h2 style={{
        margin: '0 0 20px 0',
        color: textPrimary,
        fontSize: '24px',
        fontWeight: '600'
      }}>
        {t('settings.translationSettings')}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          padding: '20px',
          background: morandiLightPurple,
          borderRadius: '8px',
          border: `1px solid ${morandiPurple}`
        }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
            {t('settings.parallelTasks')}
          </label>
          <input
            type="number"
            value={translationConfig.parallelTasks}
            onChange={(e) => handleTranslationConfigChange('parallelTasks', parseInt(e.target.value) || 1)}
            min="1"
            max="20"
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${morandiPurple}`,
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#fff'
            }}
          />
          <div style={{ fontSize: '12px', color: textSecondary, marginTop: '4px' }}>
            {t('settings.parallelTasksDescription')}
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: morandiLightPurple,
          borderRadius: '8px',
          border: `1px solid ${morandiPurple}`
        }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
            {t('settings.autoTranslate')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={translationConfig.autoTranslate}
              onChange={(e) => handleTranslationConfigChange('autoTranslate', e.target.checked)}
            />
            <span style={{ fontSize: '14px', color: textPrimary }}>{t('settings.autoTranslateDescription')}</span>
          </label>
        </div>

        <div style={{
          padding: '20px',
          background: morandiLightPurple,
          borderRadius: '8px',
          border: `1px solid ${morandiPurple}`
        }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
            {t('settings.defaultLanguageDirection')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={translationConfig.sourceLang}
              onChange={(e) => handleTranslationConfigChange('sourceLang', e.target.value as 'zh' | 'en')}
              style={{
                flex: 1,
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="en">{t('settings.english')}</option>
              <option value="zh">{t('settings.chinese')}</option>
            </select>
            <span style={{ color: textSecondary }}>→</span>
            <select
              value={translationConfig.targetLang}
              onChange={(e) => handleTranslationConfigChange('targetLang', e.target.value as 'zh' | 'en')}
              style={{
                flex: 1,
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
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