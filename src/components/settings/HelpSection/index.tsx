import React from 'react';
import { useI18n } from '../../../utils/i18n';
import './HelpSection.scss';

interface HelpSectionProps {
  // 可以添加其他需要的props
}

const HelpSection: React.FC<HelpSectionProps> = () => {
  const { t } = useI18n();

  return (
    <div className="help-section">
      <h2 className="section-header">
        {t('settings.gettingStarted')}
      </h2>

      <div className="help-container">
        <div className="help-content">
          <p className="help-step"><strong>1. {t('settings.addAiConfigurations')}:</strong></p>
          <ul className="help-list">
            <li>{t('settings.createMultipleConfigurations')}</li>
            <li>{t('settings.setOneConfigurationActive')}</li>
            <li>{t('settings.testConnectionsBeforeUsing')}</li>
          </ul>

          <p className="help-step"><strong>2. {t('settings.getYourApiKey')}:</strong></p>
          <ul className="help-list">
            <li>{t('settings.deepseek')}: <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="help-link">platform.deepseek.com</a></li>
            <li>{t('settings.openai')}: <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="help-link">platform.openai.com</a></li>
            <li>{t('settings.claude')}: <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="help-link">console.anthropic.com</a></li>
          </ul>

          <p className="help-step"><strong>3. {t('settings.backupYourSettings')}</strong> {t('settings.backupYourSettings')}</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
