import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Heart,
  Moon,
  User,
  PlusCircle,
  MessageCircle,
  Minus,
  X,
  ListFilter,
  LogOut,
  CalendarOff,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Edit as EditIcon,
  FileText
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  getDay,
  isToday,
  getDaysInMonth
} from 'date-fns';
import './App.css';
import Analyze from './Analyze';
import Profile from './Profile';
import JournalEntries from './JournalEntries';
import { useAuth } from './contexts/AuthContext';
import { tradesAPI } from './api/trades';
import { journalAPI } from './api/journal';
import { tagsAPI } from './api/tags';

function App() {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalTab, setModalTab] = useState('add');
  const [tradeType, setTradeType] = useState('profit');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isSevenDayWeek, setIsSevenDayWeek] = useState(() => {
    const saved = localStorage.getItem('isSevenDayWeek');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar', 'analyze', 'profile', or 'journalEntries'
  const [trades, setTrades] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [journalEntries, setJournalEntries] = useState({}); // Store journal entries by date
  const [viewingJournal, setViewingJournal] = useState(false); // Track if viewing journal
  const [readerModalOpen, setReaderModalOpen] = useState(false); // Track reader modal state
  const [journalOnlyMode, setJournalOnlyMode] = useState(false); // Track if modal is in journal-only mode
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, message: '', title: 'Notice' });
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', title: 'Confirm', onConfirm: null });
  const [formData, setFormData] = useState({
    symbol: '',
    amount: '',
    category: '',
    fees: '',
    tags: []
  });
  const [tradesExpanded, setTradesExpanded] = useState(false);

  // Tags management
  const [availableTags, setAvailableTags] = useState([]);

  // Load trades, journal entries, and tags on mount
  useEffect(() => {
    loadTrades();
    loadJournalEntries();
    loadTags();
  }, []);

  // Save 7/5 day preference to localStorage
  useEffect(() => {
    localStorage.setItem('isSevenDayWeek', JSON.stringify(isSevenDayWeek));
  }, [isSevenDayWeek]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const { data } = await tradesAPI.getAll();
      // Convert date strings back to Date objects
      const tradesWithDates = data.trades.map(trade => ({
        ...trade,
        date: new Date(trade.date)
      }));
      setTrades(tradesWithDates);
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalEntries = async () => {
    try {
      const { data } = await journalAPI.getAll();
      setJournalEntries(data.entries);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    }
  };

  const loadTags = async () => {
    try {
      const { data } = await tagsAPI.getAll();
      setAvailableTags(data.tags.map(tag => ({ name: tag.name, color: tag.color, id: tag.id })));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const editorInitialized = useRef(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    insertUnorderedList: false,
    insertOrderedList: false
  });

  const categories = ['Stocks', 'Options', 'Indices'];

  // Helper function to calculate P&L from trades
  const calculatePnL = (tradesArray) => {
    return tradesArray.reduce((sum, trade) => {
      const amount = parseFloat(trade.amount) || 0;
      const fees = parseFloat(trade.fees) || 0;
      if (trade.type === 'profit') {
        return sum + amount - fees;
      } else if (trade.type === 'loss') {
        return sum - amount - fees;
      }
      return sum - fees; // break-even still has fees
    }, 0);
  };

  // Get trades for a specific date range
  const getTradesInRange = (startDate, endDate) => {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return tradeDate >= start && tradeDate <= end;
    });
  };

  // Get trades for a specific date
  const getTradesForDate = (date) => {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      const compareDate = new Date(date);
      return isSameDay(tradeDate, compareDate);
    });
  };

  const nextPeriod = () => {
    if (activeTab === 'Week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (activeTab === 'Year') {
      setCurrentDate(addYears(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const prevPeriod = () => {
    if (activeTab === 'Week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (activeTab === 'Year') {
      setCurrentDate(subYears(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const openModal = (date, forceViewMode = false) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(date);
    selectedDateNormalized.setHours(0, 0, 0, 0);

    // Prevent opening modal for future dates
    if (selectedDateNormalized > today) {
      return;
    }

    if (activeTab === 'Week' || isSameMonth(date, startOfMonth(currentDate))) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingJournal = journalEntries[dateKey] || '';

      setSelectedDate(date);
      setJournalContent(existingJournal);

      // Reset journal-only mode when opening from calendar
      setJournalOnlyMode(false);

      // Reset trades expanded state
      setTradesExpanded(false);

      // Reset form data when opening from calendar (for new entries)
      setFormData({
        symbol: '',
        amount: '',
        category: '',
        fees: '',
        tags: []
      });
      setTradeType('profit');

      // If forceViewMode is true and there's a journal entry, open in view mode
      if (forceViewMode && existingJournal) {
        setViewingJournal(true);
        setModalTab('journal');
      } else {
        // Open in edit mode on 'add' tab for new entries
        setViewingJournal(false);
        setModalTab('add');
      }
    }
  };

  const handleViewJournalEntry = (dateString) => {
    const date = new Date(dateString);
    const dateKey = format(date, 'yyyy-MM-dd');
    const existingJournal = journalEntries[dateKey] || '';

    setSelectedDate(date);
    setJournalContent(existingJournal);
    setReaderModalOpen(true);
  };

  const handleAddJournal = () => {
    const today = new Date();
    const dateKey = format(today, 'yyyy-MM-dd');
    const existingJournal = journalEntries[dateKey] || '';

    setSelectedDate(today);
    setJournalContent(existingJournal);
    setModalTab('journal');
    setJournalOnlyMode(false);
    setViewingJournal(false);
    setTradesExpanded(false);

    // Reset form data
    setFormData({
      symbol: '',
      amount: '',
      category: '',
      fees: '',
      tags: []
    });
    setTradeType('profit');
  };

  const handleCloseReader = () => {
    setReaderModalOpen(false);
    setSelectedDate(null);
  };

  const handleEditJournalFromReader = () => {
    setReaderModalOpen(false);
    setViewingJournal(false);
    setModalTab('journal');

    // Load trade data if there are trades for this date
    if (selectedDate) {
      const dayTrades = getTradesForDate(selectedDate);
      if (dayTrades.length > 0) {
        // Populate form with the first trade's data
        const trade = dayTrades[0];
        setTradeType(trade.type);

        // Extract tag names, handling both string and object formats
        const tagNames = trade.tags
          ? trade.tags.map(t => typeof t === 'string' ? t : (t.name || t))
          : [];

        setFormData({
          symbol: trade.symbol || '',
          amount: trade.amount || '',
          category: trade.category || '',
          fees: trade.fees || '',
          tags: tagNames
        });
      }
    }
  };

  const handleDeleteJournal = (dateString) => {
    setConfirmModal({
      open: true,
      title: 'Delete Journal Entry',
      message: 'Are you sure you want to delete this journal entry? This action cannot be undone.',
      onConfirm: async () => {
        const dateKey = typeof dateString === 'string' && dateString.includes('-')
          ? dateString
          : format(dateString, 'yyyy-MM-dd');

        try {
          await journalAPI.delete(dateKey);
          setJournalEntries(prev => {
            const newEntries = { ...prev };
            delete newEntries[dateKey];
            return newEntries;
          });
          setReaderModalOpen(false);
          if (selectedDate) {
            setSelectedDate(null);
          }
          setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
        } catch (error) {
          console.error('Failed to delete journal entry:', error);
          setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
          setAlertModal({
            open: true,
            message: 'Failed to delete journal entry. Please try again.',
            title: 'Error'
          });
        }
      }
    });
  };

  const handleDeleteTrade = (tradeId) => {
    setConfirmModal({
      open: true,
      title: 'Delete Trade',
      message: 'Are you sure you want to delete this trade? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await tradesAPI.delete(tradeId);
          setTrades(prev => prev.filter(t => t.id !== tradeId));
          setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
        } catch (error) {
          console.error('Failed to delete trade:', error);
          setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
          setAlertModal({
            open: true,
            message: 'Failed to delete trade. Please try again.',
            title: 'Error'
          });
        }
      }
    });
  };

  const closeModal = async () => {
    // Save journal content before closing
    if (selectedDate && journalContent) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await journalAPI.saveEntry(dateKey, journalContent);
        setJournalEntries(prev => ({
          ...prev,
          [dateKey]: journalContent
        }));
      } catch (error) {
        console.error('Failed to save journal:', error);
        setAlertModal({ open: true, message: 'Failed to save journal entry. Please try again.', title: 'Error' });
      }
    }

    setSelectedDate(null);
    setModalTab('add');
    setTradeType('profit');
    setJournalContent('');
    setViewingJournal(false);
    setJournalOnlyMode(false);
    setTradesExpanded(false);
    setTagsOpen(false);
    setTagSearchQuery('');
    editorInitialized.current = false;
    setFormData({
      symbol: '',
      amount: '',
      category: '',
      fees: '',
      tags: []
    });
  };

  // WYSIWYG Editor functions
  const updateActiveFormats = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const parentElement = selection.anchorNode?.parentElement;
    const tagName = parentElement?.tagName?.toLowerCase();

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      h1: tagName === 'h1',
      h2: tagName === 'h2',
      h3: tagName === 'h3',
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList')
    });
  };

  const formatText = (command, value = null) => {
    if (!editorRef.current) return;

    // Ensure editor has focus
    editorRef.current.focus();

    // Execute the command
    document.execCommand(command, false, value);

    // For list commands, move cursor to the end of the line
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const listItem = range.startContainer.parentElement?.closest('li');

        if (listItem) {
          // Move cursor to the end of the list item
          range.selectNodeContents(listItem);
          range.collapse(false); // false = collapse to end
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }

    // Update active formats after formatting
    setTimeout(updateActiveFormats, 10);
  };

  const insertImage = (src) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);

      // Create wrapper div for the image
      const wrapper = document.createElement('div');
      wrapper.contentEditable = 'false';
      wrapper.style.display = 'inline-block';
      wrapper.style.position = 'relative';
      wrapper.style.margin = '0.5rem 0';
      wrapper.style.maxWidth = '100%';
      wrapper.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.src = src;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '0.5rem';
      img.style.display = 'block';

      wrapper.appendChild(img);

      // Insert the wrapper
      range.deleteContents();
      range.insertNode(wrapper);

      // Move cursor after the image
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);

      // Add a line break after the image
      const br = document.createElement('br');
      range.insertNode(br);

      editorRef.current.focus();

      // Update content state
      setJournalContent(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        insertImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            insertImage(event.target.result);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  };

  const handleEditorKeyDown = (e) => {
    // Handle Tab key for indentation (like Word)
    if (e.key === 'Tab') {
      e.preventDefault();

      if (e.shiftKey) {
        // Shift+Tab for outdent
        document.execCommand('outdent', false, null);
      } else {
        // Tab for indent
        document.execCommand('indent', false, null);
      }
    }
  };

  // Reset editor initialization flag when switching tabs
  useEffect(() => {
    if (modalTab !== 'journal') {
      editorInitialized.current = false;
    }
  }, [modalTab]);

  // Set editor content only when modal first opens
  useEffect(() => {
    if (editorRef.current && selectedDate && modalTab === 'journal' && !editorInitialized.current) {
      editorRef.current.innerHTML = journalContent;
      editorInitialized.current = true;
    }
  }, [selectedDate, journalContent, modalTab]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (selectedDate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Tag management functions
  const handleAddTag = (tagName) => {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      // Add to available tags if new
      if (!availableTags.find(t => t.name === trimmedTag)) {
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setAvailableTags(prev => [...prev, { name: trimmedTag, color: randomColor }]);
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getTagColor = (tagName) => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag ? tag.color : '#64748b';
  };

  const handleSaveEntry = async () => {

    // Validate category is selected if any trade fields are filled
    const hasTradeData = formData.symbol || formData.amount || formData.category;
    if (hasTradeData && !formData.category) {
      setAlertModal({ open: true, message: 'Please select a category before adding a trade.', title: 'Validation Error' });
      return;
    }

    try {
      let tradeCreated = false;
      let journalSaved = false;

      // Save trade if form is filled
      if (formData.symbol && formData.amount && formData.category) {
        const tradeData = {
          date: selectedDate.toISOString(),
          type: tradeType,
          symbol: formData.symbol,
          amount: formData.amount,
          category: formData.category,
          fees: formData.fees || '0',
          tags: formData.tags
        };

        const { data } = await tradesAPI.create(tradeData);
        const tradeWithDate = {
          ...data.trade,
          date: new Date(data.trade.date)
        };
        setTrades(prevTrades => [...prevTrades, tradeWithDate]);
        tradeCreated = true;
      }

      // Save journal if there's content
      if (journalContent && journalContent.trim() !== '') {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        await journalAPI.saveEntry(dateKey, journalContent);
        setJournalEntries(prev => ({
          ...prev,
          [dateKey]: journalContent
        }));
        journalSaved = true;
      }

      // Show appropriate success message
      if (tradeCreated && journalSaved) {
        // Both saved successfully
        closeModal();
      } else if (tradeCreated) {
        closeModal();
      } else if (journalSaved) {
        closeModal();
      } else {
        setAlertModal({
          open: true,
          message: 'Please add either a trade or journal entry.',
          title: 'No Data to Save'
        });
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      setAlertModal({
        open: true,
        message: error.response?.data?.message || 'An unexpected error occurred. Please try again.',
        title: 'Failed to Save'
      });
    }
  };

  const renderHeader = () => {
    return (
      <header className="header">
        <div
          className="logo-section"
          onClick={() => {
            setCurrentView('calendar');
            setActiveTab('Month');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon">
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>$</span>
          </div>
          <div className="logo-text">
            <h1>Journal & Calendar</h1>
            <p>Track your trading performance</p>
          </div>
        </div>
        <div className="nav-actions">
          <div className="profile-dropdown-container">
            <div
              className="user-profile"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <User size={20} />
              <span>{user?.name || 'Loading...'}</span>
            </div>
            {profileOpen && (
              <>
                <div
                  className="profile-dropdown-overlay"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">Account</div>
                  <div
                    className="profile-dropdown-item"
                    onClick={() => {
                      setCurrentView('profile');
                      setProfileOpen(false);
                    }}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </div>
                  <div className="profile-dropdown-separator" />
                  <div className="profile-dropdown-item profile-dropdown-item-danger" onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);

    // For 5-day week, start from Monday (weekStartsOn: 1)
    const weekStartsOn = isSevenDayWeek ? 0 : 1;
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    const endDate = endOfWeek(monthEnd, { weekStartsOn });

    const dateFormat = "EEE";
    const days = [];

    // Generate day headers based on week type
    const numDays = isSevenDayWeek ? 7 : 5;
    let startDay = startOfWeek(monthStart, { weekStartsOn });

    for (let i = 0; i < numDays; i++) {
      days.push(
        <div className="weekday" key={i}>
          {format(addDays(startDay, i), dateFormat).toUpperCase()}
        </div>
      );
    }

    const rows = [];
    let day = startDate;
    let formattedDate = "";

    let allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Filter out days not in current month and weekends if 5-day week is selected
    allDays = allDays.filter(day => {
      const inCurrentMonth = isSameMonth(day, monthStart);
      if (!inCurrentMonth) return false;

      if (!isSevenDayWeek) {
        const dayOfWeek = getDay(day);
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
      }

      return true;
    });

    return (
      <div key="month-view" className="month-view-container animate-fade-in">
        <div className="month-view-header-wrapper">
          <div className="month-view-header" style={{ margin: '0 auto' }}>
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={prevPeriod}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="month-view-title">
              <span className="month-view-date">
                {format(currentDate, 'MMMM yyyy')}
              </span>
            </div>
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={nextPeriod}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="calendar-grid"
          style={{ gridTemplateColumns: `repeat(${numDays}, 1fr)` }}
          key={`grid-${isSevenDayWeek ? '7day' : '5day'}-${format(currentDate, 'yyyy-MM')}`}
        >
          {days}
          {allDays.map((day, idx) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayNormalized = new Date(day);
            dayNormalized.setHours(0, 0, 0, 0);
            const isFuture = dayNormalized > today;
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasJournal = journalEntries[dateKey] && journalEntries[dateKey].trim() !== '';

            const dayTrades = getTradesForDate(day);
            const dayPnL = calculatePnL(dayTrades);
            const hasTrades = dayTrades.length > 0;

            return (
              <div
                className={`day-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${isFuture ? 'disabled' : ''}`}
                key={idx}
                onClick={() => openModal(day, hasJournal)}
                style={{ cursor: isFuture ? 'not-allowed' : 'pointer' }}
              >
                <span className="day-number">{format(day, 'd')}</span>
                {hasTrades && (
                  <span className={`day-pnl ${dayPnL >= 0 ? 'profit' : 'loss'}`}>
                    {dayPnL >= 0 ? '+' : ''}${Math.abs(dayPnL).toFixed(0)}
                  </span>
                )}
                {hasJournal && (
                  <span className="journal-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} strokeWidth={1.5} color="#e2e8f0" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekList = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    let weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Filter out weekends if 5-day week is selected
    if (!isSevenDayWeek) {
      weekDays = weekDays.filter(day => {
        const dayOfWeek = getDay(day);
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
      });
    }

    return (
      <div key="week-view" className="week-view-container animate-fade-in">
        <div className="week-view-header-wrapper">
          <div className="week-view-header" style={{ margin: '0 auto' }}>
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={prevPeriod}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="week-view-title">
              <span className="week-view-date-range">
                {format(weekStart, 'MMM d')} – {format(weekEnd, 'd, yyyy')}
              </span>
            </div>
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={nextPeriod}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="week-days-list" key={`week-${isSevenDayWeek ? '7day' : '5day'}-${format(weekStart, 'yyyy-MM-dd')}`}>
          {weekDays.map((day, idx) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayNormalized = new Date(day);
            dayNormalized.setHours(0, 0, 0, 0);
            const isFuture = dayNormalized > today;
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasJournal = journalEntries[dateKey] && journalEntries[dateKey].trim() !== '';

            const dayTrades = getTradesForDate(day);
            const dayPnL = calculatePnL(dayTrades);
            const hasTrades = dayTrades.length > 0;

            return (
              <div
                key={idx}
                className={`week-day-item ${isToday(day) ? 'week-day-today' : ''} ${isFuture ? 'disabled' : ''}`}
                style={{ animationDelay: `${idx * 50}ms`, cursor: isFuture ? 'not-allowed' : 'pointer', opacity: isFuture ? 0.5 : 1 }}
                onClick={() => openModal(day, hasJournal)}
              >
                <div className="week-day-left">
                  <div className={`week-day-number ${isToday(day) ? 'week-day-number-today' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="week-day-info">
                    <span className="week-day-name">{format(day, 'EEEE')}</span>
                    {hasJournal && (
                      <span className="journal-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={14} strokeWidth={1.5} color="#e2e8f0" />
                        Journal
                      </span>
                    )}
                  </div>
                </div>
                <div className="week-day-right">
                  {hasTrades ? (
                    <span className={dayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'} style={{ fontWeight: '600' }}>
                      {dayPnL >= 0 ? '+' : ''}${dayPnL.toFixed(2)}
                    </span>
                  ) : (
                    <span className="week-day-empty">—</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-500 ml-2" size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const currentYear = format(currentDate, 'yyyy');
    const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

    const renderMiniCalendar = (month) => {
      const monthStart = startOfMonth(month);
      const startDay = getDay(monthStart);
      const daysInMonth = getDaysInMonth(month);

      // Create array of 35 cells (5 weeks x 7 days)
      const cells = [];

      // Add empty cells before month starts
      for (let i = 0; i < startDay; i++) {
        cells.push(<div key={`empty-${i}`} className="year-mini-day empty" title="" />);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(format(month, 'yyyy'), format(month, 'M') - 1, day);
        const isTodayDate = isToday(date);
        const dateKey = format(date, 'yyyy-MM-dd');
        const hasJournal = journalEntries[dateKey] && journalEntries[dateKey].trim() !== '';

        const dayTrades = getTradesForDate(date);
        const dayPnL = calculatePnL(dayTrades);
        const hasTrades = dayTrades.length > 0;

        const title = hasTrades
          ? `${format(date, 'MMM d')}: ${dayPnL >= 0 ? '+' : ''}$${dayPnL.toFixed(2)}${hasJournal ? ' 📝' : ''}`
          : hasJournal
          ? `${format(date, 'MMM d')}: Has journal 📝`
          : `${format(date, 'MMM d')}: No trades`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateNormalized = new Date(date);
        dateNormalized.setHours(0, 0, 0, 0);
        const isFuture = dateNormalized > today;

        let dayClass = 'year-mini-day neutral';
        if (hasTrades) {
          dayClass = `year-mini-day ${dayPnL >= 0 ? 'profit' : 'loss'}`;
        }

        cells.push(
          <div
            key={day}
            className={`${dayClass} ${isTodayDate ? 'today' : ''} ${hasJournal ? 'has-journal' : ''}`}
            title={title}
            onClick={() => !isFuture && openModal(date, hasJournal)}
            style={{ cursor: isFuture ? 'not-allowed' : 'pointer', opacity: isFuture ? 0.5 : 1 }}
          />
        );
      }

      // Fill remaining cells to make 35
      const remaining = 35 - cells.length;
      for (let i = 0; i < remaining; i++) {
        cells.push(<div key={`empty-end-${i}`} className="year-mini-day empty" title="" />);
      }

      return <div className="year-mini-calendar-grid">{cells}</div>;
    };

    return (
      <div key="year-view" className="year-view-container animate-fade-in">
        <div className="year-view-header-wrapper">
          <div className="year-view-header">
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={prevPeriod}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="year-view-title">
              <span className="year-view-year">{currentYear}</span>
            </div>
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={nextPeriod}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="year-months-grid">
          {months.map((month, idx) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthTrades = getTradesInRange(monthStart, monthEnd);
            const monthTotal = calculatePnL(monthTrades);
            const hasMonthTrades = monthTrades.length > 0;

            return (
              <div
                key={idx}
                className="year-month-card"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="year-month-header">
                  <span className="year-month-name">{format(month, 'MMM')}</span>
                </div>
                <div className="year-mini-calendar">
                  {renderMiniCalendar(month)}
                </div>
                <div className={`year-month-total ${hasMonthTrades ? (monthTotal >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-slate-500'}`}>
                  <span>
                    {hasMonthTrades ? `${monthTotal >= 0 ? '+' : ''}$${monthTotal.toFixed(2)}` : '$0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAllTimeView = () => {
    return <Analyze trades={trades} />;
  };


  const renderModal = () => {
    if (!selectedDate || readerModalOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-modal" onClick={closeModal}>
            <X size={20} />
          </button>

          <div className="modal-header" style={{ textAlign: 'left' }}>
            <h2 className="modal-title" style={{ textAlign: 'left' }}>{format(selectedDate, 'MMMM d, yyyy')}</h2>
            <p className="modal-subtitle" style={{ textAlign: 'left' }}>Trade Management Ritual</p>
          </div>

          <div className="modal-body" style={{ padding: '1.5rem 1.75rem' }}>
            {!journalOnlyMode && (
              <div className="modal-tabs">
                <button
                  className={`modal-tab ${modalTab === 'add' ? 'active' : ''}`}
                  onClick={() => {
                    setModalTab('add');
                    setViewingJournal(false);
                  }}
                >
                  <PlusCircle size={14} />
                  New Entry
                </button>
                <button
                  className={`modal-tab ${modalTab === 'journal' ? 'active' : ''}`}
                  onClick={() => {
                    setModalTab('journal');
                    setViewingJournal(false);
                  }}
                >
                  <FileText size={14} />
                  Journal
                </button>
              </div>
            )}

            {viewingJournal ? (
              <div className="journal-view-container" style={{ padding: '1rem 0' }}>
                <div
                  className="journal-view-content"
                  dangerouslySetInnerHTML={{ __html: journalContent }}
                  style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}
                />
              </div>
            ) : modalTab === 'add' ? (
              <>
                {/* Show existing trades for this date */}
                {selectedDate && getTradesForDate(selectedDate).length > 0 && (() => {
                  const dayTrades = getTradesForDate(selectedDate);
                  const totalPnL = calculatePnL(dayTrades);

                  return (
                    <div style={{
                      marginBottom: '1.5rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)'
                    }}>
                      <button
                        onClick={() => setTradesExpanded(!tradesExpanded)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}>
                            Existing Trades ({dayTrades.length})
                          </span>
                          <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: totalPnL >= 0 ? '#10b981' : '#ef4444'
                          }}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          style={{
                            color: 'var(--text-secondary)',
                            transform: tradesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </button>

                      {tradesExpanded && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.375rem',
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)'
                        }}>
                          {dayTrades.map((trade) => {
                            const amount = parseFloat(trade.amount) || 0;
                            const fees = parseFloat(trade.fees) || 0;
                            const pnl = trade.type === 'profit' ? amount - fees : -(amount + fees);

                            return (
                              <div
                                key={trade.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.375rem 0.5rem',
                                  background: 'var(--bg-primary)',
                                  borderRadius: '0.25rem',
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                  <span style={{
                                    fontWeight: 600,
                                    fontSize: '0.8125rem',
                                    color: 'var(--text-primary)'
                                  }}>
                                    {trade.symbol}
                                  </span>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    textTransform: 'capitalize'
                                  }}>
                                    {trade.category}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.8125rem',
                                      fontWeight: 600,
                                      color: pnl >= 0 ? '#10b981' : '#ef4444'
                                    }}
                                  >
                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTrade(trade.id);
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
                                  title="Delete trade"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <form onSubmit={(e) => { e.preventDefault(); handleSaveEntry(); }}>
                <div className="form-field full-width">
                  <label className="form-label">Trade Result</label>
                  <div className="trade-type-grid">
                    <div
                      className={`trade-type-option profit ${tradeType === 'profit' ? 'selected' : ''}`}
                      onClick={() => setTradeType('profit')}
                    >
                      <div className="trade-type-icon">
                        <TrendingUp size={16} />
                      </div>
                      <span className="trade-type-label">Profit</span>
                    </div>
                    <div
                      className={`trade-type-option loss ${tradeType === 'loss' ? 'selected' : ''}`}
                      onClick={() => setTradeType('loss')}
                    >
                      <div className="trade-type-icon">
                        <TrendingDown size={16} />
                      </div>
                      <span className="trade-type-label">Loss</span>
                    </div>
                    <div
                      className={`trade-type-option break-even ${tradeType === 'break-even' ? 'selected' : ''}`}
                      onClick={() => setTradeType('break-even')}
                    >
                      <div className="trade-type-icon">
                        <Minus size={16} />
                      </div>
                      <span className="trade-type-label">Even</span>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label" htmlFor="symbol">Symbol *</label>
                    <input
                      id="symbol"
                      name="symbol"
                      type="text"
                      className="form-input"
                      placeholder="e.g. BTCUSDT"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="amount">Amount ($) *</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="category">Category *</label>
                    <div className="dropdown-container">
                      <button
                        type="button"
                        className="dropdown-trigger"
                        onClick={() => setCategoryOpen(!categoryOpen)}
                        style={{ borderColor: !formData.category ? '#ef4444' : undefined }}
                      >
                        <span className={formData.category ? '' : 'placeholder'}>
                          {formData.category || 'Select Market'}
                        </span>
                        <ChevronRight
                          size={16}
                          style={{
                            transform: categoryOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </button>
                      {categoryOpen && (
                        <div className="dropdown-menu">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, category: cat }));
                                setCategoryOpen(false);
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="fees">Fees ($)</label>
                    <input
                      id="fees"
                      name="fees"
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.fees}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-field full-width">
                  <label className="form-label">Tags</label>

                  <div style={{ position: 'relative' }}>
                    {/* Dropdown above input */}
                    {tagsOpen && (() => {
                      const filteredTags = availableTags.filter(tag =>
                        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                      );
                      const showCreate = tagSearchQuery && !availableTags.find(t => t.name.toLowerCase() === tagSearchQuery.toLowerCase());

                      return (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderBottom: 'none',
                          borderRadius: '0.5rem 0.5rem 0 0',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          marginBottom: '-1px'
                        }}>
                          {filteredTags.map((tag) => {
                            const isSelected = formData.tags.includes(tag.name);
                            return (
                              <button
                                key={tag.name}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (isSelected) {
                                    handleRemoveTag(tag.name);
                                  } else {
                                    handleAddTag(tag.name);
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.375rem 0.625rem',
                                  borderRadius: '999px',
                                  fontSize: '0.8125rem',
                                  background: isSelected ? 'var(--accent-purple)' : 'var(--bg-primary)',
                                  border: `1px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                                  color: isSelected ? 'white' : 'var(--text-primary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: tag.color, flexShrink: 0 }} />
                                {tag.name}
                                {isSelected && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                              </button>
                            );
                          })}
                          {showCreate && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddTag(tagSearchQuery);
                                setTagSearchQuery('');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.375rem 0.625rem',
                                borderRadius: '999px',
                                fontSize: '0.8125rem',
                                background: 'transparent',
                                border: '1px dashed var(--border-color)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontStyle: 'italic',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              + Create "{tagSearchQuery}"
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Input with selected tags */}
                    <div
                      style={{
                        width: '100%',
                        minHeight: '42px',
                        padding: '0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: tagsOpen ? '0 0 0.5rem 0.5rem' : '0.5rem',
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}
                    >
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="tag-badge"
                          style={{ backgroundColor: getTagColor(tag) }}
                        >
                          {tag}
                          <button
                            type="button"
                            className="tag-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(tag);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        id="tags-input"
                        type="text"
                        placeholder={formData.tags.length === 0 ? 'Type to add tags...' : ''}
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        onClick={() => setTagsOpen(true)}
                        onBlur={() => setTimeout(() => setTagsOpen(false), 150)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagSearchQuery.trim()) {
                            e.preventDefault();
                            handleAddTag(tagSearchQuery);
                            setTagSearchQuery('');
                          } else if (e.key === 'Backspace' && !tagSearchQuery && formData.tags.length > 0) {
                            e.preventDefault();
                            handleRemoveTag(formData.tags[formData.tags.length - 1]);
                          } else if (e.key === 'Escape') {
                            setTagsOpen(false);
                            setTagSearchQuery('');
                          }
                        }}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          padding: '0.25rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

              </form>
              </>
            ) : modalTab === 'journal' ? (
              <div className="journal-editor-container">
                <div className="journal-toolbar">
                  <div className="journal-toolbar-group">
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('bold');
                      }}
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('italic');
                      }}
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.underline ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('underline');
                      }}
                      title="Underline"
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                  <div className="journal-toolbar-group">
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.h1 ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('formatBlock', 'h1');
                      }}
                      title="Heading 1"
                    >
                      <Heading1 size={16} />
                    </button>
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.h2 ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('formatBlock', 'h2');
                      }}
                      title="Heading 2"
                    >
                      <Heading2 size={16} />
                    </button>
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.h3 ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('formatBlock', 'h3');
                      }}
                      title="Heading 3"
                    >
                      <Heading3 size={16} />
                    </button>
                  </div>
                  <div className="journal-toolbar-group">
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.insertUnorderedList ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('insertUnorderedList');
                      }}
                      title="Bullet List"
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      className={`journal-toolbar-btn ${activeFormats.insertOrderedList ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        formatText('insertOrderedList');
                      }}
                      title="Numbered List"
                    >
                      <ListOrdered size={16} />
                    </button>
                  </div>
                  <div className="journal-toolbar-group">
                    <button
                      type="button"
                      className="journal-toolbar-btn"
                      onClick={() => imageInputRef.current?.click()}
                      title="Insert Image"
                    >
                      <ImageIcon size={16} />
                    </button>
                  </div>
                </div>
                <div
                  ref={editorRef}
                  className="journal-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Write your trading journal entry here... You can paste screenshots directly (Ctrl+V)"
                  onInput={(e) => setJournalContent(e.currentTarget.innerHTML)}
                  onPaste={handlePaste}
                  onKeyDown={handleEditorKeyDown}
                  onMouseUp={updateActiveFormats}
                  onKeyUp={updateActiveFormats}
                  onClick={updateActiveFormats}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="journal-image-input"
                  onChange={handleImageUpload}
                />
              </div>
            ) : null}

            {/* Persistent action button */}
            {!viewingJournal && (
              <div style={{ paddingTop: '1.5rem' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: 'var(--accent-blue)',
                    border: 'none',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                  }}
                  onClick={handleSaveEntry}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-blue)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                  }}
                >
                  <PlusCircle size={16} />
                  Save Entry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    // Determine date range and title based on active tab
    let startDate, endDate, title;

    if (activeTab === 'Week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      title = `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
    } else if (activeTab === 'Year') {
      startDate = startOfYear(currentDate);
      endDate = endOfYear(currentDate);
      title = `${format(currentDate, 'yyyy')} Statistics`;
    } else {
      // Default to Month
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
      title = `${format(currentDate, 'MMMM yyyy')} Statistics`;
    }

    const periodTrades = getTradesInRange(startDate, endDate);

    const wins = periodTrades.filter(t => t.type === 'profit').length;
    const losses = periodTrades.filter(t => t.type === 'loss').length;
    const totalTrades = periodTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades * 100).toFixed(1) : '0.0';

    // Calculate daily P&L
    const dailyPnL = {};
    periodTrades.forEach(trade => {
      const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
      if (!dailyPnL[dateKey]) {
        dailyPnL[dateKey] = 0;
      }
      const amount = parseFloat(trade.amount) || 0;
      const fees = parseFloat(trade.fees) || 0;
      if (trade.type === 'profit') {
        dailyPnL[dateKey] += amount - fees;
      } else if (trade.type === 'loss') {
        dailyPnL[dateKey] -= amount + fees;
      } else {
        dailyPnL[dateKey] -= fees;
      }
    });

    const dailyTotals = Object.values(dailyPnL);
    const bestDay = dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0;
    const worstDay = dailyTotals.length > 0 ? Math.min(...dailyTotals) : 0;

    // Calculate average win and loss
    const profitTrades = periodTrades.filter(t => t.type === 'profit');
    const lossTrades = periodTrades.filter(t => t.type === 'loss');

    const avgWin = profitTrades.length > 0
      ? profitTrades.reduce((sum, t) => sum + parseFloat(t.amount) - parseFloat(t.fees || 0), 0) / profitTrades.length
      : 0;

    const avgLoss = lossTrades.length > 0
      ? lossTrades.reduce((sum, t) => sum + parseFloat(t.amount) + parseFloat(t.fees || 0), 0) / lossTrades.length
      : 0;

    const totalPnL = calculatePnL(periodTrades);

    return (
      <aside className="sidebar-section">
        <h2 className="sidebar-title">{title}</h2>

        <div className="info-card">
          <span className="info-label">Net Total</span>
          <div className={`info-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
          <div className="info-subtext">Period P&L</div>
        </div>

        <div className="info-card">
          <span className="info-label">Win Rate</span>
          <div className="info-value">{winRate}%</div>
          <div className="info-subtext">{wins}W / {losses}L</div>
        </div>

        <div className="info-card">
          <span className="info-label">Daily Performance</span>
          <div className="perf-row">
            <span className="perf-label">Best Day</span>
            <span className={`perf-value ${bestDay >= 0 ? 'positive' : 'negative'}`}>
              {bestDay >= 0 ? '+' : ''}${bestDay.toFixed(2)}
            </span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Worst Day</span>
            <span className={`perf-value ${worstDay >= 0 ? 'positive' : 'negative'}`}>
              {worstDay >= 0 ? '+' : ''}${worstDay.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="info-card">
          <span className="info-label">Average Stats</span>
          <div className="perf-row">
            <span className="perf-label">Avg Win</span>
            <span className="perf-value positive">
              +${avgWin.toFixed(2)}
            </span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Avg Loss</span>
            <span className="perf-value negative">
              -${avgLoss.toFixed(2)}
            </span>
          </div>
        </div>
      </aside>
    );
  };

  const renderReaderModal = () => {
    if (!readerModalOpen || !selectedDate) return null;

    const hasContent = journalContent && journalContent.trim() !== '';

    return (
      <div
        className="modal-overlay"
        style={{ zIndex: 9999 }}
        onClick={handleCloseReader}
      >
        <div
          className="modal-content"
          style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-modal" onClick={handleCloseReader}>
            <X size={20} />
          </button>

          <div className="modal-header" style={{ textAlign: 'left', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <FileText size={24} color="#6366f1" />
              <h2 className="modal-title" style={{ textAlign: 'left', margin: 0, fontSize: '1.25rem' }}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            <p className="modal-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              Journal Entry
            </p>
          </div>

          <div className="modal-body" style={{ padding: '1.5rem 1.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {hasContent ? (
              <div
                className="journal-view-content"
                dangerouslySetInnerHTML={{ __html: journalContent }}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  lineHeight: '1.8',
                  fontSize: '0.9375rem',
                  marginBottom: '1rem'
                }}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'rgba(148, 163, 184, 0.05)',
                borderRadius: '0.75rem',
                border: '1px dashed var(--border-color)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  No Journal Entry
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  This date doesn't have a journal entry yet.
                </p>
              </div>
            )}

            <div style={{ flexShrink: 0, paddingTop: '0.5rem' }}>
              <button
                onClick={handleEditJournalFromReader}
                style={{
                  width: '100%',
                  background: 'var(--accent-blue)',
                  border: 'none',
                  color: 'white',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent-blue)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                }}
              >
                <EditIcon size={16} />
                {hasContent ? 'Edit' : 'Write'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmModal = () => {
    if (!confirmModal.open) return null;

    return (
      <div className="modal-overlay" style={{ zIndex: 10001 }}>
        <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }}>
          <button className="close-modal" onClick={() => setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null })}>
            <X size={20} />
          </button>

          <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>{confirmModal.title}</h2>
          </div>

          <div style={{ marginBottom: '2rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            {confirmModal.message}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="modal-action-button"
              onClick={() => setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null })}
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Cancel
            </button>
            <button
              className="modal-action-button"
              onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
              style={{
                flex: 1,
                background: '#ef4444',
                borderColor: '#ef4444'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
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
    <div className="app-container">
      {renderHeader()}

      {currentView === 'analyze' ? (
        <Analyze trades={trades} />
      ) : currentView === 'profile' ? (
        <Profile
          availableTags={availableTags}
          setAvailableTags={setAvailableTags}
        />
      ) : currentView === 'journalEntries' ? (
        <JournalEntries
          journalEntries={journalEntries}
          onViewEntry={handleViewJournalEntry}
          onAddJournal={handleAddJournal}
          onDeleteEntry={handleDeleteJournal}
          trades={trades}
        />
      ) : (
        <>
          <div className="nav-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="view-tabs" style={{ marginBottom: 0 }}>
                  {['Week', 'Month', 'Year', 'Statistics'].map(tab => (
                    <button
                      key={tab}
                      className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  className="tab-btn tab-btn-outlined"
                  style={{
                    marginBottom: 0,
                    opacity: (activeTab === 'Year' || activeTab === 'Statistics') ? 0.5 : 1,
                    cursor: (activeTab === 'Year' || activeTab === 'Statistics') ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => {
                    if (activeTab !== 'Year' && activeTab !== 'Statistics') {
                      setIsSevenDayWeek(!isSevenDayWeek);
                    }
                  }}
                  disabled={activeTab === 'Year' || activeTab === 'Statistics'}
                >
                  <CalendarIcon size={16} />
                  {isSevenDayWeek ? '7-Day' : '5-Day'}
                </button>
              </div>
              <button
                className="tab-btn tab-btn-outlined tab-btn-journal"
                style={{ marginBottom: 0 }}
                onClick={() => setCurrentView('journalEntries')}
              >
                <FileText size={16} />
                Journal Entries
              </button>
            </div>
          </div>

          {activeTab === 'Statistics' ? (
            renderAllTimeView()
          ) : (
            <main className="dashboard-grid">
              <div className="main-content">
                {activeTab === 'Week' ? renderWeekList() :
                 activeTab === 'Year' ? renderYearView() :
                 renderCalendar()}
              </div>
              {renderSidebar()}
            </main>
          )}
        </>
      )}
      {renderModal()}
      {renderReaderModal()}
      {renderConfirmModal()}
      {renderAlertModal()}
    </div>
  );
}

export default App;
