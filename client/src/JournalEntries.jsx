import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

function JournalEntries({ journalEntries, onViewEntry }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Convert journalEntries object to array
  const entriesArray = useMemo(() => {
    return Object.entries(journalEntries)
      .filter(([date, content]) => content && content.trim() !== '')
      .map(([date, content]) => ({
        date,
        content,
        // Strip HTML for preview text
        textContent: content.replace(/<[^>]*>/g, '').trim(),
        wordCount: content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length
      }));
  }, [journalEntries]);

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

  // Sort entries
  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'wordCount':
          aValue = a.wordCount;
          bValue = b.wordCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredEntries, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getPreviewText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <main className="journal-entries-container">
      <div className="journal-entries-header">
        <div className="journal-entries-title">
          <div className="journal-entries-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <h2>Journal Entries</h2>
            <p className="journal-entries-subtitle">
              {entriesArray.length} {entriesArray.length === 1 ? 'entry' : 'entries'} total
            </p>
          </div>
        </div>
        <div className="journal-entries-search">
          <Search size={18} className="journal-search-icon" />
          <input
            type="text"
            className="journal-search-input"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="journal-entries-card">
        {sortedEntries.length === 0 ? (
          <div className="journal-empty-state">
            <div className="journal-empty-icon">
              <BookOpen size={48} />
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
          <div className="journal-entries-list">
            {sortedEntries.map((entry, index) => (
              <div
                key={entry.date}
                className="journal-entry-item"
                onClick={() => onViewEntry(entry.date)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="journal-entry-header">
                  <div className="journal-entry-date">
                    <CalendarIcon size={18} />
                    <span>{format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="journal-entry-meta">
                    <span className="journal-word-count">{entry.wordCount} words</span>
                  </div>
                </div>
                <div className="journal-entry-preview">
                  {getPreviewText(entry.textContent, 200)}
                </div>
                <button
                  className="journal-entry-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEntry(entry.date);
                  }}
                >
                  <Eye size={16} />
                  <span>View Entry</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sortedEntries.length > 0 && (
        <div className="journal-entries-footer">
          Showing {sortedEntries.length} of {entriesArray.length} entries
        </div>
      )}
    </main>
  );
}

export default JournalEntries;
