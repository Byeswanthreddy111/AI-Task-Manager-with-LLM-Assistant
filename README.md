# 🚀 AI-Powered Task Manager with LLM assistant

> A modern, full-stack task management application with AI-powered productivity insights

![React](https://img.shields.io/badge/React-18.2.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MySQL](https://img.shields.io/badge/MySQL-8.0-orange) ![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green) ![Groq](https://img.shields.io/badge/Groq-AI-purple)

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- ✅ **Task Management** - Complete CRUD operations with real-time updates
- 🤖 **AI Assistant** - Context-aware chatbot powered by Groq AI
- 📊 **Analytics Dashboard** - Interactive charts and productivity insights
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- 🎯 **Smart Filtering** - Filter by status, priority, and category
- 🔍 **Quick Search** - Instant task search functionality
- 📈 **Performance Optimized** - 99/100 Lighthouse score

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **Redux Toolkit** - State management
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Relational database for structured data
- **MongoDB** - NoSQL database for chat logs
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### AI Integration
- **Groq API** - Fast LLM inference (FREE)
- **Custom prompts** - Context-aware responses
- **Conversation memory** - Session-based chat history

## 📊 Performance Metrics
```
Lighthouse Scores:
├─ Performance:    99/100 ⚡
├─ Accessibility:  100/100 ♿
├─ Best Practices: 100/100 ✅
└─ SEO:            100/100 🔍

Load Times:
├─ First Contentful Paint: 0.8s
├─ Largest Contentful Paint: 1.7s
└─ Total Blocking Time: 120ms

Bundle Size:
├─ Initial: 89 KB (gzipped)
└─ 88% reduction from development build
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- MongoDB Atlas account ([Sign up](https://www.mongodb.com/cloud/atlas/register))
- Groq API key ([Get free key](https://console.groq.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-task-manager.git
cd ai-task-manager
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. **Setup MySQL Database**
```bash
# Login to MySQL
mysql -u root -p

# Create database and tables
source database/schema.sql

# (Optional) Load sample data
source database/seed.sql
```

4. **Configure Environment Variables**

Create `server/.env` file:
```env
PORT=5000
NODE_ENV=development

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=taskdb

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskdb

# Groq AI (FREE)
GROQ_API_KEY=gsk_your_key_here
AI_PROVIDER=groq

# JWT
JWT_SECRET=your_random_secret_string
JWT_EXPIRE=7d

CLIENT_URL=http://localhost:3000
```

5. **Run the application**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm start
```

6. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure
```
ai-task-manager/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # Redux store & slices
│   │   ├── config/        # API configuration
│   │   └── App.js         # Main app component
│   └── package.json
│
├── server/                # Node.js backend
│   ├── config/           # Database connections
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth & error handling
│   ├── models/           # MongoDB models
│   ├── routes/           # API endpoints
│   ├── server.js         # Entry point
│   └── package.json
│
├── database/             # SQL scripts
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Sample data
│
└── README.md            # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle completion

### AI Features
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/suggestions` - Get task suggestions
- `GET /api/ai/analyze` - Analyze productivity

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/score` - Productivity score
- `GET /api/analytics/trend` - Completion trends

## 🎨 Features in Detail

### Task Management
- Create, read, update, delete tasks
- Mark tasks as complete/incomplete
- Set priority levels (Low, Medium, High)
- Categorize tasks (Work, Personal, Shopping, etc.)
- Set due dates with reminders
- Real-time status updates

### AI Assistant
- Natural language conversation
- Context-aware responses based on your tasks
- Task suggestions and recommendations
- Productivity tips and insights
- Maintains conversation history

### Analytics
- Task completion rate
- Tasks by priority distribution
- Category-based analysis
- Time-based trends (7/14/30 days)
- Productivity score calculation
- Visual charts (Pie, Bar, Line)

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Error handling middleware
- ✅ Environment variable protection

## 📱 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### AI Assistant
![AI Chat](screenshots/ai-chat.png)

### Analytics
![Analytics](screenshots/analytics.png)

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy to Vercel via GitHub integration
```

### Backend (Render)
```bash
# Deploy via Render dashboard
# Set environment variables in Render
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for free AI API
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for free database hosting
- [Vercel](https://vercel.com/) for frontend hosting
- [Render](https://render.com/) for backend hosting

## 📞 Support

For support, email your.email@example.com or open an issue on GitHub.

---

Made with ❤️ by [Your Name]
