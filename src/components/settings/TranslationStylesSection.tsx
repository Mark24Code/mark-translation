import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { TranslationStyle } from '../../shared/types';
import { useI18n } from '../../utils/i18n';
import {
  translationStylesAtom,
  activeTranslationStyleAtom,
  addTranslationStyleAtom,
  updateTranslationStyleAtom,
  deleteTranslationStyleAtom,
  setActiveTranslationStyleAtom
} from '../../store';

interface TranslationStylesSectionProps {
  status: string;
  statusType: 'info' | 'success' | 'error';
  setStatus: (status: string) => void;
  setStatusType: (type: 'info' | 'success' | 'error') => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  editingStyle: TranslationStyle | null;
  setEditingStyle: (style: TranslationStyle | null) => void;
  newStyle: Omit<TranslationStyle, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>;
  setNewStyle: (style: Omit<TranslationStyle, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>) => void;
}

const TranslationStylesSection: React.FC<TranslationStylesSectionProps> = ({
  status,
  statusType,
  setStatus,
  setStatusType,
  isSaving,
  setIsSaving,
  editingStyle,
  setEditingStyle,
  newStyle,
  setNewStyle
}) => {
  const translationStyles = useAtomValue(translationStylesAtom);
  const activeTranslationStyle = useAtomValue(activeTranslationStyleAtom);
  const addTranslationStyle = useSetAtom(addTranslationStyleAtom);
  const updateTranslationStyle = useSetAtom(updateTranslationStyleAtom);
  const deleteTranslationStyle = useSetAtom(deleteTranslationStyleAtom);
  const setActiveTranslationStyle = useSetAtom(setActiveTranslationStyleAtom);

  const { t } = useI18n();

  // 莫兰迪紫色配色方案
  const morandiPurple = '#8B7D9C';
  const morandiLightPurple = '#E8E4F0';
  const textPrimary = '#333333';
  const textSecondary = 'rgba(51, 51, 51, 0.7)';
  const textTertiary = 'rgba(51, 51, 51, 0.5)';

  const handleNewStyleChange = (field: keyof typeof newStyle, value: string) => {
    setNewStyle(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditingStyleChange = (field: keyof TranslationStyle, value: string) => {
    if (editingStyle) {
      setEditingStyle({
        ...editingStyle,
        [field]: value
      });
    }
  };

  const handleAddStyle = async () => {
    try {
      setIsSaving(true);
      setStatus(t('common.loading'));
      setStatusType('info');

      if (!newStyle.name || !newStyle.description || !newStyle.prompt) {
        throw new Error(t('errors.fillAllFields'));
      }

      await addTranslationStyle(newStyle);
      setNewStyle({
        name: '',
        description: '',
        prompt: ''
      });
      setStatus(`✅ ${t('settings.translationStyleAdded')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to add translation style:', error);
      setStatus(`❌ ${t('errors.failedToAddTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStyle = async () => {
    if (!editingStyle) return;

    try {
      setIsSaving(true);
      setStatus(t('common.loading'));
      setStatusType('info');

      if (!editingStyle.name || !editingStyle.description || !editingStyle.prompt) {
        throw new Error(t('errors.fillAllFields'));
      }

      await updateTranslationStyle({
        styleId: editingStyle.id,
        updates: editingStyle
      });
      setEditingStyle(null);
      setStatus(`✅ ${t('settings.translationStyleUpdated')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to update translation style:', error);
      setStatus(`❌ ${t('errors.failedToUpdateTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStyle = async (styleId: string) => {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deleteTranslationStyle(styleId);
        setStatus(`✅ ${t('settings.translationStyleDeleted')}`);
        setStatusType('success');
      } catch (error) {
        console.error('Failed to delete translation style:', error);
        setStatus(`❌ ${t('errors.failedToDeleteTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setStatusType('error');
      }
    }
  };

  const handleSetActiveStyle = async (styleId: string | null) => {
    try {
      await setActiveTranslationStyle(styleId);
      setStatus(`✅ ${t('settings.activeTranslationStyleUpdated')}`);
      setStatusType('success');
    } catch (error) {
      console.error('Failed to set active translation style:', error);
      setStatus(`❌ ${t('errors.failedToSetActiveTranslationStyle')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
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
        {t('settings.translationStyles')}
      </h2>

      {/* Active Translation Style Selection */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: textPrimary,
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {t('settings.activeTranslationStyle')}
        </h3>
        <select
          value={activeTranslationStyle?.id || ''}
          onChange={(e) => handleSetActiveStyle(e.target.value || null)}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${morandiPurple}`,
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: '#fff'
          }}
        >
          <option value="">{t('settings.noTranslationStyle')}</option>
          {(translationStyles || []).map(style => (
            <option key={style.id} value={style.id}>
              {style.name} {style.isBuiltIn ? '(内置)' : ''}
            </option>
          ))}
        </select>
        <div style={{ fontSize: '12px', color: textSecondary, marginTop: '4px' }}>
          {t('settings.translationStyleDescription')}
        </div>
      </div>

      {/* Translation Styles List */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: textPrimary,
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {t('settings.yourTranslationStyles')}
        </h3>

        {(translationStyles || []).length === 0 ? (
          <div style={{
            padding: '20px',
            background: morandiLightPurple,
            borderRadius: '8px',
            textAlign: 'center',
            color: textSecondary,
            border: `1px solid ${morandiPurple}`
          }}>
            {t('settings.noTranslationStyles')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(translationStyles || []).map(style => (
              <div key={style.id} style={{
                padding: '15px',
                border: `2px solid ${style.id === activeTranslationStyle?.id ? morandiPurple : morandiLightPurple}`,
                borderRadius: '8px',
                background: style.id === activeTranslationStyle?.id ? morandiLightPurple : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ color: textPrimary }}>{style.name}</strong>
                    {style.isBuiltIn && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        background: textTertiary,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        内置
                      </span>
                    )}
                    {style.id === activeTranslationStyle?.id && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        background: morandiPurple,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        激活
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!style.isBuiltIn && (
                      <>
                        <button
                          onClick={() => setEditingStyle(style)}
                          style={{
                            padding: '6px 12px',
                            background: '#f8f9fa',
                            color: textPrimary,
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteStyle(style.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {t('common.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: textSecondary }}>
                  <div>{style.description}</div>
                  <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                    <strong>提示词:</strong> {style.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Translation Style Form */}
      <div style={{
        padding: '20px',
        background: morandiLightPurple,
        borderRadius: '8px',
        border: `1px solid ${morandiPurple}`
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: textPrimary,
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {editingStyle ? t('settings.editTranslationStyle') : t('settings.addNewTranslationStyle')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
              {t('settings.styleName')}
            </label>
            <input
              type="text"
              value={editingStyle ? editingStyle.name : newStyle.name}
              onChange={(e) => editingStyle
                ? handleEditingStyleChange('name', e.target.value)
                : handleNewStyleChange('name', e.target.value)
              }
              placeholder="技术文档翻译"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
              {t('settings.styleDescription')}
            </label>
            <input
              type="text"
              value={editingStyle ? editingStyle.description : newStyle.description}
              onChange={(e) => editingStyle
                ? handleEditingStyleChange('description', e.target.value)
                : handleNewStyleChange('description', e.target.value)
              }
              placeholder="适合技术文档、API文档、代码注释等"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: textPrimary }}>
              {t('settings.stylePrompt')}
            </label>
            <textarea
              value={editingStyle ? editingStyle.prompt : newStyle.prompt}
              onChange={(e) => editingStyle
                ? handleEditingStyleChange('prompt', e.target.value)
                : handleNewStyleChange('prompt', e.target.value)
              }
              placeholder="请将以下技术文档进行中英互译。保持技术术语的准确性，使用专业的技术语言..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${morandiPurple}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff',
                resize: 'vertical'
              }}
              required
            />
            <div style={{ fontSize: '12px', color: textSecondary, marginTop: '4px' }}>
              {t('settings.stylePromptDescription')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {editingStyle ? (
              <>
                <button
                  onClick={handleUpdateStyle}
                  disabled={isSaving}
                  style={{
                    padding: '12px 24px',
                    background: isSaving ? textTertiary : morandiPurple,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  {isSaving ? t('common.loading') : t('common.save')}
                </button>
                <button
                  onClick={() => setEditingStyle(null)}
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
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={handleAddStyle}
                disabled={isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt}
                style={{
                  padding: '12px 24px',
                  background: isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt ? textTertiary : morandiPurple,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt ? 'not-allowed' : 'pointer',
                  opacity: isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt ? 0.6 : 1
                }}
              >
                {isSaving ? t('common.loading') : t('settings.addNewTranslationStyle')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationStylesSection;