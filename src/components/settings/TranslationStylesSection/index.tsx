import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { TranslationStyle } from '../../../shared/types';
import { useI18n } from '../../../utils/i18n';
import {
  translationStylesAtom,
  activeTranslationStyleAtom,
  addTranslationStyleAtom,
  updateTranslationStyleAtom,
  deleteTranslationStyleAtom,
  setActiveTranslationStyleAtom
} from '../../../store';
import './TranslationStylesSection.scss';

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
    <div className="settings-section translation-styles-section">
      <h2 className="section-header">
        {t('settings.translationStyles')}
      </h2>

      {/* Active Translation Style Selection */}
      <div className="style-list">
        <h3 className="subsection-header">
          {t('settings.activeTranslationStyle')}
        </h3>
        <select
          value={activeTranslationStyle?.id || ''}
          onChange={(e) => handleSetActiveStyle(e.target.value || null)}
          className="form-select"
        >
          <option value="">{t('settings.noTranslationStyle')}</option>
          {(translationStyles || []).map(style => (
            <option key={style.id} value={style.id}>
              {style.name} {style.isBuiltIn ? '(内置)' : ''}
            </option>
          ))}
        </select>
        <div className="form-description">
          {t('settings.translationStyleDescription')}
        </div>
      </div>

      {/* Translation Styles List */}
      <div className="style-list">
        <h3 className="subsection-header">
          {t('settings.yourTranslationStyles')}
        </h3>

        {(translationStyles || []).length === 0 ? (
          <div className="empty-state">
            {t('settings.noTranslationStyles')}
          </div>
        ) : (
          <div className="styles-grid">
            {(translationStyles || []).map(style => (
              <div
                key={style.id}
                className={`style-item ${style.id === activeTranslationStyle?.id ? 'active' : ''}`}
              >
                <div className="style-header">
                  <div>
                    <strong className="style-name">{style.name}</strong>
                    {style.isBuiltIn && (
                      <span className="badge built-in">
                        内置
                      </span>
                    )}
                    {style.id === activeTranslationStyle?.id && (
                      <span className="badge active">
                        激活
                      </span>
                    )}
                  </div>
                  <div className="action-buttons">
                    {!style.isBuiltIn && (
                      <>
                        <button
                          onClick={() => setEditingStyle(style)}
                          className="button secondary small"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteStyle(style.id)}
                          className="button danger small"
                        >
                          {t('common.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="style-details">
                  <div>{style.description}</div>
                  <div className="style-prompt">
                    <strong>提示词:</strong> {style.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Translation Style Form */}
      <div className="style-form">
        <h3 className="subsection-header">
          {editingStyle ? t('settings.editTranslationStyle') : t('settings.addNewTranslationStyle')}
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
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
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
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
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
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
              className="form-textarea"
              required
            />
            <div className="form-description">
              {t('settings.stylePromptDescription')}
            </div>
          </div>

          <div className="button-group">
            {editingStyle ? (
              <>
                <button
                  onClick={handleUpdateStyle}
                  disabled={isSaving}
                  className={`button primary ${isSaving ? 'disabled' : ''}`}
                >
                  {isSaving ? t('common.loading') : t('common.save')}
                </button>
                <button
                  onClick={() => setEditingStyle(null)}
                  className="button secondary"
                >
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={handleAddStyle}
                disabled={isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt}
                className={`button primary ${isSaving || !newStyle.name || !newStyle.description || !newStyle.prompt ? 'disabled' : ''}`}
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
