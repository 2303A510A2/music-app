# My Music Application

A full-stack music playlist application with user authentication and database storage.

## Deployment Links

- GitHub Actions: https://github.com/2303A510A2/music-app/actions/runs/28709783009
- Render Deployment: https://music-app-4-dpnc.onrender.com

## Features

- **User Authentication**: Register and login with email and password
- **Secure Password Storage**: Passwords are hashed using bcrypt
- **Music Playlists**: Browse and organize music in different playlists
- **Song Search**: Search across all songs in your playlists
- **Now Playing**: Play songs directly from SoundCloud
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Project Structure

```
my music/
├── backend/
│   ├── routes/
│   │   └── auth.js           # Authentication routes
│   ├── database.js           # Database initialization and setup
│   ├── server.js             # Main Express server
│   └── .env                  # Environment variables
├── frontend/
│   ├── login.html            # Login page
│   ├── register.html         # Registration page
│   ├── dashboard.html        # Main music app dashboard
│   ├── styles.css            # All styling
│   └── dashboard.js          # Frontend logic for music app
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Install Dependencies

```bash
cd "my music"
npm install
```

### Step 2: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Step 3: Access the Application

Open your browser and go to:
```
http://localhost:5000
```

You'll see the login page. If you don't have an account, click "Sign up" to register.

## How to Use

### Register a New Account

1. Click "Sign up" on the login page
2. Enter your full name, email, password, and confirm password
3. Click "Create Account"
4. You'll be redirected to login page
5. Log in with your credentials

### Login

1. Enter your email and password
2. Click "Log In"
3. You'll be redirected to the dashboard

### Using the App

- **View Playlists**: Browse different music playlists on the dashboard
- **Open Playlist**: Click on a playlist to see all songs
- **Play a Song**: Click on any song to play it
- **Search**: Use the search bar to find songs across all playlists
- **Logout**: Click the "Logout" button to exit

## Database

The application uses SQLite for data storage. The database file (`mymusic.db`) is automatically created in the backend folder when you first run the server.

### Tables Created:

1. **users** - Stores user account information
   - id (Integer, Primary Key)
   - fullName (Text)
   - email (Text, Unique)
   - password (Text, Hashed)
   - createdAt (DateTime)

2. **playlists** - Stores user playlists (for future expansion)
   - id (Integer, Primary Key)
   - userId (Integer, Foreign Key)
   - playlistName (Text)
   - createdAt (DateTime)

3. **songs** - Stores songs in playlists (for future expansion)
   - id (Integer, Primary Key)
   - playlistId (Integer, Foreign Key)
   - songName (Text)
   - songUrl (Text)
   - createdAt (DateTime)

## API Endpoints

### Authentication

- **POST** `/api/auth/register`
  - Register a new user
  - Body: `{ fullName, email, password, confirmPassword }`

- **POST** `/api/auth/login`
  - Login with email and password
  - Body: `{ email, password }`
  - Returns: `{ userId, fullName, email }`

- **GET** `/api/auth/user/:id`
  - Get user profile information
  - Returns: `{ id, fullName, email, createdAt }`

## Security Features

- ✅ Passwords are hashed using bcrypt
- ✅ Email validation on registration and login
- ✅ Password confirmation on registration
- ✅ Minimum password length requirement (6 characters)
- ✅ CORS enabled for secure cross-origin requests
- ✅ Input validation on server side

## Future Enhancements

- [ ] User-created playlists
- [ ] Save favorite songs
- [ ] User profile page
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Integration with music streaming APIs
- [ ] User preferences and settings
- [ ] Social features (share playlists, follow users)

## Troubleshooting

### Server Won't Start
- Make sure port 5000 is available
- Check if Node.js is properly installed: `node --version`

### Can't Connect to Database
- Delete `backend/mymusic.db` and restart the server
- This will recreate the database with empty tables

### CORS Errors in Frontend
- Make sure backend server is running on `http://localhost:5000`
- Check browser console for exact error messages

### Password Issues
- Passwords must be at least 6 characters
- Passwords and confirm password must match exactly

## Contact & Support

For issues or questions, please check the code comments or refer to the documentation in respective files.

---

**Enjoy your music! 🎵**
