import React from 'react';

const StatsCard = ({ title, value, icon, color = 'indigo', subtitle }) => {
  const colorStyles = {
    indigo: {
      bg: '#eef2ff',
      text: '#4f46e5',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    },
    cyan: {
      bg: '#ecfeff',
      text: '#0891b2',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    },
    emerald: {
      bg: '#ecfdf5',
      text: '#059669',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    amber: {
      bg: '#fffbeb',
      text: '#d97706',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  };

  const current = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="stats-card">
      <div className="stats-info">
        <h3>{title}</h3>
        <div className="stats-value">{value}</div>
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div 
        className="stats-icon-wrapper" 
        style={{ 
          background: current.gradient,
          color: 'white',
          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)` 
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      </div>
    </div>
  );
};

export default StatsCard;
