import os
import sys

# Ensure root directory is in python sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.app import create_app
from backend.app.config.settings import Config

app = create_app()

if __name__ == '__main__':
    print(f"Starting CyberSaarthi Backend Server on port {Config.PORT}...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=True)
