# Trading Journal & Calendar 📊💰

A modern, feature-rich **full-stack** trading journal application with SQL database backend, user authentication, and persistent data storage. Track, analyze, and improve your trading performance with secure cloud-based storage.

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

### Frontend
- **Framework**: React 19.2.0
- **Date Utilities**: date-fns 4.1.0
- **Icons**: lucide-react 0.563.0
- **Build Tool**: Vite 7.2.4
- **HTTP Client**: Axios 1.6.5
- **Styling**: Custom CSS with CSS Variables
- **Language**: JavaScript (ES6+)

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Database**: SQLite (better-sqlite3 9.2.2)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: bcryptjs 2.4.3, CORS 2.8.5
- **Environment**: dotenv 16.3.1

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trading-journal
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client & server dependencies
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Start both servers**
   ```bash
   npm run dev
   ```
   This starts:
   - Frontend at `http://localhost:5173`
   - Backend at `http://localhost:5000`

4. **Login with default account**
   ```
   Email: john@example.com
   Password: password123
   ```

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
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # API client utilities
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── components/    # React components (Login)
│   │   ├── App.jsx        # Main app component
│   │   ├── App.css        # Global styles
│   │   ├── Analyze.jsx    # Analytics dashboard
│   │   ├── Profile.jsx    # User profile
│   │   └── main.jsx       # Entry point
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
│
├── server/                 # Backend Express application
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # SQLite configuration
│   │   ├── routes/
│   │   │   ├── auth.js          # Authentication API
│   │   │   ├── trades.js        # Trades CRUD API
│   │   │   └── journal.js       # Journal API
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication
│   │   └── server.js            # Express app
│   ├── database/
│   │   └── trading-journal.db   # SQLite database
│   ├── .env              # Environment variables
│   └── package.json      # Backend dependencies
│
└── package.json           # Root workspace configuration
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

### Root Directory
```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:client

# Start only backend
npm run dev:server

# Build frontend for production
npm run build
```

### Client Directory (cd client/)
```bash
# Start Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Server Directory (cd server/)
```bash
# Start Express server with auto-reload
npm run dev

# Start Express server (production)
npm start
```

## ✅ Completed Features

- [x] **Database integration** - SQLite with persistent storage
- [x] **User authentication** - JWT-based login/register system
- [x] **Multi-user support** - Each user has isolated data
- [x] **Password hashing** - Secure bcrypt encryption
- [x] **REST API** - Complete backend API for all operations
- [x] **Journal entries** - Rich text with formatting and images

## 🎯 Future Enhancements

- [ ] Performance charts and graphs
- [ ] Advanced statistics (Sharpe ratio, drawdown, etc.)
- [ ] Trading strategy templates
- [ ] Multi-currency support
- [ ] Mobile app version
- [ ] Dark/Light theme toggle
- [ ] Backup and restore functionality
- [ ] Real-time sync across devices

## 🌈 Color Scheme

- **Accent Green**: `#10b981` - Profits, positive values
- **Accent Red**: `#ef4444` - Losses, negative values
- **Accent Blue**: `#3b82f6` - Win rate, interactive elements
- **Accent Purple**: `#8b5cf6` - Profit factor
- **Background**: Dark theme optimized for trading

## 📊 Data Storage & Security

### Database
The application uses **SQLite** for persistent storage with three main tables:
- **users** - User accounts with hashed passwords
- **trades** - All trading entries with full details
- **journal_entries** - Rich text journal content per date

### Security Features
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **CORS Protection** - Restricted to frontend origin
- ✅ **SQL Injection Prevention** - Prepared statements
- ✅ **User Isolation** - Users only access their own data
- ✅ **Token Expiration** - 24-hour JWT tokens

### API Endpoints
- **Auth**: `/api/auth/*` - Login, register, profile management
- **Trades**: `/api/trades/*` - CRUD operations for trades
- **Journal**: `/api/journal/*` - CRUD operations for journal entries

All endpoints (except login/register) require Bearer token authentication.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for traders by traders**
