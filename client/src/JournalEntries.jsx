import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  BookOpen,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

function JournalEntries({ journalEntries, onViewEntry, trades = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
      if (trade.type === 'profit') {
        return sum + amount - fees;
      } else if (trade.type === 'loss') {
        return sum - amount - fees;
      }
      return sum - fees;
    }, 0);
  };

  // Convert journalEntries object to array with trade data
  const entriesArray = useMemo(() => {
    return Object.entries(journalEntries)
      .filter(([date, content]) => content && content.trim() !== '')
      .map(([date, content]) => {
        const dayTrades = getTradesForDate(date);
        const dayPnL = calculatePnL(dayTrades);

        return {
          date,
          content,
          textContent: content.replace(/<[^>]*>/g, '').trim(),
          wordCount: content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
          trades: dayTrades,
          pnl: dayPnL,
          tradeCount: dayTrades.length
        };
      });
  }, [journalEntries, trades]);

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entriesArray;

    const query = searchQuery.toLowerCase();
    return entriesArray.filter(entry => {
      const dateStr = format(parseISO(entry.date), 'MMM d, yyyy').toLowerCase();
      const content = entry.textContent.toLowerCase();
      return dateStr.includes(query) || content.includes(query);
    });
  }, [entriesArray, searchQuery]);

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

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getPreviewText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTrades = entriesArray.reduce((sum, entry) => sum + entry.tradeCount, 0);
    const totalPnL = entriesArray.reduce((sum, entry) => sum + entry.pnl, 0);
    const avgWordsPerEntry = entriesArray.length > 0
      ? Math.round(entriesArray.reduce((sum, entry) => sum + entry.wordCount, 0) / entriesArray.length)
      : 0;

    const profitableDays = entriesArray.filter(entry => entry.pnl > 0).length;
    const winRate = entriesArray.length > 0 ? ((profitableDays / entriesArray.length) * 100).toFixed(1) : '0.0';

    return {
      totalEntries: entriesArray.length,
      totalTrades,
      totalPnL,
      avgWordsPerEntry,
      profitableDays,
      winRate
    };
  }, [entriesArray]);

  return (
    <>
      <div className="nav-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="journal-entries-icon" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Journal Entries</h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {entriesArray.length} {entriesArray.length === 1 ? 'entry' : 'entries'} total
              </p>
            </div>
          </div>
          <div className="journal-entries-search">
            <Search size={16} className="journal-search-icon" />
            <input
              type="text"
              className="journal-search-input"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="dashboard-grid">
        <div className="main-content">
          <div className="journal-entries-main-card">
            {sortedEntries.length === 0 ? (
              <div className="journal-empty-state">
                <div className="journal-empty-icon">
                  <BookOpen size={40} />
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
                          </div>
                          <div className="journal-entry-badges">
                            <span className="journal-entry-word-badge">{entry.wordCount}w</span>
                            {hasTrades && (
                              <span className={`journal-entry-pnl-badge ${isProfitable ? 'profit' : 'loss'}`}>
                                {isProfitable ? '+' : ''}{entry.pnl >= 0 ? '$' : '-$'}{Math.abs(entry.pnl).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="journal-entry-preview-new">
                          {getPreviewText(entry.textContent)}
                        </div>

                        {hasTrades && (
                          <div className="journal-entry-trades-summary">
                            <Target size={14} />
                            <span>{entry.tradeCount} {entry.tradeCount === 1 ? 'trade' : 'trades'}</span>
                            {entry.trades.some(t => t.tags && t.tags.length > 0) && (
                              <span className="journal-entry-has-tags">📌</span>
                            )}
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
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
            </div>
            <div className="info-subtext">Across all entries</div>
          </div>

          <div className="info-card">
            <span className="info-label">Win Rate</span>
            <div className="info-value">{stats.winRate}%</div>
            <div className="info-subtext">{stats.profitableDays} profitable days</div>
          </div>

          <div className="info-card">
            <span className="info-label">Total Trades</span>
            <div className="info-value">{stats.totalTrades}</div>
            <div className="info-subtext">{stats.totalEntries} journal entries</div>
          </div>

          <div className="info-card">
            <span className="info-label">Avg Words</span>
            <div className="info-value">{stats.avgWordsPerEntry}</div>
            <div className="info-subtext">Per entry</div>
          </div>
        </aside>
      </main>
    </>
  );
}

export default JournalEntries;
