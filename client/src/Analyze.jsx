import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  ChartColumn,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from './contexts/CurrencyContext';

function Analyze({ trades, onEditTrade, onDeleteTrade }) {
  const { symbol } = useCurrency();
  const [periodFilter, setPeriodFilter] = useState('All Time');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [alertModal, setAlertModal] = useState({ open: false, message: '', title: 'Notice' });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [customDateModal, setCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowsPerPageOpen, setRowsPerPageOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Refs for dropdown containers
  const periodDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const rowsPerPageDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);

  const periods = ['Custom Range', 'This Week', 'This Month', 'Last 30 Days', 'This Year', 'All Time'];
  const types = ['All Types', 'Profit', 'Loss', 'Break Even'];
  const categories = ['All Categories', 'Crypto', 'Forex', 'Futures', 'Options', 'Stocks'];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setPeriodOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setTypeOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
      if (rowsPerPageDropdownRef.current && !rowsPerPageDropdownRef.current.contains(event.target)) {
        setRowsPerPageOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        case 'Custom Range': {
          if (!customStartDate || !customEndDate) return true;
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          return tradeDate >= startDate && tradeDate <= endDate;
        }
        case 'All Time':
        default:
          return true;
      }
    });
  }, [trades, periodFilter, customStartDate, customEndDate]);

  // Filter trades based on symbol, type, and category
  const filteredTrades = useMemo(() => {
    let filtered = filteredByPeriod.filter(trade => {
      const matchesSymbol = !symbolFilter ||
        trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase());

      const matchesType = typeFilter === 'All Types' ||
        trade.type.toLowerCase() === typeFilter.toLowerCase().replace(' ', '-');

      const matchesCategory = categoryFilter === 'All Categories' ||
        trade.category === categoryFilter;

      return matchesSymbol && matchesType && matchesCategory;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch(sortConfig.key) {
          case 'date':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'symbol':
            aValue = a.symbol.toLowerCase();
            bValue = b.symbol.toLowerCase();
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'category':
            aValue = a.category;
            bValue = b.category;
            break;
          case 'amount':
            aValue = parseFloat(a.amount) || 0;
            bValue = parseFloat(b.amount) || 0;
            break;
          case 'fees':
            aValue = parseFloat(a.fees) || 0;
            bValue = parseFloat(b.fees) || 0;
            break;
          case 'netPL':
            const calcNetPL = (trade) => {
              const amount = parseFloat(trade.amount) || 0;
              const fees = parseFloat(trade.fees) || 0;
              return trade.type === 'profit' ? Math.abs(amount) - fees :
                     trade.type === 'loss' ? -(Math.abs(amount) + fees) : -fees;
            };
            aValue = calcNetPL(a);
            bValue = calcNetPL(b);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [filteredByPeriod, symbolFilter, typeFilter, categoryFilter, sortConfig]);

  // Pagination logic
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredTrades.slice(startIndex, endIndex);
  }, [filteredTrades, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [symbolFilter, typeFilter, categoryFilter, periodFilter, customStartDate, customEndDate, rowsPerPage]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTrades = filteredByPeriod.length;

    let totalProfit = 0;
    let totalLoss = 0;
    let totalFees = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakEvenCount = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

    // Calculate daily P&L for best/worst day
    const dailyPnL = {};

    filteredByPeriod.forEach(trade => {
      const amount = parseFloat(trade.amount) || 0;
      const fees = parseFloat(trade.fees) || 0;
      totalFees += fees;

      const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
      let pnl = 0;

      if (trade.type === 'profit') {
        const absAmount = Math.abs(amount);
        totalProfit += absAmount;
        totalWinAmount += absAmount;
        winCount++;
        pnl = absAmount - fees;
      } else if (trade.type === 'loss') {
        const absAmount = Math.abs(amount);
        totalLoss += absAmount;
        totalLossAmount += absAmount;
        lossCount++;
        pnl = -(absAmount + fees);
      } else if (trade.type === 'break-even') {
        breakEvenCount++;
        pnl = -fees;
      }

      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + pnl;
    });

    const netProfit = totalProfit - totalLoss - totalFees;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    const avgWin = winCount > 0 ? (totalWinAmount / winCount) : 0;
    const avgLoss = lossCount > 0 ? (totalLossAmount / lossCount) : 0;

    const dailyValues = Object.values(dailyPnL);
    const bestDay = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
    const worstDay = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;

    return {
      netProfit,
      totalFees,
      winRate,
      winCount,
      lossCount,
      profitFactor,
      totalTrades,
      breakEvenCount,
      avgWin,
      avgLoss,
      bestDay,
      worstDay
    };
  }, [filteredByPeriod]);


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleCustomDateApply = () => {
    if (!customStartDate || !customEndDate) {
      setAlertModal({ open: true, message: 'Please select both start and end dates.', title: 'Invalid Date Range' });
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      setAlertModal({ open: true, message: 'Start date must be before end date.', title: 'Invalid Date Range' });
      return;
    }
    setCustomDateModal(false);
    setPeriodFilter('Custom Range');
  };

  const handleExportCSV = () => {
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
        const netPL = trade.type === 'profit' ? Math.abs(amount) - fees :
                      trade.type === 'loss' ? -(Math.abs(amount) + fees) : -fees;

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
    setExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredTrades.length === 0) {
      setAlertModal({ open: true, message: 'No trades available to export for the selected filters.', title: 'No Data' });
      return;
    }

    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trading Journal - ${format(new Date(), 'yyyy-MM-dd')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e293b; margin-bottom: 10px; }
          .meta { color: #64748b; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; }
          .profit { color: #10b981; }
          .loss { color: #ef4444; }
          .text-right { text-align: right; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Trading Journal Export</h1>
        <div class="meta">
          <p>Period: ${periodFilter}${periodFilter === 'Custom Range' && customStartDate && customEndDate ?
            ` (${format(new Date(customStartDate), 'MMM d, yyyy')} - ${format(new Date(customEndDate), 'MMM d, yyyy')})` : ''}</p>
          <p>Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}</p>
          <p>Total Trades: ${filteredTrades.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Fees</th>
              <th class="text-right">Net P/L</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTrades.map((trade, index) => {
              const amount = parseFloat(trade.amount) || 0;
              const fees = parseFloat(trade.fees) || 0;
              const netPL = trade.type === 'profit' ? Math.abs(amount) - fees :
                            trade.type === 'loss' ? -(Math.abs(amount) + fees) : -fees;
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(trade.date), 'MMM d, yyyy')}</td>
                  <td><strong>${trade.symbol}</strong></td>
                  <td>${trade.type === 'break-even' ? 'Break Even' : trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}</td>
                  <td>${trade.category}</td>
                  <td class="text-right">${symbol}${amount.toFixed(2)}</td>
                  <td class="text-right">${symbol}${fees.toFixed(2)}</td>
                  <td class="text-right ${netPL >= 0 ? 'profit' : 'loss'}">
                    ${netPL >= 0 ? '+' : '-'}${symbol}${Math.abs(netPL).toFixed(2)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlertModal({ open: true, message: 'Please allow pop-ups to export as PDF.', title: 'Pop-up Blocked' });
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    setExportOpen(false);
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
    <div className="analyze-container">
      <main className="dashboard-grid full-width">
        <div className="main-content">
          {/* Empty State */}
          {filteredByPeriod.length === 0 && (
            <div className="analyze-empty-state">
              <p>No trades found for the selected date range. Try selecting a different period or add trades on the calendar.</p>
            </div>
          )}

          {/* Controls */}
          <div className="analyze-controls-row">
            <div className="analyze-tabs" style={{ marginBottom: 0 }}>
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
            <div className="analyze-controls-actions">
              <div className="dropdown-container" ref={periodDropdownRef}>
                <button
                  type="button"
                  className="analyze-dropdown-trigger"
                  onClick={() => {
                    setPeriodOpen(!periodOpen);
                    setTypeOpen(false);
                    setCategoryOpen(false);
                  }}
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
                          if (period === 'Custom Range') {
                            setCustomDateModal(true);
                            setPeriodOpen(false);
                          } else {
                            setPeriodFilter(period);
                            setPeriodOpen(false);
                          }
                        }}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown-container" ref={exportDropdownRef}>
                <button
                  type="button"
                  className="analyze-export-btn"
                  onClick={() => setExportOpen(!exportOpen)}
                >
                  <Download size={16} />
                  Export Data
                  <ChevronDown size={16} />
                </button>
                {exportOpen && (
                  <div className="dropdown-menu">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleExportCSV}
                    >
                      Export as CSV
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleExportPDF}
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* Tab Content */}
      {activeTab === 'performance' ? (
        <div className="analyze-tab-content">
          {/* KPI Cards */}
          <div className="analyze-kpi-grid">
            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Net P&L</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-green">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className={`analyze-kpi-value ${Math.abs(kpis.netProfit) < 0.01 ? 'analyze-kpi-value-default' : (kpis.netProfit >= 0 ? 'analyze-kpi-value-profit' : 'analyze-kpi-value-loss')}`}>
                {Math.abs(kpis.netProfit) < 0.01 ? '' : (kpis.netProfit >= 0 ? '+' : '-')}{symbol}{Math.abs(kpis.netProfit).toFixed(2)}
              </div>
              <p className="analyze-kpi-sublabel">
                {kpis.totalFees > 0 ? `${symbol}${kpis.totalFees.toFixed(2)} in fees` : 'No fees recorded'}
              </p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Win Rate</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-blue">
                  <Activity size={18} />
                </div>
              </div>
              <div className="analyze-kpi-value analyze-kpi-value-blue">
                {kpis.winRate.toFixed(1)}%
              </div>
              <p className="analyze-kpi-sublabel">
                {kpis.winCount}W / {kpis.lossCount}L / {kpis.breakEvenCount}BE
              </p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Profit Factor</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-purple">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="analyze-kpi-value analyze-kpi-value-purple">
                {kpis.profitFactor === 0 ? 'N/A' :
                 kpis.profitFactor === Infinity ? '∞' :
                 kpis.profitFactor.toFixed(2)}
              </div>
              <p className="analyze-kpi-sublabel">Risk/Reward Ratio</p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Total Trades</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-default">
                  <ChartColumn size={18} />
                </div>
              </div>
              <div className="analyze-kpi-value analyze-kpi-value-default">
                {kpis.totalTrades}
              </div>
              <p className="analyze-kpi-sublabel">Total executed trades</p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Best Day</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-green">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className={`analyze-kpi-value ${Math.abs(kpis.bestDay) < 0.01 ? 'analyze-kpi-value-default' : (kpis.bestDay >= 0 ? 'analyze-kpi-value-profit' : 'analyze-kpi-value-loss')}`}>
                {Math.abs(kpis.bestDay) < 0.01 ? '' : (kpis.bestDay >= 0 ? '+' : '-')}{symbol}{Math.abs(kpis.bestDay).toFixed(2)}
              </div>
              <p className="analyze-kpi-sublabel">Highest daily P&L</p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Worst Day</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-default">
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className={`analyze-kpi-value ${Math.abs(kpis.worstDay) < 0.01 ? 'analyze-kpi-value-default' : (kpis.worstDay >= 0 ? 'analyze-kpi-value-profit' : 'analyze-kpi-value-loss')}`}>
                {Math.abs(kpis.worstDay) < 0.01 ? '' : (kpis.worstDay >= 0 ? '+' : '-')}{symbol}{Math.abs(kpis.worstDay).toFixed(2)}
              </div>
              <p className="analyze-kpi-sublabel">Lowest daily P&L</p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Avg Win</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-green">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className={`analyze-kpi-value ${Math.abs(kpis.avgWin) < 0.01 ? 'analyze-kpi-value-default' : 'analyze-kpi-value-profit'}`}>
                {Math.abs(kpis.avgWin) < 0.01 ? '' : '+'}{symbol}{kpis.avgWin.toFixed(2)}
              </div>
              <p className="analyze-kpi-sublabel">Average winning trade</p>
            </div>

            <div className="analyze-kpi-card">
              <div className="analyze-kpi-header">
                <span className="analyze-kpi-label">Avg Loss</span>
                <div className="analyze-kpi-icon analyze-kpi-icon-default">
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className={`analyze-kpi-value ${Math.abs(kpis.avgLoss) < 0.01 ? 'analyze-kpi-value-default' : 'analyze-kpi-value-loss'}`}>
                {Math.abs(kpis.avgLoss) < 0.01 ? '' : '-'}{symbol}{kpis.avgLoss.toFixed(2)}
              </div>
              <p className="analyze-kpi-sublabel">Average losing trade</p>
            </div>
          </div>

          <div className="analyze-card">
            <div className="analyze-card-header" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>Equity Curve</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {periodFilter}
                  {periodFilter === 'Custom Range' && customStartDate && customEndDate &&
                    ` (${format(new Date(customStartDate), 'MMM d')} - ${format(new Date(customEndDate), 'MMM d, yyyy')})`
                  }
                </span>
              </div>
            </div>
            <div className="analyze-card-body" style={{ padding: '0.5rem 1rem 1rem' }}>
              {(() => {
                const sortedTrades = [...filteredByPeriod].sort((a, b) => {
                  const dateA = new Date(a.date);
                  const dateB = new Date(b.date);

                  // Primary sort: by trade date
                  if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                  }

                  // Secondary sort: by ID for trades on the same date
                  return a.id - b.id;
                });

                if (sortedTrades.length === 0) {
                  return (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                      No trades available for the selected period
                    </p>
                  );
                }

                // Calculate cumulative equity
                let cumulative = 0;
                const dataPoints = [];

                sortedTrades.forEach((trade, index) => {
                  const amount = parseFloat(trade.amount) || 0;
                  const fees = parseFloat(trade.fees) || 0;
                  const netPL = trade.type === 'profit' ? Math.abs(amount) - fees :
                                trade.type === 'loss' ? -(Math.abs(amount) + fees) : -fees;
                  cumulative += netPL;
                  dataPoints.push({
                    x: index,
                    y: cumulative,
                    date: trade.date,
                    symbol: trade.symbol,
                    netPL
                  });
                });

                const maxY = Math.max(...dataPoints.map(p => p.y), 0);
                const minY = Math.min(...dataPoints.map(p => p.y), 0);
                const range = maxY - minY || 100;
                const padding = range * 0.1;

                // Calculate nice Y-axis ticks
                const getNiceTicks = (min, max, count = 6) => {
                  const rawStep = (max - min) / (count - 1);
                  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
                  const normalizedStep = rawStep / magnitude;

                  let niceStep;
                  if (normalizedStep <= 1) niceStep = 1;
                  else if (normalizedStep <= 2) niceStep = 2;
                  else if (normalizedStep <= 5) niceStep = 5;
                  else niceStep = 10;

                  const step = niceStep * magnitude;
                  const niceMin = Math.floor(min / step) * step;
                  const niceMax = Math.ceil(max / step) * step;

                  const ticks = [];
                  for (let i = niceMin; i <= niceMax; i += step) {
                    ticks.push(i);
                  }
                  return ticks;
                };

                const yTicks = getNiceTicks(minY - padding, maxY + padding);
                const displayMinY = Math.min(...yTicks);
                const displayMaxY = Math.max(...yTicks);
                const displayRange = displayMaxY - displayMinY;

                const width = 1000;
                const height = 280;
                const marginLeft = 60;
                const marginRight = 20;
                const marginTop = 15;
                const marginBottom = 30;
                const chartWidth = width - marginLeft - marginRight;
                const chartHeight = height - marginTop - marginBottom;

                const xScale = (x) => marginLeft + (x / (dataPoints.length - 1)) * chartWidth;
                const yScale = (y) => height - marginBottom - ((y - displayMinY) / displayRange) * chartHeight;

                const pathData = dataPoints.map((p, i) =>
                  `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`
                ).join(' ');

                const areaData = `M ${marginLeft} ${height - marginBottom} L ${pathData.substring(2)} L ${xScale(dataPoints[dataPoints.length - 1].x)} ${height - marginBottom} Z`;

                return (
                  <div className="equity-chart-container">
                    <svg
                      width="100%"
                      viewBox={`0 0 ${width} ${height}`}
                      style={{ display: 'block', minWidth: '500px' }}
                    >
                      <defs>
                        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {yTicks.map((value, i) => {
                        const y = yScale(value);
                        return (
                          <g key={i}>
                            <line
                              x1={marginLeft}
                              y1={y}
                              x2={width - marginRight}
                              y2={y}
                              stroke="var(--border-color)"
                              strokeWidth="1"
                              opacity="0.5"
                            />
                            <text
                              x={marginLeft - 10}
                              y={y}
                              textAnchor="end"
                              dominantBaseline="middle"
                              fill="var(--text-secondary)"
                              fontSize="12"
                            >
                              {value >= 0 ? '' : '-'}{symbol}{Math.abs(value).toFixed(0)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area fill */}
                      <path d={areaData} fill="url(#areaGradient)" />

                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.5))'
                        }}
                      />

                      {/* Data points */}
                      {dataPoints.map((point, i) => (
                        <circle
                          key={i}
                          cx={xScale(point.x)}
                          cy={yScale(point.y)}
                          r={hoveredPoint === i ? 7 : 4}
                          fill="var(--bg-color)"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            filter: hoveredPoint === i ? 'drop-shadow(0 0 10px #3b82f6)' : 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                          }}
                          onMouseEnter={() => setHoveredPoint(i)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}

                      {/* X-axis */}
                      <line
                        x1={marginLeft}
                        y1={height - marginBottom}
                        x2={width - marginRight}
                        y2={height - marginBottom}
                        stroke="var(--border-color)"
                        strokeWidth="1"
                      />

                      {/* Month labels */}
                      {(() => {
                        const monthLabels = [];
                        const seenMonths = new Set();
                        dataPoints.forEach((point, i) => {
                          if (point.date) {
                            const date = new Date(point.date);
                            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                            if (!seenMonths.has(monthKey)) {
                              seenMonths.add(monthKey);
                              monthLabels.push({
                                x: xScale(point.x),
                                label: format(date, 'MMM yyyy')
                              });
                            }
                          }
                        });
                        return monthLabels.map((label, i) => (
                          <text
                            key={i}
                            x={label.x}
                            y={height - marginBottom + 20}
                            textAnchor="middle"
                            fill="var(--text-secondary)"
                            fontSize="11"
                          >
                            {label.label}
                          </text>
                        ));
                      })()}

                      {/* Y-axis */}
                      <line
                        x1={marginLeft}
                        y1={marginTop}
                        x2={marginLeft}
                        y2={height - marginBottom}
                        stroke="var(--border-color)"
                        strokeWidth="1"
                      />
                    </svg>

                    {/* Tooltip */}
                    {hoveredPoint !== null && hoveredPoint > 0 && dataPoints[hoveredPoint] && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        pointerEvents: 'none',
                        animation: 'fadeIn 0.2s ease-out'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          {format(new Date(dataPoints[hoveredPoint].date), 'MMM d, yyyy')}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {dataPoints[hoveredPoint].symbol}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: dataPoints[hoveredPoint].netPL >= 0 ? '#10b981' : '#ef4444' }}>
                          {dataPoints[hoveredPoint].netPL >= 0 ? '+' : '-'}{symbol}{Math.abs(dataPoints[hoveredPoint].netPL).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                          Total: {dataPoints[hoveredPoint].y >= 0 ? '+' : '-'}{symbol}{Math.abs(dataPoints[hoveredPoint].y).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="analyze-tab-content">
          <div className="analyze-card">
            <div className="analyze-card-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginRight: '1rem' }}>
                <h3 style={{ margin: 0 }}>All Trades</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {periodFilter}
                  {periodFilter === 'Custom Range' && customStartDate && customEndDate &&
                    ` (${format(new Date(customStartDate), 'MMM d')} - ${format(new Date(customEndDate), 'MMM d, yyyy')})`
                  }
                </span>
              </div>
              <div className="analyze-filters">
                <input
                  className="analyze-filter-input"
                  placeholder="Filter by Symbol..."
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                />

                <div className="dropdown-container" ref={rowsPerPageDropdownRef}>
                  <button
                    type="button"
                    className="analyze-filter-dropdown"
                    onClick={() => {
                      setRowsPerPageOpen(!rowsPerPageOpen);
                      setTypeOpen(false);
                      setPeriodOpen(false);
                      setCategoryOpen(false);
                    }}
                  >
                    <span>{rowsPerPage} rows</span>
                    <ChevronDown size={16} />
                  </button>
                  {rowsPerPageOpen && (
                    <div className="dropdown-menu">
                      {[10, 20, 50, 100].map((size) => (
                        <button
                          key={size}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setRowsPerPage(size);
                            setRowsPerPageOpen(false);
                          }}
                        >
                          {size} rows
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="dropdown-container" ref={typeDropdownRef}>
                  <button
                    type="button"
                    className="analyze-filter-dropdown"
                    onClick={() => {
                      setTypeOpen(!typeOpen);
                      setPeriodOpen(false);
                      setCategoryOpen(false);
                    }}
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

                <div className="dropdown-container" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    className="analyze-filter-dropdown"
                    onClick={() => {
                      setCategoryOpen(!categoryOpen);
                      setPeriodOpen(false);
                      setTypeOpen(false);
                    }}
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
                      <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Date {getSortIcon('date')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Symbol {getSortIcon('symbol')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Type {getSortIcon('type')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Category {getSortIcon('category')}
                        </div>
                      </th>
                      <th className="text-right" onClick={() => handleSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          Amount {getSortIcon('amount')}
                        </div>
                      </th>
                      <th className="text-right" onClick={() => handleSort('fees')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          Fees {getSortIcon('fees')}
                        </div>
                      </th>
                      <th className="text-right" onClick={() => handleSort('netPL')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          Net P/L {getSortIcon('netPL')}
                        </div>
                      </th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No trades match the current filters
                        </td>
                      </tr>
                    ) : (
                      paginatedTrades.map((trade, index) => {
                        const amount = parseFloat(trade.amount) || 0;
                        const fees = parseFloat(trade.fees) || 0;
                        const netPL = trade.type === 'profit' ? Math.abs(amount) - fees :
                                      trade.type === 'loss' ? -(Math.abs(amount) + fees) : -fees;

                        return (
                          <tr
                            key={trade.id}
                            onClick={() => onEditTrade && onEditTrade(trade)}
                            style={{ cursor: onEditTrade ? 'pointer' : 'default' }}
                          >
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{format(new Date(trade.date), 'MMM d, yyyy')}</td>
                            <td><strong>{trade.symbol}</strong></td>
                            <td>
                              <span className={`analyze-type-badge analyze-type-${trade.type}`}>
                                {trade.type === 'break-even' ? 'Break Even' :
                                 trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                              </span>
                            </td>
                            <td>{trade.category}</td>
                            <td className="text-right">{symbol}{amount.toFixed(2)}</td>
                            <td className="text-right">{symbol}{fees.toFixed(2)}</td>
                            <td className={`text-right ${netPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {netPL >= 0 ? '+' : '-'}{symbol}{Math.abs(netPL).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {onDeleteTrade && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTrade(trade.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s, color 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.6';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                  }}
                                  title="Delete trade"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredTrades.length > 0 && totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredTrades.length)} of {filteredTrades.length} trades
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      Previous
                    </button>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                        if (endPage - startPage < maxVisiblePages - 1) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setCurrentPage(1)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.375rem',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                minWidth: '2.5rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(<span key="ellipsis1" style={{ padding: '0 0.25rem', color: 'var(--text-secondary)' }}>...</span>);
                          }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: currentPage === i ? 'var(--accent-blue)' : 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.375rem',
                                color: currentPage === i ? '#fff' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                minWidth: '2.5rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(<span key="ellipsis2" style={{ padding: '0 0.25rem', color: 'var(--text-secondary)' }}>...</span>);
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.375rem',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                minWidth: '2.5rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </main>

      {renderAlertModal()}

      {/* Custom Date Range Modal */}
      {customDateModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '450px', padding: '2rem' }}>
            <button className="close-modal" onClick={() => setCustomDateModal(false)}>
              <X size={20} />
            </button>

            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                <CalendarIcon size={24} style={{ color: 'var(--accent-blue)' }} />
                <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Custom Date Range</h2>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="modal-action-button"
                onClick={() => setCustomDateModal(false)}
                style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                className="modal-action-button"
                onClick={handleCustomDateApply}
                style={{ flex: 1 }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analyze;
