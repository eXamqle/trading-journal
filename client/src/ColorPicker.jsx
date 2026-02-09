import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import './ColorPicker.css';

const ColorPicker = ({ color, onChange, onClose }) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [rgbInput, setRgbInput] = useState({ r: 59, g: 130, b: 246 });

  const pickerRef = useRef(null);
  const satLightRef = useRef(null);
  const [isDraggingSL, setIsDraggingSL] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Parse initial color
  useEffect(() => {
    if (color) {
      const rgb = hexToRgb(color);
      if (rgb) {
        setRgbInput(rgb);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
      }
    }
  }, []);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToRgb = (h, s, l) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const updateColor = (h, s, l) => {
    const rgb = hslToRgb(h, s, l);
    setRgbInput(rgb);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange(hex);
  };

  const handleSatLightClick = (e) => {
    if (!satLightRef.current) return;
    const rect = satLightRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const newSat = (x / rect.width) * 100;
    const newLight = 100 - (y / rect.height) * 100;

    setSaturation(newSat);
    setLightness(newLight);
    updateColor(hue, newSat, newLight);
  };

  const handleHueClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;

    setHue(newHue);
    updateColor(newHue, saturation, lightness);
  };

  const handleSatLightMouseDown = (e) => {
    setIsDraggingSL(true);
    handleSatLightClick(e);
  };

  const handleHueMouseDown = (e) => {
    setIsDraggingHue(true);
    handleHueClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSL) {
        handleSatLightClick(e);
      }
      if (isDraggingHue) {
        handleHueClick(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSL(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSL || isDraggingHue) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSL, isDraggingHue, hue, saturation, lightness]);

  const handleRgbChange = (channel, value) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgbInput, [channel]: numValue };
    setRgbInput(newRgb);

    const hsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);

    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    onChange(hex);
  };

  const currentColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const satLightBg = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`;

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div className="color-picker-modal" onClick={(e) => e.stopPropagation()} ref={pickerRef}>
        <div className="color-picker-header">
          <div className="color-picker-preview" style={{ backgroundColor: currentColor }} />
          <button className="color-picker-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="color-picker-body">
          {/* Saturation/Lightness Picker */}
          <div
            ref={satLightRef}
            className="saturation-lightness-picker"
            style={{ background: satLightBg }}
            onMouseDown={handleSatLightMouseDown}
          >
            <div
              className="sl-cursor"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
                backgroundColor: currentColor
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className="hue-slider" onMouseDown={handleHueMouseDown}>
            <div
              className="hue-cursor"
              style={{ left: `${(hue / 360) * 100}%` }}
            />
          </div>

          {/* RGB Inputs */}
          <div className="rgb-inputs">
            <div className="rgb-input-group">
              <input
                type="number"
                min="0"
                max="255"
                value={rgbInput.r}
                onChange={(e) => handleRgbChange('r', e.target.value)}
                className="rgb-input"
              />
              <label>R</label>
            </div>
            <div className="rgb-input-group">
              <input
                type="number"
                min="0"
                max="255"
                value={rgbInput.g}
                onChange={(e) => handleRgbChange('g', e.target.value)}
                className="rgb-input"
              />
              <label>G</label>
            </div>
            <div className="rgb-input-group">
              <input
                type="number"
                min="0"
                max="255"
                value={rgbInput.b}
                onChange={(e) => handleRgbChange('b', e.target.value)}
                className="rgb-input"
              />
              <label>B</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
