# Yatri Suraksha

A safety companion application for travelers with real-time location tracking and user authentication.

## Features

- User Authentication with Appwrite
- Real-time Location Tracking
- Location History
- WebSocket Support for Live Updates
- Responsive UI with Tailwind CSS

## Prerequisites

Before you begin, ensure you have installed:

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn
- Git

## Installation

### Frontend Setup

1. Clone the repository:
```bash
cd YatriSuraksha
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/MacOS
python -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:5173
```

## Running the Application

### Start the Frontend

1. From the project root:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Start the Backend

1. From the backend directory with virtual environment activated:
```bash
uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000`

### Optional: Redis Setup

Redis is optional but recommended for persistent storage. You can run the application without Redis (it will use in-memory storage).

To use Redis, you can:

1. Using WSL (Windows Subsystem for Linux):
```bash
wsl --install
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

2. Using Docker:
```bash
docker run --name redis -p 6379:6379 -d redis
```

3. Using Windows Redis Port:
```bash
winget install Redis
```

## API Endpoints

- `POST /location/update` - Update user location
- `GET /location/{user_id}` - Get user's latest location
- `GET /location/{user_id}/history` - Get user's location history
- `WebSocket /ws/location/{user_id}` - Real-time location updates

## Environment Configuration

### Frontend (.env)
```env
VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
```

### Backend (.env)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:5173
```

## Directory Structure

```
YatriSuraksha/
├── src/                    # Frontend source files
│   ├── components/         # React components
│   ├── context/           # Context providers
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── routes/            # Route configurations
├── backend/               # Backend source files
│   ├── main.py           # FastAPI application
│   └── requirements.txt   # Python dependencies
├── public/                # Static files
└── package.json          # Node.js dependencies
```

## Tech Stack

- **Frontend**:
  - React with Vite
  - Appwrite Authentication
  - Tailwind CSS
  - React Router DOM
  - WebSocket Client

- **Backend**:
  - FastAPI
  - Redis (optional)
  - WebSockets
  - Python-dotenv

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
