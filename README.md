# Trading Journal & Calendar 📊

A full-stack trading journal with SQL database, authentication, and rich journaling features. Track trades, write detailed journals, and analyze your trading performance.

## ✨ Features

### 📅 Calendar & Views
- **Multiple Views**: Month (5/7-day), Week, and Year views
- **Visual Indicators**: P&L display on calendar, journal entry indicators
- **Quick Access**: Click any date to add trades or journal entries

### 📈 Trade Management
- **Trade Entry**: Track profits, losses, and break-even trades
- **Categories**: Stocks, Options, Indices
- **Tags System**: Organize trades with customizable colored tags
- **Trade Details**: Symbol, amount, fees, and tags
- **Existing Trades**: Collapsible view with delete functionality
- **Delete Trades**: Subtle delete option with confirmation

### 📝 Rich Journal Editor
- **WYSIWYG Editor**: Full formatting toolbar (bold, italic, underline, headings, lists)
- **Image Support**: Paste screenshots directly (Ctrl+V) or upload images
- **Unified Entry**: Add both trade and journal in one session
- **Journal List**: View all entries with search, filter, and pagination
- **Delete Entries**: Remove journal entries without affecting trades
- **Image Indicators**: Visual indicator for entries with images

### 📊 Analytics & Statistics
- **All-Time Stats**: Net P&L, win rate, total trades
- **Journaling Stats**: Entry count, average words per entry
- **Period Stats**: Weekly, monthly, and yearly breakdowns
- **Win/Loss Tracking**: Detailed performance metrics

### 👤 User Management
- **Authentication**: Secure JWT-based login/register
- **Profile Settings**: Manage account and password
- **Multi-User**: Isolated data per user

### 🎨 UI/UX
- **Dark Theme**: Optimized for extended trading sessions
- **Responsive**: Works on all screen sizes
- **Smooth Animations**: Polished interactions
- **Color-Coded**: Green for profits, red for losses

## 🛠️ Tech Stack

**Frontend**: React 19, Vite, date-fns, Axios, Lucide Icons
**Backend**: Node.js, Express, SQLite (better-sqlite3)
**Auth**: JWT, bcryptjs
**Styling**: Custom CSS with CSS Variables

## 📦 Quick Start

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Start both servers
npm run dev
```

**Access**: `http://localhost:5173`
**Login**: `john@example.com` / `password123`

## 🚀 Usage

### Add Trade & Journal Entry
1. Click any calendar date
2. Add trade details (symbol, amount, category, tags)
3. Switch to "Journal" tab to write your thoughts
4. Click "Save Entry" to save both

### View Journal Entries
1. Click "Journal Entries" button
2. Search, filter, or browse entries
3. Click any entry to view/edit
4. Delete entries or trades as needed

### Analyze Performance
1. Click "Statistics" tab
2. View all-time or period-specific stats
3. Track win rate and P&L trends

## 📁 Project Structure

```
trading-journal/
├── client/             # React frontend (Vite)
│   └── src/
│       ├── api/        # API clients
│       ├── contexts/   # Auth context
│       ├── App.jsx     # Main component
│       ├── Analyze.jsx # Analytics
│       ├── Profile.jsx # User profile
│       └── JournalEntries.jsx  # Journal list
├── server/             # Express backend
│   ├── src/
│   │   ├── routes/     # API routes (auth, trades, journal)
│   │   ├── middleware/ # JWT auth
│   │   └── server.js   # Express app
│   └── database/
│       └── trading-journal.db  # SQLite database
└── package.json        # Root workspace
```

## 🔑 Key Features

- ✅ SQLite database with persistent storage
- ✅ JWT authentication with password hashing
- ✅ Rich text journal with image support
- ✅ Customizable tag system
- ✅ Unified trade + journal entry
- ✅ Delete trades/journals independently
- ✅ Search and filter journal entries
- ✅ All-time and period statistics
- ✅ Multi-user support with data isolation
- ✅ REST API with CORS protection

## 🎨 Color Scheme

- **Profit Green**: `#10b981`
- **Loss Red**: `#ef4444`
- **Accent Blue**: `#3b82f6`
- **Accent Purple**: `#8b5cf6`

## 📊 Database Tables

- **users**: Account credentials (hashed passwords)
- **trades**: Trading entries with tags
- **journal_entries**: Rich text journal content
- **tags**: Customizable colored tags

## 🔒 Security

- JWT token authentication (24hr expiry)
- bcrypt password hashing
- SQL injection prevention (prepared statements)
- CORS protection
- User data isolation

## 📝 API Endpoints

```
POST   /api/auth/register    # Create account
POST   /api/auth/login       # Login
GET    /api/auth/profile     # Get user profile
PUT    /api/auth/profile     # Update profile

GET    /api/trades           # Get all trades
POST   /api/trades           # Create trade
PUT    /api/trades/:id       # Update trade
DELETE /api/trades/:id       # Delete trade

GET    /api/journal          # Get all journals
GET    /api/journal/:date    # Get journal by date
PUT    /api/journal/:date    # Save journal
DELETE /api/journal/:date    # Delete journal

GET    /api/tags             # Get all tags
POST   /api/tags             # Create tag
```

## 🤝 Contributing

Pull requests welcome! Feel free to open issues for bugs or feature requests.

## 📝 License

MIT License - Open source for traders, by traders.

---

**Built by traders with ❤️ for better trading performance**
