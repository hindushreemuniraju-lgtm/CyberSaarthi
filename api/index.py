import os
import sys
import urllib.parse

# Ensure root directory is in sys.path so backend module can be imported
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app import create_app
from flask import request, jsonify

flask_app = create_app()

class VercelPathFixer:
    """WSGI middleware to ensure Vercel rewrites map properly to Flask routes."""
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        query_string = environ.get('QUERY_STRING', '')
        if '__path__=' in query_string:
            params = query_string.split('&')
            clean_params = []
            for param in params:
                if param.startswith('__path__='):
                    real_path = param.split('__path__=', 1)[1]
                    environ['PATH_INFO'] = urllib.parse.unquote(real_path)
                else:
                    clean_params.append(param)
            environ['QUERY_STRING'] = '&'.join(clean_params)
        return self.wsgi_app(environ, start_response)

flask_app.wsgi_app = VercelPathFixer(flask_app.wsgi_app)

app = flask_app

if __name__ == '__main__':
    app.run(debug=True)
