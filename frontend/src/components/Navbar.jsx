import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const [gatewayStatus, setGatewayStatus] = useState('checking');

  useEffect(() => {
    const checkGateway = async () => {
      try {
        const res = await api.getHealth();
        setGatewayStatus(res.overall_status === 'healthy' ? 'online' : 'degraded');
      } catch (err) {
        setGatewayStatus('offline');
      }
    };
    checkGateway();
    const interval = setInterval(checkGateway, 20000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (gatewayStatus === 'online') {
      return (
        <span className="badge badge-success" title="All microservices are reachable via API Gateway">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginRight: 5 }}></span>
          Gateway :8000 Online
        </span>
      );
    }
    if (gatewayStatus === 'degraded') {
      return (
        <span className="badge badge-warning" title="Some downstream microservices are unreachable">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginRight: 5 }}></span>
          Partially Degraded
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: '#fef2f2', color: '#ef4444' }} title="API Gateway unreachable">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginRight: 5 }}></span>
        Gateway Offline
      </span>
    );
  };

  const initial = user?.full_name ? user.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U');

  return (
    <header className="navbar">
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title || 'Dashboard'}</h2>
      </div>

      <div className="navbar-user">
        {getStatusBadge()}

        <div className="user-badge">
          <div className="user-avatar">{initial}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name || user?.email || 'Administrator'}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role || 'Admin'}</span>
          </div>
        </div>

        <button 
          onClick={logout} 
          className="btn btn-secondary btn-sm"
          title="Sign out of the dashboard"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
