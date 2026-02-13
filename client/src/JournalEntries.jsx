import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
  FileText,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrency } from './contexts/CurrencyContext';

function JournalEntries({ journalEntries, onViewEntry, trades = [], onAddJournal, onDeleteEntry, availableTags = [] }) {
  const { symbol } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTrades, setExpandedTrades] = useState({});
  const entriesPerPage = 10;

  // Helper function to get trades for a specific date
  const getTradesForDate = (dateString) => {
    const entryDate = new Date(dateString);
    entryDate.setHours(0, 0, 0, 0);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === entryDate.getTime();
    });
  };

  // Helper function to calculate P&L
  const calculatePnL = (tradesArray) => {
    return tradesArray.reduce((sum, trade) => {
      const amount = parseFloat(trade.amount) || 0;
      const fees = parseFloat(trade.fees) || 0;
      // Always: amount - fees (type is just a label)
      return sum + (amount - fees);
    }, 0);
  };

  // Convert journalEntries object to array with trade data
  const entriesArray = useMemo(() => {
    return Object.entries(journalEntries)
      .filter(([date, entry]) => entry?.content && entry.content.trim() !== '')
      .map(([date, entry]) => {
        const dayTrades = getTradesForDate(date);
        const dayPnL = calculatePnL(dayTrades);
        const content = entry?.content || '';
        const tags = entry?.tags || [];

        return {
          date,
          content,
          tags,
          textContent: content.replace(/<[^>]*>/g, '').trim(),
          wordCount: content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
          trades: dayTrades,
          pnl: dayPnL,
          tradeCount: dayTrades.length
        };
      });
  }, [journalEntries, trades]);

  // Filter entries based on search query and date filter
  const filteredEntries = useMemo(() => {
    let filtered = entriesArray;

    // Apply text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const dateStr = format(parseISO(entry.date), 'MMM d, yyyy').toLowerCase();
        const content = entry.textContent.toLowerCase();
        // Also search in ticker symbols and tags
        const tickers = entry.trades.map(t => t.symbol?.toLowerCase() || '').join(' ');
        const tags = entry.trades.flatMap(t => t.tags?.map(tag => tag.name.toLowerCase()) || []).join(' ');
        return dateStr.includes(query) || content.includes(query) || tickers.includes(query) || tags.includes(query);
      });
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(entry => entry.date === dateFilter);
    }

    return filtered;
  }, [entriesArray, searchQuery, dateFilter]);

  // Sort entries by date (most recent first)
  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries];
    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted;
  }, [filteredEntries]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

  // Reset to page 1 when search or date filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter]);

  const getPreviewText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Calculate statistics
  const stats = useMemo(() => {
    // All-time trading statistics (from all trades, not just journal entries)
    const totalTrades = trades.length;
    const totalPnL = calculatePnL(trades);

    // Calculate win rate from all trades
    const profitTrades = trades.filter(t => t.type === 'profit').length;
    const lossTrades = trades.filter(t => t.type === 'loss').length;
    const winRate = totalTrades > 0 ? ((profitTrades / totalTrades) * 100).toFixed(1) : '0.0';

    // Journaling statistics (only from journal entries)
    const totalEntries = entriesArray.length;
    const avgWordsPerEntry = totalEntries > 0
      ? Math.round(entriesArray.reduce((sum, entry) => sum + entry.wordCount, 0) / totalEntries)
      : 0;

    // Days with journal entries that were profitable
    const profitableDays = entriesArray.filter(entry => entry.pnl > 0).length;

    return {
      totalEntries,
      totalTrades,
      totalPnL,
      avgWordsPerEntry,
      profitableDays,
      winRate,
      profitTrades,
      lossTrades
    };
  }, [entriesArray, trades]);

  return (
    <>
      <main className="dashboard-grid">
        <div className="main-content">
          <div className="journal-entries-header">
            <div className="journal-entries-header-left">
              <div className="journal-entries-icon" style={{ width: '3rem', height: '3rem', fontSize: '1rem' }}>
                <FileText size={26} strokeWidth={2.5} color="white" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Journal</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {entriesArray.length} {entriesArray.length === 1 ? 'entry' : 'entries'} total
                </p>
              </div>
            </div>
            <div className="journal-entries-header-right">
              <div className="journal-entries-search">
                <Search size={16} className="journal-search-icon" />
                <input
                  type="text"
                  className="journal-search-input"
                  placeholder="Search entries, tickers, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ paddingRight: dateFilter ? '2.5rem' : '0.75rem', minWidth: '180px' }}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={onAddJournal}
                className="journal-add-button"
              >
                <PlusCircle size={16} />
                Add Journal
              </button>
            </div>
          </div>
          <div className="journal-entries-main-card">
            {sortedEntries.length === 0 ? (
              <div className="journal-empty-state">
                <div className="journal-empty-icon">
                  <FileText size={40} />
                </div>
                {entriesArray.length === 0 ? (
                  <>
                    <h3>No Entries Yet</h3>
                    <p>Start documenting your trading journey by clicking on a date in the calendar.</p>
                  </>
                ) : (
                  <>
                    <h3>No Results Found</h3>
                    <p>Try adjusting your search query.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="journal-entries-list-new">
                  {paginatedEntries.map((entry, index) => {
                    const hasTrades = entry.tradeCount > 0;
                    const isProfitable = entry.pnl > 0;
                    const hasImages = entry.content.includes('<img');

                    // Get unique tickers from trades
                    const tickers = [...new Set(entry.trades.map(t => t.symbol).filter(Boolean))];

                    // Get unique tags from trades and journal
                    const tradeTags = entry.trades.flatMap(t => t.tags || []);
                    const journalTags = entry.tags || [];
                    const allTags = [...tradeTags, ...journalTags];
                    const uniqueTags = allTags.reduce((acc, tag) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      if (!acc.find(t => (typeof t === 'string' ? t : t.name) === tagName)) {
                        acc.push(tag);
                      }
                      return acc;
                    }, []);

                    return (
                      <div
                        key={entry.date}
                        className="journal-entry-card"
                        onClick={() => onViewEntry(entry.date)}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="journal-entry-card-header">
                          <div className="journal-entry-date-new">
                            <CalendarIcon size={16} />
                            <span className="journal-entry-day">{format(parseISO(entry.date), 'EEEE')}</span>
                            <span className="journal-entry-date-full">{format(parseISO(entry.date), 'MMM d, yyyy')}</span>
                            {hasImages && (
                              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                <ImageIcon size={14} />
                              </span>
                            )}
                          </div>
                          <div className="journal-entry-badges">
                            <span className="journal-entry-word-badge">{entry.wordCount}w</span>
                            {hasTrades && (
                              <span className={`journal-entry-pnl-badge ${isProfitable ? 'profit' : 'loss'}`}>
                                {entry.pnl >= 0 ? '+' : '-'}{symbol}{Math.abs(entry.pnl).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="journal-entry-preview-new">
                          {getPreviewText(entry.textContent)}
                        </div>

                        {hasTrades && (
                          <>
                            <div
                              className="journal-entry-trades-summary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTrades(prev => ({
                                  ...prev,
                                  [entry.date]: !prev[entry.date]
                                }));
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <Target size={14} />
                              <span>{entry.tradeCount} {entry.tradeCount === 1 ? 'trade' : 'trades'}</span>
                              {tickers.length > 0 && (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                  • {tickers.slice(0, 3).join(', ')}{tickers.length > 3 ? ` +${tickers.length - 3}` : ''}
                                </span>
                              )}
                              {expandedTrades[entry.date] ? (
                                <ChevronUp size={16} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                              ) : (
                                <ChevronDown size={16} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                              )}
                            </div>

                            {expandedTrades[entry.date] && (
                              <div className="journal-entry-trades-list">
                                {entry.trades.map((trade, tradeIdx) => {
                                  const tradeAmount = parseFloat(trade.amount) || 0;
                                  const tradeFees = parseFloat(trade.fees) || 0;
                                  // Always: amount - fees
                                  const tradeNet = tradeAmount - tradeFees;

                                  return (
                                    <div key={tradeIdx} className="journal-trade-item">
                                      <div className="journal-trade-item-left">
                                        <div className="journal-trade-icon">
                                          {trade.type === 'profit' ? (
                                            <TrendingUp size={12} color="var(--accent-green)" />
                                          ) : trade.type === 'loss' ? (
                                            <TrendingDown size={12} color="var(--accent-red)" />
                                          ) : (
                                            <Minus size={12} color="var(--text-secondary)" />
                                          )}
                                        </div>
                                        <div className="journal-trade-info">
                                          <span className="journal-trade-symbol">{trade.symbol}</span>
                                          <span className="journal-trade-category">• {trade.category}</span>
                                        </div>
                                      </div>
                                      <div className="journal-trade-item-right">
                                        {tradeFees > 0 && (
                                          <span className="journal-trade-fees">
                                            -{symbol}{tradeFees.toFixed(2)}
                                          </span>
                                        )}
                                        <span className={`journal-trade-amount ${trade.type}`}>
                                          {tradeNet >= 0 ? '+' : ''}{symbol}{tradeNet.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}

                        {uniqueTags.length > 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border-color)'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.375rem',
                              flex: 1
                            }}>
                              {uniqueTags.slice(0, 5).map((tag, idx) => {
                                // Handle both string tags (from journal) and object tags (from trades)
                                const tagName = typeof tag === 'string' ? tag : tag.name;
                                const tagColor = typeof tag === 'string'
                                  ? availableTags.find(t => t.name === tag)?.color || '#3b82f6'
                                  : tag.color;

                                return (
                                  <span
                                    key={idx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.375rem',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      background: tagColor,
                                      color: 'white'
                                    }}
                                  >
                                    {tagName}
                                  </span>
                                );
                              })}
                              {uniqueTags.length > 5 && (
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)'
                                }}>
                                  +{uniqueTags.length - 5} more
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEntry(entry.date);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
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
                              title="Delete journal entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}

                        {uniqueTags.length === 0 && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border-color)'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEntry(entry.date);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
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
                              title="Delete journal entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="journal-pagination">
                    <button
                      className="journal-pagination-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="journal-pagination-info">
                      <span className="journal-pagination-text">
                        Page {currentPage} of {totalPages}
                      </span>
                      <span className="journal-pagination-count">
                        Showing {startIndex + 1}-{Math.min(endIndex, sortedEntries.length)} of {sortedEntries.length}
                      </span>
                    </div>

                    <button
                      className="journal-pagination-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <aside className="sidebar-section">
          <h2 className="sidebar-title">Statistics</h2>

          <div className="info-card">
            <span className="info-label">Total P&L</span>
            <div className={`info-value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {stats.totalPnL >= 0 ? '+' : '-'}{symbol}{Math.abs(stats.totalPnL).toFixed(2)}
            </div>
            <div className="info-subtext">All-time trading</div>
          </div>

          <div className="info-card">
            <span className="info-label">Win Rate</span>
            <div className="info-value">{stats.winRate}%</div>
            <div className="info-subtext">{stats.profitTrades}W / {stats.lossTrades}L</div>
          </div>

          <div className="info-card">
            <span className="info-label">Total Trades</span>
            <div className="info-value">{stats.totalTrades}</div>
            <div className="info-subtext">All-time</div>
          </div>

          <div className="info-card">
            <span className="info-label">Journal Entries</span>
            <div className="info-value">{stats.totalEntries}</div>
            <div className="info-subtext">{stats.avgWordsPerEntry} avg words</div>
          </div>
        </aside>
      </main>
    </>
  );
}

export default JournalEntries;
