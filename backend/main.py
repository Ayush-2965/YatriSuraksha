from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Yatri Suraksha Location Service")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis Configuration
redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is None:
        try:
            redis_client = Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=0,
                decode_responses=True,
                socket_timeout=5,  # 5 seconds timeout
                retry_on_timeout=True
            )
            # Test the connection
            redis_client.ping()
        except Exception as e:
            print(f"Warning: Redis connection failed: {e}")
            # For development, we'll use an in-memory fallback
            redis_client = None
    return redis_client

class LocationUpdate(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    timestamp: Optional[datetime] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# In-memory storage fallback
location_cache = {}
location_history = {}

@app.post("/location/update")
async def update_location(location: LocationUpdate):
    """Update user location in Redis or fallback storage"""
    try:
        location_data = location.dict()
        if not location_data["timestamp"]:
            location_data["timestamp"] = datetime.now().isoformat()
        
        redis = get_redis_client()
        if redis:
            # Store latest location in Redis
            redis.hset(
                f"user:{location.user_id}:location",
                mapping={
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "timestamp": location_data["timestamp"],
                    "speed": location.speed or 0,
                    "accuracy": location.accuracy or 0
                }
            )
            
            # Store in location history
            redis.lpush(
                f"user:{location.user_id}:location_history",
                json.dumps(location_data)
            )
            redis.ltrim(f"user:{location.user_id}:location_history", 0, 8640)
        else:
            # Fallback to in-memory storage
            location_cache[location.user_id] = {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "timestamp": location_data["timestamp"],
                "speed": location.speed or 0,
                "accuracy": location.accuracy or 0
            }
            
            # Maintain history in memory
            if location.user_id not in location_history:
                location_history[location.user_id] = []
            location_history[location.user_id].insert(0, location_data)
            # Keep only last 100 entries in memory
            location_history[location.user_id] = location_history[location.user_id][:100]
        
        # Notify websocket clients if any
        if location.user_id in active_connections:
            await active_connections[location.user_id].send_json(location_data)
        
        return {"status": "success", "message": "Location updated", "storage": "redis" if redis else "memory"}
    
    except Exception as e:
        print(f"Error in update_location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/location/{user_id}")
async def get_location(user_id: str):
    """Get user's latest location"""
    try:
        redis = get_redis_client()
        if redis:
            location = redis.hgetall(f"user:{user_id}:location")
        else:
            location = location_cache.get(user_id, {})
            
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        return location
    except Exception as e:
        print(f"Error in get_location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/location/{user_id}/history")
async def get_location_history(user_id: str, limit: int = 100):
    """Get user's location history"""
    try:
        redis = get_redis_client()
        if redis:
            history = redis.lrange(f"user:{user_id}:location_history", 0, limit - 1)
            return [json.loads(item) for item in history]
        else:
            history = location_history.get(user_id, [])
            return history[:limit]
    except Exception as e:
        print(f"Error in get_location_history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/location/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time location updates"""
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except:
        active_connections.pop(user_id, None)
