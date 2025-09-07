import requests
import time
from datetime import datetime
import random

def simulate_movement(start_lat, start_lon, user_id):
    """Simulate movement by slightly changing coordinates"""
    lat = start_lat
    lon = start_lon
    
    while True:
        # Simulate small movements
        lat += random.uniform(-0.0001, 0.0001)
        lon += random.uniform(-0.0001, 0.0001)
        
        data = {
            "user_id": user_id,
            "latitude": lat,
            "longitude": lon,
            "timestamp": datetime.now().isoformat(),
            "speed": random.uniform(0, 50),  # Random speed between 0-50 km/h
            "accuracy": random.uniform(1, 10)  # Random accuracy between 1-10 meters
        }
        
        try:
            response = requests.post("http://localhost:8000/location/update", json=data)
            print(f"Update sent: {response.status_code}", data)
        except Exception as e:
            print(f"Error sending update: {e}")
        
        time.sleep(10)  # Update every 10 seconds

if __name__ == "__main__":
    # Start simulation for a user
    simulate_movement(
        start_lat=28.7041,  # Example: Delhi coordinates
        start_lon=77.1025,
        user_id="test_user_1"
    )
