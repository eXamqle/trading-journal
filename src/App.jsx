import React, { useState } from 'react';
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
  Twitter,
  MessageCircle,
  Minus,
  X,
  ListFilter,
  LogOut
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

function App() {
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
  const [formData, setFormData] = useState({
    symbol: '',
    amount: '',
    category: '',
    fees: '',
    notes: ''
  });

  const categories = ['Forex', 'Stocks', 'Crypto', 'Options', 'Indices', 'Other'];

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

  const openModal = (date) => {
    if (activeTab === 'Week' || isSameMonth(date, startOfMonth(currentDate))) {
      setSelectedDate(date);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
    setModalTab('add');
    setTradeType('profit');
    setFormData({
      symbol: '',
      amount: '',
      category: '',
      fees: '',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTrade = {
      id: Date.now().toString(),
      date: selectedDate,
      type: tradeType,
      symbol: formData.symbol,
      amount: formData.amount,
      category: formData.category,
      fees: formData.fees || '0',
      notes: formData.notes
    };

    setTrades(prevTrades => [...prevTrades, newTrade]);
    closeModal();
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
              <span>John Doe</span>
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
                  <div className="profile-dropdown-item profile-dropdown-item-danger" onClick={() => alert('Sign out clicked')}>
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
    return (
      <div className="top-stats">
        <div className="week-total-card week-total-profit">
          <div className="week-total-icon">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="week-total-label">Monthly Net Total</p>
            <p className="week-total-amount">$0.00</p>
          </div>
        </div>
        <div className="week-total-card week-total-profit">
          <div className="week-total-icon">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="week-total-label">Annual Net Total</p>
            <p className="week-total-amount">$0.00</p>
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
          {allDays.map((day, idx) => (
            <div
              className={`day-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
              key={idx}
              onClick={() => openModal(day)}
            >
              <span className="day-number">{format(day, 'd')}</span>
            </div>
          ))}
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
      <div className="week-view-container animate-fade-in">
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

        <div className="week-total-card week-total-profit">
          <div className="week-total-icon">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="week-total-label">Total P&L</p>
            <p className="week-total-amount">+$0.00</p>
          </div>
        </div>

        <div className="week-days-list">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`week-day-item ${isToday(day) ? 'week-day-today' : ''}`}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => openModal(day)}
            >
              <div className="week-day-left">
                <div className={`week-day-number ${isToday(day) ? 'week-day-number-today' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="week-day-info">
                  <span className="week-day-name">{format(day, 'EEEE')}</span>
                </div>
              </div>
              <div className="week-day-right">
                <span className="week-day-empty">—</span>
                <ChevronRight className="h-4 w-4 text-slate-500 ml-2" size={16} />
              </div>
            </div>
          ))}
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
        const title = `${format(date, 'MMM d')}: $0.00`;

        cells.push(
          <div
            key={day}
            className={`year-mini-day neutral ${isTodayDate ? 'today' : ''}`}
            title={title}
            onClick={() => setSelectedDate(date)}
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

        <div className="year-total-card year-total-profit">
          <div className="year-total-icon">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="year-total-label">Total P&L</p>
            <p className="year-total-amount">$0</p>
            <p className="year-total-sublabel">in {currentYear}</p>
          </div>
        </div>

        <div className="year-months-grid">
          {months.map((month, idx) => (
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
              <div className="year-month-total text-slate-500">
                <span className="text-slate-600">$0</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedDate) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                className={`modal-tab ${modalTab === 'history' ? 'active' : ''}`}
                onClick={() => setModalTab('history')}
              >
                <ListFilter size={14} />
                History
              </button>
            </div>

            {modalTab === 'add' ? (
              <form onSubmit={handleSubmit}>
                <div className="form-field full-width">
                  <label className="form-label">Trade Result</label>
                  <div className="trade-type-grid">
                    <div
                      className={`trade-type-option ${tradeType === 'profit' ? 'selected' : ''}`}
                      onClick={() => setTradeType('profit')}
                    >
                      <div className="trade-type-icon">
                        <TrendingUp size={16} />
                      </div>
                      <span className="trade-type-label">Profit</span>
                    </div>
                    <div
                      className={`trade-type-option ${tradeType === 'loss' ? 'selected' : ''}`}
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
                    <label className="form-label" htmlFor="symbol">Symbol</label>
                    <input
                      id="symbol"
                      name="symbol"
                      type="text"
                      className="form-input"
                      placeholder="e.g. BTCUSDT"
                      value={formData.symbol}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="amount">Amount ($)</label>
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
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="category">Category</label>
                    <div className="dropdown-container">
                      <button
                        type="button"
                        className="dropdown-trigger"
                        onClick={() => setCategoryOpen(!categoryOpen)}
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

                <button type="submit" className="form-submit">
                  <PlusCircle size={20} />
                  Add Entry
                </button>
              </form>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No entries for this date yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    return (
      <aside className="sidebar-section">
        <h2 className="sidebar-title">{format(currentDate, 'MMMM yyyy')} Statistics</h2>

        <div className="info-card">
          <span className="info-label">Win Rate</span>
          <div className="info-value">0.0%</div>
          <div className="info-subtext">0W / 0L</div>
        </div>

        <div className="info-card">
          <span className="info-label">Total Trades</span>
          <div className="info-value">0</div>
          <div className="info-subtext">{format(currentDate, 'MMMM')}</div>
        </div>

        <div className="info-card">
          <span className="info-label">Daily Performance</span>
          <div className="perf-row">
            <span className="perf-label">Best Day</span>
            <span className="perf-value positive">$0.00</span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Worst Day</span>
            <span className="perf-value positive">$0.00</span>
          </div>
        </div>

        <div className="info-card">
          <span className="info-label">Average Stats</span>
          <div className="perf-row">
            <span className="perf-label">Avg Win</span>
            <span className="perf-value positive">$0.00</span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Avg Loss</span>
            <span className="perf-value positive">$0.00</span>
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
               renderCalendar()}
            </div>
            {renderSidebar()}
          </main>

          {renderModal()}
        </>
      )}
    </div>
  );
}

export default App;
