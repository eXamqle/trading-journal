import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import ColorPicker from './ColorPicker';
import { getTagColorMeta } from './tagColors';
import './AddTagModal.css';

const AddTagModal = ({ onClose, onSave, onDelete, editingTag = null }) => {
  const [tagName, setTagName] = useState(editingTag?.name || '');
  const [tagColor, setTagColor] = useState(editingTag?.color || '#3b82f6');
  const [tagDescription, setTagDescription] = useState(editingTag?.description || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const isEditing = !!editingTag;
  const colorMeta = getTagColorMeta(tagColor);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = tagName.trim();
    if (!trimmedName) {
      setError('Tag name is required');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Tag name must be 30 characters or less');
      return;
    }

    onSave({
      id: editingTag?.id,
      name: trimmedName,
      color: tagColor,
      description: tagDescription.trim() || null
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="add-tag-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="add-tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-tag-header">
          <h3>{isEditing ? 'Edit Tag' : 'Add New Tag'}</h3>
          <button className="add-tag-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-tag-form">
          <div className="add-tag-field-row">
            <div className="add-tag-field add-tag-field-name">
              <label htmlFor="tag-name">Tag Name</label>
              <input
                ref={inputRef}
                id="tag-name"
                type="text"
                className="add-tag-input"
                placeholder="e.g., Breakout, Swing Trade"
                value={tagName}
                onChange={(e) => {
                  setTagName(e.target.value);
                  setError('');
                }}
                maxLength={30}
              />
              {error && <span className="add-tag-error">{error}</span>}
            </div>
            <div className="add-tag-field add-tag-field-color">
              <label>Color</label>
              <button
                type="button"
                className="add-tag-color-btn"
                onClick={() => setShowColorPicker(!showColorPicker)}
                aria-label="Choose tag color"
                aria-expanded={showColorPicker}
              >
                <div
                  className="add-tag-color-swatch"
                  style={{ backgroundColor: tagColor }}
                />
                <div className="add-tag-color-meta">
                  <span className="add-tag-color-name">{colorMeta.label}</span>
                  <span className="add-tag-color-note">{(colorMeta.hex || tagColor).toUpperCase()}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="add-tag-field">
            <label htmlFor="tag-description">Description (Optional)</label>
            <textarea
              id="tag-description"
              className="add-tag-textarea"
              placeholder="e.g., Complete system breakdown. Traded on pure tilt..."
              value={tagDescription}
              onChange={(e) => setTagDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <span className="add-tag-char-count">{tagDescription.length}/200</span>
          </div>

          <div className="add-tag-actions">
            {isEditing && onDelete && (
              <button
                type="button"
                className="add-tag-btn add-tag-btn-delete"
                onClick={() => onDelete(editingTag.id)}
              >
                <Trash2 size={16} />
                Delete Tag
              </button>
            )}
            <button
              type="submit"
              className="add-tag-btn add-tag-btn-create"
              disabled={!tagName.trim()}
            >
              {isEditing ? 'Save Changes' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          color={tagColor}
          onChange={setTagColor}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};

export default AddTagModal;
