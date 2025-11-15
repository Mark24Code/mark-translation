import React from 'react';
import { useI18n } from '../../../utils/i18n';

interface HelpSectionProps {
  // 可以添加其他需要的props
}

const HelpSection: React.FC<HelpSectionProps> = () => {
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
        {t('settings.gettingStarted')}
      </h2>

      <div style={{
        background: morandiLightPurple,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${morandiPurple}`
      }}>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>1. {t('settings.addAiConfigurations')}:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>{t('settings.createMultipleConfigurations')}</li>
            <li>{t('settings.setOneConfigurationActive')}</li>
            <li>{t('settings.testConnectionsBeforeUsing')}</li>
          </ul>

          <p><strong>2. {t('settings.getYourApiKey')}:</strong></p>
          <ul style={{ margin: '0 0 15px 20px', padding: '0' }}>
            <li>{t('settings.deepseek')}: <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" style={{ color: morandiPurple }}>platform.deepseek.com</a></li>
            <li>{t('settings.openai')}: <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" style={{ color: morandiPurple }}>platform.openai.com</a></li>
            <li>{t('settings.claude')}: <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: morandiPurple }}>console.anthropic.com</a></li>
          </ul>

          <p><strong>3. {t('settings.backupYourSettings')}</strong> {t('settings.backupYourSettings')}</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
