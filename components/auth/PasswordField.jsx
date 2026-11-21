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
}) {
  const [visible, setVisible] = useState(false);
  const toggleId = id + '-show';

  return (
    <div className="field-wrap">
      <label className="field-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        data-password-field="true"
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={describedBy}
      />
      <label className="show-password" htmlFor={toggleId}>
        <input
          id={toggleId}
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        Show password
      </label>
    </div>
  );
}