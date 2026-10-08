import requests
from flask import Blueprint, request, jsonify
from backend.app.config.settings import Config

voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Endpoint prepared for Sarvam AI or Whisper speech-to-text integration.
    Gracefully notifies client to use browser Web Speech API if external key is unconfigured.
    """
    if Config.SARVAM_API_KEY:
        # Example Sarvam AI regional STT integration
        try:
            audio_file = request.files.get('file')
            language_code = request.form.get('language_code', 'kn-IN')
            if not audio_file:
                return jsonify({'error': 'Audio file required'}), 400

            headers = {"api-subscription-key": Config.SARVAM_API_KEY}
            files = {'file': (audio_file.filename, audio_file.read(), audio_file.content_type)}
            data = {'language_code': language_code, 'model': 'saaras:v1'}

            res = requests.post(
                "https://api.sarvam.ai/speech-to-text",
                headers=headers,
                files=files,
                data=data,
                timeout=10
            )
            if res.status_code == 200:
                transcript = res.json().get('transcript', '')
                return jsonify({'transcript': transcript, 'source': 'Sarvam AI'}), 200
            else:
                return jsonify({'error': 'Sarvam AI returned error', 'source': 'fallback_to_browser'}), 502
        except Exception as e:
            return jsonify({'error': str(e), 'source': 'fallback_to_browser'}), 500

    # Fallback response: browser Web Speech API handles client-side speech
    return jsonify({
        'status': 'browser_fallback',
        'message': 'External speech API key not configured. Using browser Web Speech API for zero-latency recognition.'
    }), 200
