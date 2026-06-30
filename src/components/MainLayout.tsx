// ============================================================
// Main Layout — Sidebar + Navbar + Content Area
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ThemeMode, Notification } from '../types';
import { getNotifications, saveNotifications } from '../utils/storage';
import { markAllNotificationsRead, formatDateTime, generateId } from '../utils/helpers';
import Toast, { ToastData } from './Toast';
import Dashboard from './Dashboard';
import AccountsManager from './AccountsManager';
import Transactions from './Transactions';
import TransactionHistory from './TransactionHistory';
import Analytics from './Analytics';
import Settings from './Settings';

interface MainLayoutProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', section: 'main' },
  { id: 'accounts', label: 'Accounts', icon: 'bi-people-fill', section: 'main' },
  { id: 'customers', label: 'Customers', icon: 'bi-person-badge-fill', section: 'main' },
  { id: 'deposit', label: 'Deposit', icon: 'bi-arrow-down-circle-fill', section: 'banking' },
  { id: 'withdraw', label: 'Withdraw', icon: 'bi-arrow-up-circle-fill', section: 'banking' },
  { id: 'transfer', label: 'Transfer', icon: 'bi-arrow-left-right', section: 'banking' },
  { id: 'balance', label: 'Balance Inquiry', icon: 'bi-wallet2', section: 'banking' },
  { id: 'mini', label: 'Mini Statement', icon: 'bi-receipt', section: 'banking' },
  { id: 'history', label: 'Transaction History', icon: 'bi-clock-history', section: 'reports' },
  { id: 'analytics', label: 'Analytics', icon: 'bi-graph-up-arrow', section: 'reports' },
  { id: 'settings', label: 'Settings', icon: 'bi-gear-fill', section: 'system' },
];

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  accounts: 'Account Management',
  customers: 'Customer Management',
  deposit: 'Deposit Money',
  withdraw: 'Withdraw Money',
  transfer: 'Transfer Money',
  balance: 'Balance Inquiry',
  mini: 'Mini Statement',
  history: 'Transaction History',
  analytics: 'Analytics & Reports',
  settings: 'Settings',
};

const MainLayout: React.FC<MainLayoutProps> = ({
  theme, onThemeToggle, activeSection, onSectionChange, currentUser, onLogout,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentUserState, setCurrentUserState] = useState<User>(currentUser);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 3000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = useCallback((t: Omit<ToastData, 'id'>) => {
    const id = generateId();
    setToasts(prev => [...prev, { ...t, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    loadNotifications();
    setShowNotifDropdown(false);
  };

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    setSidebarOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTransactionTab = (section: string): string => {
    const map: Record<string, string> = { deposit: 'deposit', withdraw: 'withdraw', transfer: 'transfer', balance: 'balance', mini: 'mini' };
    return map[section] || 'deposit';
  };

  const isTransactionSection = ['deposit', 'withdraw', 'transfer', 'balance', 'mini'].includes(activeSection);

  const renderContent = () => {
    if (activeSection === 'dashboard') {
      return <Dashboard onNavigate={onSectionChange} />;
    }
    if (activeSection === 'accounts' || activeSection === 'customers') {
      return <AccountsManager showToast={showToast} onNavigate={onSectionChange} />;
    }
    if (isTransactionSection) {
      return <Transactions showToast={showToast} initialTab={getTransactionTab(activeSection)} />;
    }
    if (activeSection === 'history') {
      return <TransactionHistory showToast={showToast} />;
    }
    if (activeSection === 'analytics') {
      return <Analytics />;
    }
    if (activeSection === 'settings') {
      return (
        <Settings
          currentUser={currentUserState}
          theme={theme}
          onThemeToggle={onThemeToggle}
          showToast={showToast}
          onUserUpdate={u => setCurrentUserState(u)}
        />
      );
    }
    return <Dashboard onNavigate={onSectionChange} />;
  };

  const navSections = [
    { key: 'main', label: 'Main Menu' },
    { key: 'banking', label: 'Banking' },
    { key: 'reports', label: 'Reports' },
    { key: 'system', label: 'System' },
  ];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const notifIcons: Record<string, string> = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  };

  return (
    <div className="layout-wrapper">
      {/* Sidebar Overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-bank2"></i>
          </div>
          <div className="sidebar-brand-text">
            <h2>NexaBank</h2>
            <span>Banking System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => {
            const items = NAV_ITEMS.filter(i => i.section === section.key);
            if (items.length === 0) return null;
            return (
              <div key={section.key}>
                <div className="sidebar-section-label">{section.label}</div>
                {items.map(item => (
                  <button
                    key={item.id}
                    className={`sidebar-item ${activeSection === item.id || (item.id === 'accounts' && activeSection === 'customers') ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    {item.label}
                    {item.id === 'accounts' && (
                      <span className="sidebar-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.65rem' }}>
                        {/* Show count */}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => { onSectionChange('settings'); setSidebarOpen(false); }}>
            <div className="sidebar-avatar">
              {currentUserState.avatar
                ? <img src={currentUserState.avatar} alt="" />
                : getInitials(currentUserState.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="name">{currentUserState.name}</div>
              <div className="role">{currentUserState.role}</div>
            </div>
            <i className="bi bi-chevron-right" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}></i>
          </div>
          <button
            onClick={onLogout}
            className="sidebar-item"
            style={{ marginTop: '0.5rem', color: '#f87171' }}
          >
            <i className="bi bi-box-arrow-left"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list"></i>
          </button>

          <div className="navbar-title">
            <span>{SECTION_TITLES[activeSection] || 'Dashboard'}</span>
          </div>

          <div className="navbar-actions">
            {/* Search */}
            <div className="navbar-search">
              <i className="bi bi-search"></i>
              <input placeholder="Search accounts, transactions..." onFocus={() => onSectionChange('accounts')} />
            </div>

            {/* Theme Toggle */}
            <button className="icon-btn" onClick={onThemeToggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
            </button>

            {/* Notifications */}
            <div className="dropdown" ref={notifRef}>
              <button className="icon-btn" onClick={() => { setShowNotifDropdown(v => !v); setShowUserDropdown(false); }}>
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {showNotifDropdown && (
                <div className="dropdown-menu notif-panel" style={{ width: 380 }}>
                  <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem' }}>
                    <span>Notifications {unreadCount > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.4rem' }}>{unreadCount} new</span>}</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <i className="bi bi-bell-slash"></i>
                      <h3>No Notifications</h3>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => {
                          const notifs = getNotifications();
                          const idx = notifs.findIndex(x => x.id === n.id);
                          if (idx !== -1) { notifs[idx].read = true; saveNotifications(notifs); loadNotifications(); }
                        }}>
                        <div className={`notif-dot ${n.type}`}>
                          <i className={`bi ${notifIcons[n.type] || 'bi-info-circle-fill'}`}></i>
                        </div>
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-msg">{n.message}</div>
                          <div className="notif-time">{formatDateTime(n.createdAt)}</div>
                        </div>
                        {!n.read && <div className="notif-unread-dot"></div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="dropdown" ref={userRef}>
              <button className="navbar-avatar" onClick={() => { setShowUserDropdown(v => !v); setShowNotifDropdown(false); }}>
                {currentUserState.avatar
                  ? <img src={currentUserState.avatar} alt="" />
                  : getInitials(currentUserState.name)}
              </button>
              {showUserDropdown && (
                <div className="dropdown-menu" style={{ minWidth: 240 }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1a56db, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                        {currentUserState.avatar ? <img src={currentUserState.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(currentUserState.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{currentUserState.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{currentUserState.role} • NexaBank</div>
                      </div>
                    </div>
                  </div>
                  <button className="dropdown-item" onClick={() => { onSectionChange('settings'); setShowUserDropdown(false); }}>
                    <i className="bi bi-person-fill"></i> My Profile
                  </button>
                  <button className="dropdown-item" onClick={() => { onSectionChange('settings'); setShowUserDropdown(false); }}>
                    <i className="bi bi-gear-fill"></i> Settings
                  </button>
                  <button className="dropdown-item" onClick={() => { onThemeToggle(); setShowUserDropdown(false); }}>
                    <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'}`}></i>
                    {theme === 'light' ? 'Dark' : 'Light'} Mode
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item danger" onClick={onLogout}>
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content" key={activeSection}>
          {renderContent()}
        </div>
      </main>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default MainLayout;
