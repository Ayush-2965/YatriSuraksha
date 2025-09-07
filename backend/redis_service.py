from redis import Redis
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta

class RedisLocationService:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
    
    def update_location(self, user_id: str, data: Dict) -> bool:
        """Update user's current location and history"""
        try:
            # Update current location
            self.redis.hset(f"user:{user_id}:location", mapping=data)
            
            # Add to history
            self.redis.lpush(f"user:{user_id}:location_history", json.dumps(data))
            # Keep 24 hours of history (assuming 10s updates = 8640 entries)
            self.redis.ltrim(f"user:{user_id}:location_history", 0, 8640)
            
            return True
        except Exception:
            return False
    
    def get_current_location(self, user_id: str) -> Optional[Dict]:
        """Get user's current location"""
        try:
            return self.redis.hgetall(f"user:{user_id}:location")
        except Exception:
            return None
    
    def get_location_history(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get user's location history"""
        try:
            history = self.redis.lrange(f"user:{user_id}:location_history", 0, limit - 1)
            return [json.loads(item) for item in history]
        except Exception:
            return []
    
    def get_nearby_users(self, lat: float, lon: float, radius_km: float = 5) -> List[str]:
        """Find users within a radius (requires Redis with geospatial support)"""
        try:
            # Convert km to meters for Redis
            radius_m = radius_km * 1000
            nearby = self.redis.georadius("user_locations", lon, lat, radius_m, unit="m")
            return nearby
        except Exception:
            return []
    
    def cleanup_old_data(self, days: int = 7):
        """Remove data older than specified days"""
        try:
            cutoff = datetime.now() - timedelta(days=days)
            # Implement cleanup logic based on your needs
            pass
        except Exception:
            pass
