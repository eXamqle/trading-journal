import React, { useState } from 'react';
import { X } from 'lucide-react';
import './ColorPicker.css';
import { TAG_COLOR_GROUPS } from './tagColors';

const ColorPicker = ({ color, onChange, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(color);

  const handleColorSelect = (colorValue) => {
    setSelectedColor(colorValue);
    onChange(colorValue);
    onClose();
  };

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div className="color-picker-modal-modern" onClick={(e) => e.stopPropagation()}>
        <div className="color-picker-header-modern">
          <div className="color-picker-title-section">
            <h3>Choose Color</h3>
            <div className="color-picker-preview-modern" style={{ backgroundColor: selectedColor }}>
              <span className="color-hex">{selectedColor.toUpperCase()}</span>
            </div>
          </div>
          <button className="color-picker-close-modern" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="color-picker-grid">
          {TAG_COLOR_GROUPS.map((group) => (
            <div key={group.name} className="color-row">
              <span className="color-row-label">{group.name}</span>
              <div className="color-shades-row">
                {group.shades.map((shade) => {
                  const isSelected = selectedColor?.toLowerCase() === shade.value.toLowerCase();
                  return (
                    <button
                      key={shade.value}
                      className={`color-swatch ${isSelected ? 'selected' : ''}`}
                      style={{ backgroundColor: shade.value }}
                      onClick={() => handleColorSelect(shade.value)}
                      title={`${group.name} - ${shade.name}`}
                    >
                      {isSelected && (
                        <div className="color-swatch-check">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M13.3333 4L6 11.3333L2.66667 8"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
