import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const iconMap = {
    success: '✓',
    error: '⚠',
    info: 'ℹ',
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        <span style={{ fontWeight: 800, fontSize: '1rem' }}>{iconMap[type] || 'ℹ'}</span>
        <div style={{ flex: 1 }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginLeft: '0.5rem',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
