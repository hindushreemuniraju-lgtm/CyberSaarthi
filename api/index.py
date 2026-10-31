import os
import sys

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
        path_info = environ.get('PATH_INFO', '')
        forwarded_uri = environ.get('HTTP_X_FORWARDED_URI') or environ.get('HTTP_X_MATCHED_PATH')
        
        if forwarded_uri and path_info in ('/api/index.py', '/api/index', '/api'):
            environ['PATH_INFO'] = forwarded_uri.split('?')[0]
            
        return self.wsgi_app(environ, start_response)

flask_app.wsgi_app = VercelPathFixer(flask_app.wsgi_app)

@flask_app.route('/api/index.py', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
@flask_app.route('/api/index', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def vercel_entry_fallback():
    forwarded_uri = request.headers.get('x-forwarded-uri') or request.headers.get('x-matched-path')
    if forwarded_uri and forwarded_uri not in ('/api/index.py', '/api/index'):
        with flask_app.test_client() as client:
            resp = client.open(forwarded_uri, method=request.method, data=request.get_data(), headers=dict(request.headers))
            return (resp.get_data(), resp.status_code, resp.headers.items())
            
    return jsonify({
        'status': 'healthy',
        'project': 'CyberSaarthi',
        'tagline': 'A safer digital world for everyone.',
        'version': '1.0.0',
        'runtime': 'Vercel Serverless'
    }), 200

app = flask_app

if __name__ == '__main__':
    app.run(debug=True)
