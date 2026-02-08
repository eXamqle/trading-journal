import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Heart,
  Moon,
  BarChart3,
  User,
  PlusCircle,
  MessageCircle,
  Minus,
  X,
  ListFilter,
  LogOut,
  Award,
  Target,
  ChartColumn,
  CalendarOff,
  BookOpen,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3
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
  endOfYear,
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
import { useAuth } from './contexts/AuthContext';
import { tradesAPI } from './api/trades';
import { journalAPI } from './api/journal';

function App() {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalTab, setModalTab] = useState('add');
  const [tradeType, setTradeType] = useState('profit');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isSevenDayWeek, setIsSevenDayWeek] = useState(true);
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar', 'analyze', or 'profile'
  const [trades, setTrades] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [journalEntries, setJournalEntries] = useState({}); // Store journal entries by date
  const [viewingJournal, setViewingJournal] = useState(false); // Track if viewing journal
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    amount: '',
    category: '',
    fees: '',
    notes: ''
  });

  // Load trades and journal entries on mount
  useEffect(() => {
    loadTrades();
    loadJournalEntries();
  }, []);

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

  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
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

  const categories = ['Forex', 'Stocks', 'Crypto', 'Options', 'Indices', 'Other'];

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

      // If forceViewMode is true and there's a journal entry, open in view mode
      if (forceViewMode && existingJournal) {
        setViewingJournal(true);
        setModalTab('journal');
      } else {
        setViewingJournal(false);
      }
    }
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
        alert('Failed to save journal entry. Please try again.');
      }
    }

    setSelectedDate(null);
    setModalTab('add');
    setTradeType('profit');
    setJournalContent('');
    setViewingJournal(false);
    setFormData({
      symbol: '',
      amount: '',
      category: '',
      fees: '',
      notes: ''
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

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && selectedDate && journalContent === '') {
      editorRef.current.innerHTML = journalContent;
    }
  }, [selectedDate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate category is selected
    if (!formData.category) {
      alert('Please select a category');
      return;
    }

    try {
      const tradeData = {
        date: selectedDate.toISOString(),
        type: tradeType,
        symbol: formData.symbol,
        amount: formData.amount,
        category: formData.category,
        fees: formData.fees || '0',
        notes: formData.notes
      };

      const { data } = await tradesAPI.create(tradeData);
      // Convert date string to Date object
      const tradeWithDate = {
        ...data.trade,
        date: new Date(data.trade.date)
      };
      setTrades(prevTrades => [...prevTrades, tradeWithDate]);
      closeModal();
    } catch (error) {
      console.error('Failed to create trade:', error);
      alert('Failed to create trade: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const renderHeader = () => {
    return (
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>$$$</span>
          </div>
          <div className="logo-text">
            <h1>Journal & Calendar</h1>
            <p>Track your trading performance</p>
          </div>
        </div>
        <div className="nav-actions">
          {currentView !== 'profile' && (
            <div className="nav-link" onClick={() => setCurrentView(currentView === 'calendar' ? 'analyze' : 'calendar')}>
              {currentView === 'calendar' ? (
                <>
                  <BarChart3 size={20} />
                  <span>Analyze</span>
                </>
              ) : (
                <>
                  <CalendarIcon size={20} />
                  <span>Calendar</span>
                </>
              )}
            </div>
          )}
          {currentView === 'profile' && (
            <div className="nav-link" onClick={() => setCurrentView('calendar')}>
              <CalendarIcon size={20} />
              <span>Back to Calendar</span>
            </div>
          )}
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

  const renderTopStats = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthTrades = getTradesInRange(monthStart, monthEnd);
    const monthlyTotal = calculatePnL(monthTrades);

    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const yearTrades = getTradesInRange(yearStart, yearEnd);
    const annualTotal = calculatePnL(yearTrades);

    const isMonthlyProfit = monthlyTotal >= 0;
    const isAnnualProfit = annualTotal >= 0;

    return (
      <div className="top-stats">
        <div className={`week-total-card ${isMonthlyProfit ? 'week-total-profit' : 'week-total-loss'}`}>
          <div className="week-total-icon">
            {isMonthlyProfit ? (
              <TrendingUp className="h-6 w-6 text-white" />
            ) : (
              <TrendingDown className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <p className="week-total-label">Monthly Net Total</p>
            <p className="week-total-amount">
              {monthlyTotal >= 0 ? '+' : ''}${monthlyTotal.toFixed(2)}
            </p>
          </div>
        </div>
        <div className={`week-total-card ${isAnnualProfit ? 'week-total-profit' : 'week-total-loss'}`}>
          <div className="week-total-icon">
            {isAnnualProfit ? (
              <TrendingUp className="h-6 w-6 text-white" />
            ) : (
              <TrendingDown className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <p className="week-total-label">Annual Net Total</p>
            <p className="week-total-amount">
              {annualTotal >= 0 ? '+' : ''}${annualTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
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
      <div className="calendar-container">
        <div className="calendar-header">
          <div style={{ width: '100px' }}></div>
          <div className="calendar-nav">
            <button className="nav-btn" onClick={prevPeriod}>
              <ChevronLeft size={20} />
            </button>
            <div className="month-display">
              <CalendarIcon size={18} />
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button className="nav-btn" onClick={nextPeriod}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            className="toggle-7day"
            onClick={() => setIsSevenDayWeek(!isSevenDayWeek)}
          >
            <CalendarIcon size={14} />
            {isSevenDayWeek ? '7-DAY WEEK' : '5-DAY WEEK'}
          </button>
        </div>
        <div
          className="calendar-grid"
          style={{ gridTemplateColumns: `repeat(${numDays}, 1fr)` }}
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
                {hasJournal && <span className="journal-indicator">📝</span>}
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

    const weekTrades = getTradesInRange(weekStart, weekEnd);
    const weekTotal = calculatePnL(weekTrades);
    const isWeekProfit = weekTotal >= 0;

    return (
      <div className="week-view-container animate-fade-in">
        <div className="week-view-header-wrapper">
          <div className="week-view-header">
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
          <button
            className="toggle-7day"
            onClick={() => setIsSevenDayWeek(!isSevenDayWeek)}
          >
            <CalendarIcon size={14} />
            {isSevenDayWeek ? '7-DAY WEEK' : '5-DAY WEEK'}
          </button>
        </div>

        <div className={`week-total-card ${isWeekProfit ? 'week-total-profit' : 'week-total-loss'}`}>
          <div className="week-total-icon">
            {isWeekProfit ? (
              <TrendingUp className="h-6 w-6 text-white" />
            ) : (
              <TrendingDown className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <p className="week-total-label">Total P&L</p>
            <p className="week-total-amount">
              {weekTotal >= 0 ? '+' : ''}${weekTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="week-days-list">
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
                    {hasJournal && <span className="journal-badge">📝 Journal</span>}
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
    const yearEnd = endOfYear(currentDate);
    const currentYear = format(currentDate, 'yyyy');
    const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

    const yearTrades = getTradesInRange(yearStart, yearEnd);
    const yearTotal = calculatePnL(yearTrades);
    const isYearProfit = yearTotal >= 0;

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
      <div className="year-view-container animate-fade-in">
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

        <div className={`year-total-card ${isYearProfit ? 'year-total-profit' : 'year-total-loss'}`}>
          <div className="year-total-icon">
            {isYearProfit ? (
              <TrendingUp className="h-6 w-6 text-white" />
            ) : (
              <TrendingDown className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <p className="year-total-label">Total P&L</p>
            <p className="year-total-amount">
              {yearTotal >= 0 ? '+' : ''}${yearTotal.toFixed(2)}
            </p>
            <p className="year-total-sublabel">in {currentYear}</p>
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
    // Calculate all time statistics
    const allTrades = trades;
    const totalTrades = allTrades.length;

    // Calculate total P&L
    const totalPnL = allTrades.reduce((sum, trade) => {
      const amount = parseFloat(trade.amount) || 0;
      const fees = parseFloat(trade.fees) || 0;
      if (trade.type === 'profit') {
        return sum + amount - fees;
      } else if (trade.type === 'loss') {
        return sum - amount - fees;
      }
      return sum - fees; // break-even still has fees
    }, 0);

    // Calculate win rate
    const wins = allTrades.filter(t => t.type === 'profit').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades * 100).toFixed(1) : '0.0';

    // Find best and worst trades
    const profitTrades = allTrades.filter(t => t.type === 'profit').map(t => parseFloat(t.amount) - parseFloat(t.fees || 0));
    const lossTrades = allTrades.filter(t => t.type === 'loss').map(t => -(parseFloat(t.amount) + parseFloat(t.fees || 0)));

    const bestTrade = profitTrades.length > 0 ? Math.max(...profitTrades) : 0;
    const worstTrade = lossTrades.length > 0 ? Math.min(...lossTrades) : 0;

    // Group trades by year
    const tradesByYear = {};
    allTrades.forEach(trade => {
      const year = format(trade.date, 'yyyy');
      if (!tradesByYear[year]) {
        tradesByYear[year] = [];
      }
      tradesByYear[year].push(trade);
    });

    // Calculate P&L for each year
    const yearlyStats = Object.keys(tradesByYear).sort((a, b) => b - a).map(year => {
      const yearTrades = tradesByYear[year];
      const yearPnL = yearTrades.reduce((sum, trade) => {
        const amount = parseFloat(trade.amount) || 0;
        const fees = parseFloat(trade.fees) || 0;
        if (trade.type === 'profit') {
          return sum + amount - fees;
        } else if (trade.type === 'loss') {
          return sum - amount - fees;
        }
        return sum - fees;
      }, 0);

      return {
        year,
        trades: yearTrades.length,
        pnl: yearPnL
      };
    });

    // Calculate years span
    const years = Object.keys(tradesByYear).length;
    const yearsText = years === 1 ? '1 year' : `${years} years`;

    const isProfitable = totalPnL >= 0;

    return (
      <div className="alltime-view-container animate-fade-in">
        <div className={`alltime-total-card ${isProfitable ? 'alltime-total-profit' : 'alltime-total-loss'}`}>
          <div className="alltime-total-icon">
            {isProfitable ? (
              <TrendingUp className="h-8 w-8 text-white" />
            ) : (
              <TrendingDown className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="alltime-total-content">
            <p className="alltime-total-label">All Time P&L</p>
            <p className="alltime-total-amount">
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </p>
            <p className="alltime-total-sublabel">
              {totalTrades} {totalTrades === 1 ? 'trade' : 'trades'} across {yearsText}
            </p>
          </div>
        </div>

        <div className="alltime-stats-grid">
          <div className="alltime-stat-card">
            <div className="alltime-stat-icon alltime-stat-icon-blue">
              <Target className="h-5 w-5" />
            </div>
            <div className="alltime-stat-content">
              <span className="alltime-stat-label">Win Rate</span>
              <span className="alltime-stat-value">{winRate}%</span>
            </div>
          </div>

          <div className="alltime-stat-card">
            <div className="alltime-stat-icon alltime-stat-icon-purple">
              <ChartColumn className="h-5 w-5" />
            </div>
            <div className="alltime-stat-content">
              <span className="alltime-stat-label">Total Trades</span>
              <span className="alltime-stat-value">{totalTrades}</span>
            </div>
          </div>

          <div className="alltime-stat-card">
            <div className="alltime-stat-icon alltime-stat-icon-green">
              <Award className="h-5 w-5" />
            </div>
            <div className="alltime-stat-content">
              <span className="alltime-stat-label">Best Trade</span>
              <span className="alltime-stat-value text-emerald-400">
                +${bestTrade.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="alltime-stat-card">
            <div className="alltime-stat-icon alltime-stat-icon-red">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="alltime-stat-content">
              <span className="alltime-stat-label">Worst Trade</span>
              <span className="alltime-stat-value text-red-400">
                ${worstTrade.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {yearlyStats.length > 0 && (
          <div className="alltime-years-section">
            <h3 className="alltime-section-title">
              <CalendarIcon className="h-4 w-4" />
              Yearly Performance
            </h3>
            <div className="alltime-years-list">
              {yearlyStats.map((yearStat, idx) => {
                const isYearProfit = yearStat.pnl >= 0;
                return (
                  <div
                    key={yearStat.year}
                    className={`alltime-year-item ${isYearProfit ? 'alltime-year-profit' : 'alltime-year-loss'}`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="alltime-year-left">
                      <span className="alltime-year-name">{yearStat.year}</span>
                      <span className="alltime-year-trades">
                        {yearStat.trades} {yearStat.trades === 1 ? 'trade' : 'trades'}
                      </span>
                    </div>
                    <div className={`alltime-year-total ${isYearProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {yearStat.pnl >= 0 ? '+' : ''}${yearStat.pnl.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedDate) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-modal" onClick={closeModal}>
            <X size={20} />
          </button>

          <div className="modal-header">
            <h2 className="modal-title">{format(selectedDate, 'MMMM d, yyyy')}</h2>
            <p className="modal-subtitle">Trade Management Ritual</p>
          </div>

          <div className="modal-body">
            <div className="modal-tabs">
              <button
                className={`modal-tab ${modalTab === 'add' ? 'active' : ''}`}
                onClick={() => setModalTab('add')}
              >
                <PlusCircle size={14} />
                New Entry
              </button>
              <button
                className={`modal-tab ${modalTab === 'journal' ? 'active' : ''}`}
                onClick={() => setModalTab('journal')}
              >
                <BookOpen size={14} />
                Journal
              </button>
            </div>

            {viewingJournal ? (
              <div className="journal-view-container">
                <div
                  className="journal-view-content"
                  dangerouslySetInnerHTML={{ __html: journalContent }}
                />
                <button
                  type="button"
                  className="modal-action-button"
                  onClick={() => setViewingJournal(false)}
                >
                  ✏️ Edit Journal
                </button>
              </div>
            ) : modalTab === 'add' ? (
              <form onSubmit={handleSubmit}>
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
                  <label className="form-label" htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-textarea"
                    placeholder="Strategy used, emotions, or mistakes..."
                    rows="3"
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>

              </form>
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
              <button
                type="button"
                className="modal-action-button"
                onClick={() => {
                  if (modalTab === 'add') {
                    // Trigger form submit for add tab
                    document.querySelector('.modal-content form')?.requestSubmit();
                  } else if (modalTab === 'journal') {
                    // Save journal and close modal
                    closeModal();
                  }
                }}
              >
                <PlusCircle size={20} />
                {modalTab === 'add' ? 'Add Entry' : 'Save Journal'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthTrades = getTradesInRange(monthStart, monthEnd);

    const wins = monthTrades.filter(t => t.type === 'profit').length;
    const losses = monthTrades.filter(t => t.type === 'loss').length;
    const totalTrades = monthTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades * 100).toFixed(1) : '0.0';

    // Calculate daily P&L for the month
    const dailyPnL = {};
    monthTrades.forEach(trade => {
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
    const profitTrades = monthTrades.filter(t => t.type === 'profit');
    const lossTrades = monthTrades.filter(t => t.type === 'loss');

    const avgWin = profitTrades.length > 0
      ? profitTrades.reduce((sum, t) => sum + parseFloat(t.amount) - parseFloat(t.fees || 0), 0) / profitTrades.length
      : 0;

    const avgLoss = lossTrades.length > 0
      ? lossTrades.reduce((sum, t) => sum + parseFloat(t.amount) + parseFloat(t.fees || 0), 0) / lossTrades.length
      : 0;

    return (
      <aside className="sidebar-section">
        <h2 className="sidebar-title">{format(currentDate, 'MMMM yyyy')} Statistics</h2>

        <div className="info-card">
          <span className="info-label">Win Rate</span>
          <div className="info-value">{winRate}%</div>
          <div className="info-subtext">{wins}W / {losses}L</div>
        </div>

        <div className="info-card">
          <span className="info-label">Total Trades</span>
          <div className="info-value">{totalTrades}</div>
          <div className="info-subtext">{format(currentDate, 'MMMM')}</div>
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

  const renderAllTimeSidebar = () => {
    const allTrades = trades;
    const totalTrades = allTrades.length;

    const wins = allTrades.filter(t => t.type === 'profit').length;
    const losses = allTrades.filter(t => t.type === 'loss').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades * 100).toFixed(1) : '0.0';

    // Calculate pie chart values
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const winPercentage = totalTrades > 0 ? (wins / totalTrades) : 0;
    const lossPercentage = totalTrades > 0 ? (losses / totalTrades) : 0;

    return (
      <aside className="sidebar-section">
        <div className="info-card">
          <span className="info-label">Win/Loss Distribution</span>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="20"
              />
              {totalTrades > 0 && (
                <>
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${winPercentage * circumference} ${circumference}`}
                    strokeDashoffset={circumference / 4}
                    transform="rotate(-90 90 90)"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${lossPercentage * circumference} ${circumference}`}
                    strokeDashoffset={circumference / 4 - winPercentage * circumference}
                    transform="rotate(-90 90 90)"
                  />
                </>
              )}
              <text
                x="90"
                y="85"
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="20"
                fontWeight="700"
              >
                {winRate}%
              </text>
              <text
                x="90"
                y="105"
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                Win Rate
              </text>
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#10b981' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Wins: {wins}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Losses: {losses}</span>
            </div>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="app-container">
      {renderHeader()}

      {currentView === 'analyze' ? (
        <Analyze trades={trades} />
      ) : currentView === 'profile' ? (
        <Profile />
      ) : (
        <>
          <div className="view-tabs">
            {['Week', 'Month', 'Year', 'All Time'].map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <main className="dashboard-grid">
            <div className="main-content">
              {activeTab === 'Month' && renderTopStats()}
              {activeTab === 'Week' ? renderWeekList() :
               activeTab === 'Year' ? renderYearView() :
               activeTab === 'All Time' ? renderAllTimeView() :
               renderCalendar()}
            </div>
            {activeTab === 'All Time' ? renderAllTimeSidebar() : renderSidebar()}
          </main>

          {renderModal()}
        </>
      )}
    </div>
  );
}

export default App;
