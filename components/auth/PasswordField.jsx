'use client';

import { useState } from 'react';

export default function PasswordField({
  id = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  ariaInvalid = false,
  describedBy,
  visible,
  onVisibleChange,
  showToggle = true,
}) {
  const [ownVisible, setOwnVisible] = useState(false);
  const controlled = visible !== undefined;
  const isVisible = controlled ? visible : ownVisible;
  const toggleId = id + '-show';

  const handleToggle = (e) => {
    if (controlled) {
      if (onVisibleChange) onVisibleChange(e.target.checked);
    } else {
      setOwnVisible(e.target.checked);
    }
  };

  return (
    <div className="field-wrap">
      <label className="field-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        data-password-field="true"
        type={isVisible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={describedBy}
      />
      {showToggle && (
        <label className="show-password" htmlFor={toggleId}>
          <input
            id={toggleId}
            type="checkbox"
            checked={isVisible}
            onChange={handleToggle}
          />
          Show password
        </label>
      )}
    </div>
  );
}