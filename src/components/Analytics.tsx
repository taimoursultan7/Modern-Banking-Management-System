// ============================================================
// Analytics Dashboard — Charts, Reports & Insights
// ============================================================

import React, { useEffect, useRef } from 'react';
import { getAccounts, getTransactions } from '../utils/storage';
import { formatCurrency, getMonthlyStats } from '../utils/helpers';

declare const Chart: any;

const Analytics: React.FC = () => {
  const accounts = getAccounts();
  const transactions = getTransactions();
  const monthly = getMonthlyStats();

  const pieRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const polarRef = useRef<HTMLCanvasElement>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0);
  const totalTransfers = transactions.filter(t => t.type === 'transfer').reduce((s, t) => s + t.amount, 0);

  const savingBal = accounts.filter(a => a.accountType === 'saving').reduce((s, a) => s + a.balance, 0);
  const currentBal = accounts.filter(a => a.accountType === 'current').reduce((s, a) => s + a.balance, 0);
  const businessBal = accounts.filter(a => a.accountType === 'business').reduce((s, a) => s + a.balance, 0);

  useEffect(() => {
    if (typeof Chart === 'undefined') return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const charts: any[] = [];

    if (pieRef.current) {
      charts.push(new Chart(pieRef.current, {
        type: 'pie',
        data: {
          labels: ['Saving Accounts', 'Current Accounts', 'Business Accounts'],
          datasets: [{
            data: [
              accounts.filter(a => a.accountType === 'saving').length,
              accounts.filter(a => a.accountType === 'current').length,
              accounts.filter(a => a.accountType === 'business').length,
            ],
            backgroundColor: ['rgba(59,130,246,0.85)', 'rgba(16,185,129,0.85)', 'rgba(139,92,246,0.85)'],
            borderWidth: 3, borderColor: isDark ? '#111827' : '#fff', hoverOffset: 10,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 12, font: { size: 11 } } } },
        },
      }));
    }

    if (lineRef.current) {
      charts.push(new Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: monthly.map(m => m.label),
          datasets: [
            {
              label: 'Deposits', data: monthly.map(m => m.deposits),
              borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
              tension: 0.4, fill: true, borderWidth: 2, pointRadius: 5, pointBackgroundColor: '#10b981',
            },
            {
              label: 'Withdrawals', data: monthly.map(m => m.withdrawals),
              borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
              tension: 0.4, fill: true, borderWidth: 2, pointRadius: 5, pointBackgroundColor: '#ef4444',
            },
            {
              label: 'Transfers', data: monthly.map(m => m.transfers),
              borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)',
              tension: 0.4, fill: true, borderWidth: 2, pointRadius: 5, pointBackgroundColor: '#3b82f6',
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor, usePointStyle: true } } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v: number) => `₨${(v/1000).toFixed(0)}K` } },
          },
        },
      }));
    }

    if (barRef.current) {
      charts.push(new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: ['Saving', 'Current', 'Business'],
          datasets: [{
            label: 'Total Balance (PKR)',
            data: [savingBal, currentBal, businessBal],
            backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(139,92,246,0.8)'],
            borderRadius: 8, borderSkipped: false,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v: number) => `₨${(v/1000).toFixed(0)}K` } },
          },
        },
      }));
    }

    if (polarRef.current) {
      charts.push(new Chart(polarRef.current, {
        type: 'polarArea',
        data: {
          labels: ['Deposits', 'Withdrawals', 'Transfers'],
          datasets: [{
            data: [totalDeposits, totalWithdrawals, totalTransfers],
            backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)', 'rgba(59,130,246,0.7)'],
            borderWidth: 2, borderColor: isDark ? '#111827' : '#fff',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 12 } } },
          scales: { r: { grid: { color: gridColor }, ticks: { color: textColor, backdropColor: 'transparent' } } },
        },
      }));
    }

    return () => charts.forEach(c => c.destroy());
  }, []);

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalDeposits), icon: 'bi-graph-up-arrow', color: '#10b981' },
    { label: 'Total Outflow', value: formatCurrency(totalWithdrawals + totalTransfers), icon: 'bi-graph-down-arrow', color: '#ef4444' },
    { label: 'Net Balance', value: formatCurrency(totalBalance), icon: 'bi-wallet2', color: '#3b82f6' },
    { label: 'Total Customers', value: accounts.length, icon: 'bi-people-fill', color: '#8b5cf6' },
    { label: 'Active Accounts', value: accounts.filter(a => a.status === 'active').length, icon: 'bi-check-circle-fill', color: '#10b981' },
    { label: 'Total Transactions', value: transactions.length, icon: 'bi-lightning-charge-fill', color: '#f59e0b' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Analytics & Reports</h1>
        <p>Deep insights into your bank's performance</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ border: `1px solid ${s.color}25` }}>
            <div className="card-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1.3rem', flexShrink: 0 }}>
                  <i className={`bi ${s.icon}`}></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>{s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{s.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-graph-up-arrow"></i> Monthly Transaction Trends</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <canvas ref={lineRef}></canvas>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-pie-chart-fill"></i> Account Type Distribution</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <canvas ref={pieRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-bar-chart-fill"></i> Balance by Account Type</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <canvas ref={barRef}></canvas>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-record-circle-fill"></i> Transaction Volume</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <canvas ref={polarRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Account Summary Table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title"><i className="bi bi-table"></i> Account Summary by Type</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Account Type</th>
                <th>Total Accounts</th>
                <th>Active</th>
                <th>Inactive/Frozen</th>
                <th>Total Balance</th>
                <th>Avg Balance</th>
              </tr>
            </thead>
            <tbody>
              {['saving', 'current', 'business'].map(type => {
                const typeAccs = accounts.filter(a => a.accountType === type);
                const active = typeAccs.filter(a => a.status === 'active').length;
                const total = typeAccs.reduce((s, a) => s + a.balance, 0);
                return (
                  <tr key={type}>
                    <td><span className={`badge badge-${type === 'saving' ? 'primary' : type === 'current' ? 'success' : 'purple'}`}>{type}</span></td>
                    <td>{typeAccs.length}</td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{active}</span></td>
                    <td><span style={{ color: 'var(--danger)', fontWeight: 600 }}>{typeAccs.length - active}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(total)}</td>
                    <td>{typeAccs.length > 0 ? formatCurrency(total / typeAccs.length) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
