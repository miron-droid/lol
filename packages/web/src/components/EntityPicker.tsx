'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { PickerItem } from '@lol/shared';
import { inputStyle, labelStyle, colors, fontSizes, radii, shadows } from '@/lib/styles';

interface EntityPickerProps {
  /** Label shown above the picker. */
  label: string;
  /** Currently selected ID (empty string = nothing selected). */
  value: string;
  /** Callback when the user selects an item. Passes the item's ID. */
  onChange: (id: string) => void;
  /** Available items to pick from. */
  items: PickerItem[];
  /** Whether the items are still loading. */
  loading?: boolean;
  /** Whether the field is required (shows asterisk). */
  required?: boolean;
  /** Placeholder text when nothing is selected. */
  placeholder?: string;
  /** Whether the picker is disabled. */
  disabled?: boolean;
}

/**
 * Reusable searchable select picker for master-data entities.
 * Renders a text input with a dropdown list filtered by the search query.
 * Submits the selected item's ID but displays the human-readable label.
 */
export function EntityPicker({
  label: fieldLabel,
  value,
  onChange,
  items,
  loading = false,
  required = false,
  placeholder = 'Search or select...',
  disabled = false,
}: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find the label for the currently selected value
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const found = items.find((i) => i.id === value);
    return found ? found.label : value; // fallback to raw ID if not found
  }, [value, items]);

  // Filter items by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  function handleSelect(item: PickerItem) {
    onChange(item.id);
    setOpen(false);
    setSearch('');
  }

  function handleClear() {
    onChange('');
    setSearch('');
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>
        {fieldLabel}{required ? ' *' : ''}
      </label>

      {/* Display / trigger area */}
      <div
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? colors.bgPage : colors.bgWhite,
        }}
        onClick={() => {
          if (!disabled) setOpen(!open);
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedLabel && selectedLabel !== value ? '#222' : colors.textMuted,
          }}
        >
          {loading ? 'Loading...' : selectedLabel || placeholder}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              fontSize: fontSizes.base,
              padding: '0 4px',
              lineHeight: 1,
            }}
            title="Clear selection"
          >
            &times;
          </button>
        )}
        <span style={{ color: colors.textMuted, fontSize: '0.625rem', marginLeft: 4 }}>
          {open ? '\u25B2' : '\u25BC'}
        </span>
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#fff',
            border: `1px solid ${colors.border}`,
            borderRadius: `0 0 ${radii.md}px ${radii.md}px`,
            boxShadow: shadows.dropdown,
            maxHeight: 240,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search box */}
          {items.length > 5 && (
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter..."
              style={{
                padding: '0.375rem 0.5rem',
                border: 'none',
                borderBottom: `1px solid ${colors.border}`,
                fontSize: fontSizes.base,
                outline: 'none',
              }}
            />
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: 200 }}>
            {/* Optional "none" option for non-required fields */}
            {!required && (
              <div
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                style={{
                  ...optionStyle,
                  color: colors.textMuted,
                  fontStyle: 'italic',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = colors.bgHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                — None —
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ padding: '0.5rem', fontSize: fontSizes.base, color: colors.textMuted, textAlign: 'center' }}>
                {items.length === 0 ? 'No items available' : 'No matches'}
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    ...optionStyle,
                    fontWeight: item.id === value ? 600 : 400,
                    background: item.id === value ? colors.bgHover : 'transparent',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = colors.bgHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = item.id === value ? colors.bgHover : ''; }}
                >
                  {item.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const optionStyle: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
  fontSize: fontSizes.base,
  cursor: 'pointer',
  borderBottom: `1px solid ${colors.border}`,
};
