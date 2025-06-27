#!/usr/bin/env python3
"""
Keep-alive script for Render free tier
Pings the health endpoint every 14 minutes to prevent the service from sleeping
"""

import requests
import time
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('keep_alive')

# Backend URL
BACKEND_URL = os.environ.get('BACKEND_URL', 'https://sentinel-backend.onrender.com')
HEALTH_ENDPOINT = f"{BACKEND_URL}/health"

# Ping interval: 14 minutes (840 seconds)
# Render free tier sleeps after 15 minutes of inactivity
PING_INTERVAL = 14 * 60  # 840 seconds

def ping_health_endpoint():
    """Ping the health endpoint to keep the service alive"""
    try:
        logger.info(f"Pinging health endpoint: {HEALTH_ENDPOINT}")
        
        response = requests.get(
            HEALTH_ENDPOINT,
            timeout=30,
            headers={'User-Agent': 'Sentinel-KeepAlive/1.0'}
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ Health check successful - Status: {data.get('status', 'unknown')}")
            logger.info(f"📊 Analysis mode: {data.get('analysis_mode', 'unknown')}")
            
            # Log service status
            services = data.get('services', {})
            active_services = [k for k, v in services.items() if v == 'available']
            logger.info(f"🔧 Active services: {', '.join(active_services)}")
            
            return True
        else:
            logger.warning(f"⚠️ Health check returned status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to ping health endpoint: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during health check: {str(e)}")
        return False

def run_keep_alive():
    """Main keep-alive loop"""
    logger.info("🚀 Starting Sentinel Keep-Alive service")
    logger.info(f"📡 Target: {HEALTH_ENDPOINT}")
    logger.info(f"⏰ Interval: {PING_INTERVAL} seconds ({PING_INTERVAL // 60} minutes)")
    
    consecutive_failures = 0
    max_failures = 5
    
    while True:
        try:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"🔄 Keep-alive ping at {current_time}")
            
            success = ping_health_endpoint()
            
            if success:
                consecutive_failures = 0
                logger.info(f"✅ Backend is alive and healthy")
            else:
                consecutive_failures += 1
                logger.warning(f"⚠️ Health check failed ({consecutive_failures}/{max_failures})")
                
                if consecutive_failures >= max_failures:
                    logger.error(f"❌ Backend appears to be down after {max_failures} consecutive failures")
                    logger.error("💡 Consider checking the backend deployment or service status")
            
            # Wait for next ping
            logger.info(f"😴 Sleeping for {PING_INTERVAL // 60} minutes until next ping...")
            time.sleep(PING_INTERVAL)
            
        except KeyboardInterrupt:
            logger.info("🛑 Keep-alive service stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in keep-alive loop: {str(e)}")
            logger.info("🔄 Continuing in 60 seconds...")
            time.sleep(60)

if __name__ == "__main__":
    run_keep_alive() 