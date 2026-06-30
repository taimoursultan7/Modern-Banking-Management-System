// ============================================================
// Dashboard Component — Analytics, Charts, Recent Activity
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { getAccounts, getTransactions } from '../utils/storage';
import { formatCurrency, formatDateTime, getMonthlyStats } from '../utils/helpers';
import { Account, Transaction } from '../types';

declare const Chart: any;

interface DashboardProps {
  onNavigate: (section: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartInstance = useRef<any>(null);
  const doughnutInstance = useRef<any>(null);
  const barInstance = useRef<any>(null);

  useEffect(() => {
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stats
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0);
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const inactiveAccounts = accounts.filter(a => a.status !== 'active').length;

  // Charts
  useEffect(() => {
    if (!lineChartRef.current || !doughnutRef.current || !barChartRef.current) return;
    if (typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const monthly = getMonthlyStats();
    const labels = monthly.map(m => m.label);
    const deposits = monthly.map(m => m.deposits);
    const withdrawals = monthly.map(m => m.withdrawals);
    const transfers = monthly.map(m => m.transfers);

    // Destroy old
    if (lineChartInstance.current) lineChartInstance.current.destroy();
    if (doughnutInstance.current) doughnutInstance.current.destroy();
    if (barInstance.current) barInstance.current.destroy();

    // Line chart - trends
    lineChartInstance.current = new Chart(lineChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Deposits',
            data: deposits,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4, fill: true, pointRadius: 4,
            pointBackgroundColor: '#10b981', borderWidth: 2,
          },
          {
            label: 'Withdrawals',
            data: withdrawals,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            tension: 0.4, fill: true, pointRadius: 4,
            pointBackgroundColor: '#ef4444', borderWidth: 2,
          },
          {
            label: 'Transfers',
            data: transfers,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            tension: 0.4, fill: true, pointRadius: 4,
            pointBackgroundColor: '#3b82f6', borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, usePointStyle: true, padding: 15, font: { size: 12 } } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v: number) => `₨${(v/1000).toFixed(0)}K` } },
        },
      },
    });

    // Doughnut - account types
    const savingCount = accounts.filter(a => a.accountType === 'saving').length;
    const currentCount = accounts.filter(a => a.accountType === 'current').length;
    const businessCount = accounts.filter(a => a.accountType === 'business').length;

    doughnutInstance.current = new Chart(doughnutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Saving', 'Current', 'Business'],
        datasets: [{
          data: [savingCount, currentCount, businessCount],
          backgroundColor: ['rgba(59,130,246,0.85)', 'rgba(16,185,129,0.85)', 'rgba(139,92,246,0.85)'],
          borderColor: isDark ? '#111827' : '#fff',
          borderWidth: 3, hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, padding: 12, font: { size: 11 } } },
        },
        cutout: '70%',
      },
    });

    // Bar chart - monthly volume
    barInstance.current = new Chart(barChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Deposits',
            data: deposits,
            backgroundColor: 'rgba(16,185,129,0.8)',
            borderRadius: 6, borderSkipped: false,
          },
          {
            label: 'Withdrawals',
            data: withdrawals,
            backgroundColor: 'rgba(239,68,68,0.8)',
            borderRadius: 6, borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, usePointStyle: true, font: { size: 12 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v: number) => `₨${(v/1000).toFixed(0)}K` } },
        },
      },
    });

    return () => {
      lineChartInstance.current?.destroy();
      doughnutInstance.current?.destroy();
      barInstance.current?.destroy();
    };
  }, [accounts, transactions]);

  const recentTxns = transactions.slice(0, 8);

  const stats = [
    { label: 'Total Accounts', value: accounts.length, icon: 'bi-people-fill', color: 'blue', change: `${activeAccounts} Active`, up: true },
    { label: 'Total Balance', value: formatCurrency(totalBalance), icon: 'bi-wallet2', color: 'green', change: 'Across all accounts', up: true },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits), icon: 'bi-arrow-down-circle-fill', color: 'purple', change: `${transactions.filter(t=>t.type==='deposit').length} transactions`, up: true },
    { label: 'Total Withdrawals', value: formatCurrency(totalWithdrawals), icon: 'bi-arrow-up-circle-fill', color: 'red', change: `${transactions.filter(t=>t.type==='withdraw').length} transactions`, up: false },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h2>Welcome to NexaBank Dashboard</h2>
          <p>Here's your complete banking overview. Monitor transactions, manage accounts, and track performance.</p>
          <div className="welcome-stats">
            <div className="welcome-stat">
              <div className="welcome-stat-val">{accounts.length}</div>
              <div className="welcome-stat-label">Total Accounts</div>
            </div>
            <div className="welcome-stat">
              <div className="welcome-stat-val">{transactions.length}</div>
              <div className="welcome-stat-label">Transactions</div>
            </div>
            <div className="welcome-stat">
              <div className="welcome-stat-val">{activeAccounts}</div>
              <div className="welcome-stat-label">Active</div>
            </div>
            <div className="welcome-stat">
              <div className="welcome-stat-val">{inactiveAccounts}</div>
              <div className="welcome-stat-label">Inactive</div>
            </div>
          </div>
        </div>
        <div className="welcome-time">
          <div className="time">{currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="date">{currentTime.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-card-header">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
              <div className={`stat-icon ${s.color}`}>
                <i className={`bi ${s.icon}`}></i>
              </div>
            </div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
              <i className={`bi ${s.up ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`}></i>
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-graph-up-arrow"></i> Transaction Trends (6 Months)</div>
            <span className="badge badge-primary">Live</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <canvas ref={lineChartRef}></canvas>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-pie-chart-fill"></i> Account Types</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: '230px' }}>
              <canvas ref={doughnutRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart + Recent Transactions */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-bar-chart-fill"></i> Monthly Volume</div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-lightning-charge-fill"></i> Quick Actions</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: 'bi-person-plus-fill', label: 'Create New Account', section: 'accounts', color: '#1a56db' },
                { icon: 'bi-arrow-down-circle-fill', label: 'Deposit Money', section: 'deposit', color: '#10b981' },
                { icon: 'bi-arrow-up-circle-fill', label: 'Withdraw Money', section: 'withdraw', color: '#ef4444' },
                { icon: 'bi-arrow-left-right', label: 'Transfer Money', section: 'transfer', color: '#8b5cf6' },
                { icon: 'bi-clock-history', label: 'Transaction History', section: 'history', color: '#f59e0b' },
                { icon: 'bi-people-fill', label: 'Manage Customers', section: 'customers', color: '#0ea5e9' },
              ].map((qa, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(qa.section)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: '10px',
                    border: '1.5px solid var(--border)', background: 'var(--bg-input)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                    transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: 600,
                    fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = qa.color;
                    (e.currentTarget as HTMLElement).style.background = `${qa.color}15`;
                    (e.currentTarget as HTMLElement).style.color = qa.color;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }}
                >
                  <i className={`bi ${qa.icon}`} style={{ color: qa.color, fontSize: '1.1rem', width: '20px', textAlign: 'center' }}></i>
                  {qa.label}
                  <i className="bi bi-chevron-right" style={{ marginLeft: 'auto', opacity: 0.4 }}></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title"><i className="bi bi-clock-history"></i> Recent Transactions</div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('history')}>
            View All <i className="bi bi-arrow-right"></i>
          </button>
        </div>
        {recentTxns.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <h3>No Transactions Yet</h3>
            <p>Transactions will appear here once made.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(txn => (
                  <tr key={txn.id}>
                    <td><span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{txn.transactionId}</span></td>
                    <td>
                      <span className={`txn-type ${txn.type}`}>
                        <i className={`bi ${txn.type === 'deposit' ? 'bi-arrow-down-circle-fill' : txn.type === 'withdraw' ? 'bi-arrow-up-circle-fill' : 'bi-arrow-left-right'}`}></i>
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </span>
                    </td>
                    <td><span className="font-mono" style={{ fontSize: '0.8rem' }}>{txn.accountNumber}</span></td>
                    <td><span className={`txn-amount ${txn.type}`}>
                      {txn.type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span></td>
                    <td>{txn.description}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(txn.createdAt)}</td>
                    <td><span className={`badge badge-${txn.status === 'success' ? 'success' : 'danger'}`}>{txn.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
