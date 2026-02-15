import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  Target,
  X,
  PlusCircle,
  FileText,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
  BarChart3,
  Clock3,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrency } from './contexts/CurrencyContext';

function JournalEntries({ journalEntries, onViewEntry, trades = [], onAddJournal, onDeleteEntry, availableTags = [] }) {
  const { symbol } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilterLabel, setQuickFilterLabel] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const availableTagMap = useMemo(() => {
    const map = new Map();
    availableTags.forEach((tag) => {
      if (typeof tag?.name === 'string') {
        const key = tag.name.trim().toLowerCase();
        if (key) {
          map.set(key, tag);
        }
      }
    });
    return map;
  }, [availableTags]);

  const today = new Date();
  const currentYear = format(today, 'yyyy');
  const currentMonthKey = format(today, 'yyyy-MM');

  // Helper function to get trades for a specific date
  const getTradesForDate = (dateString) => {
    const entryDate = new Date(dateString);
    entryDate.setHours(0, 0, 0, 0);

    return trades.filter((trade) => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === entryDate.getTime();
    });
  };

  // Helper function to calculate P&L
  const getTradeNet = (trade) => {
    const amount = parseFloat(trade.amount) || 0;
    const fees = parseFloat(trade.fees) || 0;
    return amount - fees;
  };

  const calculatePnL = (tradesArray) => {
    return tradesArray.reduce((sum, trade) => sum + getTradeNet(trade), 0);
  };

  // Convert journalEntries object to array with trade data
  const entriesArray = useMemo(() => {
    return Object.entries(journalEntries)
      .filter(([, entry]) => entry?.content && entry.content.trim() !== '')
      .map(([date, entry]) => {
        const dayTrades = getTradesForDate(date);
        const dayPnL = calculatePnL(dayTrades);
        const content = entry?.content || '';
        const textContent = content.replace(/<[^>]*>/g, '').trim();

        return {
          date,
          content,
          textContent,
          wordCount: textContent ? textContent.split(/\s+/).length : 0,
          trades: dayTrades,
          pnl: dayPnL,
          tradeCount: dayTrades.length
        };
      });
  }, [journalEntries, trades]);

  // Filter entries based on search query and date filter
  const filteredEntries = useMemo(() => {
    let filtered = entriesArray;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const dateStr = format(parseISO(entry.date), 'MMM d, yyyy').toLowerCase();
        const content = entry.textContent.toLowerCase();
        const tickers = entry.trades.map((t) => t.symbol?.toLowerCase() || '').join(' ');
        const categories = entry.trades.map((t) => t.category?.toLowerCase() || '').join(' ');
        const tags = entry.trades
          .flatMap((t) => (Array.isArray(t.tags) ? t.tags : []))
          .map((tag) => (typeof tag === 'string' ? tag : tag?.name || ''))
          .filter((tagName) => {
            const key = tagName.trim().toLowerCase();
            return key && availableTagMap.has(key);
          })
          .join(' ')
          .toLowerCase();

        return dateStr.includes(query)
          || content.includes(query)
          || tickers.includes(query)
          || categories.includes(query)
          || tags.includes(query);
      });
    }

    if (dateFilter) {
      filtered = filtered.filter((entry) => entry.date === dateFilter);
    }

    return filtered;
  }, [entriesArray, searchQuery, dateFilter, availableTagMap]);

  // Sort entries by date (most recent first)
  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries];
    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted;
  }, [filteredEntries]);

  // Group entries by year -> month
  const groupedEntries = useMemo(() => {
    const groups = {};

    sortedEntries.forEach((entry) => {
      const parsedDate = parseISO(entry.date);
      const year = format(parsedDate, 'yyyy');
      const monthKey = format(parsedDate, 'yyyy-MM');
      const monthLabel = format(parsedDate, 'MMMM');

      if (!groups[year]) {
        groups[year] = {
          year,
          entriesCount: 0,
          pnl: 0,
          months: {}
        };
      }

      if (!groups[year].months[monthKey]) {
        groups[year].months[monthKey] = {
          key: monthKey,
          label: monthLabel,
          entriesCount: 0,
          pnl: 0,
          entries: []
        };
      }

      groups[year].entriesCount += 1;
      groups[year].pnl += entry.pnl;
      groups[year].months[monthKey].entriesCount += 1;
      groups[year].months[monthKey].pnl += entry.pnl;
      groups[year].months[monthKey].entries.push(entry);
    });

    return Object.values(groups)
      .sort((a, b) => Number(b.year) - Number(a.year))
      .map((yearGroup) => ({
        ...yearGroup,
        months: Object.values(yearGroup.months).sort((a, b) => b.key.localeCompare(a.key))
      }));
  }, [sortedEntries]);

  const hasActiveFilters = searchQuery.trim().length > 0 || Boolean(dateFilter);

  const toggleYear = (year, defaultExpanded) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !(prev[year] ?? defaultExpanded)
    }));
  };

  const toggleMonth = (monthKey, defaultExpanded) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !(prev[monthKey] ?? defaultExpanded)
    }));
  };

  const applyCoachFilter = (query, label) => {
    if (!query) return;
    setSearchQuery(query);
    setDateFilter('');
    setQuickFilterLabel(label || query);
  };

  const clearCoachFilter = () => {
    setQuickFilterLabel('');
    setSearchQuery('');
  };

  const getPreviewText = (text, maxLength = 110) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const formatCompactValue = (absoluteValue) => {
    if (absoluteValue < 1000) return absoluteValue.toFixed(2);
    const tiers = [
      { threshold: 1e12, suffix: 'T' },
      { threshold: 1e9, suffix: 'B' },
      { threshold: 1e6, suffix: 'M' },
      { threshold: 1e3, suffix: 'k' },
    ];
    for (const { threshold, suffix } of tiers) {
      if (absoluteValue >= threshold) {
        const scaled = absoluteValue / threshold;
        const formatted = scaled >= 100 ? scaled.toFixed(0)
          : scaled >= 10 ? scaled.toFixed(1).replace(/\.0$/, '')
          : scaled.toFixed(2).replace(/\.?0+$/, '');
        return `${formatted}${suffix}`;
      }
    }
    return absoluteValue.toFixed(2);
  };

  const formatPnL = (value) => {
    const prefix = Math.abs(value) < 0.01 ? '' : value >= 0 ? '+' : '-';
    return `${prefix}${symbol}${formatCompactValue(Math.abs(value))}`;
  };

  const getPnLClass = (value) => {
    if (Math.abs(value) < 0.01) return 'neutral';
    return value >= 0 ? 'profit' : 'loss';
  };

  const renderHeaderPnL = (value) => {
    const pnlClass = getPnLClass(value);
    const PnLIcon = pnlClass === 'profit' ? TrendingUp : pnlClass === 'loss' ? TrendingDown : Minus;

    return (
      <span className={`journal-group-pnl ${pnlClass}`}>
        <PnLIcon size={12} strokeWidth={2.25} />
        <span>{formatPnL(value)}</span>
      </span>
    );
  };

  const coachInsights = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 29);

    const toDateKey = (value) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return '';
      parsed.setHours(0, 0, 0, 0);
      return format(parsed, 'yyyy-MM-dd');
    };

    const tradingDayKeys = new Set(
      trades
        .map((trade) => toDateKey(trade.date))
        .filter(Boolean)
    );

    const journaledTradingDays = entriesArray.filter((entry) => tradingDayKeys.has(entry.date)).length;
    const disciplineScore = tradingDayKeys.size > 0
      ? Math.round((journaledTradingDays / tradingDayKeys.size) * 100)
      : 0;

    const mostRecentEntryDate = entriesArray
      .map((entry) => entry.date)
      .sort((a, b) => new Date(b) - new Date(a))[0] || null;

    const daysSinceLastEntry = mostRecentEntryDate
      ? Math.max(0, Math.floor((now.getTime() - new Date(mostRecentEntryDate).getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const recentTrades = trades.filter((trade) => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate >= cutoff;
    });

    const categoryStats = new Map();
    const tagStats = new Map();

    recentTrades.forEach((trade) => {
      const net = getTradeNet(trade);
      const categoryName = (trade.category || 'Uncategorized').trim() || 'Uncategorized';
      const categoryAgg = categoryStats.get(categoryName) || { name: categoryName, pnl: 0, count: 0 };
      categoryAgg.pnl += net;
      categoryAgg.count += 1;
      categoryStats.set(categoryName, categoryAgg);

      const tagNames = Array.isArray(trade.tags)
        ? trade.tags
          .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
          .filter(Boolean)
          .filter((tagName) => {
            const key = tagName.trim().toLowerCase();
            return key && availableTagMap.has(key);
          })
        : [];

      tagNames.forEach((tagName) => {
        const cleanName = tagName.trim();
        if (!cleanName) return;
        const tagAgg = tagStats.get(cleanName) || { name: cleanName, pnl: 0, count: 0 };
        tagAgg.pnl += net;
        tagAgg.count += 1;
        tagStats.set(cleanName, tagAgg);
      });
    });

    const categories = [...categoryStats.values()];
    const qualifiedCategories = categories.filter((item) => item.count >= 2);
    const bestCategory = [...(qualifiedCategories.length > 0 ? qualifiedCategories : categories)]
      .sort((a, b) => b.pnl - a.pnl)[0] || null;
    const worstCategory = [...qualifiedCategories]
      .sort((a, b) => a.pnl - b.pnl)
      .find((item) => item.pnl < 0) || null;

    const tags = [...tagStats.values()];
    const qualifiedTags = tags.filter((item) => item.count >= 2);
    const worstTag = [...qualifiedTags]
      .sort((a, b) => a.pnl - b.pnl)
      .find((item) => item.pnl < 0) || null;

    const lossQueue = [...entriesArray]
      .filter((entry) => entry.tradeCount > 0 && entry.pnl < 0)
      .sort((a, b) => a.pnl - b.pnl)
      .slice(0, 4);

    const fallbackQueue = [...entriesArray]
      .filter((entry) => entry.tradeCount > 0)
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 4);

    return {
      disciplineScore,
      journaledTradingDays,
      tradingDaysCount: tradingDayKeys.size,
      daysSinceLastEntry,
      bestCategory: bestCategory && bestCategory.pnl > 0 ? bestCategory : null,
      leakTag: worstTag,
      leakCategory: worstCategory,
      reviewQueue: lossQueue.length > 0 ? lossQueue : fallbackQueue,
      reviewQueueIsLossBased: lossQueue.length > 0
    };
  }, [entriesArray, trades, availableTagMap]);

  return (
    <>
      <main className="dashboard-grid journal-view-grid">
        <div className="main-content">
          <div className="journal-entries-header">
            <div className="journal-entries-header-left">
              <div className="journal-entries-icon">
                <FileText size={26} strokeWidth={2.5} color="white" />
              </div>
              <div>
                <h2 className="journal-entries-title">Journal</h2>
                <p className="journal-entries-subtitle">
                  {entriesArray.length} {entriesArray.length === 1 ? 'entry' : 'entries'} total • review, refine, and execute better
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setQuickFilterLabel('');
                  }}
                />
              </div>
              <div className={`journal-date-filter${dateFilter ? ' has-value' : ''}`}>
                <CalendarIcon size={15} className="journal-date-icon" />
                <span className="journal-date-label">
                  {dateFilter ? format(parseISO(dateFilter), 'MMM d, yyyy') : 'Filter date'}
                </span>
                <input
                  type="date"
                  className="journal-date-input-native"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="journal-date-clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button onClick={onAddJournal} className="journal-add-button">
                <PlusCircle size={16} />
                Add Journal
              </button>
            </div>
          </div>

          {quickFilterLabel && (
            <div className="journal-active-filter">
              <span className="journal-active-filter-label">Coach filter:</span>
              <button type="button" className="journal-active-filter-chip" onClick={clearCoachFilter}>
                {quickFilterLabel}
                <X size={12} />
              </button>
            </div>
          )}

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
              <div className="journal-groups">
                {groupedEntries.map((yearGroup) => {
                  const isYearDefaultExpanded = yearGroup.year === currentYear;
                  const yearFallbackExpanded = hasActiveFilters ? true : isYearDefaultExpanded;
                  const isYearExpanded = expandedYears[yearGroup.year] ?? yearFallbackExpanded;

                  return (
                    <section key={yearGroup.year} className="journal-year-group">
                      <button
                        type="button"
                        className="journal-year-toggle"
                        onClick={() => toggleYear(yearGroup.year, yearFallbackExpanded)}
                      >
                        <div className="journal-year-meta">
                          <span className="journal-year-title">{yearGroup.year}</span>
                          <span className="journal-year-count">{yearGroup.entriesCount} entries</span>
                        </div>
                        <div className="journal-year-meta-right">
                          {renderHeaderPnL(yearGroup.pnl)}
                          <ChevronDown size={16} className={`journal-collapse-icon ${isYearExpanded ? 'expanded' : ''}`} />
                        </div>
                      </button>

                      {isYearExpanded && (
                        <div className="journal-month-groups">
                          {yearGroup.months.map((monthGroup) => {
                            const isMonthDefaultExpanded = monthGroup.key === currentMonthKey;
                            const monthFallbackExpanded = hasActiveFilters ? true : isMonthDefaultExpanded;
                            const isMonthExpanded = expandedMonths[monthGroup.key] ?? monthFallbackExpanded;

                            return (
                              <div key={monthGroup.key} className="journal-month-group">
                                <button
                                  type="button"
                                  className="journal-month-toggle"
                                  onClick={() => toggleMonth(monthGroup.key, monthFallbackExpanded)}
                                >
                                  <div className="journal-month-meta">
                                    <span className="journal-month-title">{monthGroup.label}</span>
                                    <span className="journal-month-count">{monthGroup.entriesCount} entries</span>
                                  </div>
                                  <div className="journal-month-meta-right">
                                    {renderHeaderPnL(monthGroup.pnl)}
                                    <ChevronDown size={14} className={`journal-collapse-icon ${isMonthExpanded ? 'expanded' : ''}`} />
                                  </div>
                                </button>

                                {isMonthExpanded && (
                                  <div className="journal-entry-rows">
                                    {monthGroup.entries.map((entry) => {
                                      const hasTrades = entry.tradeCount > 0;
                                      const hasImages = entry.content.includes('<img');
                                      const entryTagNames = hasTrades
                                        ? [...new Set(entry.trades.flatMap((trade) => (
                                          Array.isArray(trade.tags)
                                            ? trade.tags
                                              .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
                                              .filter(Boolean)
                                            : []
                                        )))]
                                        : [];
                                      const matchedEntryTags = entryTagNames
                                        .map((tagName) => {
                                          const key = typeof tagName === 'string' ? tagName.trim().toLowerCase() : '';
                                          return key ? availableTagMap.get(key) : null;
                                        })
                                        .filter(Boolean);
                                      const entryTagDetails = matchedEntryTags.slice(0, 6);
                                      const hiddenTagCount = Math.max(0, matchedEntryTags.length - entryTagDetails.length);

                                      return (
                                        <div
                                          key={entry.date}
                                          className="journal-entry-row"
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => onViewEntry(entry.date)}
                                          onKeyDown={(e) => {
                                            if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                                              e.preventDefault();
                                              onViewEntry(entry.date);
                                            }
                                          }}
                                        >
                                          <div className="journal-entry-row-main">
                                            <div className="journal-entry-row-header">
                                              <div className="journal-entry-row-date">
                                                <CalendarIcon size={14} />
                                                <span className="journal-entry-row-day">{format(parseISO(entry.date), 'EEE, MMM d')}</span>
                                              </div>
                                              {hasTrades && (
                                                <span className={`journal-entry-inline-pnl ${getPnLClass(entry.pnl)}`}>
                                                  {formatPnL(entry.pnl)}
                                                </span>
                                              )}
                                              {hasImages && (
                                                <span className="journal-entry-row-image" title="Contains image">
                                                  <ImageIcon size={13} />
                                                </span>
                                              )}
                                            </div>

                                            <div className="journal-entry-row-preview">
                                              {getPreviewText(entry.textContent) || 'No text preview'}
                                            </div>

                                            {entryTagDetails.length > 0 && (
                                              <div className="journal-entry-tags-row">
                                                {entryTagDetails.map((tag) => (
                                                  <span
                                                    key={`${entry.date}-${tag.name}`}
                                                    className="tag-chip journal-entry-inline-tag tag-tooltip-anchor"
                                                    style={{
                                                      backgroundColor: `${tag.color}1A`,
                                                      borderColor: `${tag.color}45`,
                                                      color: tag.color
                                                    }}
                                                  >
                                                    {tag.name}
                                                    <span className="tag-hover-tooltip">
                                                      <span className="tag-hover-title">{tag.name}</span>
                                                      {tag.description && <span className="tag-hover-desc">{tag.description}</span>}
                                                    </span>
                                                  </span>
                                                ))}
                                                {hiddenTagCount > 0 && (
                                                  <span className="tag-chip tag-chip-more journal-entry-inline-tag-more">+{hiddenTagCount}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          <div className="journal-entry-row-right">
                                            {hasTrades && (
                                              <span className="journal-entry-trade-count">
                                                {entry.tradeCount} {entry.tradeCount === 1 ? 'trade' : 'trades'}
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              className="journal-entry-delete"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteEntry(entry.date);
                                              }}
                                              title="Delete journal entry"
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="sidebar-section journal-coach-rail">
          <h2 className="sidebar-title">Profitability Coach</h2>

          <div className="info-card journal-coach-card">
            <div className="journal-coach-head">
              <BarChart3 size={14} />
              Edge Signal (30D)
            </div>
            <div className="journal-coach-main">
              {coachInsights.bestCategory ? coachInsights.bestCategory.name : 'Not enough edge data'}
            </div>
            <div className="journal-coach-sub">
              {coachInsights.bestCategory
                ? `${formatPnL(coachInsights.bestCategory.pnl)} across ${coachInsights.bestCategory.count} trades`
                : 'Need at least a few tagged/market trades to identify your edge.'}
            </div>
            {coachInsights.bestCategory && (
              <button
                type="button"
                className="journal-coach-action"
                onClick={() => applyCoachFilter(coachInsights.bestCategory.name, `Market: ${coachInsights.bestCategory.name}`)}
              >
                Filter to {coachInsights.bestCategory.name}
              </button>
            )}
          </div>

          <div className="info-card journal-coach-card danger">
            <div className="journal-coach-head">
              <AlertTriangle size={14} />
              Biggest Money Leak (30D)
            </div>
            <div className="journal-coach-main">
              {coachInsights.leakTag
                ? `You lose most on "${coachInsights.leakTag.name}" tagged trades`
                : coachInsights.leakCategory
                  ? `You lose most in ${coachInsights.leakCategory.name}`
                  : 'No repeated losing pattern found'}
            </div>
            <div className="journal-coach-sub">
              {coachInsights.leakTag
                ? `Net ${formatPnL(coachInsights.leakTag.pnl)} across ${coachInsights.leakTag.count} trades.`
                : coachInsights.leakCategory
                  ? `Net ${formatPnL(coachInsights.leakCategory.pnl)} across ${coachInsights.leakCategory.count} trades.`
                  : 'A leak only appears when a tag or market repeats with at least 2 trades and negative net P/L.'}
            </div>
            {(coachInsights.leakTag || coachInsights.leakCategory) && (
              <button
                type="button"
                className="journal-coach-action"
                onClick={() => {
                  if (coachInsights.leakTag) {
                    applyCoachFilter(coachInsights.leakTag.name, `Leak tag: ${coachInsights.leakTag.name}`);
                    return;
                  }
                  if (coachInsights.leakCategory) {
                    applyCoachFilter(coachInsights.leakCategory.name, `Leak market: ${coachInsights.leakCategory.name}`);
                  }
                }}
              >
                Review this leak
              </button>
            )}
          </div>

          <div className="info-card journal-coach-card">
            <div className="journal-coach-head">
              <Clock3 size={14} />
              Discipline
            </div>
            <div className="journal-coach-metric">{coachInsights.disciplineScore}%</div>
            <div className="journal-coach-sub">
              Journaled {coachInsights.journaledTradingDays}/{coachInsights.tradingDaysCount || 0} trading days
            </div>
            <div className="journal-coach-sub">
              {coachInsights.daysSinceLastEntry === null
                ? 'No journal entries yet.'
                : coachInsights.daysSinceLastEntry === 0
                  ? 'Updated today.'
                  : `${coachInsights.daysSinceLastEntry} day${coachInsights.daysSinceLastEntry > 1 ? 's' : ''} since last journal entry.`}
            </div>
          </div>

          <div className="info-card journal-coach-card queue">
            <div className="journal-coach-head">
              <Target size={14} />
              Review Queue
            </div>
            <div className="journal-coach-sub">
              {coachInsights.reviewQueueIsLossBased
                ? 'Most damaging days first. Review these before your next session.'
                : 'No red journal days found. Reviewing highest-activity entries instead.'}
            </div>
            <div className="journal-review-list">
              {coachInsights.reviewQueue.length > 0 ? coachInsights.reviewQueue.map((entry) => (
                <button
                  key={entry.date}
                  type="button"
                  className="journal-review-item"
                  onClick={() => onViewEntry(entry.date)}
                >
                  <span className="journal-review-item-date">{format(parseISO(entry.date), 'EEE, MMM d')}</span>
                  <span className={`journal-review-item-pnl ${getPnLClass(entry.pnl)}`}>
                    {formatPnL(entry.pnl)}
                  </span>
                </button>
              )) : (
                <div className="journal-coach-sub">No entries with linked trades yet.</div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}

export default JournalEntries;
