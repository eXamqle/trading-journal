import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Plus } from 'lucide-react';
import ColorPicker from './ColorPicker';
import './AddTagModal.css';

const AddTagModal = ({ onClose, onSave }) => {
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

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

    onSave({ name: trimmedName, color: tagColor });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Predefined color palette
  const colorPalette = [
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#a855f7', // violet
    '#22c55e', // lime
    '#eab308'  // yellow
  ];

  return (
    <div className="add-tag-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="add-tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-tag-header">
          <h3>Add New Tag</h3>
          <button className="add-tag-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-tag-form">
          <div className="add-tag-field">
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

          <div className="add-tag-field">
            <label>Tag Color</label>
            <div className="add-tag-color-section">
              {/* Color preview */}
              <div
                className="add-tag-color-preview"
                style={{ backgroundColor: tagColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Click for custom color"
              />

              {/* Predefined color palette */}
              <div className="add-tag-color-palette">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`add-tag-color-option ${tagColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTagColor(color);
                      setShowColorPicker(false);
                    }}
                    title={color}
                  >
                    {tagColor === color && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}

                {/* Custom color button */}
                <button
                  type="button"
                  className="add-tag-color-custom"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Custom color"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="add-tag-actions">
            <button
              type="button"
              className="add-tag-btn add-tag-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-tag-btn add-tag-btn-create"
              disabled={!tagName.trim()}
            >
              Create Tag
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
