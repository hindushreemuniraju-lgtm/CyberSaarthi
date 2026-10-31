import os
import sys

# Ensure root directory is in python sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.app import create_app
from backend.app.config.settings import Config

app = create_app()

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() in ('true', '1')
    print(f"Starting CyberSaarthi Backend Server on port {Config.PORT} (debug={debug_mode})...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=debug_mode)
