import React from 'react';
import { useI18n } from '../../utils/i18n';
import './SettingsLayout.scss';

interface SettingsLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  activeSection,
  onSectionChange,
  children
}) => {
  const { t } = useI18n();

  const sections = [
    { id: 'ai-config', label: t('settings.aiConfigurations'), icon: '' },
    { id: 'translation', label: t('settings.translationSettings'), icon: '' },
    { id: 'styles', label: t('settings.translationStyles'), icon: '' },
    { id: 'language', label: t('settings.languageSettings'), icon: '' },
    { id: 'backup', label: t('settings.backupRestore'), icon: '' },
    { id: 'help', label: t('settings.gettingStarted'), icon: '' }
  ];

  return (
    <div className="settings-layout">
      {/* 左侧导航栏 */}
      <div className="settings-layout__sidebar">
        <div className="settings-layout__header">
          <h1 className="settings-layout__title">
            {t('app.title')}
          </h1>
          <p className="settings-layout__subtitle">
            {t('settings.title')}
          </p>
        </div>

        <nav className="settings-layout__nav">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`settings-layout__nav-button ${
                activeSection === section.id ? 'settings-layout__nav-button--active' : ''
              }`}
            >
              <span className="settings-layout__nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 右侧内容区域 */}
      <div className="settings-layout__content">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
