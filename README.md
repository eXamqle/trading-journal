# Trading Journal & Calendar 📊💰

A modern, feature-rich trading journal application to track, analyze, and improve your trading performance. Built with React and designed for traders who want to maintain detailed records of their trades and gain insights into their trading patterns.

## ✨ Features

### 📅 Calendar Views
- **Month View**: Traditional calendar grid with 5-day or 7-day week options
- **Week View**: Detailed weekly breakdown with daily trade summaries
- **Year View**: Annual overview with mini-calendars for each month
- **All Time View**: Complete historical data access

### 📈 Trade Management
- **Quick Entry Modal**: Add trades with a single click on any date
- **Trade Types**: Track profits, losses, and break-even trades
- **Categories**: Organize trades by market type (Forex, Stocks, Crypto, Options, Indices, Other)
- **Details**: Record symbol, amount, fees, and personal notes for each trade
- **Trade History**: View all entries for any specific date

### 📊 Analytics Dashboard
- **Key Performance Indicators (KPIs)**:
  - Net Profit with fee tracking
  - Win Rate percentage with W/L breakdown
  - Profit Factor (gross profit/loss ratio)
  - Total trade count with breakeven trades
- **Time Period Filters**: This Week, This Month, Last 30 Days, This Year, All Time
- **Trade List Table**: Searchable and filterable list of all trades
- **Advanced Filters**:
  - Symbol search
  - Type filter (Profit/Loss/Break Even)
  - Category filter
- **Data Export**: Export trade data to CSV format

### 👤 User Profile
- **Account Settings**: Manage name and email
- **Security**: Change password with validation
- **Tabbed Interface**: Organized settings for easy navigation

### 🎨 UI/UX Features
- Dark theme optimized for extended use
- Responsive design for all screen sizes
- Smooth animations and transitions
- Intuitive navigation
- Color-coded trade results
- Interactive dropdowns and modals

## 🛠️ Tech Stack

- **Framework**: React 19.2.0
- **Date Utilities**: date-fns 4.1.0
- **Icons**: lucide-react 0.563.0
- **Build Tool**: Vite 7.2.4
- **Styling**: Custom CSS with CSS Variables
- **Language**: JavaScript (ES6+)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trading-journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## 🚀 Usage

### Adding a Trade

1. Navigate to any calendar view (Week/Month/Year)
2. Click on a date to open the trade entry modal
3. Select trade type (Profit/Loss/Break Even)
4. Fill in trade details:
   - Symbol (e.g., BTCUSDT, AAPL)
   - Amount in dollars
   - Category (market type)
   - Fees (optional)
   - Notes (optional)
5. Click "Add Entry" to save

### Viewing Analytics

1. Click the "Analyze" button in the header
2. Select a time period from the dropdown
3. View your KPIs at a glance
4. Use filters to narrow down specific trades
5. Export data using the "Export Data" button

### Managing Profile

1. Click on your name (John Doe) in the header
2. Select "Profile" from the dropdown
3. Switch between "Account" and "Security" tabs
4. Update your information as needed

## 📁 Project Structure

```
trading-journal/
├── src/
│   ├── App.jsx           # Main application component
│   ├── App.css           # Global styles
│   ├── Analyze.jsx       # Analytics dashboard component
│   ├── Profile.jsx       # User profile component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Base styles and CSS variables
├── public/               # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## 🎨 Key Components

### Calendar Views
- **Month Calendar**: Grid-based calendar with daily trade indicators
- **Week List**: Vertical list showing each day with trade summaries
- **Year Grid**: 12 mini-calendars showing annual overview

### Trade Modal
- Dual tabs: "New Entry" and "History"
- Visual trade type selection (Profit/Loss/Break Even)
- Form validation and error handling
- Responsive design

### Analytics Dashboard
- Real-time KPI calculations
- Multiple filtering options
- Interactive data table
- CSV export functionality

### Profile Settings
- Account information management
- Password change with validation
- Tabbed interface for better organization

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🎯 Future Enhancements

- [ ] Database integration for persistent storage
- [ ] User authentication system
- [ ] Performance charts and graphs
- [ ] Advanced statistics (Sharpe ratio, drawdown, etc.)
- [ ] Trade journal with screenshots
- [ ] Trading strategy templates
- [ ] Multi-currency support
- [ ] Mobile app version
- [ ] Dark/Light theme toggle
- [ ] Backup and restore functionality

## 🌈 Color Scheme

- **Accent Green**: `#10b981` - Profits, positive values
- **Accent Red**: `#ef4444` - Losses, negative values
- **Accent Blue**: `#3b82f6` - Win rate, interactive elements
- **Accent Purple**: `#8b5cf6` - Profit factor
- **Background**: Dark theme optimized for trading

## 📊 Data Storage

Currently, the application stores trade data in React state (in-memory). This means:
- ✅ Fast and responsive
- ✅ No backend setup required
- ⚠️ Data resets on page refresh
- 🔜 Database integration planned for persistent storage

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for traders by traders**
