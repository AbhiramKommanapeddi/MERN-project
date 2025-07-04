# 📋 MERN Todo Board - Collaborative Task Management

A real-time collaborative todo board application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user authentication, real-time updates, and modern UI.

## 🚀 Features

### Core Functionality

- **User Authentication**: Secure registration and login with JWT tokens
- **Real-time Collaboration**: Live updates using Socket.io
- **Task Management**: Create, edit, delete, and organize tasks
- **Task States**: Todo, In Progress, Done columns
- **User Management**: Assign tasks to team members
- **Activity Tracking**: Monitor task changes and user activities

### Technical Features

- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Full TypeScript implementation
- **Real-time Updates**: Instant synchronization across all connected users
- **In-memory Database**: Development-ready MongoDB setup
- **Rate Limiting**: Protection against abuse
- **CORS Configured**: Secure cross-origin requests

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Socket.io Client** for real-time communication
- **Axios** for HTTP requests
- **CSS3** for styling

### Backend

- **Node.js** with Express.js
- **Socket.io** for real-time features
- **JWT** for authentication
- **bcrypt** for password hashing
- **MongoDB** with Mongoose ODM
- **Rate limiting** with express-rate-limit

### Development Tools

- **mongodb-memory-server** for local development
- **nodemon** for development server
- **CORS** for cross-origin requests

## 📁 Project Structure

```
MERN Project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── .env                # Frontend environment variables
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── socket/             # Socket.io handlers
│   ├── index.js            # Server entry point
│   ├── package.json
│   └── .env                # Backend environment variables
├── package.json            # Root package.json
└── README.md              # This file
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** 16+ and npm
- **Git** for cloning the repository

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd "MERN Project"
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**

   **Backend (.env in server/ directory):**

   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
   CLIENT_URL=http://localhost:3002
   NODE_ENV=development
   ```

   **Frontend (.env in client/ directory):**

   ```env
   PORT=3002
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the application**

   ```bash
   # Start backend server (from server/ directory)
   cd server
   npm start

   # Start frontend server (from client/ directory - in a new terminal)
   cd client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:5000

## 🔐 Authentication

### Test Credentials

For development and testing, you can create a user account or use these test credentials:

- **Username**: `demo`
- **Password**: `demo123`

### Registration

1. Click "Sign Up" on the login page
2. Fill in username, email, and password
3. Automatically logged in after successful registration

### Login

1. Enter your username and password
2. Click "Sign In"
3. Access the collaborative todo board

## 📱 Usage Guide

### Creating Tasks

1. Click the "+" button or "Add Task"
2. Enter task title and description
3. Assign to a team member (optional)
4. Set priority level
5. Click "Create Task"

### Managing Tasks

- **Move Tasks**: Drag and drop between columns (Todo, In Progress, Done)
- **Edit Tasks**: Click on any task to edit details
- **Delete Tasks**: Use the delete button on each task
- **Assign Tasks**: Select team members from the dropdown

### Real-time Collaboration

- Multiple users can work simultaneously
- See live updates as other users make changes
- Real-time notifications for task activities
- Online user indicators

## 🔧 Development

### Available Scripts

**Backend (server/ directory):**

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

**Frontend (client/ directory):**

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Environment Modes

**Development Mode:**

- Uses in-memory MongoDB (no external database required)
- Hot reloading enabled
- Detailed error messages
- Increased rate limits for testing

**Production Mode:**

- Connects to external MongoDB instance
- Optimized builds
- Error logging
- Standard rate limits

## 🚀 Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment

1. Build the React app: `npm run build`
2. Serve static files or deploy to CDN
3. Update `REACT_APP_API_URL` to production backend URL

### Environment Variables for Production

- Set all environment variables on your hosting platform
- Use secure, randomly generated JWT secrets
- Configure production MongoDB connection string
- Set proper CORS origins

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin request handling
- **Input Validation**: Server-side validation for all inputs

## 🐛 Troubleshooting

### Common Issues

**"Route not found" error:**

- Check if backend server is running on port 5000
- Verify CORS configuration
- Ensure environment variables are set correctly

**"Server error during login":**

- Database connection issues
- Restart backend server to refresh in-memory database
- Check MongoDB connection string

**Frontend not loading:**

- Verify frontend is running on port 3002
- Check if environment variables are loaded
- Clear browser cache

**Port conflicts:**

- Backend: Default port 5000
- Frontend: Default port 3002
- Change ports in .env files if needed

### Reset Development Environment

```bash
# Kill all processes and restart
# Windows:
taskkill /f /im node.exe

# Restart servers
cd server && npm start
cd client && npm start
```

## 📞 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Activity

- `GET /api/activity` - Get activity log

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.io for real-time capabilities
- MongoDB team for the database
- Express.js for the backend framework

---

**Happy Collaborating! 🎉**

For questions or support, please open an issue in the repository.
