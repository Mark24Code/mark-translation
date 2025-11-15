import React from 'react';
import { useI18n } from '../../utils/i18n';

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
    { id: 'ai-config', label: t('settings.aiConfigurations'), icon: '🤖' },
    { id: 'translation', label: t('settings.translationSettings'), icon: '🌐' },
    { id: 'styles', label: t('settings.translationStyles'), icon: '🎨' },
    { id: 'language', label: t('settings.languageSettings'), icon: '🌍' },
    { id: 'backup', label: t('settings.backupRestore'), icon: '💾' },
    { id: 'help', label: t('settings.gettingStarted'), icon: '❓' }
  ];

  // 莫兰迪紫色配色方案
  const morandiPurple = '#8B7D9C';
  const morandiLightPurple = '#E8E4F0';
  const morandiDarkPurple = '#6B5B7A';
  const textPrimary = '#333333';
  const textSecondary = 'rgba(51, 51, 51, 0.7)';
  const textTertiary = 'rgba(51, 51, 51, 0.5)';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      {/* 左侧导航栏 */}
      <div style={{
        width: '250px',
        backgroundColor: '#fff',
        borderRight: `1px solid ${morandiLightPurple}`,
        padding: '20px 0',
        boxShadow: '2px 0 4px rgba(139, 125, 156, 0.1)'
      }}>
        <div style={{ padding: '0 20px 20px 20px', borderBottom: `1px solid ${morandiLightPurple}` }}>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            color: morandiPurple,
            fontWeight: '600'
          }}>
            {t('app.title')}
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: textSecondary
          }}>
            {t('settings.title')}
          </p>
        </div>

        <nav style={{ marginTop: '20px' }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                background: activeSection === section.id ? morandiPurple : 'transparent',
                color: activeSection === section.id ? '#fff' : textPrimary,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeSection === section.id ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                borderRadius: '0'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = morandiLightPurple;
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 右侧内容区域 */}
      <div style={{
        flex: 1,
        padding: '30px',
        overflow: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
