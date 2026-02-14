import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
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
  Menu,
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
  FileText,
  BookOpen
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
import JournalEntries from './JournalEntries';
import AddTagModal from './AddTagModal';
import { useAuth } from './contexts/AuthContext';
import { useCurrency } from './contexts/CurrencyContext';
import { tradesAPI } from './api/trades';
import { journalAPI } from './api/journal';
import { tagsAPI } from './api/tags';

function App() {
  const { user, logout } = useAuth();
  const { symbol } = useCurrency();
  const [currentDate, setCurrentDate] = useState(() => {
    try {
      const saved = localStorage.getItem('currentDate');
      if (saved) {
        const date = new Date(saved);
        // Check if date is valid
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.error('Error loading currentDate from localStorage:', error);
    }
    return new Date();
  });
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'Month';
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalTab, setModalTab] = useState('add');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [tradeType, setTradeType] = useState('profit');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [selectedSymbolIndex, setSelectedSymbolIndex] = useState(-1);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const [isSevenDayWeek, setIsSevenDayWeek] = useState(() => {
    const saved = localStorage.getItem('isSevenDayWeek');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('currentView');
    return saved || 'calendar';
  });
  const [trades, setTrades] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [editingTrade, setEditingTrade] = useState(null);
  const [modalTabPanelHeight, setModalTabPanelHeight] = useState(null);
  const [isModalTabAnimating, setIsModalTabAnimating] = useState(false);

  // Tags management
  const [availableTags, setAvailableTags] = useState([]);
  const [showAddTagModal, setShowAddTagModal] = useState(false);

  // Recent markets tracking
  const [recentMarkets, setRecentMarkets] = useState(() => {
    const saved = localStorage.getItem('recentMarkets');
    return saved ? JSON.parse(saved) : [];
  });

  // Load trades, journal entries, and tags on mount
  useEffect(() => {
    loadTrades();
    loadJournalEntries();
    loadTags();
  }, []);

  // Save navigation state to localStorage
  useEffect(() => {
    localStorage.setItem('isSevenDayWeek', JSON.stringify(isSevenDayWeek));
  }, [isSevenDayWeek]);

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('currentDate', currentDate.toISOString());
  }, [currentDate]);

  useEffect(() => {
    localStorage.setItem('recentMarkets', JSON.stringify(recentMarkets));
  }, [recentMarkets]);

  // Handle Escape key for alert modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && alertModal.open) {
        setAlertModal({ ...alertModal, open: false });
      }
    };

    if (alertModal.open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [alertModal]);

  // Handle Escape key for confirm modal
  useEffect(() => {
    const handleConfirmKeyDown = (e) => {
      if (!confirmModal.open) return;

      if (e.key === 'Escape') {
        setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
        return;
      }

      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        const targetTag = e.target?.tagName?.toLowerCase();
        const isTypingTarget =
          targetTag === 'input' ||
          targetTag === 'textarea' ||
          targetTag === 'select' ||
          e.target?.isContentEditable;

        if (isTypingTarget) return;

        e.preventDefault();
        confirmModal.onConfirm && confirmModal.onConfirm();
        setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
      }
    };

    if (confirmModal.open) {
      window.addEventListener('keydown', handleConfirmKeyDown);
      return () => window.removeEventListener('keydown', handleConfirmKeyDown);
    }
  }, [confirmModal.open, confirmModal.onConfirm]);

  // Handle Escape key for reader modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && readerModalOpen) {
        setReaderModalOpen(false);
        setViewingJournal(false);
      }
    };

    if (readerModalOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [readerModalOpen]);

  // Handle Escape key for add tag modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showAddTagModal) {
        setShowAddTagModal(false);
      }
    };

    if (showAddTagModal) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showAddTagModal]);

  // Handle Escape key for main modal (add/edit trade modal)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedDate && !readerModalOpen && !alertModal.open && !confirmModal.open && !showAddTagModal) {
        closeModal(false);
      }
    };

    if (selectedDate && !readerModalOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [selectedDate, readerModalOpen, alertModal.open, confirmModal.open, showAddTagModal]);

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
      setAvailableTags(data.tags.map(tag => ({
        name: tag.name,
        color: tag.color,
        description: tag.description,
        id: tag.id
      })));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const updateRecentMarkets = (market) => {
    setRecentMarkets(prev => {
      // Remove the market if it already exists
      const filtered = prev.filter(m => m !== market);
      // Add to front, keep only last 5
      return [market, ...filtered].slice(0, 5);
    });
  };

  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const editorInitialized = useRef(false);
  const symbolInputRef = useRef(null);
  const hasAutoFocused = useRef(false);
  const modalTradePanelRef = useRef(null);
  const modalJournalPanelRef = useRef(null);
  const modalTabAnimationTimeoutRef = useRef(null);
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

  const categories = ['Crypto', 'Forex', 'Futures', 'Options', 'Stocks'];

  // Helper function to calculate P&L from trades
  const getTradeNet = (trade) => {
    const amount = parseFloat(trade.amount) || 0;
    const fees = parseFloat(trade.fees) || 0;
    return amount - fees;
  };

  const calculatePnL = (tradesArray) => {
    return tradesArray.reduce((sum, trade) => sum + getTradeNet(trade), 0);
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

  const yearReviewData = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const yearTrades = getTradesInRange(yearStart, yearEnd);
    const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

    const summarizeDimension = (items, minCount = 2) => {
      const map = new Map();

      items.forEach((item) => {
        const name = (item.name || '').trim();
        if (!name) return;
        const agg = map.get(name) || { name, pnl: 0, count: 0 };
        agg.pnl += item.net;
        agg.count += 1;
        map.set(name, agg);
      });

      const allValues = [...map.values()];
      const qualifiedValues = allValues.filter((entry) => entry.count >= minCount);
      const source = qualifiedValues.length > 0 ? qualifiedValues : allValues;
      const best = [...source].sort((a, b) => b.pnl - a.pnl).find((entry) => entry.pnl > 0) || null;
      const worst = [...source].sort((a, b) => a.pnl - b.pnl).find((entry) => entry.pnl < 0) || null;

      return { best, worst, values: allValues };
    };

    const yearCategoryItems = yearTrades.map((trade) => ({
      name: (trade.category || 'Uncategorized').trim() || 'Uncategorized',
      net: getTradeNet(trade)
    }));

    const yearTagItems = yearTrades.flatMap((trade) => {
      const tradeNet = getTradeNet(trade);
      const tagNames = Array.isArray(trade.tags)
        ? trade.tags
          .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
          .filter(Boolean)
        : [];

      return tagNames.map((name) => ({ name, net: tradeNet }));
    });

    const categorySummary = summarizeDimension(yearCategoryItems, 2);
    const tagSummary = summarizeDimension(yearTagItems, 2);

    const repeatCandidates = [
      categorySummary.best ? { ...categorySummary.best, source: 'Market' } : null,
      tagSummary.best ? { ...tagSummary.best, source: 'Tag' } : null
    ].filter(Boolean);

    const leakCandidates = [
      categorySummary.worst ? { ...categorySummary.worst, source: 'Market' } : null,
      tagSummary.worst ? { ...tagSummary.worst, source: 'Tag' } : null
    ].filter(Boolean);

    const repeatItem = repeatCandidates.length > 0
      ? [...repeatCandidates].sort((a, b) => b.pnl - a.pnl)[0]
      : null;
    const avoidItem = leakCandidates.length > 0
      ? [...leakCandidates].sort((a, b) => a.pnl - b.pnl)[0]
      : null;

    const monthRows = months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthTrades = getTradesInRange(monthStart, monthEnd);
      const tradeNets = monthTrades.map((trade) => getTradeNet(trade));
      const pnl = tradeNets.reduce((sum, value) => sum + value, 0);
      const wins = tradeNets.filter((value) => value > 0).length;
      const losses = tradeNets.filter((value) => value < 0).length;
      const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
      const avgWin = wins > 0 ? tradeNets.filter((value) => value > 0).reduce((sum, value) => sum + value, 0) / wins : 0;
      const avgLoss = losses > 0 ? Math.abs(tradeNets.filter((value) => value < 0).reduce((sum, value) => sum + value, 0) / losses) : 0;
      const activeDays = new Set(monthTrades.map((trade) => format(new Date(trade.date), 'yyyy-MM-dd'))).size;

      const monthTagItems = monthTrades.flatMap((trade) => {
        const tradeNet = getTradeNet(trade);
        const tagNames = Array.isArray(trade.tags)
          ? trade.tags
            .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
            .filter(Boolean)
          : [];
        return tagNames.map((name) => ({ name, net: tradeNet }));
      });

      const monthTagSummary = summarizeDimension(monthTagItems, 2);

      return {
        key: format(monthDate, 'yyyy-MM'),
        monthDate,
        monthLabel: format(monthDate, 'MMM'),
        monthLongLabel: format(monthDate, 'MMMM'),
        pnl,
        tradeCount: monthTrades.length,
        wins,
        losses,
        winRate,
        avgWin,
        avgLoss,
        activeDays,
        bestTag: monthTagSummary.best,
        worstTag: monthTagSummary.worst
      };
    });

    const tradesByDay = new Map();
    yearTrades.forEach((trade) => {
      const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
      const existing = tradesByDay.get(dateKey) || { dateKey, pnl: 0, tradeCount: 0 };
      existing.pnl += getTradeNet(trade);
      existing.tradeCount += 1;
      tradesByDay.set(dateKey, existing);
    });

    const dailyRows = [...tradesByDay.values()].sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));

    let runningEquity = 0;
    let runningPeak = 0;
    let maxDrawdown = 0;
    dailyRows.forEach((day) => {
      runningEquity += day.pnl;
      runningPeak = Math.max(runningPeak, runningEquity);
      maxDrawdown = Math.min(maxDrawdown, runningEquity - runningPeak);
    });

    const worstLossDays = [...dailyRows]
      .filter((day) => day.pnl < 0)
      .sort((a, b) => a.pnl - b.pnl)
      .slice(0, 5);
    const fallbackReviewDays = [...dailyRows]
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 5);

    const totalTrades = yearTrades.length;
    const totalPnL = calculatePnL(yearTrades);
    const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const tradedMonths = monthRows.filter((row) => row.tradeCount > 0).length;
    const profitableMonths = monthRows.filter((row) => row.tradeCount > 0 && row.pnl > 0).length;
    const profitableMonthRate = tradedMonths > 0 ? (profitableMonths / tradedMonths) * 100 : 0;

    return {
      year: format(currentDate, 'yyyy'),
      totalTrades,
      totalPnL,
      expectancy,
      tradedMonths,
      profitableMonths,
      profitableMonthRate,
      maxDrawdown: Math.abs(maxDrawdown),
      monthRows,
      repeatItem,
      avoidItem,
      reviewQueue: worstLossDays.length > 0 ? worstLossDays : fallbackReviewDays
    };
  }, [currentDate, trades]);

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

  const resetModalTabAnimation = () => {
    if (modalTabAnimationTimeoutRef.current) {
      clearTimeout(modalTabAnimationTimeoutRef.current);
      modalTabAnimationTimeoutRef.current = null;
    }
    setIsModalTabAnimating(false);
    setModalTabPanelHeight(null);
  };

  const getModalTabPanelElement = (tabName = modalTab) => {
    return tabName === 'journal' ? modalJournalPanelRef.current : modalTradePanelRef.current;
  };

  const switchModalTab = (nextTab) => {
    if (nextTab === modalTab) {
      setViewingJournal(false);
      return;
    }

    const currentPanel = getModalTabPanelElement(modalTab);
    const currentHeight = currentPanel?.offsetHeight || 0;

    if (currentHeight > 0) {
      setModalTabPanelHeight(currentHeight);
    } else {
      setModalTabPanelHeight(null);
    }

    setViewingJournal(false);
    setIsModalTabAnimating(true);
    setModalTab(nextTab);
  };

  useLayoutEffect(() => {
    if (!selectedDate || !isModalTabAnimating) return;

    const targetPanel = getModalTabPanelElement(modalTab);
    if (!targetPanel) return;

    const targetHeight = targetPanel.offsetHeight;
    requestAnimationFrame(() => {
      setModalTabPanelHeight(targetHeight);
    });

    if (modalTabAnimationTimeoutRef.current) {
      clearTimeout(modalTabAnimationTimeoutRef.current);
    }

    modalTabAnimationTimeoutRef.current = setTimeout(() => {
      setModalTabPanelHeight(null);
      setIsModalTabAnimating(false);
      modalTabAnimationTimeoutRef.current = null;
    }, 220);
  }, [modalTab, isModalTabAnimating, selectedDate]);

  useEffect(() => {
    if (!selectedDate) {
      resetModalTabAnimation();
    }
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (modalTabAnimationTimeoutRef.current) {
        clearTimeout(modalTabAnimationTimeoutRef.current);
      }
    };
  }, []);

  const openModal = (date, forceViewMode = false) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(date);
    selectedDateNormalized.setHours(0, 0, 0, 0);

    // Prevent opening modal for future dates
    if (selectedDateNormalized > today) {
      return;
    }

    if (activeTab === 'Week' || activeTab === 'Year' || isSameMonth(date, startOfMonth(currentDate))) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingJournal = journalEntries[dateKey]?.content || '';

      resetModalTabAnimation();
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
    const existingJournal = journalEntries[dateKey]?.content || '';

    setSelectedDate(date);
    setJournalContent(existingJournal);
    setReaderModalOpen(true);
  };

  const handleAddJournal = () => {
    const today = new Date();
    const dateKey = format(today, 'yyyy-MM-dd');
    const existingJournal = journalEntries[dateKey]?.content || '';

    resetModalTabAnimation();
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
    resetModalTabAnimation();
    setModalTab('journal');

    // Clear form data to prevent accidentally creating duplicate trades
    setFormData({
      symbol: '',
      amount: '',
      category: '',
      fees: '',
      tags: []
    });
    setTradeType('profit');
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

  const handleEditTrade = (trade) => {
    // Set the editing trade
    setEditingTrade(trade);

    resetModalTabAnimation();

    // Set the selected date to the trade's date
    setSelectedDate(trade.date);

    // Populate the form with the trade's data
    setFormData({
      symbol: trade.symbol,
      amount: trade.amount.toString(),
      category: trade.category,
      fees: trade.fees ? trade.fees.toString() : '',
      tags: Array.isArray(trade.tags)
        ? trade.tags
          .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
          .filter(Boolean)
        : []
    });

    // Set the trade type
    setTradeType(trade.type);

    // Switch to the add tab
    setModalTab('add');

    // Load existing journal content for this date if any
    const dateKey = format(trade.date, 'yyyy-MM-dd');
    const existingJournal = journalEntries[dateKey]?.content || '';
    setJournalContent(existingJournal);

    // Reset other states
    setViewingJournal(false);
    setJournalOnlyMode(false);
    setTradesExpanded(false);
  };

  const closeModal = async (shouldSave = true) => {
    const normalizedJournalContent = typeof journalContent === 'string'
      ? journalContent
      : (journalContent?.content || '');

    // Save journal content before closing only if shouldSave is true and content is not empty
    const hasContent = normalizedJournalContent && normalizedJournalContent.replace(/<[^>]*>/g, '').trim() !== '';
    if (shouldSave && selectedDate && hasContent) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await journalAPI.saveEntry(dateKey, normalizedJournalContent);
        setJournalEntries(prev => ({
          ...prev,
          [dateKey]: { content: normalizedJournalContent }
        }));
      } catch (error) {
        console.error('Failed to save journal:', error);
        setAlertModal({ open: true, message: 'Failed to save journal entry. Please try again.', title: 'Error' });
        return; // Don't close modal if save fails
      }
    }

    resetModalTabAnimation();
    setSelectedDate(null);
    setModalTab('add');
    setTradeType('profit');
    setJournalContent('');
    setViewingJournal(false);
    setJournalOnlyMode(false);
    setTradesExpanded(false);
    setEditingTrade(null);
    editorInitialized.current = false;
    setFormData({
      symbol: '',
      amount: '',
      category: '',
      fees: '',
      tags: []
    });
    // Reset dropdown states
    setCategoryOpen(false);
    setSymbolDropdownOpen(false);
    setSelectedSymbolIndex(-1);
    setSelectedCategoryIndex(-1);
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
    // Handle Tab key for indentation and list creation
    if (e.key === 'Tab') {
      e.preventDefault();

      if (e.shiftKey) {
        // Shift+Tab for outdent
        document.execCommand('outdent', false, null);
      } else {
        // Check if we're already in a list
        const selection = window.getSelection();
        if (selection.rangeCount) {
          let node = selection.anchorNode;
          let inList = false;

          // Check if we're inside a list
          while (node && node !== editorRef.current) {
            if (node.nodeName === 'UL' || node.nodeName === 'OL' || node.nodeName === 'LI') {
              inList = true;
              break;
            }
            node = node.parentNode;
          }

          if (inList) {
            // Already in a list, indent
            document.execCommand('indent', false, null);
          } else {
            // Not in a list, create a bulleted list
            document.execCommand('insertUnorderedList', false, null);
          }
        }
      }
    }

    // Handle Enter key for automatic bullet continuation
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      // Find if we're inside a list item
      let node = selection.anchorNode;
      let listItem = null;

      // Traverse up to find the list item
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'LI') {
          listItem = node;
          break;
        }
        node = node.parentNode;
      }

      if (listItem) {
        // Check if the list item is empty or only contains a <br>
        const text = listItem.textContent.trim();

        if (text === '' || text === '\n') {
          // Empty list item - exit the list
          e.preventDefault();
          document.execCommand('outdent', false, null);
        }
        // If not empty, let the default behavior create a new list item
      }
    }
  };

  // Reset editor initialization flag and close dropdowns when switching tabs
  useEffect(() => {
    if (modalTab !== 'journal') {
      editorInitialized.current = false;
    }
    // Reset auto-focus flag when switching to 'add' tab to allow refocusing
    if (modalTab === 'add') {
      hasAutoFocused.current = false;
    }
    // Close all dropdowns when switching tabs
    setCategoryOpen(false);
    setSymbolDropdownOpen(false);
    setSelectedSymbolIndex(-1);
    setSelectedCategoryIndex(-1);
  }, [modalTab]);

  // Keyboard shortcut handler for Cmd/Ctrl+Enter to save and Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+M to open new entry modal with today's date
      if ((e.metaKey || e.ctrlKey) && e.key === 'm' && !selectedDate) {
        e.preventDefault();
        openModal(new Date());
        return;
      }

      // Shortcuts that work when modal is open
      if (selectedDate) {
        // Alt+Left Arrow to switch to Add Trade tab
        if (e.altKey && e.key === 'ArrowLeft' && !journalOnlyMode) {
          e.preventDefault();
          switchModalTab('add');
          return;
        }

        // Alt+Right Arrow to switch to Journal tab
        if (e.altKey && e.key === 'ArrowRight' && !journalOnlyMode) {
          e.preventDefault();
          switchModalTab('journal');
          return;
        }

        // Cmd/Ctrl+Enter to save
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !viewingJournal) {
          e.preventDefault();
          handleSaveEntry();
          return;
        }

        // Escape to close without saving
        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal(false);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, viewingJournal, formData, tradeType, journalContent, modalTab, journalOnlyMode]);

  // Set editor content only when modal first opens
  useEffect(() => {
    if (editorRef.current && selectedDate && modalTab === 'journal' && !editorInitialized.current) {
      editorRef.current.innerHTML = journalContent;
      editorInitialized.current = true;
    }
  }, [selectedDate, journalContent, modalTab]);

  // Auto-focus first empty input on modal open for ultra-fast entry (only once per modal open)
  useEffect(() => {
    if (selectedDate && modalTab === 'add' && !hasAutoFocused.current) {
      hasAutoFocused.current = true;
      // Small delay to ensure modal is rendered and state is updated
      setTimeout(() => {
        // Get the current input values from DOM to ensure we have the latest state
        const symbolInput = symbolInputRef.current;
        const categoryInput = document.getElementById('category-input');
        const amountInput = document.getElementById('amount');
        const feesInput = document.getElementById('fees');

        // Focus first empty field in order: symbol -> category -> amount -> fees
        if (symbolInput && !symbolInput.value) {
          symbolInput.focus();
        } else if (categoryInput && !categoryInput.value) {
          categoryInput.focus();
        } else if (amountInput && !amountInput.value) {
          amountInput.focus();
        } else if (feesInput && !feesInput.value) {
          feesInput.focus();
        }
      }, 100);
    }

    // Reset the flag when modal closes
    if (!selectedDate) {
      hasAutoFocused.current = false;
    }
  }, [selectedDate, modalTab]);

  // Auto-focus journal editor when switching to journal tab
  useEffect(() => {
    if (selectedDate && modalTab === 'journal' && editorRef.current && !viewingJournal) {
      // Small delay to ensure editor is rendered
      setTimeout(() => {
        editorRef.current?.focus();
      }, 100);
    }
  }, [selectedDate, modalTab, viewingJournal]);

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
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      // Auto-select trade result based on amount and fees
      if (name === 'amount' || name === 'fees') {
        const amount = parseFloat(name === 'amount' ? value : prev.amount) || 0;
        const fees = parseFloat(name === 'fees' ? value : prev.fees) || 0;
        const netResult = amount - fees;

        // Auto-select the appropriate trade type based on net result
        if (netResult > 0.01) {
          setTradeType('profit');
        } else if (netResult < -0.01) {
          setTradeType('loss');
        } else if (Math.abs(netResult) < 0.01 && (amount > 0 || fees > 0)) {
          setTradeType('break-even');
        }
      }

      return updated;
    });
  };

  // Tag management functions
  const handleAddTag = (tagName) => {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveNewTag = async (tagData) => {
    try {
      // Save to backend
      const { data } = await tagsAPI.create(tagData);
      const newTag = { name: data.tag.name, color: data.tag.color, id: data.tag.id };

      // Add to available tags
      setAvailableTags(prev => [...prev, newTag]);

      // Automatically add to current trade
      handleAddTag(newTag.name);

      // Close modal
      setShowAddTagModal(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag. Please try again.');
    }
  };

  const handleSaveEntry = async () => {
    // Check if selectedDate is valid
    if (!selectedDate) {
      console.error('Cannot save entry: selectedDate is null or invalid');
      return;
    }

    // Validate required fields if any trade fields are filled
    const hasTradeData = formData.symbol || formData.amount || formData.category;
    if (hasTradeData) {
      if (!formData.symbol) {
        setAlertModal({ open: true, message: 'Please enter a symbol.', title: 'Validation Error' });
        return;
      }
      if (!formData.amount) {
        setAlertModal({ open: true, message: 'Please enter an amount.', title: 'Validation Error' });
        return;
      }
      if (!formData.category) {
        setAlertModal({ open: true, message: 'Please select a category.', title: 'Validation Error' });
        return;
      }
    }

    // Validate trade result matches the net outcome
    if (formData.symbol && formData.amount && formData.category) {
      const amount = parseFloat(formData.amount) || 0;
      const fees = parseFloat(formData.fees) || 0;
      const netResult = amount - fees;

      if (tradeType === 'profit' && netResult <= 0) {
        setAlertModal({
          open: true,
          message: `Profit result requires: Amount - Fees > ${symbol}0\n\nCurrent net: ${symbol}${netResult.toFixed(2)}`,
          title: 'Invalid Trade Result'
        });
        return;
      }

      if (tradeType === 'loss' && netResult >= 0) {
        setAlertModal({
          open: true,
          message: `Loss result requires: Amount - Fees < ${symbol}0 (fees must exceed amount)\n\nCurrent net: ${symbol}${netResult.toFixed(2)}`,
          title: 'Invalid Trade Result'
        });
        return;
      }

      if (tradeType === 'break-even' && Math.abs(netResult) >= 0.01) {
        setAlertModal({
          open: true,
          message: `Breakeven result requires: Amount - Fees = ${symbol}0.00\n\nCurrent net: ${symbol}${netResult.toFixed(2)}`,
          title: 'Invalid Trade Result'
        });
        return;
      }
    }

    try {
      let tradeCreated = false;
      let journalSaved = false;

      // Save trade if form is filled
      if (formData.symbol && formData.amount && formData.category) {
        const tradeData = {
          date: format(selectedDate, 'yyyy-MM-dd'),
          type: tradeType,
          symbol: formData.symbol,
          amount: formData.amount,
          category: formData.category,
          fees: formData.fees || '0',
          tags: formData.tags
        };

        if (editingTrade) {
          // Update existing trade
          const { data } = await tradesAPI.update(editingTrade.id, tradeData);
          const tradeWithDate = {
            ...data.trade,
            date: new Date(data.trade.date)
          };
          // Use == for comparison to handle type coercion (number vs string)
          setTrades(prevTrades => prevTrades.map(t => t.id == editingTrade.id ? tradeWithDate : t));
          setEditingTrade(null);
          updateRecentMarkets(formData.category);
          tradeCreated = true;
        } else {
          // Create new trade
          const { data } = await tradesAPI.create(tradeData);
          const tradeWithDate = {
            ...data.trade,
            date: new Date(data.trade.date)
          };
          setTrades(prevTrades => [...prevTrades, tradeWithDate]);
          updateRecentMarkets(formData.category);
          tradeCreated = true;
        }
      }

      // Save journal if there's content (not just empty HTML tags or whitespace)
      const normalizedJournalContent = typeof journalContent === 'string'
        ? journalContent
        : (journalContent?.content || '');
      const hasJournalContent = normalizedJournalContent && normalizedJournalContent.replace(/<[^>]*>/g, '').trim() !== '';
      if (hasJournalContent) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        await journalAPI.saveEntry(dateKey, normalizedJournalContent);
        setJournalEntries(prev => ({
          ...prev,
          [dateKey]: { content: normalizedJournalContent }
        }));
        journalSaved = true;
      }

      // Show appropriate success message
      if (tradeCreated || journalSaved) {
        // Reset form data immediately to prevent double-counting in UI
        setFormData({
          symbol: '',
          amount: '',
          category: '',
          fees: '',
          tags: []
        });
        setTradeType('profit');

        // Close modal first
        closeModal();

        // Then show success notification
        setTimeout(() => {
          setShowSaveSuccess(true);
          setTimeout(() => {
            setShowSaveSuccess(false);
          }, 2500);
        }, 100);
      } else {
        setAlertModal({
          open: true,
          message: 'Please add either a trade or journal entry.',
          title: 'No Data to Save'
        });
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      // On error, modal stays open and shows error
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
          onClick={() => setCurrentView('calendar')}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon" style={{ width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem' }}>
            <BookOpen size={26} strokeWidth={2.5} />
          </div>
          <div className="logo-text">
            <h1>TradeBook</h1>
            <p>Track your trading performance</p>
          </div>
        </div>
        <div className="nav-actions">
          <div
            className="nav-link"
            onClick={() => setCurrentView('calendar')}
            style={{
              marginRight: '12px',
              cursor: 'pointer'
            }}
          >
            <CalendarIcon size={20} />
            <span>Calendar</span>
          </div>
          <div
            className="nav-link"
            onClick={() => setCurrentView('journalEntries')}
            style={{
              marginRight: '12px',
              cursor: 'pointer'
            }}
          >
            <FileText size={20} />
            <span>Journal</span>
          </div>
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

        <button
          className="burger-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {mobileMenuOpen && (
          <>
            <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
            <nav className="mobile-nav">
              <div className="mobile-nav-header">
                <span className="mobile-nav-title">Menu</span>
                <button
                  className="mobile-nav-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              <div
                className="mobile-nav-item"
                onClick={() => { setCurrentView('calendar'); setMobileMenuOpen(false); }}
              >
                <CalendarIcon size={20} />
                <span>Calendar</span>
              </div>
              <div
                className="mobile-nav-item"
                onClick={() => { setCurrentView('journalEntries'); setMobileMenuOpen(false); }}
              >
                <FileText size={20} />
                <span>Journal Entries</span>
              </div>
              <div
                className="mobile-nav-item"
                onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }}
              >
                <User size={20} />
                <span>Profile</span>
              </div>
              <div className="mobile-nav-separator" />
              <div
                className="mobile-nav-item mobile-nav-item-danger"
                onClick={() => { setMobileMenuOpen(false); logout(); }}
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </div>
            </nav>
          </>
        )}
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
            const hasJournal = journalEntries[dateKey]?.content && journalEntries[dateKey].content.trim() !== '';

            const dayTrades = getTradesForDate(day);
            const dayPnL = calculatePnL(dayTrades);
            const hasTrades = dayTrades.length > 0;

            // Get unique tags for this day (from trades only)
            const tradeTags = dayTrades.flatMap(trade =>
              Array.isArray(trade.tags)
                ? trade.tags.map(t => typeof t === 'string' ? t : t.name)
                : []
            );
            const dayTags = [...new Set(tradeTags)];
            const uniqueTagsWithColors = dayTags
              .map(tagName => availableTags.find(t => t.name === tagName))
              .filter(Boolean)
              .slice(0, 3); // Limit to 3 tags

            return (
              <div
                className={`day-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${isFuture ? 'disabled' : ''}`}
                key={idx}
                onClick={() => !isFuture && openModal(day, false)}
                style={{ cursor: isFuture ? 'not-allowed' : 'pointer' }}
              >
                <span className="day-number">{format(day, 'd')}</span>
                {hasTrades && (
                  <span className={`day-pnl ${Math.abs(dayPnL) < 0.01 ? '' : (dayPnL >= 0 ? 'profit' : 'loss')}`}>
                    {Math.abs(dayPnL) < 0.01 ? '' : (dayPnL >= 0 ? '+' : '-')}{symbol}{Math.abs(dayPnL).toFixed(2)}
                  </span>
                )}
                {uniqueTagsWithColors.length > 0 && (
                  <div className="day-tags">
                    {uniqueTagsWithColors.map((tag, idx) => (
                      <span
                        key={idx}
                        className="tag-tooltip-anchor"
                      >
                        <span
                          className="day-tag"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="tag-hover-tooltip">
                          <span className="tag-hover-title">{tag.name}</span>
                          {tag.description && <span className="tag-hover-desc">{tag.description}</span>}
                        </span>
                      </span>
                    ))}
                    {dayTags.length > 3 && (
                      <span className="day-tag-more tag-tooltip-anchor">
                        +{dayTags.length - 3}
                        <span className="tag-hover-tooltip">
                          <span className="tag-hover-title">+{dayTags.length - 3} more tags</span>
                          <span className="tag-hover-desc">{dayTags.slice(3).join(' • ')}</span>
                        </span>
                      </span>
                    )}
                  </div>
                )}
                {hasJournal && (
                  <span
                    className="journal-indicator"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewJournalEntry(format(day, 'yyyy-MM-dd'));
                    }}
                  >
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
            const hasJournal = journalEntries[dateKey]?.content && journalEntries[dateKey].content.trim() !== '';

            const dayTrades = getTradesForDate(day);
            const dayPnL = calculatePnL(dayTrades);
            const hasTrades = dayTrades.length > 0;

            // Get unique tags for this day (from trades only)
            const tradeTags = dayTrades.flatMap(trade =>
              Array.isArray(trade.tags)
                ? trade.tags.map(t => typeof t === 'string' ? t : t.name)
                : []
            );
            const dayTags = [...new Set(tradeTags)];
            const uniqueTagsWithColors = dayTags
              .map(tagName => availableTags.find(t => t.name === tagName))
              .filter(Boolean)
              .slice(0, 4); // Limit to 4 tags

            return (
              <div
                key={idx}
                className={`week-day-item ${isToday(day) ? 'week-day-today' : ''} ${isFuture ? 'disabled' : ''}`}
                style={{ animationDelay: `${idx * 50}ms`, cursor: isFuture ? 'not-allowed' : 'pointer', opacity: isFuture ? 0.5 : 1 }}
                onClick={() => !isFuture && openModal(day, false)}
              >
                <div className="week-day-left">
                  <div className={`week-day-number ${isToday(day) ? 'week-day-number-today' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="week-day-info">
                    <span className="week-day-name">{format(day, 'EEEE')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {hasJournal && (
                        <span
                          className="journal-badge"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewJournalEntry(format(day, 'yyyy-MM-dd'));
                          }}
                        >
                          <FileText size={14} strokeWidth={1.5} color="#e2e8f0" />
                          Journal
                        </span>
                      )}
                      {uniqueTagsWithColors.length > 0 && (
                        <div className="week-tags">
                          {uniqueTagsWithColors.map((tag, tidx) => (
                            <span
                              key={tidx}
                              className="tag-tooltip-anchor"
                            >
                              <span
                                className="week-tag"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                              <span className="tag-hover-tooltip">
                                <span className="tag-hover-title">{tag.name}</span>
                                {tag.description && <span className="tag-hover-desc">{tag.description}</span>}
                              </span>
                            </span>
                          ))}
                          {dayTags.length > 4 && (
                            <span className="week-tag-more tag-tooltip-anchor">
                              +{dayTags.length - 4}
                              <span className="tag-hover-tooltip">
                                <span className="tag-hover-title">+{dayTags.length - 4} more tags</span>
                                <span className="tag-hover-desc">{dayTags.slice(4).join(' • ')}</span>
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="week-day-right">
                  {hasTrades ? (
                    <span className={`week-day-pnl ${Math.abs(dayPnL) < 0.01 ? '' : (dayPnL >= 0 ? 'positive' : 'negative')}`} style={{ fontWeight: '600' }}>
                      {Math.abs(dayPnL) < 0.01 ? '' : (dayPnL >= 0 ? '+' : '-')}{symbol}{Math.abs(dayPnL).toFixed(2)}
                    </span>
                  ) : (
                    <span className="week-day-empty">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const formatSignedCurrency = (value) => {
      const prefix = Math.abs(value) < 0.01 ? '' : value >= 0 ? '+' : '-';
      return `${prefix}${symbol}${Math.abs(value).toFixed(2)}`;
    };

    const getPnLClass = (value) => {
      if (Math.abs(value) < 0.01) return '';
      return value >= 0 ? 'positive' : 'negative';
    };

    return (
      <div key="year-view" className="year-view-container animate-fade-in">
        <div className="year-view-header-wrapper">
          <div className="year-view-header">
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={prevPeriod}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="year-view-title">
              <span className="year-view-year">{yearReviewData.year}</span>
            </div>
            <button className="premium-month-btn hover:scale-110 transition-transform" onClick={nextPeriod}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="year-review-kpis">
          <div className="info-card year-review-kpi">
            <span className="info-label">Net P&L</span>
            <div className={`info-value ${getPnLClass(yearReviewData.totalPnL)}`}>
              {formatSignedCurrency(yearReviewData.totalPnL)}
            </div>
            <div className="info-subtext">{yearReviewData.totalTrades} total trades</div>
          </div>
          <div className="info-card year-review-kpi">
            <span className="info-label">Expectancy / Trade</span>
            <div className={`info-value ${getPnLClass(yearReviewData.expectancy)}`}>
              {formatSignedCurrency(yearReviewData.expectancy)}
            </div>
            <div className="info-subtext">Average outcome per trade</div>
          </div>
          <div className="info-card year-review-kpi">
            <span className="info-label">Profitable Months</span>
            <div className="info-value">
              {yearReviewData.profitableMonths}/{yearReviewData.tradedMonths || 0}
            </div>
            <div className="info-subtext">{yearReviewData.profitableMonthRate.toFixed(0)}% of traded months</div>
          </div>
          <div className="info-card year-review-kpi">
            <span className="info-label">Max Drawdown</span>
            <div className={`info-value ${yearReviewData.maxDrawdown > 0 ? 'negative' : ''}`}>
              -{symbol}{yearReviewData.maxDrawdown.toFixed(2)}
            </div>
            <div className="info-subtext">Largest peak-to-trough drop</div>
          </div>
        </div>

        <div className="year-review-table-card">
          <div className="year-review-table-meta">
            Click a month to open the calendar and review execution day by day.
          </div>
          <div className="year-review-table-head">
            <span>Month</span>
            <span>Net</span>
            <span>Trades</span>
            <span>Win %</span>
            <span>Pattern Signal</span>
            <span></span>
          </div>
          <div className="year-review-table-body">
            {yearReviewData.monthRows.map((row) => (
              <button
                key={row.key}
                type="button"
                className={`year-review-row ${row.tradeCount === 0 ? 'empty' : ''}`}
                onClick={() => {
                  setCurrentDate(row.monthDate);
                  setActiveTab('Month');
                }}
              >
                <span className="year-review-cell year-review-month">{row.monthLongLabel}</span>
                <span className={`year-review-cell year-review-net ${getPnLClass(row.pnl)}`}>
                  {row.tradeCount > 0 ? formatSignedCurrency(row.pnl) : '—'}
                </span>
                <span className="year-review-cell year-review-trades">{row.tradeCount > 0 ? row.tradeCount : '—'}</span>
                <span className="year-review-cell year-review-winrate">
                  {row.tradeCount > 0 ? `${row.winRate.toFixed(0)}%` : '—'}
                </span>
                <span className="year-review-cell year-review-pattern">
                  <span className="year-review-pattern-good">{row.bestTag ? `+${row.bestTag.name}` : '—'}</span>
                  <span className="year-review-pattern-bad">{row.worstTag ? ` / -${row.worstTag.name}` : ''}</span>
                </span>
                <span className="year-review-cell year-review-open">
                  Inspect
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAllTimeView = () => {
    return <Analyze trades={trades} onEditTrade={handleEditTrade} onDeleteTrade={handleDeleteTrade} />;
  };


  const renderModal = () => {
    if (!selectedDate || readerModalOpen) return null;

    // Calculate today's stats for real-time insights
    const allTodayTrades = getTradesForDate(selectedDate).sort((a, b) => {
      // Sort by created_at timestamp (oldest first)
      return new Date(a.created_at) - new Date(b.created_at);
    });
    const todayPnL = calculatePnL(allTodayTrades);
    const editingTradeId = editingTrade?.id !== undefined && editingTrade?.id !== null
      ? String(editingTrade.id)
      : null;
    const todayTrades = editingTradeId
      ? allTodayTrades.filter((trade) => String(trade.id) !== editingTradeId)
      : allTodayTrades;
    const todayTradesPnL = calculatePnL(todayTrades);
    const todayTradeCount = todayTrades.length;
    const isJournalTab = modalTab === 'journal';
    const primaryStart = isJournalTab ? '#8b5cf6' : '#3b82f6';
    const primaryEnd = isJournalTab ? '#7c3aed' : '#2563eb';
    const primaryShadow = isJournalTab ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)';
    const primaryShadowHover = isJournalTab ? 'rgba(139, 92, 246, 0.36)' : 'rgba(59, 130, 246, 0.35)';

    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '680px' }}>
          {/* Unified Header - Date, Stats, Trades, Tabs all in one cohesive section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {/* Top row: Date + Tab switcher */}
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editingTrade ? <EditIcon size={20} strokeWidth={2.5} /> : <CalendarIcon size={20} strokeWidth={2.5} />}
                  {editingTrade ? 'Update Trade' : format(selectedDate, 'EEEE, MMM d')}
                </h2>

                {/* Daily total P&L - existing trades + current trade being entered */}
                {modalTab === 'add' && (() => {
                  const amount = parseFloat(formData.amount) || 0;
                  const fees = parseFloat(formData.fees) || 0;

                  // Calculate existing P&L, subtracting the trade being edited if applicable
                  let existingPnL = todayPnL;
                  if (editingTrade) {
                    const editAmount = parseFloat(editingTrade.amount) || 0;
                    const editFees = parseFloat(editingTrade.fees) || 0;
                    let editPnL = 0;
                    if (editingTrade.type === 'profit') {
                      editPnL = Math.abs(editAmount) - editFees;
                    } else if (editingTrade.type === 'loss') {
                      editPnL = -(Math.abs(editAmount) + editFees);
                    } else {
                      editPnL = -editFees;
                    }
                    existingPnL = todayPnL - editPnL;
                  }

                  // Calculate current trade P&L - only if amount is entered
                  // Always: amount - fees (type is just a label for validation)
                  let currentTradePnL = 0;
                  if (amount !== 0 || fees > 0) {
                    currentTradePnL = amount - fees;
                  }

                  const totalDailyPnL = existingPnL + currentTradePnL;

                  let displayColor = '#10b981';
                  let DisplayIcon = TrendingUp;
                  let prefix = '+';

                  if (Math.abs(totalDailyPnL) < 0.01) {
                    displayColor = '#64748b';
                    DisplayIcon = Minus;
                    prefix = '';
                  } else if (totalDailyPnL < 0) {
                    displayColor = '#ef4444';
                    DisplayIcon = TrendingDown;
                    prefix = '-';
                  }

                  return (
                    <div style={{
                      height: '2.5rem',
                      boxSizing: 'border-box',
                      padding: '0 0.75rem',
                      background: `${displayColor}15`,
                      borderRadius: '0.5rem',
                      border: `1px solid ${displayColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginLeft: 'auto'
                    }}>
                      <DisplayIcon size={16} color={displayColor} strokeWidth={2.5} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: displayColor }}>
                        {prefix}{symbol}{Math.abs(totalDailyPnL).toFixed(2)}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {!journalOnlyMode && (
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  padding: '0.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <button
                    onClick={() => {
                      switchModalTab('add');
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      height: '2rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: modalTab === 'add' ? 'var(--accent-blue)' : 'transparent',
                      color: modalTab === 'add' ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <PlusCircle size={14} />
                    Trade
                  </button>
                  <button
                    onClick={() => {
                      switchModalTab('journal');
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      height: '2rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: modalTab === 'journal' ? '#8b5cf6' : 'transparent',
                      color: modalTab === 'journal' ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FileText size={14} />
                    Journal
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-body modal-body-entry">
            <div
              className={`modal-tab-panel-shell ${isModalTabAnimating ? 'animating' : ''}`}
              style={modalTabPanelHeight !== null ? { height: `${modalTabPanelHeight}px` } : undefined}
            >
              {viewingJournal ? (
                <div className="journal-view-container" style={{ padding: '1rem 0' }}>
                  <div
                    className="journal-view-content"
                    dangerouslySetInnerHTML={{ __html: journalContent }}
                    style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}
                  />
                </div>
              ) : modalTab === 'add' ? (
                <div ref={modalTradePanelRef} key="trade-tab" className="tab-content-animate modal-tab-panel">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveEntry(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Compact, focused input fields */}
                <div className="modal-form-row">
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Symbol
                    </label>
                    <input
                      ref={symbolInputRef}
                      id="symbol"
                      name="symbol"
                      type="text"
                      placeholder="SPY"
                      value={formData.symbol}
                      onChange={(e) => {
                        handleInputChange(e);
                        setSymbolDropdownOpen(true);
                        // Auto-select first match for quick entry
                        const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort();
                        const filteredSymbols = uniqueSymbols.filter(s =>
                          s.toLowerCase().includes(e.target.value.toLowerCase())
                        );
                        setSelectedSymbolIndex(filteredSymbols.length > 0 ? 0 : -1);
                      }}
                      onKeyDown={(e) => {
                        const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort();
                        const filteredSymbols = uniqueSymbols.filter(s =>
                          s.toLowerCase().includes(formData.symbol.toLowerCase())
                        );

                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setSelectedSymbolIndex(prev =>
                            prev < filteredSymbols.length - 1 ? prev + 1 : prev
                          );
                          setSymbolDropdownOpen(true);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSelectedSymbolIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter' && selectedSymbolIndex >= 0 && symbolDropdownOpen) {
                          e.preventDefault();
                          setFormData(prev => ({ ...prev, symbol: filteredSymbols[selectedSymbolIndex] }));
                          setSymbolDropdownOpen(false);
                          setSelectedSymbolIndex(-1);
                        } else if (e.key === 'Escape') {
                          setSymbolDropdownOpen(false);
                          setSelectedSymbolIndex(-1);
                        }
                      }}
                      onFocus={() => {
                        if (formData.symbol) {
                          setSymbolDropdownOpen(true);
                          // Auto-select first match
                          const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort();
                          const filteredSymbols = uniqueSymbols.filter(s =>
                            s.toLowerCase().includes(formData.symbol.toLowerCase())
                          );
                          setSelectedSymbolIndex(filteredSymbols.length > 0 ? 0 : -1);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on dropdown item
                        setTimeout(() => {
                          setSymbolDropdownOpen(false);
                          setSelectedSymbolIndex(-1);
                        }, 200);
                      }}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        fontSize: '0.875rem',
                        border: `1px solid ${!formData.symbol && (formData.amount || formData.category) ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.15s'
                      }}
                      required
                    />
                    {/* Autocomplete dropdown */}
                    {symbolDropdownOpen && formData.symbol && (() => {
                      const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort();
                      const filteredSymbols = uniqueSymbols.filter(s =>
                        s.toLowerCase().includes(formData.symbol.toLowerCase())
                      );

                      if (filteredSymbols.length === 0) return null;

                      return (
                        <div className="dropdown-animate" style={{
                          position: 'absolute',
                          top: 'calc(100% + 0.25rem)',
                          left: 0,
                          right: 0,
                          background: '#1e293b',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '0.5rem',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                          zIndex: 100
                        }}>
                          {filteredSymbols.map((symbol, index) => (
                            <div
                              key={symbol}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData(prev => ({ ...prev, symbol }));
                                setSymbolDropdownOpen(false);
                                setSelectedSymbolIndex(-1);
                              }}
                              onMouseEnter={() => setSelectedSymbolIndex(index)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                background: selectedSymbolIndex === index ? 'var(--accent-blue)' : 'transparent',
                                color: selectedSymbolIndex === index ? 'white' : '#e2e8f0',
                                transition: 'all 0.15s'
                              }}
                            >
                              {symbol}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Amount
                    </label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        fontSize: '0.875rem',
                        border: `1px solid ${!formData.amount && (formData.symbol || formData.category) ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.15s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                      onBlur={(e) => e.target.style.borderColor = !formData.amount && (formData.symbol || formData.category) ? '#ef4444' : 'var(--border-color)'}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Fees
                    </label>
                    <input
                      id="fees"
                      name="fees"
                      type="text"
                      placeholder="0.00"
                      value={formData.fees}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or valid positive float (with up to 2 decimal places)
                        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                          handleInputChange(e);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        fontSize: '0.875rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.15s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                      Market
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="category-input"
                        name="category"
                        type="text"
                        placeholder="Stocks, Options, etc."
                        value={formData.category}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, category: e.target.value }));
                          setCategoryOpen(true);
                          // Auto-select first match, prioritizing recent markets
                          const searchTerm = e.target.value.toLowerCase();
                          const recentFiltered = recentMarkets.filter(m => m.toLowerCase().includes(searchTerm));
                          const remainingCategories = categories.filter(c =>
                            !recentMarkets.includes(c) && c.toLowerCase().includes(searchTerm)
                          );
                          const filteredCategories = [...recentFiltered, ...remainingCategories];
                          setSelectedCategoryIndex(filteredCategories.length > 0 ? 0 : -1);
                        }}
                        onKeyDown={(e) => {
                          const searchTerm = formData.category.toLowerCase();
                          const recentFiltered = recentMarkets.filter(m => m.toLowerCase().includes(searchTerm));
                          const remainingCategories = categories.filter(c =>
                            !recentMarkets.includes(c) && c.toLowerCase().includes(searchTerm)
                          );
                          const filteredCategories = [...recentFiltered, ...remainingCategories];

                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedCategoryIndex(prev =>
                              prev < filteredCategories.length - 1 ? prev + 1 : prev
                            );
                            setCategoryOpen(true);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedCategoryIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && selectedCategoryIndex >= 0 && categoryOpen) {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, category: filteredCategories[selectedCategoryIndex] }));
                            setCategoryOpen(false);
                            setSelectedCategoryIndex(-1);
                          } else if (e.key === 'Escape') {
                            setCategoryOpen(false);
                            setSelectedCategoryIndex(-1);
                          }
                        }}
                        onFocus={() => {
                          setCategoryOpen(true);
                          // Show all options when focused, prioritizing recent markets
                          const searchTerm = formData.category.toLowerCase();
                          const recentFiltered = recentMarkets.filter(m => m.toLowerCase().includes(searchTerm));
                          const remainingCategories = categories.filter(c =>
                            !recentMarkets.includes(c) && c.toLowerCase().includes(searchTerm)
                          );
                          const filteredCategories = formData.category
                            ? [...recentFiltered, ...remainingCategories]
                            : [...recentMarkets, ...categories.filter(c => !recentMarkets.includes(c))];
                          setSelectedCategoryIndex(filteredCategories.length > 0 ? 0 : -1);
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown item
                          setTimeout(() => {
                            setCategoryOpen(false);
                            setSelectedCategoryIndex(-1);
                          }, 200);
                        }}
                        autoComplete="off"
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          fontSize: '0.875rem',
                          border: `1px solid ${!formData.category && (formData.symbol || formData.amount) ? '#ef4444' : 'var(--border-color)'}`,
                          borderRadius: '0.5rem',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'border-color 0.15s'
                        }}
                        required
                      />
                      {/* Autocomplete dropdown */}
                      {categoryOpen && (() => {
                        // Prioritize recent markets, then show remaining categories
                        const searchTerm = formData.category.toLowerCase();
                        const recentFiltered = recentMarkets.filter(m =>
                          m.toLowerCase().includes(searchTerm)
                        );
                        const remainingCategories = categories.filter(c =>
                          !recentMarkets.includes(c) && c.toLowerCase().includes(searchTerm)
                        );
                        const filteredCategories = formData.category
                          ? [...recentFiltered, ...remainingCategories]
                          : [...recentMarkets, ...categories.filter(c => !recentMarkets.includes(c))];

                        if (filteredCategories.length === 0) return null;

                        return (
                          <div className="dropdown-animate" style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.25rem)',
                            left: 0,
                            right: 0,
                            background: '#1e293b',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '0.5rem',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                            zIndex: 100
                          }}>
                            {filteredCategories.map((cat, index) => (
                              <div
                                key={cat}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData(prev => ({ ...prev, category: cat }));
                                  setCategoryOpen(false);
                                  setSelectedCategoryIndex(-1);
                                }}
                                onMouseEnter={() => setSelectedCategoryIndex(index)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.8125rem',
                                  cursor: 'pointer',
                                  background: selectedCategoryIndex === index ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                  color: selectedCategoryIndex === index ? '#60a5fa' : '#e2e8f0',
                                  transition: 'background 0.15s'
                                }}
                              >
                                {cat}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Historic trades for this day (collapsible) */}
                {todayTradeCount > 0 && (
                  <div className="today-trades-block">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Trades
                    </label>
                    <div className="today-trades-panel">
                      <button
                        type="button"
                        onClick={() => setTradesExpanded(!tradesExpanded)}
                        className="today-trades-toggle"
                      >
                        <div className="today-trades-summary">
                          <span className="today-trades-count">
                            {todayTradeCount} {todayTradeCount === 1 ? 'trade' : 'trades'}
                          </span>
                          <span className={`today-trades-total ${Math.abs(todayTradesPnL) < 0.01 ? 'neutral' : (todayTradesPnL >= 0 ? 'positive' : 'negative')}`}>
                            {Math.abs(todayTradesPnL) < 0.01 ? '' : (todayTradesPnL >= 0 ? '+' : '-')}{symbol}{Math.abs(todayTradesPnL).toFixed(2)}
                          </span>
                        </div>
                        <ChevronRight
                          size={14}
                          className={`today-trades-chevron ${tradesExpanded ? 'expanded' : ''}`}
                        />
                      </button>

                      <div className={`today-trades-list ${tradesExpanded ? 'expanded' : ''}`} aria-hidden={!tradesExpanded}>
                        {todayTrades.map((trade, tradeIndex) => {
                          const amount = parseFloat(trade.amount) || 0;
                          const fees = parseFloat(trade.fees) || 0;
                          // Always: amount - fees
                          const pnl = amount - fees;
                          const tradeTagNames = Array.isArray(trade.tags)
                            ? trade.tags
                              .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
                              .filter(Boolean)
                            : [];
                          const tradeTagDetails = tradeTagNames
                            .map((tagName) => availableTags.find((tag) => tag.name === tagName) || { name: tagName, color: '#3b82f6' })
                            .slice(0, 3);
                          const overflowTagCount = tradeTagNames.length - tradeTagDetails.length;

                          return (
                            <div
                              key={trade.id}
                              className="today-trade-row"
                              style={{ '--today-trade-delay': `${Math.min(tradeIndex * 45, 220)}ms` }}
                              onClick={() => handleEditTrade(trade)}
                            >
                              <div className="today-trade-main">
                                <div className="today-trade-line">
                                  <span className="today-trade-symbol">{trade.symbol}</span>
                                  <span className="today-trade-separator">-</span>
                                  <span className="today-trade-market">{trade.category}</span>
                                  {tradeTagDetails.length > 0 && (
                                    <div className="today-trade-tags-inline">
                                      {tradeTagDetails.map((tag) => (
                                        <span
                                          key={`${trade.id}-${tag.name}`}
                                          className="today-trade-tag"
                                          style={{
                                            backgroundColor: `${tag.color}1A`,
                                            borderColor: `${tag.color}4D`,
                                            color: tag.color
                                          }}
                                        >
                                          {tag.name}
                                        </span>
                                      ))}
                                      {overflowTagCount > 0 && (
                                        <span className="today-trade-tag today-trade-tag-more">
                                          +{overflowTagCount}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="today-trade-actions">
                                <span className={`today-trade-pnl ${Math.abs(pnl) < 0.01 ? 'neutral' : (pnl >= 0 ? 'positive' : 'negative')}`}>
                                  {Math.abs(pnl) < 0.01 ? '' : (pnl >= 0 ? '+' : '-')}{symbol}{Math.abs(pnl).toFixed(2)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrade(trade.id);
                                }}
                                className="today-trade-delete"
                                title="Delete trade"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick tags - all available for instant selection */}
                {availableTags.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Tags (optional)
                    </label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem',
                      alignItems: 'center'
                    }}>
                      {availableTags.map((tag) => {
                          const isSelected = formData.tags.includes(tag.name);
                          return (
                            <button
                              key={tag.name}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  handleRemoveTag(tag.name);
                                } else {
                                  handleAddTag(tag.name);
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.375rem 0.625rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                border: `1px solid ${isSelected ? `${tag.color}4D` : 'rgba(148, 163, 184, 0.2)'}`,
                                color: isSelected ? tag.color : 'var(--text-primary)',
                                background: isSelected ? `${tag.color}1A` : 'rgba(148, 163, 184, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                                fontWeight: 500
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = tag.color;
                                  e.currentTarget.style.color = tag.color;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                }
                              }}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setShowAddTagModal(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.625rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.08)',
                            border: '1px dashed rgba(59, 130, 246, 0.3)',
                            color: 'var(--accent-blue)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                            fontWeight: 500
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                            e.currentTarget.style.borderStyle = 'solid';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                            e.currentTarget.style.borderStyle = 'dashed';
                          }}
                        >
                          <PlusCircle size={12} />
                          Add tag
                        </button>
                      </div>
                    </div>
                )}

                </form>
                </div>
              ) : modalTab === 'journal' ? (
                <div ref={modalJournalPanelRef} key="journal-tab" className="journal-editor-container tab-content-animate modal-tab-panel">
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
                  data-placeholder="Write your trading journal here... You can paste screenshots directly (Ctrl+V)"
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
            </div>

            {/* Action buttons with keyboard shortcuts */}
            {!viewingJournal && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => closeModal(false)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-primary)';
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEntry}
                    style={{
                      flex: 2,
                      background: `linear-gradient(135deg, ${primaryStart} 0%, ${primaryEnd} 100%)`,
                      border: 'none',
                      color: 'white',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: `0 4px 12px ${primaryShadow}`,
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 16px ${primaryShadowHover}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${primaryShadow}`;
                    }}
                  >
                    {editingTrade ? <EditIcon size={16} strokeWidth={2.5} /> : <PlusCircle size={16} strokeWidth={2.5} />}
                    <span>{editingTrade ? 'Update Trade' : 'Save Entry'}</span>
                    <span style={{
                      position: 'absolute',
                      right: '1rem',
                      fontSize: '0.6875rem',
                      opacity: 0.7,
                      fontWeight: 500,
                      letterSpacing: '0.025em'
                    }}>
                      ⌘↵
                    </span>
                  </button>
                </div>
                <p className="modal-keyboard-hints">
                  <kbd>⌘M</kbd> new entry • <kbd>⌥←/→</kbd> switch tabs • <kbd>⌘↵</kbd> save • <kbd>Esc</kbd> cancel
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    if (activeTab === 'Year') {
      const formatSignedCurrency = (value) => {
        const prefix = Math.abs(value) < 0.01 ? '' : value >= 0 ? '+' : '-';
        return `${prefix}${symbol}${Math.abs(value).toFixed(2)}`;
      };

      const getPnLClass = (value) => {
        if (Math.abs(value) < 0.01) return '';
        return value >= 0 ? 'positive' : 'negative';
      };

      return (
        <aside className="sidebar-section year-review-sidebar">
          <h2 className="sidebar-title">{yearReviewData.year} Playbook</h2>

          <div className="info-card">
            <span className="info-label">Repeat More</span>
            <div className="year-playbook-title">
              {yearReviewData.repeatItem
                ? `${yearReviewData.repeatItem.source}: ${yearReviewData.repeatItem.name}`
                : 'No strong edge pattern yet'}
            </div>
            <div className={`year-playbook-value ${getPnLClass(yearReviewData.repeatItem?.pnl || 0)}`}>
              {yearReviewData.repeatItem
                ? `${formatSignedCurrency(yearReviewData.repeatItem.pnl)} across ${yearReviewData.repeatItem.count} trades`
                : 'Add more tagged and categorized trades to identify repeatable edge.'}
            </div>
          </div>

          <div className="info-card">
            <span className="info-label">Cut This Leak</span>
            <div className="year-playbook-title">
              {yearReviewData.avoidItem
                ? `${yearReviewData.avoidItem.source}: ${yearReviewData.avoidItem.name}`
                : 'No recurring leak detected'}
            </div>
            <div className={`year-playbook-value ${getPnLClass(yearReviewData.avoidItem?.pnl || 0)}`}>
              {yearReviewData.avoidItem
                ? `${formatSignedCurrency(yearReviewData.avoidItem.pnl)} across ${yearReviewData.avoidItem.count} trades`
                : 'Good sign: no repeated losing pattern with enough sample size.'}
            </div>
          </div>

          <div className="info-card">
            <span className="info-label">Review Queue</span>
            <div className="year-playbook-sub">Most expensive days first. Open and annotate before next session.</div>
            <div className="year-review-queue">
              {yearReviewData.reviewQueue.length > 0 ? yearReviewData.reviewQueue.map((day) => (
                <button
                  key={day.dateKey}
                  type="button"
                  className="year-review-queue-item"
                  onClick={() => openModal(new Date(day.dateKey), false)}
                >
                  <span className="year-review-queue-date">{format(new Date(day.dateKey), 'EEE, MMM d')}</span>
                  <span className={`year-review-queue-pnl ${getPnLClass(day.pnl)}`}>
                    {formatSignedCurrency(day.pnl)}
                  </span>
                </button>
              )) : (
                <div className="year-playbook-sub">No trade days found for this year.</div>
              )}
            </div>
          </div>
        </aside>
      );
    }

    // Determine date range and title based on active tab
    let startDate, endDate, title;

    if (activeTab === 'Week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      title = `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
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
      const amount = Math.abs(parseFloat(trade.amount) || 0);
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
      ? profitTrades.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)) - parseFloat(t.fees || 0), 0) / profitTrades.length
      : 0;

    const avgLoss = lossTrades.length > 0
      ? lossTrades.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)) + parseFloat(t.fees || 0), 0) / lossTrades.length
      : 0;

    const totalPnL = calculatePnL(periodTrades);

    return (
      <aside className="sidebar-section">
        <h2 className="sidebar-title">{title}</h2>

        <div className="info-card">
          <span className="info-label">Net Total</span>
          <div className={`info-value ${Math.abs(totalPnL) < 0.01 ? '' : (totalPnL >= 0 ? 'positive' : 'negative')}`}>
            {Math.abs(totalPnL) < 0.01 ? '' : (totalPnL >= 0 ? '+' : '-')}{symbol}{Math.abs(totalPnL).toFixed(2)}
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
            <span className={`perf-value ${Math.abs(bestDay) < 0.01 ? '' : (bestDay >= 0 ? 'positive' : 'negative')}`}>
              {Math.abs(bestDay) < 0.01 ? '' : (bestDay >= 0 ? '+' : '-')}{symbol}{Math.abs(bestDay).toFixed(2)}
            </span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Worst Day</span>
            <span className={`perf-value ${Math.abs(worstDay) < 0.01 ? '' : (worstDay >= 0 ? 'positive' : 'negative')}`}>
              {Math.abs(worstDay) < 0.01 ? '' : (worstDay >= 0 ? '+' : '-')}{symbol}{Math.abs(worstDay).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="info-card">
          <span className="info-label">Average Stats</span>
          <div className="perf-row">
            <span className="perf-label">Avg Win</span>
            <span className={`perf-value ${Math.abs(avgWin) < 0.01 ? '' : 'positive'}`}>
              {Math.abs(avgWin) < 0.01 ? '' : '+'}{symbol}{avgWin.toFixed(2)}
            </span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Avg Loss</span>
            <span className={`perf-value ${Math.abs(avgLoss) < 0.01 ? '' : 'negative'}`}>
              {Math.abs(avgLoss) < 0.01 ? '' : '-'}{symbol}{avgLoss.toFixed(2)}
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
      >
        <div
          className="modal-content"
          style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
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
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.2)';
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
        <div className="modal-content" style={{
          maxWidth: '440px',
          padding: '0',
          overflow: 'hidden'
        }}>
          <button
            className="close-modal"
            onClick={() => setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null })}
            style={{ zIndex: 10 }}
          >
            <X size={20} />
          </button>

          {/* Header with gradient background */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            padding: '2rem 2rem 1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {confirmModal.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{
            padding: '2rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            fontSize: '0.9375rem'
          }}>
            {confirmModal.message}
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem 2rem',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              onClick={() => setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null })}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-color)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm && confirmModal.onConfirm();
                setConfirmModal({ open: false, message: '', title: 'Confirm', onConfirm: null });
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
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

    // Determine if it's an error or info based on title
    const isError = alertModal.title?.toLowerCase().includes('error') ||
                    alertModal.title?.toLowerCase().includes('failed') ||
                    alertModal.title?.toLowerCase().includes('invalid');

    return (
      <div className="modal-overlay" style={{ zIndex: 10000 }}>
        <div className="modal-content" style={{
          maxWidth: '440px',
          padding: '0',
          overflow: 'hidden'
        }}>
          <button
            className="close-modal"
            onClick={() => setAlertModal({ ...alertModal, open: false })}
            style={{ zIndex: 10 }}
          >
            <X size={20} />
          </button>

          {/* Header with gradient background */}
          <div style={{
            background: isError
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
            padding: '2rem 2rem 1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: isError
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isError
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(59, 130, 246, 0.3)',
                flexShrink: 0
              }}>
                {isError ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {alertModal.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{
            padding: '2rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            fontSize: '0.9375rem'
          }}>
            {alertModal.message}
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem 2rem',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setAlertModal({ ...alertModal, open: false })}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: isError
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isError
                  ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                  : '0 2px 8px rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = isError
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isError
                  ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                  : '0 2px 8px rgba(59, 130, 246, 0.2)';
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {renderHeader()}

      {currentView === 'analyze' ? (
        <Analyze trades={trades} onEditTrade={handleEditTrade} onDeleteTrade={handleDeleteTrade} />
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
          availableTags={availableTags}
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
                Journal
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
      {showSaveSuccess && (
        <div className="save-success-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Saved!
        </div>
      )}
      {showAddTagModal && (
        <AddTagModal
          onClose={() => setShowAddTagModal(false)}
          onSave={handleSaveNewTag}
        />
      )}
    </div>
  );
}

export default App;
