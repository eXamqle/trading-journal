import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Activity,
  TrendingUp,
  ChartColumn,
  Download,
  ChevronDown,
  X
} from 'lucide-react';
import { format } from 'date-fns';

function Analyze({ trades }) {
  const [periodFilter, setPeriodFilter] = useState('This Month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('trades');
  const [alertModal, setAlertModal] = useState({ open: false, message: '', title: 'Notice' });

  const periods = ['This Week', 'This Month', 'Last 30 Days', 'This Year', 'All Time'];
  const types = ['All Types', 'Profit', 'Loss', 'Break Even'];
  const categories = ['All Categories', 'Stocks', 'Options', 'Indices'];

  // Filter trades based on period
  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);

      switch(periodFilter) {
        case 'This Week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return tradeDate >= weekAgo;
        }
        case 'This Month': {
          return tradeDate.getMonth() === now.getMonth() &&
                 tradeDate.getFullYear() === now.getFullYear();
        }
        case 'Last 30 Days': {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return tradeDate >= thirtyDaysAgo;
        }
        case 'This Year': {
          return tradeDate.getFullYear() === now.getFullYear();
        }
        case 'All Time':
        default:
          return true;
      }
    });
  }, [trades, periodFilter]);

  // Filter trades based on symbol, type, and category
  const filteredTrades = useMemo(() => {
    return filteredByPeriod.filter(trade => {
      const matchesSymbol = !symbolFilter ||
        trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase());

      const matchesType = typeFilter === 'All Types' ||
        trade.type.toLowerCase() === typeFilter.toLowerCase().replace(' ', '-');

      const matchesCategory = categoryFilter === 'All Categories' ||
        trade.category === categoryFilter;

      return matchesSymbol && matchesType && matchesCategory;
    });
  }, [filteredByPeriod, symbolFilter, typeFilter, categoryFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTrades = filteredByPeriod.length;

    let totalProfit = 0;
    let totalLoss = 0;
    let totalFees = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakEvenCount = 0;

    filteredByPeriod.forEach(trade => {
      const amount = parseFloat(trade.amount) || 0;
      const fees = parseFloat(trade.fees) || 0;
      totalFees += fees;

      if (trade.type === 'profit') {
        totalProfit += amount;
        winCount++;
      } else if (trade.type === 'loss') {
        totalLoss += amount;
        lossCount++;
      } else if (trade.type === 'break-even') {
        breakEvenCount++;
      }
    });

    const netProfit = totalProfit - totalLoss - totalFees;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    return {
      netProfit,
      totalFees,
      winRate,
      winCount,
      lossCount,
      profitFactor,
      totalTrades,
      breakEvenCount
    };
  }, [filteredByPeriod]);

  const handleExport = () => {
    if (filteredTrades.length === 0) {
      setAlertModal({ open: true, message: 'No trades available to export for the selected filters.', title: 'No Data' });
      return;
    }

    const headers = ['Date', 'Symbol', 'Type', 'Category', 'Amount', 'Fees', 'Net P/L'];
    const csvContent = [
      headers.join(','),
      ...filteredTrades.map(trade => {
        const amount = parseFloat(trade.amount) || 0;
        const fees = parseFloat(trade.fees) || 0;
        const netPL = trade.type === 'profit' ? amount - fees :
                      trade.type === 'loss' ? -(amount + fees) : -fees;

        return [
          format(new Date(trade.date), 'yyyy-MM-dd'),
          trade.symbol,
          trade.type,
          trade.category,
          amount.toFixed(2),
          fees.toFixed(2),
          netPL.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderAlertModal = () => {
    if (!alertModal.open) return null;

    return (
      <div className="modal-overlay" style={{ zIndex: 10000 }}>
        <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }}>
          <button className="close-modal" onClick={() => setAlertModal({ ...alertModal, open: false })}>
            <X size={20} />
          </button>

          <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>{alertModal.title}</h2>
          </div>

          <div style={{ marginBottom: '2rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            {alertModal.message}
          </div>

          <button
            className="modal-action-button"
            onClick={() => setAlertModal({ ...alertModal, open: false })}
            style={{ width: '100%' }}
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="analyze-container">
      {/* Controls */}
      <div className="analyze-controls">
        <div className="dropdown-container">
          <button
            type="button"
            className="analyze-dropdown-trigger"
            onClick={() => setPeriodOpen(!periodOpen)}
          >
            <span>{periodFilter}</span>
            <ChevronDown size={16} />
          </button>
          {periodOpen && (
            <div className="dropdown-menu">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setPeriodFilter(period);
                    setPeriodOpen(false);
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="analyze-export-btn" onClick={handleExport}>
          <Download size={16} />
          Export Data
        </button>
      </div>

      <h2 className="analyze-period-label">{periodFilter}'s Statistics</h2>

      {/* Empty State */}
      {filteredByPeriod.length === 0 && (
        <div className="analyze-empty-state">
          <p>No trades found for the selected date range. Try selecting a different period or add trades on the calendar.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="analyze-kpi-grid">
        <div className="analyze-kpi-card">
          <div className="analyze-kpi-header">
            <span className="analyze-kpi-label">Net Profit</span>
            <div className="analyze-kpi-icon analyze-kpi-icon-green">
              <DollarSign size={20} />
            </div>
          </div>
          <div className={`analyze-kpi-value ${kpis.netProfit >= 0 ? 'analyze-kpi-value-profit' : 'analyze-kpi-value-loss'}`}>
            {kpis.netProfit >= 0 ? '+' : ''}${kpis.netProfit.toFixed(2)}
          </div>
          <p className="analyze-kpi-sublabel">
            {kpis.totalFees > 0 ? `$${kpis.totalFees.toFixed(2)} in fees` : 'No fees recorded'}
          </p>
        </div>

        <div className="analyze-kpi-card">
          <div className="analyze-kpi-header">
            <span className="analyze-kpi-label">Win Rate</span>
            <div className="analyze-kpi-icon analyze-kpi-icon-blue">
              <Activity size={20} />
            </div>
          </div>
          <div className="analyze-kpi-value analyze-kpi-value-blue">
            {kpis.winRate.toFixed(1)}%
          </div>
          <p className="analyze-kpi-sublabel">
            {kpis.winCount} Wins / {kpis.lossCount} Losses
          </p>
        </div>

        <div className="analyze-kpi-card">
          <div className="analyze-kpi-header">
            <span className="analyze-kpi-label">Profit Factor</span>
            <div className="analyze-kpi-icon analyze-kpi-icon-purple">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="analyze-kpi-value analyze-kpi-value-purple">
            {kpis.profitFactor === 0 ? 'N/A' :
             kpis.profitFactor === Infinity ? '∞' :
             kpis.profitFactor.toFixed(2)}
          </div>
          <p className="analyze-kpi-sublabel">Based on gross P&L</p>
        </div>

        <div className="analyze-kpi-card">
          <div className="analyze-kpi-header">
            <span className="analyze-kpi-label">Total Trades</span>
            <div className="analyze-kpi-icon analyze-kpi-icon-default">
              <ChartColumn size={20} />
            </div>
          </div>
          <div className="analyze-kpi-value analyze-kpi-value-default">
            {kpis.totalTrades}
          </div>
          <p className="analyze-kpi-sublabel">{kpis.breakEvenCount} Breakeven</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="analyze-tabs">
        <button
          className={`analyze-tab-trigger ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`analyze-tab-trigger ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          Trade List
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'performance' ? (
        <div className="analyze-tab-content">
          <div className="analyze-card">
            <div className="analyze-card-header">
              <h3>Performance Charts</h3>
            </div>
            <div className="analyze-card-body">
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                Performance charts coming soon...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="analyze-tab-content">
          <div className="analyze-card">
            <div className="analyze-card-header">
              <h3>Recent Trades</h3>
              <div className="analyze-filters">
                <input
                  className="analyze-filter-input"
                  placeholder="Filter by Symbol..."
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                />

                <div className="dropdown-container">
                  <button
                    type="button"
                    className="analyze-filter-dropdown"
                    onClick={() => setTypeOpen(!typeOpen)}
                  >
                    <span>{typeFilter}</span>
                    <ChevronDown size={16} />
                  </button>
                  {typeOpen && (
                    <div className="dropdown-menu">
                      {types.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setTypeFilter(type);
                            setTypeOpen(false);
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="dropdown-container">
                  <button
                    type="button"
                    className="analyze-filter-dropdown"
                    onClick={() => setCategoryOpen(!categoryOpen)}
                  >
                    <span>{categoryFilter}</span>
                    <ChevronDown size={16} />
                  </button>
                  {categoryOpen && (
                    <div className="dropdown-menu">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setCategoryFilter(category);
                            setCategoryOpen(false);
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="analyze-card-body">
              <div className="analyze-table-container">
                <table className="analyze-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Fees</th>
                      <th className="text-right">Net P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No trades match the current filters
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((trade, index) => {
                        const amount = parseFloat(trade.amount) || 0;
                        const fees = parseFloat(trade.fees) || 0;
                        const netPL = trade.type === 'profit' ? amount - fees :
                                      trade.type === 'loss' ? -(amount + fees) : -fees;

                        return (
                          <tr key={trade.id}>
                            <td>{index + 1}</td>
                            <td>{format(new Date(trade.date), 'MMM d, yyyy')}</td>
                            <td><strong>{trade.symbol}</strong></td>
                            <td>
                              <span className={`analyze-type-badge analyze-type-${trade.type}`}>
                                {trade.type === 'break-even' ? 'Break Even' :
                                 trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                              </span>
                            </td>
                            <td>{trade.category}</td>
                            <td className="text-right">${amount.toFixed(2)}</td>
                            <td className="text-right">${fees.toFixed(2)}</td>
                            <td className={`text-right ${netPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {netPL >= 0 ? '+' : ''}${netPL.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {renderAlertModal()}
    </main>
  );
}

export default Analyze;
